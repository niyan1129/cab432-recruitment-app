// Recruitment Video Upload System - Frontend JavaScript
// CAB432 Assignment 1

// Global variables
let currentUser = null;
let authToken = null;
const API_BASE = window.location.origin;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Recruitment video system frontend loaded');
    
    // Setup event listeners first
    setupEventListeners();
    
    // Check for existing session and validate it
    checkExistingSession();
});

// Handle page refresh or navigation
window.addEventListener('beforeunload', function() {
    // This event fires when the page is about to be unloaded
    console.log('📄 Page unloading, session will be preserved');
});

// Check and validate existing session
async function checkExistingSession() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        console.log('🔍 Found existing session, validating...');
        
        try {
            // Validate token with server
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${savedToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Token is valid
                authToken = savedToken;
                currentUser = JSON.parse(savedUser);
                console.log('✅ Session valid, showing dashboard');
                showDashboard();
            } else {
                // Token is invalid
                console.log('❌ Session invalid, clearing and showing login');
                clearSession();
                showLogin();
            }
        } catch (error) {
            console.log('❌ Session validation failed, clearing and showing login');
            clearSession();
            showLogin();
        }
    } else {
        // No existing session
        console.log('ℹ️ No existing session, showing login');
        showLogin();
    }
}

// Clear session data
function clearSession() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

// Show login page
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('candidateSection').classList.add('hidden');
    document.getElementById('hrSection').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('userInfo').textContent = '';
}

// Setup all event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', handleProfileSave);
    
    // Video upload form
    document.getElementById('videoUploadForm').addEventListener('submit', handleVideoUpload);
    
    // Video file selection
    document.getElementById('videoFile').addEventListener('change', handleFileSelection);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// ==================== Authentication Functions ====================

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    // Simple username/password mapping
    const userMap = {
        'candidate': { email: 'candidate@demo.com', role: 'candidate', name: 'Demo Candidate' },
        'hr': { email: 'hr@demo.com', role: 'hr', name: 'Demo HR Manager' }
    };
    
    if (!userMap[username]) {
        showError('Invalid username. Use "candidate" or "hr"');
        return;
    }
    
    if (password !== '123456') {
        showError('Invalid password. Use "123456"');
        return;
    }
    
    showLoading('Logging in...');
    
    try {
        const user = userMap[username];
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: username, 
                password: password, 
                role: user.role 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showSuccess('Login successful!');
            showDashboard();
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error, please try again');
    }
    
    hideLoading();
}

// quickLogin function removed - no longer needed

function logout() {
    console.log('🚪 Logging out user...');
    
    // Clear session data
    clearSession();
    
    // Show success message briefly
    showSuccess('Logged out successfully');
    
    // Refresh the page after a short delay to ensure clean state
    setTimeout(() => {
        console.log('🔄 Refreshing page for clean logout...');
        window.location.reload();
    }, 1000);
}

function showDashboard() {
    // Hide login section
    document.getElementById('loginSection').classList.add('hidden');
    
    // Show user info
    document.getElementById('userInfo').textContent = 
        `${currentUser.role === 'candidate' ? 'Candidate' : 'HR'}: ${currentUser.email}`;
    document.getElementById('logoutBtn').classList.remove('hidden');
    
    if (currentUser.role === 'candidate') {
        document.getElementById('candidateSection').classList.remove('hidden');
        // Clear forms and keep them empty for fresh input
        clearCandidateForms();
        loadVideoStatus();
    } else {
        document.getElementById('hrSection').classList.remove('hidden');
        loadCandidates();
    }
}

// ==================== Candidate Functions ====================

// Clear all candidate forms
function clearCandidateForms() {
    // Clear profile form
    document.getElementById('fullName').value = '';
    document.getElementById('phone').value = '';
    
    // Clear video upload form
    const videoUploadForm = document.getElementById('videoUploadForm');
    if (videoUploadForm) {
        videoUploadForm.reset();
    }
    
    // Clear file input
    const videoFileInput = document.getElementById('videoFile');
    if (videoFileInput) {
        videoFileInput.value = '';
    }
    
    console.log('🧹 Candidate forms cleared');
}

async function handleProfileSave(e) {
    e.preventDefault();
    
    const profileData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value
    };
    
    showLoading('Saving profile...');
    
    try {
        const response = await fetch(`${API_BASE}/api/candidates/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Profile saved successfully!');
        } else {
            showError(data.message || 'Save failed');
        }
    } catch (error) {
        console.error('Profile save error:', error);
        showError('Network error, please try again');
    }
    
    hideLoading();
}

function handleFileSelection(e) {
    const file = e.target.files[0];
    if (file) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        const duration = file.duration ? `${Math.round(file.duration / 60)} min` : 'Unknown';
        
        showInfo(`Selected file: ${file.name} (${sizeMB}MB)`);
        
        if (sizeMB > 2048) {
            showError('File too large, please select a video file smaller than 2GB');
            e.target.value = '';
        }
    }
}

async function handleVideoUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('videoFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a video file');
        return;
    }
    
    // Check if profile exists first
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!fullName || !phone) {
        showError('Please save your profile information first (Name and Phone required)');
        return;
    }
    
    const formData = new FormData();
    formData.append('video', file);
    
    showLoading('Uploading video and starting CPU-intensive processing...');
    showInfo('💡 Please open Task Manager to monitor CPU usage, expected to reach 80%+ for several minutes');
    
    try {
        const response = await fetch(`${API_BASE}/api/candidates/upload-video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Video uploaded successfully! Background processing started...');
            displayCPULoadInfo(data);
            
            // Clear form
            fileInput.value = '';
            
            // Start status polling
            startVideoStatusPolling();
        } else {
            showError(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Video upload error:', error);
        showError('Network error, please try again');
    }
    
    hideLoading();
}

function displayCPULoadInfo(data) {
    const cpuInfo = `
        <div class="alert alert-warning">
            <h6><i class="fas fa-microchip me-2"></i>CPU Load Information (CAB432 Demo)</h6>
            <p><strong>Expected CPU Usage:</strong> ${data.cpuLoad.expected}</p>
            <p><strong>Processing Strategy:</strong> ${data.cpuLoad.strategy}</p>
            <p><strong>Estimated Processing Time:</strong> ${data.cpuLoad.duration}</p>
            <p><strong>Assignment Notes:</strong> ${data.assignment.note}</p>
            <p class="mb-0"><strong>Recommendation:</strong> ${data.assignment.recommendation}</p>
        </div>
    `;
    
    document.getElementById('videoStatus').innerHTML = cpuInfo;
    document.getElementById('videoStatus').classList.remove('hidden');
}

async function loadVideoStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/candidates/video-status`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayVideoStatus(data.video);
        }
    } catch (error) {
        console.error('Load video status error:', error);
    }
}

function displayVideoStatus(video) {
    if (!video || !video.originalName) {
        return;
    }
    
    // Calculate progress percentage
    const progressPercentage = video.qualityProgress ? 
        Math.round(video.qualityProgress.completed / video.qualityProgress.total * 100) : 0;
    
    // Determine status icon and message
    let statusIcon = '';
    let statusMessage = '';
    
    switch(video.processingStatus) {
        case 'pending':
            statusIcon = '<i class="fas fa-clock text-warning"></i>';
            statusMessage = 'Waiting to start processing...';
            break;
        case 'processing':
            statusIcon = '<i class="fas fa-cog fa-spin text-primary"></i>';
            statusMessage = `Processing video... (${progressPercentage}% complete)`;
            break;
        case 'completed':
            statusIcon = '<i class="fas fa-check-circle text-success"></i>';
            statusMessage = '✅ Processing completed successfully!';
            break;
        case 'failed':
            statusIcon = '<i class="fas fa-times-circle text-danger"></i>';
            statusMessage = '❌ Processing failed';
            break;
        default:
            statusIcon = '<i class="fas fa-question-circle text-secondary"></i>';
            statusMessage = 'Unknown status';
    }
    
    const statusHtml = `
        <div class="card">
            <div class="card-body">
                <h6><i class="fas fa-video me-2"></i>${video.originalName}</h6>
                
                <div class="status-display mb-3">
                    ${statusIcon}
                    <span class="ms-2">${statusMessage}</span>
                </div>
                
                ${video.qualityProgress ? `
                    <div class="progress-section mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <small>Quality Processing Progress</small>
                            <small>${video.qualityProgress.completed}/${video.qualityProgress.total} complete</small>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${video.processingStatus === 'completed' ? 'bg-success' : 'bg-primary'}" 
                                 style="width: ${progressPercentage}%"
                                 aria-valuenow="${progressPercentage}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                                ${progressPercentage}%
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${video.availableQualities.length > 0 ? `
                    <div class="qualities-section mb-3">
                        <small class="text-muted">Available Qualities:</small>
                        <div class="mt-1">
                            ${video.availableQualities.map(q => 
                                `<span class="badge bg-success me-1">${q.name}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="info-section">
                    <small class="text-muted">
                        CPU Intensity: <span class="badge bg-warning">${video.cpuIntensity || 'HIGH'}</span>
                        ${video.totalProcessingTime ? ` | Processing Time: ${Math.round(video.totalProcessingTime / 1000)}s` : ''}
                    </small>
                </div>
                
                ${video.processingError ? `
                    <div class="alert alert-danger mt-3">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Error:</strong> ${video.processingError}
                    </div>
                ` : ''}
                
                ${video.processingStatus === 'processing' ? `
                    <div class="alert alert-info mt-3">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>CPU Load Monitor:</strong> Check Task Manager - CPU usage should be 80%+ during processing
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('statusContent').innerHTML = statusHtml;
    document.getElementById('videoStatus').classList.remove('hidden');
}

function startVideoStatusPolling() {
    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showInfo('✅ Browser notifications enabled. You\'ll be notified when processing completes.');
            }
        });
    }
    
    const pollInterval = setInterval(async () => {
        await loadVideoStatus();
        
        // Check if processing is complete
        try {
            const response = await fetch(`${API_BASE}/api/candidates/video-status`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.video.processingStatus === 'completed') {
                    clearInterval(pollInterval);
                    console.log('✅ Video processing completed!');
                    
                    // Show completion notification
                    showSuccess('🎉 Video processing completed successfully! All qualities are now available.');
                    
                    // Update page title to notify user
                    document.title = '✅ Processing Complete - Recruitment System';
                    
                    // Display completion info
                    if (data.video.totalProcessingTime) {
                        showInfo(`⏱️ Total processing time: ${Math.round(data.video.totalProcessingTime / 1000)} seconds`);
                    }
                    
                    // Try to show browser notification if permission granted
                    if (Notification.permission === 'granted') {
                        new Notification('Video Processing Complete!', {
                            body: 'Your video has been processed successfully. All quality versions are now ready.',
                            icon: '/favicon.ico'
                        });
                    }
                    
                } else if (data.video.processingStatus === 'failed') {
                    clearInterval(pollInterval);
                    console.log('❌ Video processing failed');
                    showError('❌ Video processing failed. Please try uploading again.');
                    
                } else if (data.video.processingStatus === 'processing') {
                    // Show progress updates
                    const progress = data.video.qualityProgress;
                    if (progress && progress.completed > 0) {
                        console.log(`🔄 Processing progress: ${progress.completed}/${progress.total} qualities complete`);
                        
                        // Update page title with progress
                        const percentage = Math.round(progress.completed / progress.total * 100);
                        document.title = `🔄 Processing ${percentage}% - Recruitment System`;
                    }
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 5000); // Poll every 5 seconds
    
    // Auto-stop polling after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
}

// ==================== HR Functions ====================

async function loadCandidates() {
    console.log('🔍 Loading candidates...');
    console.log('🔑 Auth token:', authToken ? 'exists' : 'missing');
    
    // Simplify search logic to avoid element not found issues
    const search = '';
    const status = '';
    
    showLoading('Loading candidates...');
    
    try {
        let url = `${API_BASE}/api/hr/candidates?limit=50`;
        console.log('📡 Request URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📊 Response data:', data);
        
        if (data.success) {
            console.log('✅ Found candidates:', data.candidates.length);
            displayCandidatesList(data.candidates);
        } else {
            console.error('❌ API Error:', data.message);
            showError(data.message || 'Loading failed');
        }
    } catch (error) {
        console.error('❌ Load candidates error:', error);
        showError('Network error, please retry');
    }
    
    hideLoading();
}

function displayCandidatesList(candidates) {
    console.log('📋 Candidates data:', candidates);
    candidates.forEach(c => console.log(`Candidate: ${c.fullName}, ID: ${c.id}`));
    
    if (candidates.length === 0) {
        document.getElementById('candidatesList').innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle me-2"></i>No candidates found
            </div>
        `;
        return;
    }
    
    const candidatesHtml = candidates.map(candidate => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <h6 class="mb-1">${candidate.fullName}</h6>
                        <small class="text-muted">${candidate.phone}</small>
                    </div>
                    <div class="col-md-4">
                        ${candidate.video ? `
                            <div>
                                <i class="fas fa-video text-success me-1"></i>Has Video
                                <div class="mt-1">
                                    <span class="badge bg-info me-1">720p</span>
                                    <span class="badge bg-info me-1">480p</span>
                                    <span class="badge bg-info me-1">360p</span>
                                </div>
                            </div>
                        ` : `<span class="text-muted"><i class="fas fa-video-slash me-1"></i>No Video</span>`}
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">${new Date(candidate.submittedAt).toLocaleDateString()}</small>
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-info btn-sm view-candidate-btn" data-candidate-id="${candidate.id}">
                            <i class="fas fa-eye me-1"></i>View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('candidatesList').innerHTML = candidatesHtml;
    
    // Add event listeners for view buttons (no inline onclick)
    document.querySelectorAll('.view-candidate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const candidateId = e.currentTarget.getAttribute('data-candidate-id');
            console.log('🔍 View candidate clicked, ID:', candidateId);
            if (!candidateId || candidateId === 'undefined') {
                console.error('❌ Invalid candidate ID:', candidateId);
                showError('Invalid candidate ID');
                return;
            }
            viewCandidateDetail(candidateId);
        });
    });
}

async function viewCandidateDetail(candidateId) {
    showLoading('Loading candidate details...');
    
    try {
        const response = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayCandidateDetail(data.candidate);
            new bootstrap.Modal(document.getElementById('candidateModal')).show();
        } else {
            showError(data.message || 'Loading failed');
        }
    } catch (error) {
        console.error('Load candidate detail error:', error);
        showError('Network error, please retry');
    }
    
    hideLoading();
}

function displayCandidateDetail(candidate) {
    const detailHtml = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-user me-2"></i>Basic Information</h6>
                <p><strong>Name:</strong> ${candidate.fullName}</p>
                <p><strong>Phone:</strong> ${candidate.phone}</p>

            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-video me-2"></i>Video Information</h6>
                ${candidate.video ? `
                    <p><strong>File Name:</strong> ${candidate.video.originalName}</p>
                    <p><strong>File Size:</strong> ${(candidate.video.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    <div class="mt-3">
                        <h6>Video Playback:</h6>
                        <div id="qualitySelector" class="mb-3">
                            <button class="btn btn-outline-primary btn-sm me-2 mb-2 play-video-btn" data-candidate-id="${candidate.id}" data-quality="720p">
                                <i class="fas fa-play me-1"></i>720p
                            </button>
                            <button class="btn btn-outline-primary btn-sm me-2 mb-2 play-video-btn" data-candidate-id="${candidate.id}" data-quality="480p">
                                <i class="fas fa-play me-1"></i>480p
                            </button>
                            <button class="btn btn-outline-primary btn-sm me-2 mb-2 play-video-btn" data-candidate-id="${candidate.id}" data-quality="360p">
                                <i class="fas fa-play me-1"></i>360p
                            </button>
                            <button class="btn btn-outline-secondary btn-sm me-2 mb-2 play-video-btn" data-candidate-id="${candidate.id}" data-quality="original">
                                <i class="fas fa-play me-1"></i>Original Quality
                            </button>
                        </div>
                    </div>
                    
                    <div id="videoPlayer" class="text-center">
                        <!-- Video will be loaded here -->
                    </div>
                ` : `<p class="text-muted">This candidate has not uploaded a video yet</p>`}
            </div>
        </div>

    `;
    
    document.getElementById('candidateDetail').innerHTML = detailHtml;
    
    // Add event listeners for play video buttons (no inline onclick)
    document.querySelectorAll('.play-video-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const candidateId = e.currentTarget.getAttribute('data-candidate-id');
            const quality = e.currentTarget.getAttribute('data-quality');
            console.log('🎬 Play video clicked:', candidateId, quality);
            playVideo(candidateId, quality);
        });
    });
}

async function playVideo(candidateId, quality) {
    const videoPlayer = document.getElementById('videoPlayer');
    
    try {
        // Show loading
        videoPlayer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading video...</p>
            </div>
        `;
        
        // Fetch video with specified quality
        const videoUrl = `${API_BASE}/api/hr/candidates/${candidateId}/video${quality !== 'original' ? `?quality=${quality}` : ''}`;
        console.log(`🎬 Fetching video: ${videoUrl} (quality: ${quality})`);
        
        const response = await fetch(videoUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get video blob
        const videoBlob = await response.blob();
        const videoBlobUrl = URL.createObjectURL(videoBlob);
        
        // Display video
        videoPlayer.innerHTML = `
            <div class="video-container">
                <video controls style="max-width: 100%; height: auto;">
                    <source src="${videoBlobUrl}" type="video/mp4">
                    Your browser does not support video playback.
                </video>
                <p class="mt-2 text-muted">Playing: ${quality === 'original' ? 'Original Video' : quality + ' Quality'}</p>
            </div>
        `;
        
        console.log(`Playing video quality: ${quality}`);
        
        // Clean up blob URL when video is loaded
        const video = videoPlayer.querySelector('video');
        video.addEventListener('loadeddata', function() {
            // URL.revokeObjectURL(videoBlobUrl); // Keep it for now
        });
        
    } catch (error) {
        console.error('Video loading error:', error);
        videoPlayer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Video loading failed: ${error.message}
            </div>
        `;
    }
}

async function addReview(candidateId) {
    const rating = document.getElementById('rating').value;
    const comments = document.getElementById('comments').value;
    
    if (!rating) {
        showError('Please select a rating');
        return;
    }
    
    showLoading('Submitting review...');
    
    try {
        const response = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ rating: parseInt(rating), comments })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Review submitted successfully!');
            // Refresh candidate detail
            viewCandidateDetail(candidateId);
        } else {
            showError(data.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Add review error:', error);
        showError('Network error, please retry');
    }
    
    hideLoading();
}

// ==================== Helper Functions ====================

function getStatusColor(status) {
    const colors = {
        'draft': 'secondary',
        'pending': 'warning',
        'processing': 'warning',
        'submitted': 'primary',
        'reviewed': 'info',
        'interview': 'success',
        'hired': 'success',
        'rejected': 'danger',
        'completed': 'success',
        'failed': 'danger'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'draft': 'Draft',
        'pending': 'Pending',
        'processing': 'Processing',
        'submitted': 'Submitted',
        'reviewed': 'Reviewed',
        'interview': 'Interview',
        'hired': 'Hired',
        'rejected': 'Rejected',
        'completed': 'Completed',
        'failed': 'Failed'
    };
    return texts[status] || status;
}

function showLoading(message) {
    // You could implement a loading overlay here
    console.log('Loading:', message);
}

function hideLoading() {
    // Hide loading overlay
    console.log('Loading complete');
}

function showSuccess(message) {
    showAlert(message, 'success');
}

function showError(message) {
    showAlert(message, 'danger');
}

function showInfo(message) {
    showAlert(message, 'info');
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-notification');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-notification position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${message}</span>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}
