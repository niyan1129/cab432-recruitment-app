const express = require('express');
const Candidate = require('../models/Candidate');
const { requireHR } = require('../middleware/auth');
const path = require('path');
const candidateAnalyzer = require('../services/candidateAnalyzer');

const router = express.Router();

// Get all candidates (for HR to review)
router.get('/candidates', requireHR, async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 5,  // 默认每页5个
      search,
      sort = 'hasVideo',  // 支持视频状态和评分排序
      order = 'desc'  // 默认有视频的在前
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by application status
    if (status && status !== 'all') {
      query.applicationStatus = status;
    }
    
    // Search by name
    if (search) {
      query.fullName = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options - support video status and score sorting
    let sortOptions = {};
    if (sort === 'hasVideo') {
      // Sort by video availability - use a more reliable field
      if (order === 'desc') {
        // Has Video First: sort by video existence (null values last)
        sortOptions = { 'video.originalPath': -1 };
        console.log('🔀 Sorting: Has Video First (desc)');
      } else {
        // No Video First: sort by video existence (null values first)
        sortOptions = { 'video.originalPath': 1 };
        console.log('🔀 Sorting: No Video First (asc)');
      }
    } else if (sort === 'score') {
      // Score sorting will be handled after analysis calculation
      sortOptions = null;
      console.log('🔀 Sorting: By Score (' + order + ')');
    } else {
      // Default sort by creation date desc
      sortOptions = { createdAt: -1 };
      console.log('🔀 Sorting: Default by creation date');
    }
    
    console.log('🔀 Sort options:', sortOptions);
    console.log('🔀 Requested sort:', sort, 'order:', order);
    
    // Get candidates
    let candidates;
    
    if (sort === 'hasVideo') {
      // For video sorting, we need to get all candidates first to sort properly
      candidates = await Candidate.find(query)
        .populate('user', 'email createdAt');
      
      // Sort by video availability manually
      candidates.sort((a, b) => {
        const aHasVideo = !!(a.video?.originalPath || (a.video?.qualities && a.video.qualities.length > 0));
        const bHasVideo = !!(b.video?.originalPath || (b.video?.qualities && b.video.qualities.length > 0));
        
        if (order === 'desc') {
          // Has Video First: true values first
          return bHasVideo - aHasVideo;
        } else {
          // No Video First: false values first
          return aHasVideo - bHasVideo;
        }
      });
      
      // Apply pagination after sorting
      candidates = candidates.slice(skip, skip + parseInt(limit));
    } else if (sort === 'score') {
      // For score sorting, get all candidates first, analyze, then sort
      candidates = await Candidate.find(query)
        .populate('user', 'email createdAt');
      
      // Calculate scores for all candidates
      const candidatesWithScores = candidates.map(candidate => {
        const analysis = candidateAnalyzer.analyzeCandidate(candidate);
        return {
          candidate,
          score: analysis.totalScore
        };
      });
      
      // Sort by score
      candidatesWithScores.sort((a, b) => {
        if (order === 'desc') {
          return b.score - a.score; // High to low
        } else {
          return a.score - b.score; // Low to high
        }
      });
      
      // Extract candidates and apply pagination
      candidates = candidatesWithScores
        .slice(skip, skip + parseInt(limit))
        .map(item => item.candidate);
    } else {
      // For other sorting, use database sorting
      candidates = await Candidate.find(query)
        .populate('user', 'email createdAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));
    }

    // Get total count for pagination
    const total = await Candidate.countDocuments(query);

    // Format response with Custom Processing analysis
    const formattedCandidates = candidates.map(candidate => {
      // Debug: Check duration data
      console.log(`🐛 Candidate ${candidate.fullName} video duration:`, candidate.video?.duration);
      
      // Apply custom processing analysis to each candidate
      const analysis = candidateAnalyzer.analyzeCandidate(candidate);
      
      return {
        id: candidate._id,
        fullName: candidate.fullName,
        phone: candidate.phone,
        applicationStatus: candidate.applicationStatus,
        hasVideo: !!(candidate.video?.originalPath || (candidate.video?.qualities && candidate.video.qualities.length > 0)),
        videoProcessed: candidate.video?.isProcessed || false,
        videoStatus: candidate.video?.processingStatus || 'pending',
        videoDuration: candidate.video?.duration || null,
        hasThumbnail: !!candidate.video?.thumbnailPath,
        availableQualities: (candidate.video?.qualities || []).filter(q => q.isReady).map(q => q.name),
        cpuIntensity: candidate.video?.cpuIntensity || 'UNKNOWN',
        submittedAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
        reviewCount: candidate.hrReviews?.length || 0,
        averageRating: candidate.hrReviews?.length > 0 
          ? (candidate.hrReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / candidate.hrReviews.length).toFixed(1)
          : null,
        
        // CUSTOM PROCESSING: Add analysis scores
        analysis: {
          totalScore: analysis.totalScore,
          grade: analysis.grade,
          recommendation: analysis.recommendation,
          profileScore: analysis.breakdown.profile.score,
          videoScore: analysis.breakdown.video.score,
          strengths: analysis.strengths,
          hasPhone: !!candidate.phone,
          hasVideo: !!(candidate.video?.originalPath),
          completenessLevel: analysis.totalScore >= 90 ? 'excellent' : 
                           analysis.totalScore >= 70 ? 'good' : 
                           analysis.totalScore >= 50 ? 'fair' : 'poor'
        }
      };
    });

    res.json({
      success: true,
      candidates: formattedCandidates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        status: status || 'all',
        search: search || '',
        sort: sort || 'hasVideo',
        order: order || 'desc'
      }
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      error: 'Failed to get candidates',
      message: error.message
    });
  }
});

// Get detailed candidate information
router.get('/candidates/:id', requireHR, async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    const candidate = await Candidate.findById(candidateId)
      .populate('user', 'email createdAt')
      .populate('hrReviews.hr', 'email');

    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found',
        message: 'The requested candidate does not exist'
      });
    }

    // Format response (don't expose actual file paths for security)
    const candidateDetails = {
      id: candidate._id,
      fullName: candidate.fullName,
      phone: candidate.phone,
      applicationStatus: candidate.applicationStatus,
      submittedAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      user: {
        email: candidate.user.email,
        joinedAt: candidate.user.createdAt
      },
      video: {
        hasVideo: !!(candidate.video?.originalPath || (candidate.video?.qualities && candidate.video.qualities.length > 0)),
        originalName: candidate.video?.originalName,
        size: candidate.video?.size,
        mimeType: candidate.video?.mimeType,
        duration: candidate.video?.duration,
        isProcessed: candidate.video?.isProcessed || false,
        processingStatus: candidate.video?.processingStatus || 'pending',
        processingError: candidate.video?.processingError,
        hasThumbnail: !!candidate.video?.thumbnailPath,
        
        // Multi-quality information
        cpuIntensity: candidate.video?.cpuIntensity || 'UNKNOWN',
        totalProcessingTime: candidate.video?.totalProcessingTime,
        requestedQualities: candidate.video?.requestedQualities || [],
        availableQualities: (candidate.video?.qualities || []).filter(q => q.isReady).map(q => ({
          name: q.name,
          resolution: q.resolution,
          processingTime: q.processingTime
        })),
        
        // Processing stats
        qualityProgress: {
          total: candidate.video?.requestedQualities?.length || 0,
          completed: (candidate.video?.qualities || []).filter(q => q.isReady).length
        }
      },
      reviews: candidate.hrReviews.map(review => ({
        id: review._id,
        rating: review.rating,
        comments: review.comments,
        reviewDate: review.reviewDate,
        reviewer: {
          email: review.hr.email
        }
      }))
    };

    res.json({
      success: true,
      candidate: candidateDetails
    });

  } catch (error) {
    console.error('Get candidate details error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid candidate ID',
        message: 'Please provide a valid candidate ID'
      });
    }
    
    res.status(500).json({
      error: 'Failed to get candidate details',
      message: error.message
    });
  }
});

// Get available video qualities for a candidate
router.get('/candidates/:id/video-qualities', requireHR, async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found'
      });
    }

    if (!candidate.video?.originalPath) {
      return res.status(404).json({
        error: 'Video not available',
        message: 'No video has been uploaded for this candidate'
      });
    }

    const availableQualities = (candidate.video.qualities || [])
      .filter(q => q.isReady)
      .map(q => ({
        name: q.name,
        resolution: q.resolution,
        processingTime: q.processingTime,
        description: `${q.name} (${q.resolution})`
      }))
      .sort((a, b) => {
        // Sort by quality preference
        const qualityOrder = { '4K': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1 };
        return (qualityOrder[b.name] || 0) - (qualityOrder[a.name] || 0);
      });

    // Add original/processed if available
    const legacyOptions = [];
    if (candidate.video.processedPath) {
      legacyOptions.push({
        name: 'processed',
        resolution: 'Variable',
        description: 'Processed (Legacy)'
      });
    }
    legacyOptions.push({
      name: 'original',
      resolution: 'Original',
      description: 'Original Upload'
    });

    res.json({
      success: true,
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName
      },
      video: {
        originalName: candidate.video.originalName,
        duration: candidate.video.duration,
        processingStatus: candidate.video.processingStatus,
        cpuIntensity: candidate.video.cpuIntensity
      },
      availableQualities: [...availableQualities, ...legacyOptions],
      recommended: availableQualities.length > 0 ? availableQualities[0].name : 'original',
      usage: {
        example: `/api/hr/candidates/${candidateId}/video?quality=720p`,
        note: 'Add ?quality=QUALITY_NAME to video URL to select specific quality'
      }
    });

  } catch (error) {
    console.error('Get video qualities error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid candidate ID'
      });
    }
    
    res.status(500).json({
      error: 'Failed to get video qualities',
      message: error.message
    });
  }
});

// Get candidate video thumbnail
router.get('/candidates/:id/thumbnail', requireHR, async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found'
      });
    }

    if (!candidate.video?.thumbnailPath) {
      return res.status(404).json({
        error: 'Thumbnail not available',
        message: 'Video thumbnail has not been generated yet'
      });
    }

    // Serve thumbnail file
    const thumbnailPath = candidate.video.thumbnailPath;
    res.sendFile(path.resolve(thumbnailPath));

  } catch (error) {
    console.error('Get thumbnail error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid candidate ID'
      });
    }
    
    res.status(500).json({
      error: 'Failed to get thumbnail',
      message: error.message
    });
  }
});

// Stream candidate video with quality selection
router.get('/candidates/:id/video', requireHR, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const requestedQuality = req.query.quality; // e.g., '1080p', '720p', etc.
    
    console.log(`🎬 Video request for candidate: ${candidateId}, quality: ${requestedQuality}`);
    
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate) {
      console.log(`❌ Candidate not found: ${candidateId}`);
      return res.status(404).json({
        error: 'Candidate not found'
      });
    }
    
    console.log(`📋 Candidate video data:`, {
      hasVideo: !!candidate.video,
      originalPath: candidate.video?.originalPath,
      processedPath: candidate.video?.processedPath,
      qualities: candidate.video?.qualities?.length || 0
    });

    if (!candidate.video?.originalPath) {
      return res.status(404).json({
        error: 'Video not available',
        message: 'No video has been uploaded for this candidate'
      });
    }

    let videoPath = null;
    let selectedQuality = 'original';

    // Try to find requested quality first
    if (requestedQuality && candidate.video.qualities && candidate.video.qualities.length > 0) {
      const qualityVideo = candidate.video.qualities.find(q => 
        q.name === requestedQuality && q.isReady && q.filePath
      );
      
      if (qualityVideo) {
        // Build full path to processed video
        videoPath = path.join(__dirname, '..', 'uploads', 'processed', qualityVideo.filePath);
        selectedQuality = qualityVideo.name;
        console.log(`📺 Serving ${selectedQuality} quality video for candidate ${candidateId}`);
        console.log(`📁 Full path: ${videoPath}`);
      }
    }

    // Fall back to original video when no specific quality is requested
    if (!videoPath) {
      if (!requestedQuality) {
        // No quality specified, use original video
        videoPath = candidate.video.originalPath;
        selectedQuality = 'original';
        console.log(`📺 Serving original video for candidate ${candidateId} (no quality specified)`);
      } else {
        // Specific quality requested but not found, try best available
        const availableQualities = (candidate.video.qualities || [])
          .filter(q => q.isReady && q.filePath && q.filePath !== 'dummy')
          .sort((a, b) => {
            // Sort by quality preference (720p > 480p > 360p)
            const qualityOrder = { '720p': 3, '480p': 2, '360p': 1 };
            return (qualityOrder[b.name] || 0) - (qualityOrder[a.name] || 0);
          });

        if (availableQualities.length > 0) {
          // Build full path to processed video
          videoPath = path.join(__dirname, '..', 'uploads', 'processed', availableQualities[0].filePath);
          selectedQuality = availableQualities[0].name;
          console.log(`📺 Serving best available quality ${selectedQuality} for candidate ${candidateId}`);
          console.log(`📁 Full path: ${videoPath}`);
        } else {
          // Fall back to original
          videoPath = candidate.video.originalPath;
          selectedQuality = 'original';
          console.log(`📺 Falling back to original video for candidate ${candidateId}`);
        }
      }
    }
    
    // Check if file exists, fallback to original if not
    const fs = require('fs');
    if (!fs.existsSync(videoPath)) {
      console.log(`⚠️ Processed video not found: ${videoPath}, falling back to original`);
      videoPath = candidate.video.originalPath;
      selectedQuality = 'original (fallback)';
      
      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({
          error: 'Video file not found',
          message: 'Neither processed nor original video file exists'
        });
      }
    }

    // Stream video file
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support for video seeking (range requests)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': candidate.video.mimeType || 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Stream entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': candidate.video.mimeType || 'video/mp4',
        'X-Video-Quality': selectedQuality,
        'X-Available-Qualities': (candidate.video.qualities || [])
          .filter(q => q.isReady)
          .map(q => q.name)
          .join(',') || 'original'
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }

  } catch (error) {
    console.error('Stream video error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid candidate ID'
      });
    }
    
    res.status(500).json({
      error: 'Failed to stream video',
      message: error.message
    });
  }
});

// Delete candidate profile
router.delete('/candidates/:id', requireHR, async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Delete associated video files if they exist
    if (candidate.video) {
      try {
        // Delete original video
        if (candidate.video.originalPath && fs.existsSync(candidate.video.originalPath)) {
          fs.unlinkSync(candidate.video.originalPath);
        }
        
        // Delete processed qualities
        if (candidate.video.qualities) {
          candidate.video.qualities.forEach(quality => {
            if (quality.filePath && fs.existsSync(quality.filePath)) {
              fs.unlinkSync(quality.filePath);
            }
          });
        }
        
        // Delete thumbnail
        if (candidate.video.thumbnailPath && fs.existsSync(candidate.video.thumbnailPath)) {
          fs.unlinkSync(candidate.video.thumbnailPath);
        }
      } catch (fileError) {
        console.error('Error deleting video files:', fileError);
        // Continue with candidate deletion even if file deletion fails
      }
    }

    // Delete candidate record
    await Candidate.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Candidate profile deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({
      error: 'Failed to delete candidate',
      message: error.message
    });
  }
});

// Update candidate profile (HR can update name and add notes)
router.put('/candidates/:id', requireHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, notes } = req.body;
    
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Update fields if provided
    if (fullName !== undefined) {
      candidate.fullName = fullName;
    }
    
    if (notes !== undefined) {
      candidate.notes = notes;
    }

    await candidate.save();
    
    res.json({
      success: true,
      message: 'Candidate profile updated successfully',
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        phone: candidate.phone,
        notes: candidate.notes,
        hasVideo: !!(candidate.video?.originalPath || (candidate.video?.qualities && candidate.video.qualities.length > 0)),
        applicationStatus: candidate.applicationStatus
      }
    });
    
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({
      error: 'Failed to update candidate',
      message: error.message
    });
  }
});

// CUSTOM PROCESSING: Individual candidate analysis 
router.get('/candidates/:id/analysis', requireHR, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found'
      });
    }
    
    // Debug: Check duration data in analysis endpoint  
    console.log(`🐛 Analysis endpoint - Candidate ${candidate.fullName} video duration:`, candidate.video?.duration);
    
    // Use custom processing algorithm to analyze candidate
    const analysis = candidateAnalyzer.analyzeCandidate(candidate);
    
    res.json({
      success: true,
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        phone: candidate.phone,
        applicationStatus: candidate.applicationStatus
      },
      analysis: analysis,
      processingNote: 'Generated by custom recruitment analysis algorithms'
    });
    
  } catch (error) {
    console.error('Candidate analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// TEMP: Fix missing duration for existing videos  
router.post('/fix-duration/:id', requireHR, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate || !candidate.video?.originalPath) {
      return res.status(404).json({
        error: 'Candidate or video not found'
      });
    }
    
    // Get video info to extract duration
    const videoProcessor = require('../services/videoProcessor');
    const videoInfo = await videoProcessor.getVideoInfo(candidate.video.originalPath);
    
    // Save duration to database
    candidate.video.duration = videoInfo.duration;
    await candidate.save();
    
    console.log(`✅ Fixed duration for ${candidate.fullName}: ${videoInfo.duration} seconds`);
    
    res.json({
      success: true,
      message: `Duration updated: ${videoInfo.duration} seconds`,
      candidateName: candidate.fullName,
      duration: videoInfo.duration
    });
    
  } catch (error) {
    console.error('Fix duration error:', error);
    res.status(500).json({
      error: 'Failed to fix duration',
      message: error.message
    });
  }
});

// TEMP: Fix duration for ALL candidates with missing duration
router.post('/fix-all-durations', requireHR, async (req, res) => {
  try {
    const videoProcessor = require('../services/videoProcessor');
    
    // Find all candidates with video but missing duration
    const candidates = await Candidate.find({
      'video.originalPath': { $exists: true },
      $or: [
        { 'video.duration': { $exists: false } },
        { 'video.duration': null },
        { 'video.duration': 0 }
      ]
    });
    
    console.log(`🔧 Found ${candidates.length} candidates needing duration fix`);
    
    const results = [];
    let fixed = 0;
    let failed = 0;
    
    for (const candidate of candidates) {
      try {
        console.log(`🔧 Fixing duration for: ${candidate.fullName}`);
        
        // Check if video file exists
        const fs = require('fs');
        if (!fs.existsSync(candidate.video.originalPath)) {
          console.log(`⚠️ Video file not found for ${candidate.fullName}: ${candidate.video.originalPath}`);
          results.push({
            name: candidate.fullName,
            status: 'failed',
            error: 'Video file not found'
          });
          failed++;
          continue;
        }
        
        // Get video duration
        const videoInfo = await videoProcessor.getVideoInfo(candidate.video.originalPath);
        
        // Update database
        candidate.video.duration = videoInfo.duration;
        await candidate.save();
        
        console.log(`✅ Fixed ${candidate.fullName}: ${videoInfo.duration} seconds`);
        results.push({
          name: candidate.fullName,
          status: 'success',
          duration: videoInfo.duration
        });
        fixed++;
        
      } catch (error) {
        console.error(`❌ Failed to fix ${candidate.fullName}:`, error.message);
        results.push({
          name: candidate.fullName,
          status: 'failed',
          error: error.message
        });
        failed++;
      }
    }
    
    res.json({
      success: true,
      message: `Fixed ${fixed} candidates, ${failed} failed`,
      fixed,
      failed,
      results
    });
    
  } catch (error) {
    console.error('Fix all durations error:', error);
    res.status(500).json({
      error: 'Failed to fix durations',
      message: error.message
    });
  }
});

module.exports = router;