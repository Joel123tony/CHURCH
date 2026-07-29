import re
import os

file_path = r'd:\MY_SITES\Chruch_web\src\pages\Bible.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Audio Icons
content = re.sub(r'Volume2,\s*Pause,\s*Play,\s*Square,\s*SkipBack,\s*SkipForward,\s*Loader2', '', content)
content = re.sub(r'Volume2,\s*Pause,\s*Play,\s*Square,\s*SkipBack,\s*SkipForward', '', content)

# 2. Clean up VerseItem isReadingVerse prop and styles
content = re.sub(r',\s*isReadingVerse', '', content)
content = re.sub(r'\$\{isReadingVerse \? \'!bg-\[#D4AF37\]/30 !border-\[#D4AF37\] shadow-\[inset_0_0_20px_rgba\(212,175,55,0\.15\)\] ring-2 ring-\[#D4AF37\]/50\' : \'\'\}', '', content)

# 3. Remove Reading State Block
# The block is between `// --- Reading (TTS) State ---` and `// --- End Reading State ---`
content = re.sub(r'\s*// --- Reading \(TTS\) State ---.*?// --- End Reading State ---\s*', '\n\n  ', content, flags=re.DOTALL)

# 4. Remove Audio Buttons in Desktop Toolbar
desktop_buttons = r'\{!isReading && !isReadingStarting \? \(\s*<button.*?onClick=\{handleStartReading\}.*?</button>\s*\) : isReadingStarting \? \(\s*<button.*?</button>\s*\) : \(\s*<button.*?onClick=\{handleStopReading\}.*?</button>\s*\)\}'
content = re.sub(desktop_buttons, '', content, flags=re.DOTALL)
# It's possible the buttons were already removed or modified, let's just write a more general regex if they exist.
# We'll just look for the block containing handleStartReading and remove it
content = re.sub(r'\{!isReading && !isReadingStarting \? \(.*?\) : isReadingStarting \? \(.*?\) : \(.*?\)\}', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Audio cleanup applied to Bible.jsx")
