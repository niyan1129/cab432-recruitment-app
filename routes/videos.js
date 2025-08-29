const express = require('express');
const { requireAuth } = require('../middleware/auth');
const videoProcessor = require('../services/videoProcessor');
const path = require('path');

const router = express.Router();

// Process existing video (CPU intensive test)
router.post('/process-test', async (req, res) => {
  try {
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Find the first video file in uploads directory
    let videoPath = null;
    let videoName = null;
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const videoFile = files.find(file => 
        file.toLowerCase().match(/\.(mov|mp4|avi|mkv|webm)$/i)
      );
      
      if (videoFile) {
        videoPath = path.join(uploadsDir, videoFile);
        videoName = videoFile;
      }
    }
    
    if (!videoPath || !fs.existsSync(videoPath)) {
      return res.status(400).json({
        success: false,
        error: 'No video file found',
        message: 'Please upload a video file first before running CPU test'
      });
    }
    
    console.log('Starting CPU intensive processing...');
    console.log(`📁 Using video file: ${videoName} (${Math.round(fs.statSync(videoPath).size / 1024 / 1024)} MB)`);
    console.log(`📂 Full path: ${videoPath}`);
    
    // Start processing (don't await to return immediately)
    videoProcessor.processVideoCompleteMultiQuality(
      videoPath,
      videoName,
      ['1080p', '720p', '480p', '360p']
    ).then(result => {
      console.log('✅ Video processing completed successfully!', result);
    }).catch(error => {
      console.error('❌ Video processing failed:', error);
    });

    res.json({
      success: true,
      message: 'Processing started. Check CPU usage.',
      note: 'This will take 5-15 minutes for high CPU load',
      videoFile: videoName,
      videoSize: Math.round(fs.statSync(videoPath).size / 1024 / 1024) + ' MB'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get video processing capabilities and status
router.get('/processing-info', requireAuth, (req, res) => {
  try {
    const cpuInfo = require('os').cpus();
    const memInfo = process.memoryUsage();
    
    res.json({
      success: true,
      server: {
        cpus: cpuInfo.length,
        cpuModel: cpuInfo[0]?.model || 'Unknown',
        memory: {
          total: Math.round(memInfo.heapTotal / 1024 / 1024) + ' MB',
          used: Math.round(memInfo.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memInfo.external / 1024 / 1024) + ' MB'
        },
        uptime: Math.round(process.uptime()) + ' seconds',
        nodeVersion: process.version,
        platform: process.platform
      },
      videoProcessing: {
        supportedFormats: ['mp4', 'avi', 'mov', 'webm', 'mkv'],
        maxFileSize: '2GB',
        outputFormat: 'mp4 (H.264)',
        thumbnailFormat: 'jpg',
        features: [
          'Video compression',
          'Format conversion',
          'Thumbnail generation',
          'Metadata extraction',
          'Quality optimization'
        ]
      },
      cpuIntensiveOperations: [
        'Video encoding/decoding',
        'Format conversion',
        'Video compression',
        'Thumbnail generation',
        'Mathematical computations',
        'Image processing'
      ]
    });

  } catch (error) {
    console.error('Get processing info error:', error);
    res.status(500).json({
      error: 'Failed to get processing information',
      message: error.message
    });
  }
});

// Get current server performance metrics
router.get('/performance', requireAuth, (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      success: true,
      performance: {
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          total: cpuUsage.user + cpuUsage.system
        },
        uptime: {
          process: Math.round(process.uptime()) + ' seconds',
          system: require('os').uptime() + ' seconds'
        },
        loadAverage: require('os').loadavg(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

// Test thumbnail generation
router.post('/test-thumbnail', async (req, res) => {
  try {
    const fs = require('fs');
    const Candidate = require('../models/Candidate');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Find a video file
    let videoPath = null;
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const videoFile = files.find(file => 
        file.toLowerCase().match(/\.(mov|mp4|avi|mkv|webm)$/i)
      );
      
      if (videoFile) {
        videoPath = path.join(uploadsDir, videoFile);
      }
    }
    
    if (!videoPath || !fs.existsSync(videoPath)) {
      return res.status(404).json({
        error: 'No video file found',
        message: 'Upload a video first'
      });
    }
    
    console.log('🧪 Testing thumbnail generation for:', videoPath);
    
    // Generate thumbnail
    const thumbnailResult = await videoProcessor.generateThumbnail(videoPath, 'test-thumb.jpg');
    
    console.log('🧪 Thumbnail result:', thumbnailResult);
    
    res.json({
      success: true,
      message: 'Thumbnail generated successfully',
      videoPath: videoPath,
      thumbnailPath: thumbnailResult.thumbnailPath,
      processingTime: thumbnailResult.processingTime
    });
    
  } catch (error) {
    console.error('Test thumbnail error:', error);
    res.status(500).json({
      error: 'Thumbnail generation failed',
      message: error.message
    });
  }
});

module.exports = router;


