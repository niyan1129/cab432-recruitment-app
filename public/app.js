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
        'candidate1': { email: 'candidate1@demo.com', role: 'candidate', name: 'Candidate 1' },
        'candidate2': { email: 'candidate2@demo.com', role: 'candidate', name: 'Candidate 2' },
        'candidate3': { email: 'candidate3@demo.com', role: 'candidate', name: 'Candidate 3' },
        'candidate4': { email: 'candidate4@demo.com', role: 'candidate', name: 'Candidate 4' },
        'candidate5': { email: 'candidate5@demo.com', role: 'candidate', name: 'Candidate 5' },
        'candidate6': { email: 'candidate6@demo.com', role: 'candidate', name: 'Candidate 6' },
        'candidate7': { email: 'candidate7@demo.com', role: 'candidate', name: 'Candidate 7' },
        'candidate8': { email: 'candidate8@demo.com', role: 'candidate', name: 'Candidate 8' },
        'candidate9': { email: 'candidate9@demo.com', role: 'candidate', name: 'Candidate 9' },
        'candidate10': { email: 'candidate10@demo.com', role: 'candidate', name: 'Candidate 10' },
        'candidate11': { email: 'candidate11@demo.com', role: 'candidate', name: 'Candidate 11' },
        'candidate12': { email: 'candidate12@demo.com', role: 'candidate', name: 'Candidate 12' },
        'hr': { email: 'hr@demo.com', role: 'hr', name: 'Demo HR Manager' }
    };
    
    if (!userMap[username]) {
        showError('Invalid username. Use "candidate1" to "candidate12" or "hr"');
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

async function logout() {
    console.log('🚪 Logging out user...');
    
    try {
        // Call logout API if user is authenticated
        if (authToken) {
            const response = await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log('✅ Server logout successful');
            } else {
                console.warn('⚠️ Server logout failed, continuing with local logout');
            }
        }
    } catch (error) {
        console.warn('⚠️ Logout API call failed:', error.message);
    }
    
    // Clear session data (always do this regardless of API result)
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
            showSuccess('Profile saved successfully! HR can now see your application.');
            // Show success message for HR visibility
            showInfo('✅ Your profile is now visible to HR managers. You can upload a video later to enhance your application.');
            
            // Reload current user profile
            await loadUserProfile();
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
    
    if (!fullName) {
        showError('Please save your profile information first (Name required)');
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
            <p><strong>Processing Strategy:</strong> ${data.cpuIntensive.strategy}</p>
            <p><strong>Expected CPU Load:</strong> ${data.cpuIntensive.expectedLoad}</p>
            <p><strong>Recommendation:</strong> ${data.cpuIntensive.recommendation}</p>
            <p class="mb-0"><strong>Assignment Notes:</strong> ${data.cpuIntensive.note}</p>
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
            if (data.success && data.video) {
                displayVideoStatus(data.video, data);
            }
        }
    } catch (error) {
        console.error('Load video status error:', error);
        // Don't show error to user for video status polling
    }
}

function displayVideoStatus(video, data) {
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
                
                ${data.progress ? `
                    <div class="progress-section mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <small>Quality Processing Progress</small>
                            <small>${data.progress.completed}/${data.progress.total} complete</small>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${video.processingStatus === 'completed' ? 'bg-success' : 'bg-primary'}" 
                                 style="width: ${data.progress.percentage}%"
                                 aria-valuenow="${data.progress.percentage}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                                ${data.progress.percentage}%
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${data.progress && data.progress.availableQualities && data.progress.availableQualities.length > 0 ? `
                    <div class="qualities-section mb-3">
                        <small class="text-muted">Available Qualities:</small>
                        <div class="mt-1">
                            ${data.progress.availableQualities.map(q => 
                                `<span class="badge bg-success me-1">${q}</span>`
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
    
    const statusContentElement = document.getElementById('statusContent');
    const videoStatusElement = document.getElementById('videoStatus');
    
    if (statusContentElement && videoStatusElement) {
        statusContentElement.innerHTML = statusHtml;
        videoStatusElement.classList.remove('hidden');
    } else {
        console.warn('⚠️ Video status elements not found, user may not be on candidate page');
    }
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
            if (data.success && data.video && data.video.processingStatus === 'completed') {
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
                    
                } else if (data.success && data.video && data.video.processingStatus === 'failed') {
                    clearInterval(pollInterval);
                    console.log('❌ Video processing failed');
                    showError('❌ Video processing failed. Please try uploading again.');
                    
                } else if (data.success && data.video && data.video.processingStatus === 'processing') {
                    // Show progress updates
                    const progress = data.progress;
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

async function loadCandidates(page = 1, limit = 5, search = '', sortField = 'hasVideo', sortOrder = 'desc') {
    console.log('🔍 Loading candidates...');
    console.log('🔑 Auth token:', authToken ? 'exists' : 'missing');
    
    showLoading('Loading candidates...');
    
    try {
        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sort: sortField,
            order: sortOrder
        });
        
        if (search) {
            params.append('search', search);
        }
        
        let url = `${API_BASE}/api/hr/candidates?${params.toString()}`;
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
            // Store pagination info for later use
            window.currentPagination = data.pagination;
            window.currentPage = page;
            
            displayCandidatesList(data);
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

// Delete candidate profile
async function deleteCandidate(candidateId) {
    if (!confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
        return;
    }
    
    showLoading('Deleting candidate...');
    
    try {
        const response = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Candidate deleted successfully!');
            // Refresh candidates list with current search and sorting
            const searchTerm = window.currentSearchTerm || '';
            const sortSelection = window.currentSortOrder || 'hasVideo_desc';
            const [sortField, sortOrder] = sortSelection.split('_');
            await loadCandidates(window.currentPage || 1, 5, searchTerm, sortField, sortOrder);
        } else {
            showError(data.message || 'Delete failed');
        }
    } catch (error) {
        console.error('Delete candidate error:', error);
        showError('Network error, please retry');
    }
    
    hideLoading();
}

// Show update form for candidate
function showUpdateForm(candidateId, currentName, currentNotes) {
    const updateFormHtml = `
        <div class="modal fade" id="updateModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Update Candidate Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="updateCandidateForm">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" id="updateFullName" class="form-control" value="${currentName}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Notes</label>
                                <textarea id="updateNotes" class="form-control" rows="3" placeholder="Add HR notes about this candidate">${currentNotes}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="updateCandidate('${candidateId}')">Update</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('updateModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', updateFormHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('updateModal'));
    modal.show();
    
    // Store modal instance for later use
    window.currentUpdateModal = modal;
}

// Update candidate profile
async function updateCandidate(candidateId) {
    const fullName = document.getElementById('updateFullName').value.trim();
    const notes = document.getElementById('updateNotes').value.trim();
    
    if (!fullName) {
        showError('Full name is required');
        return;
    }
    
    showLoading('Updating candidate...');
    
    try {
        const response = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ fullName, notes })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Candidate updated successfully!');
            // Close modal using stored instance
            if (window.currentUpdateModal) {
                window.currentUpdateModal.hide();
                window.currentUpdateModal = null;
            }
            // Refresh candidate detail
            await viewCandidateDetail(candidateId);
            // Refresh candidates list
            await loadCandidates();
        } else {
            showError(data.message || 'Update failed');
        }
    } catch (error) {
        console.error('Update candidate error:', error);
        showError('Network error, please retry');
    }
    
    hideLoading();
}

function displayCandidatesList(data) {
    const candidates = data.candidates || [];
    console.log('📋 Candidates data:', candidates);
    console.log('📄 Pagination data:', data.pagination);
    console.log('📋 Candidates data:', candidates);
    candidates.forEach(c => {
        console.log(`Candidate: ${c.fullName}, ID: ${c.id}`);
        console.log(`  - hasVideo: ${c.hasVideo}`);
        console.log(`  - videoStatus: ${c.videoStatus}`);
        console.log(`  - availableQualities:`, c.availableQualities);
        console.log(`  - video object:`, c.video);
    });
    
    if (candidates.length === 0) {
        document.getElementById('candidatesList').innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle me-2"></i>No candidates found
                <div class="mt-2">
                    <button class="btn btn-primary btn-sm" onclick="loadCandidates()">
                        <i class="fas fa-sync-alt me-1"></i>Refresh
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const candidatesHtml = candidates.map(candidate => {
        // Get analysis data from API response
        const analysis = candidate.analysis || {};
        const scoreClass = analysis.completenessLevel === 'excellent' ? 'success' : 
                          analysis.completenessLevel === 'good' ? 'primary' :
                          analysis.completenessLevel === 'fair' ? 'warning' : 'danger';
        const gradeIcon = analysis.grade === 'A' ? '⭐' : 
                         analysis.grade === 'B' ? '👍' :
                         analysis.grade === 'C' ? '⚠️' : 
                         analysis.grade === 'D' ? '📝' : '🔴';
        
        return `
        <div class="card mb-3 border-${scoreClass === 'danger' ? 'danger' : scoreClass === 'warning' ? 'warning' : 'success'}">
            <div class="card-body">
                <div class="row align-items-center">
                    <!-- Candidate Basic Information -->
                    <div class="col-md-3">
                        <h6 class="mb-1">${candidate.fullName}</h6>
                        <div class="mb-1">
                            ${candidate.phone ? 
                                `<small class="text-success"><i class="fas fa-phone me-1"></i>${candidate.phone}</small>` :
                                `<small class="text-muted"><i class="fas fa-phone-slash me-1"></i>No phone</small>`
                            }
                        </div>
                        <small class="text-info">ID: ${candidate.id}</small>
                    </div>
                    
                    <!-- Video Information -->
                    <div class="col-md-3">
                        ${candidate.hasVideo ? `
                            <div>
                                <i class="fas fa-video text-success me-1"></i>Has Video
                                ${candidate.hasThumbnail ? `
                                    <div class="mt-2 mb-2">
                                        <img id="thumbnail-list-${candidate.id}" 
                                             class="video-thumbnail img-fluid rounded" 
                                             alt="Video thumbnail"
                                             style="max-width: 60px; max-height: 45px; display: none;"
                                             onerror="this.style.display='none'">
                                        <div id="thumbnail-list-loading-${candidate.id}" class="text-muted small">
                                            <i class="fas fa-image"></i> Loading...
                                        </div>
                                    </div>
                                ` : ''}
                                <div class="mt-1">
                                    ${candidate.availableQualities && candidate.availableQualities.length > 0 ? 
                                        candidate.availableQualities.map(q => 
                                            `<span class="badge bg-info me-1" style="font-size: 0.7em">${q}</span>`
                                        ).join('') : 
                                        candidate.hasVideo ? 
                                            '<span class="badge bg-info me-1" style="font-size: 0.7em">720p</span><span class="badge bg-info me-1" style="font-size: 0.7em">480p</span><span class="badge bg-info me-1" style="font-size: 0.7em">360p</span>' :
                                            '<span class="badge bg-warning me-1" style="font-size: 0.7em">No Video</span>'
                                    }
                                </div>
                            </div>
                        ` : `
                            <div>
                                <span class="text-muted"><i class="fas fa-video-slash me-1"></i>No Video</span>
                            </div>
                        `}
                    </div>
                    
                    <!-- CUSTOM PROCESSING: Score Display -->
                    <div class="col-md-4">
                        <div class="text-center">
                            <div class="mb-1">
                                <span class="badge bg-${scoreClass} fs-6">${analysis.totalScore || 0}/100</span>
                                <span class="badge bg-secondary ms-1">${gradeIcon} ${analysis.grade || 'N/A'}</span>
                            </div>
                            <div class="progress mb-1" style="height: 6px;">
                                <div class="progress-bar bg-${scoreClass}" style="width: ${analysis.totalScore || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="col-md-2 text-end">
                        <div class="d-flex gap-1 justify-content-end">
                            <button class="btn btn-info btn-sm view-candidate-btn" data-candidate-id="${candidate.id}">
                                <i class="fas fa-eye me-1"></i>View
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="showAnalysisModal('${candidate.id}')">
                                <i class="fas fa-chart-line me-1"></i>Analysis
                            </button>
                            ${candidate.hasVideo && !candidate.videoDuration ? 
                                `<button class="btn btn-outline-warning btn-sm" onclick="fixDuration('${candidate.id}')" title="Fix video duration">
                                    <i class="fas fa-clock me-1"></i>Fix
                                </button>` : ''
                            }
                            <button class="btn btn-outline-danger btn-sm delete-candidate-btn" data-candidate-id="${candidate.id}">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        `;
    }).join('');
    
    // Add refresh button and candidate count info
    const headerHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h4 class="mb-0">
                    <i class="fas fa-users me-2"></i>Candidates (${candidates.length})
                </h4>
                <small class="text-muted">Showing all candidates including those without videos</small>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-primary btn-sm" onclick="loadCandidates()">
                    <i class="fas fa-sync-alt me-1"></i>Refresh
                </button>
            </div>
        </div>
    `;
    
    // Add search and sort controls
    const searchSortHtml = `
        <div class="row mb-3">
            <div class="col-md-6">
                <label class="form-label">Search by Name:</label>
                <div class="input-group">
                    <input type="text" class="form-control form-control-sm" id="searchInput" placeholder="Enter name to search..." value="${window.currentSearchTerm || ''}">
                    <button class="btn btn-primary btn-sm" type="button" onclick="searchCandidates()">
                        <i class="fas fa-search"></i> Search
                    </button>
                </div>
            </div>
            <div class="col-md-6">
                <label class="form-label">Sorting:</label>
                <select class="form-select form-select-sm" id="sortOrder" onchange="applySort()">
                    <option value="hasVideo_desc" ${(window.currentSortOrder || 'hasVideo_desc') === 'hasVideo_desc' ? 'selected' : ''}>Has Video First</option>
                    <option value="hasVideo_asc" ${(window.currentSortOrder || 'hasVideo_desc') === 'hasVideo_asc' ? 'selected' : ''}>No Video First</option>
                    <option value="score_desc" ${(window.currentSortOrder || 'hasVideo_desc') === 'score_desc' ? 'selected' : ''}>Candidate Score (High to Low)</option>
                    <option value="score_asc" ${(window.currentSortOrder || 'hasVideo_desc') === 'score_asc' ? 'selected' : ''}>Candidate Score (Low to High)</option>
                </select>
            </div>
        </div>
    `;
    
    // Insert main content first
    document.getElementById('candidatesList').innerHTML = headerHtml + searchSortHtml + candidatesHtml;
    
    // Load thumbnails for candidates that have them
    console.log('🖼️ Checking candidates for thumbnails:', candidates.map(c => ({
        id: c.id, 
        name: c.fullName, 
        hasThumbnail: c.hasThumbnail,
        hasVideo: c.hasVideo
    })));
    
    candidates.forEach(candidate => {
        if (candidate.hasThumbnail) {
            console.log(`🖼️ Loading thumbnail for ${candidate.fullName} (${candidate.id})`);
            loadThumbnailWithAuth(candidate.id, 'list');
        }
    });
    
    // 立即在候选人列表后插入 pts页控件（往上提）
    console.log('📄 Full data object:', data);
    console.log('📄 Pagination data:', data.pagination);
    
    // 强制显示 pts页控件，即使没有 pts页数据
    let paginationData = data.pagination;
    if (!paginationData) {
      // 如果没有 pts页数据，创建一个默认的
      paginationData = {
        page: 1,
        pages: 1,
        total: candidates.length,
        limit: 5
      };
      console.log('📄 Created default pagination data:', paginationData);
    }
    
    const paginationHtml = generatePaginationHtml(paginationData);
    console.log('📄 Generated pagination HTML:', paginationHtml);
    document.getElementById('candidatesList').insertAdjacentHTML('beforeend', paginationHtml);
    
    // 保存当前状态到全局变量
    window.currentSearchTerm = data.filters?.search || '';
    window.currentSortOrder = data.filters?.order || 'desc';
    
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
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-candidate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const candidateId = e.currentTarget.getAttribute('data-candidate-id');
            console.log('🗑️ Delete candidate clicked, ID:', candidateId);
            if (!candidateId || candidateId === 'undefined') {
                console.error('❌ Invalid candidate ID:', candidateId);
                showError('Invalid candidate ID');
                return;
            }
            deleteCandidate(candidateId);
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
                ${candidate.notes ? `<p><strong>Notes:</strong> ${candidate.notes}</p>` : ''}
                
                <div class="mt-3">
                    <button class="btn btn-warning btn-sm me-2" onclick="showUpdateForm('${candidate.id}', '${candidate.fullName}', '${candidate.notes || ''}')">
                        <i class="fas fa-edit me-1"></i>Update Profile
                    </button>
                </div>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-video me-2"></i>Video Information</h6>
                ${candidate.video && candidate.video.hasVideo ? `
                    ${candidate.video.hasThumbnail ? `
                        <div class="mb-3">
                            <img id="thumbnail-detail-${candidate.id}" 
                                 class="video-thumbnail img-fluid rounded" 
                                 alt="Video thumbnail"
                                 style="max-width: 200px; max-height: 150px; display: none;"
                                 onerror="this.style.display='none'">
                            <div id="thumbnail-detail-loading-${candidate.id}" class="text-muted">
                                <i class="fas fa-spinner fa-spin"></i> Loading thumbnail...
                            </div>
                        </div>
                    ` : ''}
                    <p><strong>File Name:</strong> ${candidate.video.originalName || 'Unknown'}</p>
                    <p><strong>File Size:</strong> ${candidate.video.size ? (candidate.video.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</p>
                    
                    ${candidate.video.availableQualities && candidate.video.availableQualities.length > 0 ? `
                        <div class="mt-3">
                            <h6>Available Qualities:</h6>
                            <div id="qualitySelector" class="mb-3">
                                ${candidate.video.availableQualities.map(q => 
                                    `<button class="btn btn-outline-primary btn-sm me-2 mb-2 play-video-btn" data-candidate-id="${candidate.id}" data-quality="${q.name}">
                                        <i class="fas fa-play me-1"></i>${q.name}
                                    </button>`
                                ).join('')}
                                <button class="btn btn-outline-secondary btn-sm me-2 mb-2 play-video-btn" data-candidate-id="${candidate.id}" data-quality="original">
                                    <i class="fas fa-play me-1"></i>Original
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="mt-3">
                            <p class="text-warning">
                                <i class="fas fa-clock me-1"></i>Video is being processed...
                            </p>
                            <div class="progress">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
                            </div>
                        </div>
                    `}
                    
                    <div id="videoPlayer" class="text-center mt-3">
                        <!-- Video will be loaded here -->
                    </div>
                ` : `<p class="text-muted">This candidate has not uploaded a video yet</p>`}
            </div>
        </div>

    `;
    
    document.getElementById('candidateDetail').innerHTML = detailHtml;
    
    // Load thumbnail if available
    if (candidate.video?.hasThumbnail) {
        loadThumbnailWithAuth(candidate.id, 'detail');
    }
    
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

// Generate pagination HTML
function generatePaginationHtml(pagination) {
    const { page, pages, total } = pagination;
    let paginationHtml = '<div class="mt-3 mb-3 border-top pt-3">';
    
    // Always show pagination info
    paginationHtml += `<div class="text-center text-muted mb-3">Showing page ${page} of ${pages} (${total} total candidates)</div>`;
    
    // Always show pagination controls, even for single page
    paginationHtml += '<nav><ul class="pagination justify-content-center mb-0">';
    
    // Previous button
    if (page > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${page - 1})">Previous</a></li>`;
    } else {
        paginationHtml += `<li class="page-item disabled"><span class="page-link">Previous</span></li>`;
    }
    
    // Page numbers - always show
    for (let i = 1; i <= pages; i++) {
        if (i === page) {
            paginationHtml += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${i})">${i}</a></li>`;
        }
    }
    
    // Next button
    if (page < pages) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${page + 1})">Next</a></li>`;
    } else {
        paginationHtml += `<li class="page-item disabled"><span class="page-link">Next</span></li>`;
    }
    
    paginationHtml += '</ul></nav>';
    paginationHtml += '</div>';
    
    return paginationHtml;
}

// Search candidates by name
function searchCandidates() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const sortSelection = document.getElementById('sortOrder').value;
    
    // Parse sort selection
    const [sortField, sortOrder] = sortSelection.split('_');
    
    // Save current state
    window.currentSearchTerm = searchTerm;
    window.currentSortOrder = sortSelection;
    
    // Reset to first page when searching
    window.currentPage = 1;
    
    // Load candidates with search term (fixed limit of 5)
    loadCandidates(1, 5, searchTerm, sortField, sortOrder);
}

// Apply sorting and reload candidates
function applySort() {
    const sortSelection = document.getElementById('sortOrder').value;
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    // Parse sort selection
    const [sortField, sortOrder] = sortSelection.split('_');
    
    // Save current state
    window.currentSearchTerm = searchTerm;
    window.currentSortOrder = sortSelection;
    
    console.log('🔀 Frontend sorting changed:');
    console.log('  - sortField:', sortField);
    console.log('  - sortOrder:', sortOrder);
    console.log('  - searchTerm:', searchTerm);
    
    // Reset to first page when sorting changes
    window.currentPage = 1;
    
    // Load candidates with current search and new sorting (fixed limit of 5)
    loadCandidates(1, 5, searchTerm, sortField, sortOrder);
}

// Go to specific page
function goToPage(pageNumber) {
    // Use saved state instead of reading from DOM
    const sortSelection = window.currentSortOrder || 'hasVideo_desc';
    const searchTerm = window.currentSearchTerm || '';
    
    // Parse sort selection
    const [sortField, sortOrder] = sortSelection.split('_');
    
    window.currentPage = pageNumber;
    loadCandidates(pageNumber, 5, searchTerm, sortField, sortOrder);
}

// Load thumbnail with authentication
async function loadThumbnailWithAuth(candidateId, type) {
    console.log(`🖼️ Attempting to load thumbnail for candidate ${candidateId}, type: ${type}`);
    
    // Set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
        const response = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/thumbnail`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log(`🖼️ Thumbnail response for ${candidateId}:`, response.status, response.statusText);
        
        if (response.ok) {
            const blob = await response.blob();
            const objectURL = URL.createObjectURL(blob);
            
            const imgElement = document.getElementById(`thumbnail-${type}-${candidateId}`);
            const loadingElement = document.getElementById(`thumbnail-${type}-loading-${candidateId}`);
            
            if (imgElement && loadingElement) {
                imgElement.src = objectURL;
                imgElement.style.display = 'block';
                loadingElement.style.display = 'none';
                
                // Clean up object URL when image is loaded
                imgElement.onload = () => URL.revokeObjectURL(objectURL);
            }
        } else {
            // Hide loading indicator if failed
            const loadingElement = document.getElementById(`thumbnail-${type}-loading-${candidateId}`);
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.warn(`🖼️ Thumbnail load timeout for candidate ${candidateId}`);
        } else {
            console.error('Failed to load thumbnail:', error);
        }
        
        // Hide loading indicator and show error message
        const loadingElement = document.getElementById(`thumbnail-${type}-loading-${candidateId}`);
        if (loadingElement) {
            loadingElement.innerHTML = '<small class="text-muted">⚠️ Thumbnail timeout</small>';
        }
    }
}



// Load user profile after saving
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/api/candidates/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.candidate) {
            // 更新表单显示已保存的资料
            document.getElementById('fullName').value = data.candidate.fullName || '';
            document.getElementById('phone').value = data.candidate.phone || '';
            
            // 显示资料状态
            if (data.candidate.video && data.candidate.video.originalPath) {
                showInfo('📹 You have uploaded a video. HR can view and review your application.');
            } else {
                showInfo('📝 Profile saved! You can upload a video anytime to complete your application.');
            }
        }
    } catch (error) {
        console.error('Load profile error:', error);
        // 不显示错误，因为这不是关键操作
    }
}

// CUSTOM PROCESSING: Show detailed candidate analysis
async function showAnalysisModal(candidateId) {
    showLoading('Analyzing candidate profile...');
    
    try {
        const response = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/analysis`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAnalysisModal(data.candidate, data.analysis);
        } else {
            showError(data.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        showError('Network error, please retry');
    }
    
    hideLoading();
}

// Display detailed analysis modal
function displayAnalysisModal(candidate, analysis) {
    const modalHtml = `
        <div class="modal fade" id="analysisModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-line me-2"></i>Candidate Analysis - ${candidate.fullName}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Overall Score -->
                        <div class="row mb-4">
                            <div class="col-12 text-center">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h2 class="mb-1">${analysis.totalScore}/100</h2>
                                        <h4 class="text-${analysis.grade === 'A' ? 'success' : analysis.grade === 'B' ? 'primary' : analysis.grade === 'C' ? 'warning' : 'danger'} mb-2">
                                            Grade ${analysis.grade}
                                        </h4>
                                        <div class="progress mb-2" style="height: 12px;">
                                            <div class="progress-bar bg-${analysis.grade === 'A' ? 'success' : analysis.grade === 'B' ? 'primary' : analysis.grade === 'C' ? 'warning' : 'danger'}" 
                                                 style="width: ${analysis.percentage}"></div>
                                        </div>
                                        <p class="mb-0"><strong>${analysis.recommendation}</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Detailed Breakdown -->
                        <div class="row">
                            <!-- Profile Completeness -->
                            <div class="col-md-6">
                                <h6><i class="fas fa-user me-2"></i>${analysis.breakdown.profile.category}</h6>
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span>Score</span>
                                            <span class="fw-bold">${analysis.breakdown.profile.score}/${analysis.breakdown.profile.maxScore}</span>
                                        </div>
                                        <div class="progress mb-3" style="height: 8px;">
                                            <div class="progress-bar bg-info" style="width: ${analysis.breakdown.profile.percentage}%"></div>
                                        </div>
                                        
                                        ${analysis.breakdown.profile.details.map(detail => `
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <div>
                                                    <div class="fw-bold">${detail.item}</div>
                                                    <small class="text-muted">${detail.impact}</small>
                                                </div>
                                                <div class="text-end">
                                                    <span class="badge bg-${detail.points > 0 ? 'success' : 'danger'}">${detail.status}</span>
                                                    <br>
                                                    <small class="text-muted">+${detail.points} pts</small>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Video Quality Analysis -->
                            <div class="col-md-6">
                                <h6><i class="fas fa-video me-2"></i>${analysis.breakdown.video.category}</h6>
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span>Score</span>
                                            <span class="fw-bold">${analysis.breakdown.video.score}/${analysis.breakdown.video.maxScore}</span>
                                        </div>
                                        <div class="progress mb-3" style="height: 8px;">
                                            <div class="progress-bar bg-primary" style="width: ${analysis.breakdown.video.percentage}%"></div>
                                        </div>
                                        
                                        ${analysis.breakdown.video.details.map(detail => `
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <div>
                                                    <div class="fw-bold">${detail.item}</div>
                                                    <small class="text-muted">${detail.impact}</small>
                                                </div>
                                                <div class="text-end">
                                                    <span class="badge bg-${detail.points >= 15 ? 'success' : detail.points >= 8 ? 'warning' : 'danger'}">${detail.status}</span>
                                                    <br>
                                                    <small class="text-muted">+${detail.points} pts</small>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Strengths and Improvement Suggestions -->
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <h6><i class="fas fa-star me-2 text-warning"></i>Candidate Strengths</h6>
                                <div class="card border-success">
                                    <div class="card-body">
                                        ${analysis.strengths.length > 0 ? 
                                            analysis.strengths.map(strength => `
                                                <div class="mb-1">
                                                    <i class="fas fa-check-circle text-success me-2"></i>${strength}
                                                </div>
                                            `).join('') :
                                            '<p class="text-muted mb-0">No notable strengths identified</p>'
                                        }
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <h6><i class="fas fa-lightbulb me-2 text-primary"></i>Improvement Suggestions</h6>
                                <div class="card border-warning">
                                    <div class="card-body">
                                        ${analysis.improvements.length > 0 ? 
                                            analysis.improvements.map(improvement => `
                                                <div class="mb-1">
                                                    <i class="fas fa-exclamation-triangle text-warning me-2"></i>${improvement}
                                                </div>
                                            `).join('') :
                                            '<p class="text-muted mb-0">Profile is complete, no improvements needed</p>'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="alert alert-info mt-3">
                            <small>
                                <i class="fas fa-robot me-1"></i>
                                This analysis is generated by custom recruitment algorithms specifically designed for candidate evaluation.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('analysisModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('analysisModal'));
    modal.show();
}

// Fix duration for candidate with missing duration data
async function fixDuration(candidateId) {
    showLoading('Fixing video duration...');
    
    try {
        const response = await fetch(`${API_BASE}/api/hr/fix-duration/${candidateId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`Duration fixed: ${data.duration} seconds for ${data.candidateName}`);
            // Reload candidates list to show updated data
            await loadCandidates();
        } else {
            showError(data.error || 'Failed to fix duration');
        }
    } catch (error) {
        console.error('Fix duration error:', error);
        showError('Network error, please retry');
    }
    
    hideLoading();
}



