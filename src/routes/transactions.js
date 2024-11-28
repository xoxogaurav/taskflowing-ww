import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user transactions
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('taskId', 'title')
      .sort('-createdAt');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request withdrawal
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const transaction = await Transaction.create({
      userId: user._id,
      amount,
      type: 'withdrawal',
      status: 'pending'
    });

    user.balance -= amount;
    await user.save();

    // Notify connected clients
    req.app.get('io').emit('withdrawalRequested', {
      userId: user._id,
      amount,
      transactionId: transaction._id
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;