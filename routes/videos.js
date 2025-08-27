const express = require('express');
const { requireAuth } = require('../middleware/auth');
const videoProcessor = require('../services/videoProcessor');
const path = require('path');

const router = express.Router();

// Process existing video (CPU intensive test)
router.post('/process-test', async (req, res) => {
  try {
    const videoPath = path.join(__dirname, '../videos/video.mov');
    console.log('Starting CPU intensive processing...');
    
    videoProcessor.processVideoCompleteMultiQuality(
      videoPath,
      'video.mov',
      ['1080p', '720p', '480p', '360p']
    ).catch(error => {
      console.error('Processing failed:', error);
    });

    res.json({
      success: true,
      message: 'Processing started. Check CPU usage.',
      note: 'This will take 5-15 minutes for high CPU load'
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

module.exports = router;

