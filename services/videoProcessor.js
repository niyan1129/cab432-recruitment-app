const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('@ffprobe-installer/ffprobe');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// Set FFmpeg and FFprobe paths - use static binaries for local development
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
} else if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
} else if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

console.log('🔧 FFmpeg path:', ffmpegStatic || 'system default');
console.log('🔧 FFprobe path:', ffprobeStatic.path || 'system default');

class VideoProcessor {
  constructor() {
    this.uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
    this.processedDir = path.join(this.uploadDir, 'processed');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    
    // 定义不同质量级别 - 使用slower preset增加CPU使用时间
    this.qualityPresets = {
      '4K': {
        resolution: '3840x2160',
        bitrate: '8000k',
        crf: 18,
        preset: 'slower',  // 最慢预设，最大化CPU使用
        suffix: '_4k'
      },
      '1080p': {
        resolution: '1920x1080', 
        bitrate: '3000k',
        crf: 20,
        preset: 'slower',  // 最慢预设，延长处理时间
        suffix: '_1080p'
      },
      '720p': {
        resolution: '1280x720',
        bitrate: '1500k', 
        crf: 23,
        preset: 'slow',    // 慢预设，保证质量和CPU负载
        suffix: '_720p'
      },
      '480p': {
        resolution: '854x480',
        bitrate: '800k',
        crf: 25,
        preset: 'slow',    // 慢预设，增加处理时间
        suffix: '_480p'
      },
      '360p': {
        resolution: '640x360',
        bitrate: '400k',
        crf: 28,
        preset: 'medium',  // 中等预设
        suffix: '_360p'
      }
    };
    
    this.ensureDirectories();
  }

  /**
   * 安全地解析视频帧率分数 (如 "30/1" 转换为 30)
   */
  parseFraction(fractionString) {
    try {
      if (!fractionString || typeof fractionString !== 'string') return 0;
      
      const parts = fractionString.split('/');
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        return denominator !== 0 ? numerator / denominator : 0;
      }
      return parseFloat(fractionString) || 0;
    } catch (error) {
      console.error('Error parsing fraction:', error);
      return 0;
    }
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
      console.log('✅ Video directories ensured');
    } catch (error) {
      console.error('❌ Error creating directories:', error);
      throw new Error(`Failed to create video directories: ${error.message}`);
    }
  }

  /**
   * CPU INTENSIVE OPERATION: Process video into single quality
   * This includes compression, format conversion, and optimization
   */
  async processVideoSingleQuality(inputPath, outputFilename, qualityPreset) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.processedDir, outputFilename);
      
      console.log(`🎬 Starting CPU intensive video processing: ${inputPath} -> ${qualityPreset.resolution}`);
      const startTime = Date.now();

      ffmpeg(inputPath)
        .videoCodec('libx264')           // CPU intensive H.264 encoding
        .audioCodec('aac')               // Audio compression
        .videoBitrate(qualityPreset.bitrate)
        .size(qualityPreset.resolution)  // CPU intensive scaling
        .fps(30)                         
        .addOptions([
          `-preset ${qualityPreset.preset}`,  // Slower preset = more CPU usage
          `-crf ${qualityPreset.crf}`,        // Quality setting (CPU intensive)
          '-movflags +faststart',             // Web optimization
          '-profile:v high',                  // H.264 profile
          '-level 4.0'                        // H.264 level
        ])
        .on('start', (commandLine) => {
          console.log(`📊 FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          console.log(`📈 Processing ${qualityPreset.resolution}: ${Math.round(progress.percent || 0)}% complete`);
        })
        .on('end', () => {
          const duration = Date.now() - startTime;
          console.log(`✅ ${qualityPreset.resolution} processing completed in ${duration}ms`);
          resolve({
            outputPath,
            quality: qualityPreset.resolution,
            processingTime: duration,
            success: true
          });
        })
        .on('error', (error) => {
          const duration = Date.now() - startTime;
          console.error(`❌ ${qualityPreset.resolution} processing failed after ${duration}ms:`, error.message);
          reject({
            error: error.message,
            quality: qualityPreset.resolution,
            processingTime: duration,
            success: false
          });
        })
        .save(outputPath);
    });
  }

  /**
   * EXTREMELY CPU INTENSIVE OPERATION: Process video into multiple qualities SEQUENTIALLY
   * This will generate multiple versions one after another - sustained CPU load for long videos!
   * Perfect for demonstrating extended 80%+ CPU usage over 5+ minutes
   */
  async processVideoMultipleQualities(inputPath, baseFilename, qualities = ['1080p', '720p', '480p']) {
    const startTime = Date.now();
    console.log(`🔥 Starting SUSTAINED CPU intensive sequential multi-quality processing: ${qualities.join(', ')}`);
    console.log(`⏱️ Expected duration: ${qualities.length * 2-5} minutes for long videos`);
    
    const results = [];
    const failures = [];
    let currentQualityIndex = 0;

    for (const qualityName of qualities) {
      const preset = this.qualityPresets[qualityName];
      if (!preset) {
        console.warn(`⚠️ Unknown quality preset: ${qualityName}`);
        failures.push({ quality: qualityName, error: 'Unknown preset' });
        continue;
      }
      
      currentQualityIndex++;
      console.log(`🎬 Processing quality ${currentQualityIndex}/${qualities.length}: ${qualityName}`);
      console.log(`📊 Current progress: ${Math.round((currentQualityIndex - 1) / qualities.length * 100)}%`);
      
      const outputFilename = `${baseFilename}${preset.suffix}.mp4`;
      
      try {
        const qualityStartTime = Date.now();
        const result = await this.processVideoSingleQuality(inputPath, outputFilename, preset);
        const qualityDuration = Date.now() - qualityStartTime;
        
        console.log(`✅ ${qualityName} completed in ${Math.round(qualityDuration/1000)}s`);
        console.log(`📈 Overall progress: ${Math.round(currentQualityIndex / qualities.length * 100)}%`);
        
        results.push(result);
        
        // Add small delay between qualities to allow system to breathe
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to process ${qualityName}:`, error);
        failures.push({ ...error, quality: qualityName });
      }
    }

    const totalDuration = Date.now() - startTime;
    const totalMinutes = Math.round(totalDuration / 60000 * 10) / 10;
    
    console.log(`🎯 Sequential multi-quality processing completed in ${totalDuration}ms (${totalMinutes} minutes)`);
    console.log(`✅ Successful: ${results.length}, ❌ Failed: ${failures.length}`);
    console.log(`🔥 CPU was intensively used for ${totalMinutes} minutes continuously`);
    
    return {
      success: results.length > 0,
      qualities: results,
      failures: failures,
      totalProcessingTime: totalDuration,
      processingMinutes: totalMinutes,
      cpuIntensity: 'SUSTAINED', // Long-duration continuous CPU load
      strategy: 'SEQUENTIAL' // One quality at a time for sustained load
    };
  }

  /**
   * CPU INTENSIVE OPERATION: Process video file (legacy single quality)
   * This includes compression, format conversion, and optimization
   */
  async processVideo(inputPath, outputFilename) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.processedDir, outputFilename);
      
      console.log(`🎬 Starting CPU intensive video processing: ${inputPath}`);
      const startTime = Date.now();

      ffmpeg(inputPath)
        .videoCodec('libx264')           // CPU intensive H.264 encoding
        .audioCodec('aac')               // Audio compression
        .videoBitrate('1000k')           // Reduce bitrate for web
        .size('1280x720')                // Resize to 720p (CPU intensive)
        .fps(30)                         // Standardize frame rate
        .addOptions([
          '-preset slow',                // Slower preset = more CPU usage, better compression
          '-crf 23',                     // Quality setting (CPU intensive)
          '-movflags +faststart',        // Web optimization
          '-profile:v high',             // H.264 profile
          '-level 4.0'                   // H.264 level
        ])
        .on('start', (commandLine) => {
          console.log(`📊 FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          console.log(`📈 Processing: ${Math.round(progress.percent || 0)}% complete`);
        })
        .on('end', () => {
          const duration = Date.now() - startTime;
          console.log(`✅ Video processing completed in ${duration}ms`);
          resolve({
            outputPath,
            processingTime: duration,
            success: true
          });
        })
        .on('error', (error) => {
          const duration = Date.now() - startTime;
          console.error(`❌ Video processing failed after ${duration}ms:`, error.message);
          reject({
            error: error.message,
            processingTime: duration,
            success: false
          });
        })
        .save(outputPath);
    });
  }

  /**
   * CPU INTENSIVE OPERATION: Generate video thumbnail
   * This extracts a frame and processes it into a thumbnail
   */
  async generateThumbnail(videoPath, thumbnailFilename) {
    return new Promise((resolve, reject) => {
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
      const tempImagePath = thumbnailPath.replace('.jpg', '_temp.png');
      
      // 确保视频路径中的空格被正确处理
      const sanitizedVideoPath = videoPath.replace(/ /g, '\\ ');
      
      console.log(`🖼️ Starting CPU intensive thumbnail generation: ${sanitizedVideoPath}`);
      const startTime = Date.now();

      // First, extract frame from video (CPU intensive)
      ffmpeg(sanitizedVideoPath)
        .screenshots({
          timestamps: ['00:00:02'],  // Extract frame at 2 seconds
          filename: path.basename(tempImagePath),
          folder: this.thumbnailDir,
          size: '640x360'           // Extract at specific resolution
        })
        .on('end', async () => {
          try {
            // Then process with Sharp for optimization (CPU intensive)
            await sharp(tempImagePath)
              .resize(320, 180, {
                fit: 'cover',
                position: 'center'
              })
              .jpeg({
                quality: 80,
                progressive: true
              })
              .toFile(thumbnailPath);

            // Clean up temp file
            await fs.unlink(tempImagePath).catch(() => {});
            
            const duration = Date.now() - startTime;
            console.log(`✅ Thumbnail generation completed in ${duration}ms`);
            
            resolve({
              thumbnailPath,
              processingTime: duration,
              success: true
            });
          } catch (sharpError) {
            const duration = Date.now() - startTime;
            console.error(`❌ Thumbnail processing failed after ${duration}ms:`, sharpError.message);
            reject({
              error: sharpError.message,
              processingTime: duration,
              success: false
            });
          }
        })
        .on('error', (error) => {
          const duration = Date.now() - startTime;
          console.error(`❌ Thumbnail extraction failed after ${duration}ms:`, error.message);
          reject({
            error: error.message,
            processingTime: duration,
            success: false
          });
        });
    });
  }

  /**
   * CPU INTENSIVE OPERATION: Get video metadata and duration
   */
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      console.log(`📊 Analyzing video metadata: ${videoPath}`);
      const startTime = Date.now();

      ffmpeg.ffprobe(videoPath, (error, metadata) => {
        const duration = Date.now() - startTime;
        
        if (error) {
          console.error(`❌ Video analysis failed after ${duration}ms:`, error.message);
          reject({
            error: error.message,
            processingTime: duration,
            success: false
          });
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        const info = {
          duration: parseFloat(metadata.format.duration),
          size: parseInt(metadata.format.size),
          bitrate: parseInt(metadata.format.bit_rate),
          format: metadata.format.format_name,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: this.parseFraction(videoStream.r_frame_rate) // Convert fraction to decimal
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels
          } : null,
          processingTime: duration,
          success: true
        };

        console.log(`✅ Video analysis completed in ${duration}ms`);
        resolve(info);
      });
    });
  }

  /**
   * EXTREMELY CPU INTENSIVE OPERATION: Complete multi-quality video processing pipeline
   * This generates multiple quality versions + thumbnail - MAXIMUM CPU load!
   */
  async processVideoCompleteMultiQuality(inputPath, baseFilename, qualities = ['1080p', '720p', '480p']) {
    const startTime = Date.now();
    console.log(`🚀 Starting EXTREME CPU intensive multi-quality pipeline for: ${inputPath}`);
    console.log(`🔥 Generating ${qualities.length} quality versions: ${qualities.join(', ')}`);

    try {
      // Step 1: Get video information (CPU intensive)
      const videoInfo = await this.getVideoInfo(inputPath);
      console.log(`📊 Video info: ${videoInfo.duration}s, ${videoInfo.video?.width}x${videoInfo.video?.height}`);

      // Step 2: Generate thumbnail (CPU intensive)
      const thumbnailFilename = `thumb_${baseFilename}.jpg`;
      const thumbnailResult = await this.generateThumbnail(inputPath, thumbnailFilename);
      console.log(`🖼️ Thumbnail generated: ${thumbnailResult.thumbnailPath}`);

      // Step 3: Process video into multiple qualities (EXTREMELY CPU intensive)
      const multiQualityResult = await this.processVideoMultipleQualities(inputPath, baseFilename, qualities);
      
      const totalDuration = Date.now() - startTime;
      console.log(`🎯 EXTREME multi-quality processing pipeline finished in ${totalDuration}ms`);

      return {
        success: multiQualityResult.success,
        originalInfo: videoInfo,
        qualities: multiQualityResult.qualities || [],
        failures: multiQualityResult.failures || [],
        thumbnailPath: thumbnailResult.thumbnailPath,
        totalProcessingTime: totalDuration,
        cpuIntensity: 'MAXIMUM', // Multiple simultaneous video encoding
        steps: {
          analysis: videoInfo.processingTime,
          thumbnail: thumbnailResult.processingTime,
          multiQuality: multiQualityResult.totalProcessingTime
        }
      };

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`❌ Multi-quality processing pipeline failed after ${totalDuration}ms:`, error);
      
      return {
        success: false,
        error: error.error || error.message,
        totalProcessingTime: totalDuration,
        cpuIntensity: 'MAXIMUM'
      };
    }
  }

  /**
   * CPU INTENSIVE OPERATION: Complete video processing pipeline (legacy single quality)
   * This combines all CPU intensive operations
   */
  async processVideoComplete(inputPath, baseFilename) {
    const startTime = Date.now();
    console.log(`🚀 Starting complete video processing pipeline for: ${inputPath}`);

    try {
      // Step 1: Get video information (CPU intensive)
      const videoInfo = await this.getVideoInfo(inputPath);
      console.log(`📊 Video info obtained: ${videoInfo.duration}s, ${videoInfo.video?.width}x${videoInfo.video?.height}`);

      // Step 2: Process video (Most CPU intensive operation)
      const processedFilename = `processed_${baseFilename}.mp4`;
      const processResult = await this.processVideo(inputPath, processedFilename);
      console.log(`🎬 Video processing completed: ${processResult.outputPath}`);

      // Step 3: Generate thumbnail (CPU intensive)
      const thumbnailFilename = `thumb_${baseFilename}.jpg`;
      const thumbnailResult = await this.generateThumbnail(inputPath, thumbnailFilename);
      console.log(`🖼️ Thumbnail generated: ${thumbnailResult.thumbnailPath}`);

      const totalDuration = Date.now() - startTime;
      console.log(`✅ Complete video processing pipeline finished in ${totalDuration}ms`);

      return {
        success: true,
        originalInfo: videoInfo,
        processedPath: processResult.outputPath,
        thumbnailPath: thumbnailResult.thumbnailPath,
        totalProcessingTime: totalDuration,
        steps: {
          analysis: videoInfo.processingTime,
          processing: processResult.processingTime,
          thumbnail: thumbnailResult.processingTime
        }
      };

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`❌ Video processing pipeline failed after ${totalDuration}ms:`, error);
      
      return {
        success: false,
        error: error.error || error.message,
        totalProcessingTime: totalDuration
      };
    }
  }

  /**
   * Additional CPU intensive operation for demonstration
   */
  async performCPUIntensiveTask(complexity = 1000000) {
    const startTime = Date.now();
    console.log(`🔥 Starting CPU intensive calculation with complexity: ${complexity}`);

    let result = 0;
    
    // CPU intensive mathematical operations
    for (let i = 0; i < complexity; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
      
      // Additional complex calculations
      if (i % 1000 === 0) {
        result += Math.pow(i, 0.5) * Math.log(i + 1);
      }
      
      // Matrix-like operations
      if (i % 10000 === 0) {
        for (let j = 0; j < 100; j++) {
          result += Math.atan2(i, j) * Math.tan(j);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ CPU intensive calculation completed in ${duration}ms`);
    
    return {
      result: result.toFixed(4),
      complexity,
      processingTime: duration,
      operationsPerSecond: Math.round(complexity / (duration / 1000))
    };
  }
}

module.exports = new VideoProcessor();
