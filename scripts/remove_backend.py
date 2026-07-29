import os
import re

# 1. Remove Backend Files
files_to_remove = [
    r'd:\MY_SITES\Chruch_web\server\services\ttsService.js',
    r'd:\MY_SITES\Chruch_web\server\controllers\ttsController.js',
    r'd:\MY_SITES\Chruch_web\server\routes\ttsRoutes.js'
]

for file_path in files_to_remove:
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Removed {file_path}")

# 2. Remove from server.js
server_js_path = r'd:\MY_SITES\Chruch_web\server\server.js'
if os.path.exists(server_js_path):
    with open(server_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove import
    content = re.sub(r'import\s+ttsRoutes\s+from\s+[\'"]\./routes/ttsRoutes\.js[\'"];\n?', '', content)
    # Remove app.use
    content = re.sub(r'app\.use\([\'"]/api/tts[\'"],\s*ttsRoutes\);\n?', '', content)
    
    with open(server_js_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Cleaned up server.js")

