const fs = require('fs');
const { execSync } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

fs.writeFileSync('test_image.jpg', 'fake image data');
execSync(`"${ffmpegPath}" -y -f lavfi -i color=c=black:s=128x128 -t 1 -c:v libx264 test_video.mp4`);
