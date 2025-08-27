const express = require('express');
const Candidate = require('../models/Candidate');
const { requireHR } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// Get all candidates (for HR to review)
router.get('/candidates', requireHR, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
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
    
    // Get candidates
    const candidates = await Candidate.find(query)
      .populate('user', 'email createdAt')
      .select('-video.originalPath -video.processedPath') // Don't expose file paths
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Candidate.countDocuments(query);

    // Format response
    const formattedCandidates = candidates.map(candidate => ({
      id: candidate._id,
      fullName: candidate.fullName,
      phone: candidate.phone,
      applicationStatus: candidate.applicationStatus,
      hasVideo: !!candidate.video?.originalPath,
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
        : null
    }));

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
        search: search || ''
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
        hasVideo: !!candidate.video?.originalPath,
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
        videoPath = qualityVideo.filePath;
        selectedQuality = qualityVideo.name;
        console.log(`📺 Serving ${selectedQuality} quality video for candidate ${candidateId}`);
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
          videoPath = availableQualities[0].filePath;
          selectedQuality = availableQualities[0].name;
          console.log(`📺 Serving best available quality ${selectedQuality} for candidate ${candidateId}`);
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

module.exports = router;