import re

file_path = r'd:\MY_SITES\Chruch_web\src\components\ShareImageModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove 'React' from imports if unused, or just ignore it (React is fine, some linter configs just warn).
# 2. Remove 'logoUrl' from ShareImageModal.jsx (it's moved to canvasRenderer)
content = content.replace("import logoUrl from '../assets/methodist-logo.png';", "")

# 3. Remove 'imageRef'
content = re.sub(r'const imageRef = useRef\(null\);\n?', '', content)

# 4. Remove 'setIsGenerating' if unused
content = content.replace("const [isGenerating, setIsGenerating] = useState(false);", "const [isGenerating] = useState(false);")

# 5. Move `if (!isOpen || !verseData) return null;`
content = content.replace("  if (!isOpen || !verseData) return null;\n", "")
# put it just before `const modalContent = (`
content = content.replace("  const modalContent = (", "  if (!isOpen || !verseData) return null;\n\n  const modalContent = (")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied fix_hooks.py")
