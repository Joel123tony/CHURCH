import json
import os

pkg_path = r'd:\MY_SITES\Chruch_web\package.json'
with open(pkg_path, 'r', encoding='utf-8') as f:
    pkg = json.load(f)

changed = False
if '@google-cloud/text-to-speech' in pkg.get('dependencies', {}):
    del pkg['dependencies']['@google-cloud/text-to-speech']
    changed = True

if 'get-mp3-duration' in pkg.get('dependencies', {}):
    del pkg['dependencies']['get-mp3-duration']
    changed = True

if changed:
    with open(pkg_path, 'w', encoding='utf-8') as f:
        json.dump(pkg, f, indent=2)
    print("Cleaned up package.json")
