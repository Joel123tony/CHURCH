const mongoose = require('mongoose');
require('dotenv').config();

const queries = [
    'Enakkaga yavarayum', 'Unthan siththam', 'Aaruyir urave', 
    'En belane en kotteye', 'Yesuve ummai thudikkiren', 'Parisutha aaviye varum', 
    'En kuttram neenga', 'Ulagin oliye', 'Devan anbu', 'Thuthi thuthi',
    'Yathumagi nindrai', 'Kavalaigal kanner', 'Aaruthal nayagan', 'Karthave ummai', 'En iniya yesuve'
];

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
  const Song = (await import('./models/Song.js')).default;
  let uncached = [];
  for (const q of queries) {
      const c = await Song.countDocuments({ $text: { $search: `"${q}"` } });
      if (c === 0) uncached.push(q);
  }
  console.log("Uncached candidates:", uncached);
  process.exit(0);
});
