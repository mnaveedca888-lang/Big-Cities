from pathlib import Path
from PIL import Image
import urllib.request
import shutil

root = Path(r'c:\Users\LBG\Desktop\New folder\React router')
outdir = root / 'backend/public/Images/North America cities images'
outdir.mkdir(parents=True, exist_ok=True)
rej = root / 'North_America_rejected_city_image_candidates'

for name in ['bs-andros-town.visual-rejected.webp', 'bs-great-harbour-cay.visual-rejected.webp']:
    src = rej / name
    dst = outdir / name.replace('.visual-rejected', '')
    shutil.copy2(src, dst)
    print(f'copied {src.name} -> {dst.name}')

url_tampico = 'https://live.staticflickr.com/5445/8778089806_a4263cfe53_b.jpg'
dst_tampico = outdir / 'mx-tampico.webp'
urllib.request.urlretrieve(url_tampico, outdir / 'mx-tampico.jpg')
Image.open(outdir / 'mx-tampico.jpg').convert('RGB').save(dst_tampico, 'WEBP', quality=92)
print(f'saved {dst_tampico.name}')
(outdir / 'mx-tampico.jpg').unlink(missing_ok=True)

url_scarb = 'https://upload.wikimedia.org/wikipedia/commons/9/9c/TTS_Scarborough_%28CG42%29_and_TTS_Port_of_Spain_%28CG41%29_at_Austal%2C_Henderson%2C_March_2021.jpg'
dst_scarb = outdir / 'tt-scarborough.webp'
urllib.request.urlretrieve(url_scarb, outdir / 'tt-scarborough.jpg')
Image.open(outdir / 'tt-scarborough.jpg').convert('RGB').save(dst_scarb, 'WEBP', quality=92)
print(f'saved {dst_scarb.name}')
(outdir / 'tt-scarborough.jpg').unlink(missing_ok=True)
