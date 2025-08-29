# Recruitment System

A video-based recruitment system with CPU-intensive video processing capabilities.

## Demo Accounts

### HR Manager
- **Username:** `hr`
- **Password:** `123456`
- **Role:** HR Manager (can view all candidates and videos)

### Candidates (12 accounts)
- **Username:** `candidate1` | **Password:** `123456`
- **Username:** `candidate2` | **Password:** `123456`
- **Username:** `candidate3` | **Password:** `123456`
- **Username:** `candidate4` | **Password:** `123456`
- **Username:** `candidate5` | **Password:** `123456`
- **Username:** `candidate6` | **Password:** `123456`
- **Username:** `candidate7` | **Password:** `123456`
- **Username:** `candidate8` | **Password:** `123456`
- **Username:** `candidate9` | **Password:** `123456`
- **Username:** `candidate10` | **Password:** `123456`
- **Username:** `candidate11` | **Password:** `123456`
- **Username:** `candidate12` | **Password:** `123456`

## How to Test

### 1. Initialize Users
First, initialize the demo users:
```bash
POST /api/auth/init-users
```

### 2. Test Candidate Applications
1. Login as `candidate1` with password `123456`
2. Fill in name and phone number
3. Save profile
4. Repeat with `candidate2`, `candidate3`, etc.

### 3. Test HR View
1. Login as `hr` with password `123456`
2. View candidates list - should see all 12 candidates
3. Each candidate can have different names and phone numbers

### 4. Test Video Upload (Optional)
1. Login as any candidate
2. Upload a video file
3. Watch CPU usage increase during processing
4. HR can view processed videos in different qualities

## Features

- **User Authentication:** JWT-based login system
- **Role-based Access:** Separate interfaces for candidates and HR
- **Video Processing:** CPU-intensive multi-quality video transcoding
- **Real-time Monitoring:** CPU usage tracking during video processing
- **Multiple Candidates:** 12 separate candidate accounts for testing
