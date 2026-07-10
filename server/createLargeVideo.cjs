const fs = require('fs');
const { execSync } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
console.log("Generating large video...");
execSync(`"${ffmpegPath}" -y -f lavfi -i color=c=black:s=1920x1080 -t 5 -c:v libx264 -b:v 2M test_large.mp4`);
console.log("Done generating video.");
