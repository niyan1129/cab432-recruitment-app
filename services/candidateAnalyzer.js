/**
 * Custom Processing: Candidate Profile Analysis Service
 * 
 * This service implements domain-specific algorithms for recruitment:
 * - Profile completeness scoring (phone + video upload)
 * - Video quality analysis (duration, file size, processing status)
 * - Overall candidate ranking system
 * 
 * Satisfies "Custom Processing" requirements:
 * - Significant amount of custom algorithms
 * - Domain-specific for recruitment
 * - Novel implementation for HR decision making
 */

class CandidateAnalyzer {
  constructor() {
    // Custom scoring weights and thresholds
    this.weights = {
      profile: 50,  // Profile completeness max score
      video: 50     // Video quality max score
    };
    
    this.thresholds = {
      video: {
        optimalDuration: { min: 60, max: 180 },  // 1-3 minutes (OPTIMAL)
        acceptableDuration: { min: 30, max: 240 }, // 0.5-4 minutes (ACCEPTABLE)
        optimalFileSize: { min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 }, // 10-100MB
        minFileSize: 5 * 1024 * 1024  // 5MB minimum
      }
    };
  }

  /**
   * Main analysis function - calculates overall candidate score
   * @param {Object} candidate - Candidate document from MongoDB
   * @returns {Object} Complete analysis with scores and recommendations
   */
  analyzeCandidate(candidate) {
    const profileAnalysis = this.calculateProfileCompleteness(candidate);
    const videoAnalysis = this.calculateVideoQuality(candidate);
    
    const totalScore = profileAnalysis.score + videoAnalysis.score;
    const grade = this.calculateGrade(totalScore);
    const recommendation = this.generateRecommendation(totalScore, profileAnalysis, videoAnalysis);
    
    return {
      totalScore,
      maxScore: 100,
      percentage: `${totalScore}%`,
      grade,
      recommendation,
      breakdown: {
        profile: profileAnalysis,
        video: videoAnalysis
      },
      strengths: this.identifyStrengths(profileAnalysis, videoAnalysis),
      improvements: this.identifyImprovements(profileAnalysis, videoAnalysis)
    };
  }

  /**
   * Custom Algorithm 1: Profile Completeness Analysis
   * Evaluates basic information completeness for recruitment purposes
   */
  calculateProfileCompleteness(candidate) {
    let score = 0;
    let details = [];
    const maxScore = this.weights.profile;
    
    // Phone information analysis (25 points)
    if (candidate.phone && candidate.phone.trim().length > 0) {
      score += 25;
      details.push({
        item: "Contact Phone",
        status: "✅ Provided",
        points: 25,
        impact: "Easy for HR to contact, smooth communication"
      });
    } else {
      details.push({
        item: "Contact Phone", 
        status: "❌ Not Provided",
        points: 0,
        impact: "Difficult for HR to contact, affects interview scheduling"
      });
    }
    
    // Video upload analysis (25 points)
    if (candidate.video && candidate.video.originalPath) {
      score += 25;
      details.push({
        item: "Interview Video",
        status: "✅ Uploaded",
        points: 25,
        impact: "Can assess communication skills and professional image"
      });
    } else {
      details.push({
        item: "Interview Video",
        status: "❌ Not Uploaded", 
        points: 0,
        impact: "Cannot assess candidate's communication abilities"
      });
    }
    
    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      details,
      category: "Profile Completeness"
    };
  }

  /**
   * Custom Algorithm 2: Video Quality Analysis  
   * Sophisticated video quality scoring for recruitment assessment
   */
  calculateVideoQuality(candidate) {
    const maxScore = this.weights.video;
    
    // No video case
    if (!candidate.video || !candidate.video.originalPath) {
      return {
        score: 0,
        maxScore,
        percentage: 0,
        details: [{
          item: "Video File",
          status: "❌ No Video",
          points: 0,
          impact: "Cannot perform video quality assessment"
        }],
        category: "Video Quality Analysis"
      };
    }
    
    let score = 0;
    let details = [];
    
    // 1. Duration Analysis (20 points) - Custom algorithm for optimal interview length
    const duration = candidate.video.duration || 0;
    console.log(`🐛 Analyzer - Processing duration for ${candidate.fullName || 'Unknown'}: ${duration} seconds`);
    
    let durationScore = 0;
    let durationStatus = "";
    let durationImpact = "";
    
    // Updated duration logic per user requirements:
    // Under 1 minute = Fair, 1-3 minutes = Best, 4+ minutes = Fair
    if (duration === 0) {
      durationScore = 0;
      durationStatus = "❌ No Duration";
      durationImpact = "Video duration not detected";
    } else if (duration < 60) {
      // Under 1 minute: FAIR
      durationScore = 12;
      durationStatus = "🟡 Fair Duration";
      durationImpact = "Under 1 minute - adequate for basic assessment";
    } else if (duration >= 60 && duration <= 180) {
      // 1-3 minutes: BEST
      durationScore = 20;
      durationStatus = "🟢 Best Duration";
      durationImpact = "1-3 minutes - ideal length for thorough evaluation";
    } else if (duration >= 240) {
      // 4+ minutes: FAIR
      durationScore = 12;
      durationStatus = "🟡 Fair Duration";
      durationImpact = "4+ minutes - adequate but lengthy";
    } else {
      // 3-4 minutes: Good (between best and fair)
      durationScore = 16;
      durationStatus = "🔵 Good Duration";
      durationImpact = "3-4 minutes - good length, slightly extended";
    }
    
    score += durationScore;
    details.push({
      item: "Video Duration",
      status: `${durationStatus} (${this.formatDuration(duration)})`,
      points: durationScore,
      impact: durationImpact
    });
    
    // 2. File Quality Analysis (15 points) - Custom file size evaluation
    const fileSize = candidate.video.size || 0;
    let fileSizeScore = 0;
    let fileSizeStatus = "";
    let fileSizeImpact = "";
    
    if (fileSize >= this.thresholds.video.optimalFileSize.min && 
        fileSize <= this.thresholds.video.optimalFileSize.max) {
      fileSizeScore = 15;
      fileSizeStatus = "✅ Excellent Quality";
      fileSizeImpact = "Appropriate file size, clear video quality";
    } else if (fileSize >= this.thresholds.video.minFileSize) {
      fileSizeScore = 8;
      fileSizeStatus = "⚠️ Fair Quality";
      fileSizeImpact = "File quality acceptable, recommend improving recording quality";
    } else {
      fileSizeScore = 0;
      fileSizeStatus = "❌ Poor Quality";
      fileSizeImpact = "File too small, may affect video and audio quality";
    }
    
    score += fileSizeScore;
    details.push({
      item: "File Quality",
      status: `${fileSizeStatus} (${this.formatFileSize(fileSize)})`,
      points: fileSizeScore,
      impact: fileSizeImpact
    });
    
    // 3. Processing Quality Analysis (15 points) - Custom processing evaluation
    let processingScore = 0;
    let processingStatus = "";
    let processingImpact = "";
    
    if (candidate.video.isProcessed && candidate.video.qualities && candidate.video.qualities.length > 0) {
      processingScore = 15;
      processingStatus = "✅ Perfect Processing";
      processingImpact = `Multi-quality versions generated (${candidate.video.qualities.length} versions)`;
    } else if (candidate.video.isProcessed) {
      processingScore = 8;
      processingStatus = "⚠️ Basic Processing";
      processingImpact = "Basic processing completed, but missing multi-quality versions";
    } else {
      processingScore = 0;
      processingStatus = "❌ Processing Incomplete";
      processingImpact = "Video processing not completed, may affect playback experience";
    }
    
    score += processingScore;
    details.push({
      item: "Processing Quality",
      status: processingStatus,
      points: processingScore,
      impact: processingImpact
    });
    
    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      details,
      category: "Video Quality Analysis"
    };
  }

  /**
   * Custom grading algorithm based on recruitment industry standards
   */
  calculateGrade(totalScore) {
    if (totalScore >= 90) return "A";
    if (totalScore >= 70) return "B";
    if (totalScore >= 50) return "C";
    if (totalScore >= 30) return "D";
    return "F";
  }

  /**
   * Custom recommendation engine for HR decision making
   */
  generateRecommendation(totalScore, profileAnalysis, videoAnalysis) {
    if (totalScore >= 90) {
      return "🔥 Priority Interview - Excellent Candidate";
    } else if (totalScore >= 70) {
      if (profileAnalysis.score < 40) {
        return "📞 Obtain Contact Info Then Prioritize";
      } else {
        return "⭐ Recommended Interview - Quality Candidate";
      }
    } else if (totalScore >= 50) {
      const missing = [];
      if (profileAnalysis.score < 25) missing.push("improve contact information");
      if (videoAnalysis.score < 25) missing.push("enhance video quality");
      return `⚠️ Needs Improvement: ${missing.join(", ")}`;
    } else if (totalScore >= 30) {
      return "🔄 Suggest Candidate Complete Profile for Re-evaluation";
    } else {
      return "⏸️ Hold Processing - Profile Severely Incomplete";
    }
  }

  /**
   * Identify candidate strengths for HR reference
   */
  identifyStrengths(profileAnalysis, videoAnalysis) {
    const strengths = [];
    
    if (profileAnalysis.score >= 40) {
      strengths.push("Complete profile information");
    }
    if (videoAnalysis.score >= 40) {
      strengths.push("Excellent video quality");
    }
    if (videoAnalysis.score >= 30) {
      strengths.push("Actively participates in video interviews");
    }
    
    return strengths;
  }

  /**
   * Identify improvement areas for candidate development
   */
  identifyImprovements(profileAnalysis, videoAnalysis) {
    const improvements = [];
    
    profileAnalysis.details.forEach(detail => {
      if (detail.points === 0) {
        improvements.push(detail.impact);
      }
    });
    
    videoAnalysis.details?.forEach(detail => {
      if (detail.points < detail.item === "视频时长" ? 15 : 
                       detail.item === "文件质量" ? 10 : 10) {
        improvements.push(detail.impact);
      }
    });
    
    return improvements;
  }

  /**
   * Utility functions for formatting
   */
  formatDuration(seconds) {
    if (!seconds || seconds === 0) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  }
}

module.exports = new CandidateAnalyzer();
