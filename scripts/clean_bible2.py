import re

file_path = r'd:\MY_SITES\Chruch_web\src\pages\Bible.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove mobile action controls for reading
# It's lines 669 to 685: {!isReading ? ( <button onClick={handleStartReading}... ) : ( <button onClick={handleStopReading}... )}
pattern_mobile_reading_buttons = r'\{!isReading \? \(\s*<button[^>]*onClick=\{handleStartReading\}[^>]*>.*?Read\s*</button>\s*\)\s*:\s*\(\s*<button[^>]*onClick=\{handleStopReading\}[^>]*>.*?Stop\s*</button>\s*\)\}'
content = re.sub(pattern_mobile_reading_buttons, '', content, flags=re.DOTALL)

# 2. Remove isReadingVerse={currentReadingVerse === verseNum}
content = content.replace('isReadingVerse={currentReadingVerse === verseNum}', '')

# 3. Remove Read Aloud Floating Mini Player
# It's from {/* Read Aloud Floating Mini Player */} to {isReading && ( ... )}
pattern_mini_player = r'\{\s*/\*\s*Read Aloud Floating Mini Player\s*\*/\s*\}\s*\{isReading && \(\s*<div.*?</div>\s*\)\}'
content = re.sub(pattern_mini_player, '', content, flags=re.DOTALL)

# 4. Remove 'Check' from lucide-react if unused
# I won't bother unless it's a compile error, but ESLint warned about it.
content = content.replace('Copy, Check, ChevronDown', 'Copy, ChevronDown')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied clean_bible2.py")
