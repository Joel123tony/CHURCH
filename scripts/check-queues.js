import dotenv from 'dotenv';
import { connectDB } from '../server/config/db.js';
import JobQueue from '../server/models/JobQueue.js';
import Song from '../server/models/Song.js';

dotenv.config({path: '../server/.env'});

async function check() {
  await connectDB();
  const counts = await JobQueue.aggregate([
    {$group:{
      _id:'$type', 
      pending:{$sum:{$cond:[{$eq:['$status','pending']},1,0]}}, 
      processing:{$sum:{$cond:[{$eq:['$status','processing']},1,0]}}, 
      completed:{$sum:{$cond:[{$eq:['$status','completed']},1,0]}}, 
      failed:{$sum:{$cond:[{$eq:['$status','failed']},1,0]}} 
    }}
  ]);
  console.log("JobQueue Stats:", counts);
  
  const songAI = await Song.aggregate([
    {$group:{
      _id:'$aiStatus', 
      count:{$sum:1}
    }}
  ]);
  console.log("Song aiStatus:", songAI);
  process.exit(0);
}
check();
