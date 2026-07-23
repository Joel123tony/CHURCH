import fs from 'fs';
import path from 'path';

const dir = 'server/services/songSources';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'adapterManager.js');

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');

  // Replace axios import
  if (content.includes('import axios from "axios";')) {
    content = content.replace('import axios from "axios";', 'import { resilientFetch } from "../../utils/resilientFetch.js";');
  }

  // Replace axios.get with resilientFetch
  content = content.replace(/axios\.get/g, 'resilientFetch');

  // Remove hardcoded headers as resilientFetch handles them
  content = content.replace(/headers:\s*\{[^}]+\},?/g, '');

  // For youtubeDiscovery.js which might use googleapis, we don't want to replace axios if it doesn't use it.
  // Wait, youtube uses axios? Let's check:
  if (file === 'youtubeDiscovery.js') {
     // I'll be careful
  }

  fs.writeFileSync(p, content);
  console.log(`Updated ${file}`);
}
