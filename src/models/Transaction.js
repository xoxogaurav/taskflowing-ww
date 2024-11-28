import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['earning', 'withdrawal'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model('Transaction', transactionSchema);