const text = 'Added to wishlist Removed from wishlist 0';
const blockedPhrases = ['added to wishlist', 'removed from wishlist'];
let tempLine = text;
for (const phrase of blockedPhrases) {
    const regex = new RegExp(`(?<=\\s|^)${phrase}(?=\\s|$)`, 'gi');
    tempLine = tempLine.replace(regex, "");
}
console.log('Result:', tempLine);
