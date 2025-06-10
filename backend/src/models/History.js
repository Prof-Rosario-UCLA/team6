import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  history: {
    type: String,
    required: true,
  },
});


const History = mongoose.model('History', HistorySchema);

export default History; 