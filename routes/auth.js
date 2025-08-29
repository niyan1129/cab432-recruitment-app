const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Predefined users for simple login system
const PREDEFINED_USERS = {
  'candidate1': {
    username: 'candidate1',
    email: 'candidate1@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 1'
  },
  'candidate2': {
    username: 'candidate2',
    email: 'candidate2@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 2'
  },
  'candidate3': {
    username: 'candidate3',
    email: 'candidate3@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 3'
  },
  'candidate4': {
    username: 'candidate4',
    email: 'candidate4@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 4'
  },
  'candidate5': {
    username: 'candidate5',
    email: 'candidate5@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 5'
  },
  'candidate6': {
    username: 'candidate6',
    email: 'candidate6@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 6'
  },
  'candidate7': {
    username: 'candidate7',
    email: 'candidate7@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 7'
  },
  'candidate8': {
    username: 'candidate8',
    email: 'candidate8@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 8'
  },
  'candidate9': {
    username: 'candidate9',
    email: 'candidate9@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 9'
  },
  'candidate10': {
    username: 'candidate10',
    email: 'candidate10@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 10'
  },
  'candidate11': {
    username: 'candidate11',
    email: 'candidate11@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 11'
  },
  'candidate12': {
    username: 'candidate12',
    email: 'candidate12@demo.com',
    password: '123456',
    role: 'candidate',
    name: 'Candidate 12'
  },
  'hr': {
    username: 'hr',
    email: 'hr@demo.com',
    password: '123456',
    role: 'hr',
    name: 'Demo HR Manager'
  }
};

// Initialize default users in database (run once)
router.post('/init-users', async (req, res) => {
  try {
    for (const userData of Object.values(PREDEFINED_USERS)) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User({
          email: userData.email,
          password: userData.password,
          role: userData.role
        });
        await user.save();
        console.log(`✅ Created default user: ${userData.email}`);
      }
    }

    res.json({
      success: true,
      message: 'Default users initialized',
      users: Object.keys(PREDEFINED_USERS)
    });

  } catch (error) {
    console.error('User initialization error:', error);
    res.status(500).json({
      error: 'Failed to initialize users',
      message: error.message
    });
  }
});

// Simple login (no registration needed)
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        required: ['username', 'password']
      });
    }

    // Check if using predefined credentials
    const predefinedUser = PREDEFINED_USERS[username.toLowerCase()];
    
    if (predefinedUser && predefinedUser.password === password) {
      // Use predefined user
      let user = await User.findOne({ email: predefinedUser.email });
      
      if (!user) {
        // Create user if doesn't exist
        user = new User({
          email: predefinedUser.email,
          password: predefinedUser.password,
          role: predefinedUser.role
        });
        await user.save();
        console.log(`✅ Auto-created user: ${predefinedUser.email}`);
      } else {
        // Check password for existing user
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({
            error: 'Invalid credentials',
            message: 'Incorrect password'
          });
        }
      }

      // Generate token
      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: predefinedUser.name,
          createdAt: user.createdAt
        },
        token
      });
    }

    // For any other credentials, create a temporary user based on role
    if (role && ['candidate', 'hr'].includes(role)) {
      let user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Create new user with provided credentials
        user = new User({
          email: email.toLowerCase(),
          password: password,
          role: role
        });
        await user.save();
      } else {
        // Verify password for existing user
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({
            error: 'Invalid credentials',
            message: 'Email or password is incorrect'
          });
        }
      }

      // Generate token
      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      });
    }

    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Please provide valid email, password, and role'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Get current user info (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: error.message
    });
  }
});

// Get available demo accounts
router.get('/demo-accounts', (req, res) => {
  res.json({
    success: true,
    accounts: [
      {
        email: 'candidate@demo.com',
        password: '123456',
        role: 'candidate',
        description: '演示候选人账号'
      },
      {
        email: 'hr@demo.com', 
        password: '123456',
        role: 'hr',
        description: '演示HR账号'
      }
    ],
    message: '您可以使用这些预设账号登录，或者使用任意邮箱+密码+角色创建新账号'
  });
});

// Update user profile (requires authentication)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user._id;

    const updateData = {};
    
    if (email && email !== req.user.email) {
      // Check if new email is already taken
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already taken',
          message: 'This email is already associated with another account'
        });
      }
      
      updateData.email = email.toLowerCase();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No changes provided',
        message: 'No valid fields to update'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: error.message
    });
  }
});

// Change password (requires authentication)
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['currentPassword', 'newPassword']
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Verify current password
    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: error.message
    });
  }
});

// Logout (client-side token removal, server-side placeholder)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

module.exports = router;
