import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function updatePassword() {
  await mongoose.connect('mongodb://churchadmin:mtc2611@ac-0jfscni-shard-00-00.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-01.jf0uog0.mongodb.net:27017,ac-0jfscni-shard-00-02.jf0uog0.mongodb.net:27017/churchdb?ssl=true&replicaSet=atlas-xboc9n-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
  
  const User = mongoose.model('User', new mongoose.Schema({ email: String, password: String, passwordHash: String, role: String }));
  
  const newHash = await bcrypt.hash('mtc@2026', 10);
  
  await User.updateOne(
    { email: 'methodist@padikuppam.com' },
    { $set: { passwordHash: newHash } }
  );
  
  const user = await User.findOne({ email: 'methodist@padikuppam.com' });
  const storedPassword = user.password || user.passwordHash;
  const isMatch = await bcrypt.compare('mtc@2026', storedPassword);
  
  console.log('Password updated successfully. Match:', isMatch);
  
  mongoose.disconnect();
}
updatePassword().catch(console.error);
