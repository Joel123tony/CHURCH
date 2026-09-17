import { translate } from "@vitalets/google-translate-api";

const testTamil = `ஆத்துமமே என் முழு உள்ளமே
உன் ஆண்டவரைத் தொழுதேத்து

1. போற்றிடும் வானோர்
பூதலத்துள்ளோர்`;

async function run() {
  const transResult = await translate(testTamil, { to: 'en' });
  console.log("Raw sentences:", JSON.stringify(transResult.raw.sentences, null, 2));
  
  let thanglish = "";
  if (transResult.raw && transResult.raw.sentences) {
    const translitObj = transResult.raw.sentences.find(s => s.src_translit);
    if (translitObj) {
        thanglish = translitObj.src_translit;
    }
  }
  console.log("Extracted Thanglish using current method:\n", thanglish);
}

run();
