const express = require('express');
const Candidate = require('../models/Candidate');
const { requireCandidate } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');
const videoProcessor = require('../services/videoProcessor');

const router = express.Router();

// Create or update candidate profile (simplified - only name and phone)
router.post('/profile', requireCandidate, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const userId = req.user._id;

    // Validation - only fullName is required, phone is optional
    if (!fullName) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fullName']
      });
    }

    // Check if candidate profile already exists for this user
    let candidate = await Candidate.findOne({ user: userId });

    if (candidate) {
      // Update existing profile
      candidate.fullName = fullName;
      candidate.phone = phone;
      candidate.applicationStatus = 'submitted';
      
      await candidate.save();
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        candidate: {
          id: candidate._id,
          fullName: candidate.fullName,
          phone: candidate.phone,
          hasVideo: !!candidate.video?.originalPath,
          applicationStatus: candidate.applicationStatus
        }
      });
    } else {
      // Create new profile for this user
      candidate = new Candidate({
        user: userId,
        fullName,
        phone,
        applicationStatus: 'submitted'
      });

      await candidate.save();

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        candidate: {
          id: candidate._id,
          fullName: candidate.fullName,
          phone: candidate.phone,
          hasVideo: false,
          applicationStatus: candidate.applicationStatus
        }
      });
    }

  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({
      error: 'Failed to save profile',
      message: error.message
    });
  }
});

// Get candidate profile
router.get('/profile', requireCandidate, async (req, res) => {
  try {
    const userId = req.user._id;
    const candidate = await Candidate.findOne({ user: userId });

    if (!candidate) {
      return res.json({
        success: true,
        candidate: null,
        message: 'No profile found. Please create your profile first.'
      });
    }

    res.json({
      success: true,
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        phone: candidate.phone,
        hasVideo: !!candidate.video?.originalPath,
        videoStatus: candidate.video?.processingStatus || 'pending'
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

// Upload video (CPU intensive process)
router.post('/upload-video', requireCandidate, uploadVideo, async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file provided',
        message: 'Please select a video file to upload'
      });
    }

    // Find candidate profile
    const candidate = await Candidate.findOne({ user: userId });
    if (!candidate) {
      return res.status(400).json({
        error: 'Profile not found',
        message: 'Please create your profile before uploading videos'
      });
    }

    console.log(`🎬 Video upload started for candidate: ${candidate.fullName}`);
    console.log(`📁 File: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Store video information
    candidate.video = {
      originalPath: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      isProcessed: false,
      processingStatus: 'pending',
      requestedQualities: ['720p', '480p', '360p'], // For sustained CPU load
      qualities: []
    };

    await candidate.save();

    // Start CPU-intensive video processing (asynchronous)
    console.log(`🔥 Starting SEQUENTIAL multi-quality video processing for SUSTAINED CPU load...`);
    
    // Store file info for callback
    const videoFileName = req.file.filename;
    const baseFileName = req.file.originalname;
    
    // Remove file extension to avoid duplication (e.g., "video.mp4" -> "video")
    const baseNameWithoutExt = baseFileName.replace(/\.[^/.]+$/, '');
    
    videoProcessor.processVideoCompleteMultiQuality(
      req.file.path,
      baseNameWithoutExt,
      ['720p', '480p', '360p']
    ).then(async (result) => {
      console.log('✅ Video processing completed successfully!');
      console.log('📊 Processing result:', result);
      
              // Update candidate with processed video information
      try {
        candidate.video.processingStatus = 'completed';
        candidate.video.isProcessed = true;
        
        // Save video duration from processing result
        if (result.originalInfo && result.originalInfo.duration) {
          candidate.video.duration = result.originalInfo.duration;
          console.log(`⏱️ Saved video duration: ${result.originalInfo.duration} seconds`);
        }
        
        // Save total processing time
        if (result.totalProcessingTime) {
          candidate.video.totalProcessingTime = result.totalProcessingTime;
          console.log(`⏱️ Total processing time: ${result.totalProcessingTime}ms`);
        }
        
        // Use actual generated file paths from the processing result
        const qualityMap = {
          '1280x720': '720p',
          '854x480': '480p',
          '640x360': '360p'
        };
        
        candidate.video.qualities = result.qualities.map(qualityResult => {
          const qualityName = qualityMap[qualityResult.quality] || qualityResult.quality;
          return {
            name: qualityName,
            resolution: qualityResult.quality,
            filePath: qualityResult.outputPath.replace(/^.*[\\\/]/, ''), // Get just filename
            isReady: true
          };
        });
        
        // Save thumbnail path
        if (result.thumbnailPath) {
          candidate.video.thumbnailPath = result.thumbnailPath;
          console.log(`🖼️ Saved thumbnail path: ${result.thumbnailPath}`);
        }
        
        candidate.video.completedAt = new Date();
        await candidate.save();
        
        console.log(`📋 Updated candidate ${candidate.fullName} with completed video processing`);
        console.log(`📁 Qualities:`, candidate.video.qualities);
      } catch (error) {
        console.error('❌ Failed to update candidate with video status:', error);
      }
    }).catch(async (error) => {
      console.error('❌ Video processing failed:', error);
      
      // Update candidate with failed status
      try {
        candidate.video.processingStatus = 'failed';
        candidate.video.errorMessage = error.message;
        await candidate.save();
      } catch (updateError) {
        console.error('❌ Failed to update candidate with error status:', updateError);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully! Processing started with SUSTAINED CPU load.',
      video: {
        originalName: req.file.originalname,
        size: req.file.size,
        processingStatus: 'pending',
        requestedQualities: ['720p', '480p', '360p']
      },
      cpuIntensive: {
        strategy: 'SEQUENTIAL multi-quality transcoding',
        expectedLoad: '80%+ CPU for 5-15 minutes',
        recommendation: 'Use long videos (>5 min) for best CAB432 assignment demo',
        note: 'Check /api/candidates/video-status for real-time progress'
      }
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      error: 'Video upload failed',
      message: error.message
    });
  }
});

// Check video processing status
router.get('/video-status', requireCandidate, async (req, res) => {
  try {
    const userId = req.user._id;
    const candidate = await Candidate.findOne({ user: userId });

    if (!candidate || !candidate.video) {
      return res.json({
        success: true,
        status: 'no_video',
        message: 'No video uploaded yet'
      });
    }

    const video = candidate.video;
    const completedQualities = (video.qualities || []).filter(q => q.isReady);
    const totalQualities = video.requestedQualities?.length || 0;

    res.json({
      success: true,
      status: video.processingStatus,
      video: {
        originalName: video.originalName,
        size: video.size,
        duration: video.duration,
        isProcessed: video.isProcessed,
        processingStatus: video.processingStatus,
        processingError: video.processingError,
        hasThumbnail: !!video.thumbnailPath,
        totalProcessingTime: video.totalProcessingTime,
        cpuIntensity: video.cpuIntensity
      },
      progress: {
        completed: completedQualities.length,
        total: totalQualities,
        percentage: totalQualities > 0 ? Math.round((completedQualities.length / totalQualities) * 100) : 0,
        availableQualities: completedQualities.map(q => q.name)
      }
    });

  } catch (error) {
    console.error('Get video status error:', error);
    res.status(500).json({
      error: 'Failed to get video status',
      message: error.message
    });
  }
});

module.exports = router;