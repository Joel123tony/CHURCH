import re

file_path = r'd:\MY_SITES\Chruch_web\src\pages\Bible.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove && !isReading
content = content.replace('&& !isReading', '')

# 2. Fix the unused variables
# Line 194: const [copiedVerse, setCopiedVerse] = useState(null);
content = re.sub(r'const \[copiedVerse,\s*setCopiedVerse\] = useState\(null\);\n?', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied clean_bible3.py")
