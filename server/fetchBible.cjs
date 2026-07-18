const axios = require('axios');
const fs = require('fs');
const path = require('path');

const bookNames = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

async function generate() {
  try {
    const enUrl = 'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/English/bible.json';
    const taUrl = 'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/Tamil/bible.json';

    console.log("Fetching English...");
    const enRes = await axios.get(enUrl);
    console.log("Fetching Tamil...");
    const taRes = await axios.get(taUrl);

    const parseBible = (data) => {
      const output = {};
      data.Book.forEach((book, bIndex) => {
        const bookName = bookNames[bIndex];
        if(!bookName) return;
        output[bookName] = {};
        
        book.Chapter.forEach((chapter, cIndex) => {
          const chapNum = (cIndex + 1).toString();
          output[bookName][chapNum] = {};
          
          chapter.Verse.forEach((verse, vIndex) => {
            const vNum = (vIndex + 1).toString();
            output[bookName][chapNum][vNum] = verse.Verse;
          });
        });
      });
      return output;
    };

    const enOutput = parseBible(enRes.data);
    const taOutput = parseBible(taRes.data);

    const publicDataPath = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(publicDataPath)){
        fs.mkdirSync(publicDataPath, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDataPath, 'bible-en.json'), JSON.stringify(enOutput));
    fs.writeFileSync(path.join(publicDataPath, 'bible-ta.json'), JSON.stringify(taOutput));
    
    console.log("Bible JSONs successfully generated!");
  } catch (err) {
    console.error(err);
  }
}

generate();
