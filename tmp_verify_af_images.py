import json
import os
import re
import subprocess

repo = os.getcwd()
with open(os.path.join(repo, 'tmp_afg_events_response.json'), 'r', encoding='utf-8-sig') as f:
    data = json.load(f)
items = data['data']['items']
af_items = [e for e in items if str(e.get('countryCode', '')).strip().upper() == 'AF']
null_items = [e for e in af_items if not e.get('image')]
valid_items = [e for e in af_items if e.get('image')]
print('AF_TOTAL=' + str(len(af_items)))
print('AF_NULL=' + str(len(null_items)))
print('AF_VALID=' + str(len(valid_items)))
print('AF_NULL_SLUGS=' + ', '.join(e['slug'] for e in null_items))
print('AF_NULL_TITLES=' + ' | '.join(e['title'] for e in null_items))
print('AF_VALID_SLUGS=' + ', '.join(e['slug'] for e in valid_items))
print('AF_VALID_IMAGES=' + ' | '.join(f"{e['slug']}:{e['image']}" for e in valid_items))
img_root = os.path.join(repo, 'backend', 'public', 'Images')
img_files = []
for root, dirs, files in os.walk(img_root):
    for name in files:
        if name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.svg')):
            img_files.append(os.path.relpath(os.path.join(root, name), img_root).replace('\\', '/'))
print('IMG_TOTAL=' + str(len(img_files)))
print('IMG_FILES=' + ' | '.join(img_files))
pattern = re.compile(r'Afghan|Afghanistan|Kabul|Kandahar|Herat|Mazar|Khost|Balkh|Bamyan|Jalalabad|Massoud|Nowruz|Independence|Eid|Ashura|Labour|Victory|Prophet', re.I)
candidates = [f for f in img_files if pattern.search(f)]
print('IMG_MATCH_COUNT=' + str(len(candidates)))
print('IMG_MATCH_FILES=' + ' | '.join(candidates))
upload_dir = os.path.join(img_root, 'uploads')
upload_files = []
if os.path.isdir(upload_dir):
    upload_files = [f for f in os.listdir(upload_dir) if os.path.isfile(os.path.join(upload_dir, f))]
print('UPLOAD_COUNT=' + str(len(upload_files)))
print('UPLOAD_FILES=' + ' | '.join(upload_files))
print('GIT_STATUS=' + subprocess.run(['git', 'status', '--short'], cwd=repo, capture_output=True, text=True).stdout.strip().replace('\n', ' ; '))
