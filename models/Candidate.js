const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate format if phone is provided
        return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },

  video: {
    originalPath: {
      type: String,
      required: false
    },
    originalName: {
      type: String,
      required: false
    },
    size: {
      type: Number,
      required: false
    },
    mimeType: {
      type: String,
      required: false
    },
    duration: {
      type: Number, // in seconds
      required: false
    },
    thumbnailPath: {
      type: String,
      required: false
    },
    
    // 多质量版本支持
    qualities: [{
      name: {
        type: String, // '1080p', '720p', '480p', etc.
        required: true
      },
      resolution: {
        type: String, // '1920x1080', '1280x720', etc.
        required: true
      },
      filePath: {
        type: String,
        required: true
      },
      fileSize: {
        type: Number, // in bytes
        required: false
      },
      bitrate: {
        type: String, // '3000k', '1500k', etc.
        required: false
      },
      processingTime: {
        type: Number, // in milliseconds
        required: false
      },
      isReady: {
        type: Boolean,
        default: false
      }
    }],
    
    // 整体处理状态
    isProcessed: {
      type: Boolean,
      default: false
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    processingError: {
      type: String,
      required: false
    },
    totalProcessingTime: {
      type: Number, // in milliseconds
      required: false
    },
    cpuIntensity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'EXTREME', 'MAXIMUM'],
      default: 'HIGH'
    },
    
    // 处理选项
    requestedQualities: [{
      type: String,
      enum: ['4K', '1080p', '720p', '480p', '360p']
    }],
    
    // 传统单质量支持（向后兼容）
    processedPath: {
      type: String,
      required: false
    }
  },
  applicationStatus: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'interview', 'rejected', 'hired'],
    default: 'draft'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  hrReviews: [{
    hr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      maxlength: 500
    },
    reviewDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
candidateSchema.index({ user: 1 });
candidateSchema.index({ applicationStatus: 1 });
candidateSchema.index({ createdAt: -1 });
candidateSchema.index({ fullName: 'text', email: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);
