import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reward: {
    type: Number,
    required: true
  },
  timeEstimate: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  timeInSeconds: {
    type: Number,
    required: true
  },
  steps: [{
    type: String
  }],
  approvalType: {
    type: String,
    enum: ['automatic', 'manual'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Task', taskSchema);