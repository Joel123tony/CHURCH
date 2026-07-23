
const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/MY_SITES/Chruch_web/server/.env' });
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Song = require('d:/MY_SITES/Chruch_web/server/models/Song.js').default;
  const SongSearchCache = require('d:/MY_SITES/Chruch_web/server/models/SongSearchCache.js').default;
  
  const query = { title: { $regex: /enna senjom|ummai aarathippen|thuthiyin aadaigal|pudhiya naal idhu|Azhaithavarae Neer Nadathiduveer|Ennai kondru potalum|Thuthiyin Aadai|Yesuvukkaga/i } };
  const delSongs = await Song.deleteMany(query);
  const delCaches = await SongSearchCache.deleteMany({});
  
  console.log('Deleted Songs:', delSongs.deletedCount);
  console.log('Cleared Search Cache:', delCaches.deletedCount);
  await mongoose.disconnect();
}
run().catch(console.error);

