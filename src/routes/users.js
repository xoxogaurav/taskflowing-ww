import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.country = req.body.country || user.country;
    user.age = req.body.age || user.age;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.bio = req.body.bio || user.bio;
    user.timezone = req.body.timezone || user.timezone;
    user.language = req.body.language || user.language;
    user.emailNotifications = req.body.emailNotifications ?? user.emailNotifications;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('name balance tasksCompleted profilePicture')
      .sort('-balance')
      .limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;