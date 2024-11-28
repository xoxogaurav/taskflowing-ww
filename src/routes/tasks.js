import express from 'express';
import Task from '../models/Task.js';
import TaskSubmission from '../models/TaskSubmission.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ isActive: true });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit task
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const submission = await TaskSubmission.create({
      taskId: task._id,
      userId: req.user._id,
      screenshotUrl: req.body.screenshotUrl
    });

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      taskId: task._id,
      amount: task.reward,
      type: 'earning',
      status: task.approvalType === 'automatic' ? 'completed' : 'pending'
    });

    // If automatic approval, update user balance
    if (task.approvalType === 'automatic') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 
          balance: task.reward,
          tasksCompleted: 1
        }
      });
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { pendingEarnings: task.reward }
      });
    }

    // Notify connected clients
    req.app.get('io').emit('taskSubmitted', {
      userId: req.user._id,
      taskId: task._id,
      status: submission.status
    });

    res.status(201).json({ submission, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Review submission (admin only)
router.put('/:id/review', protect, admin, async (req, res) => {
  try {
    const { submissionId, status } = req.body;
    const submission = await TaskSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = status;
    await submission.save();

    const task = await Task.findById(submission.taskId);
    const transaction = await Transaction.findOne({
      taskId: submission.taskId,
      userId: submission.userId
    });

    if (status === 'approved') {
      await User.findByIdAndUpdate(submission.userId, {
        $inc: {
          balance: task.reward,
          tasksCompleted: 1,
          pendingEarnings: -task.reward
        }
      });

      if (transaction) {
        transaction.status = 'completed';
        await transaction.save();
      }
    } else if (status === 'rejected') {
      await User.findByIdAndUpdate(submission.userId, {
        $inc: { pendingEarnings: -task.reward }
      });

      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }
    }

    // Notify connected clients
    req.app.get('io').emit('submissionReviewed', {
      userId: submission.userId,
      taskId: submission.taskId,
      status
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;