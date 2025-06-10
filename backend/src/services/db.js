import History from '../models/History.js';

export async function getHistoryFromDB(roomId) {
  console.log("Reading data to DB");
  try {
    const res = await History.findOne({ roomId: roomId });
    if (!res) {
      return [];
    }
    const history = res.history;
    const data = JSON.parse(history);
    return data;
  } catch (error) {
    console.error('Error getting history from database:', error);
    return [];
  }
}

export async function addHistoryToDB(roomId, blob) {
  console.log("Writing data to DB");
  try {
    const res = await History.updateOne(
      { roomId: roomId },              
      { $set: { history: JSON.stringify(blob) } },        
      { upsert: true }                 
  );
  return true;
  } catch (error) {
    console.error('Error adding history to database:', error);
    return false;
  }
}


export default { getHistoryFromDB, addHistoryToDB };