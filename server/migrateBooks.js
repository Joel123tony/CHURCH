import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './models/Book.js';

dotenv.config();

const migrateBooks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const books = await Book.find();
    let updatedCount = 0;
    
    for (const book of books) {
      let needsUpdate = false;
      let newUrl = book.pdfUrl;
      
      if (newUrl && newUrl.includes('/image/upload/')) {
        newUrl = newUrl.replace('/image/upload/', '/raw/upload/');
        needsUpdate = true;
      }
      
      if (newUrl && !newUrl.toLowerCase().endsWith('.pdf')) {
        newUrl = newUrl + '.pdf';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        book.pdfUrl = newUrl;
        await book.save();
        updatedCount++;
        console.log(`Updated book ${book._id}: ${newUrl}`);
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} books.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrateBooks();
