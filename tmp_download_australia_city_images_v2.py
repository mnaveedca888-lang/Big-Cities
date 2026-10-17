import json, re, time, urllib.parse, urllib.request
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageOps

ROOT = Path(r"C:\Users\LBG\Desktop\New folder\React router")
OUTDIR = ROOT / 'backend' / 'public' / 'Images' / 'Australia cities images'
OUTDIR.mkdir(parents=True, exist_ok=True)

CITIES = [
    ('Australia','Sydney'), ('Australia','Melbourne'), ('Australia','Brisbane'), ('Australia','Perth'), ('Australia','Adelaide'), ('Australia','Gold Coast'), ('Australia','Cairns'), ('Australia','Darwin'), ('Australia','Canberra'), ('Australia','Hobart'), ('Australia','Townsville'), ('Australia','Newcastle'), ('Australia','Broome'), ('Australia','Port Hedland'), ('Australia','Ayers Rock'), ('Australia','Christmas Island'), ('Australia','Cocos (Keeling) Islands'),
    ('Fiji','Nadi'), ('Fiji','Suva'),
    ('Kiribati','Tarawa'), ('Kiribati','Kiritimati'),
    ('Marshall Islands','Majuro'), ('Marshall Islands','Kwajalein'),
    ('Federated States of Micronesia','Palikir'), ('Federated States of Micronesia','Pohnpei'), ('Federated States of Micronesia','Weno'), ('Federated States of Micronesia','Yap'), ('Federated States of Micronesia','Kosrae'),
    ('Nauru','Yaren'),
    ('New Zealand','Auckland'), ('New Zealand','Christchurch'), ('New Zealand','Wellington'), ('New Zealand','Queenstown'), ('New Zealand','Dunedin'), ('New Zealand','Hamilton'), ('New Zealand','Rotorua'), ('New Zealand','Palmerston North'), ('New Zealand','Napier'), ('New Zealand','New Plymouth'), ('New Zealand','Nelson'), ('New Zealand','Invercargill'), ('New Zealand','Whangārei'), ('New Zealand','Blenheim'), ('New Zealand','Taupō'), ('New Zealand','Gisborne'), ('New Zealand','Kerikeri'),
    ('Palau','Koror'), ('Samoa','Apia'), ('Solomon Islands','Honiara'), ('Tonga','Nuku\'alofa'), ('Tuvalu','Funafuti'), ('Vanuatu','Port Vila'), ('Vanuatu','Luganville'), ('Papua New Guinea','Port Moresby')
]

CODE_BY_COUNTRY = {
    'Australia': 'au', 'Fiji': 'fj', 'Kiribati': 'ki', 'Marshall Islands': 'mh', 'Federated States of Micronesia': 'fm',
    'Nauru': 'nr', 'New Zealand': 'nz', 'Palau': 'pw', 'Samoa': 'ws', 'Solomon Islands': 'sb', 'Tonga': 'to', 'Tuvalu': 'tv', 'Vanuatu': 'vu', 'Papua New Guinea': 'pg'
}

USER_AGENT = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'}


def fetch_json(url):
    for attempt in range(1, 7):
        try:
            req = urllib.request.Request(url, headers=USER_AGENT)
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception as exc:
            if attempt < 6:
                time.sleep(3 * attempt)
                continue
            raise exc


def fetch_bytes(url):
    for attempt in range(1, 7):
        try:
            req = urllib.request.Request(url, headers=USER_AGENT)
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except Exception as exc:
            if attempt < 6:
                time.sleep(3 * attempt)
                continue
            raise exc


def slugify(value):
    value = value.strip().lower()
    value = value.replace("'", '')
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-')


def find_image_url(country, city):
    query = f'{city} {country}'
    search_url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=' + urllib.parse.quote(query) + '&srlimit=10'
    search = fetch_json(search_url)
    items = search.get('query', {}).get('search', [])
    if not items:
        raise RuntimeError(f'No search results for {query}')
    # prefer exact or near exact title
    candidates = []
    for item in items:
        title = item.get('title','')
        snippet = (item.get('snippet','') or '').lower()
        normalized = (title + ' ' + snippet).lower()
        if city.lower() in normalized or country.lower() in normalized:
            candidates.append(title)
    if not candidates:
        candidates.append(items[0]['title'])
    for title in candidates[:4]:
        page_url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|info&piprop=original|thumbnail&inprop=url&titles=' + urllib.parse.quote(title) + '&redirects=1&formatversion=2'
        page = fetch_json(page_url)
        pages = page.get('query', {}).get('pages', [])
        for p in pages:
            image = None
            if 'original' in p.get('thumbnail', {}):
                image = p['thumbnail'].get('source')
            if not image and 'original' in p:
                image = p['original'].get('source')
            if image:
                return image
    # fallback commons query
    commons_url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + urllib.parse.quote(f'{city} {country} city') + '&gsrnamespace=6&gsrprop=title&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*'
    commons = fetch_json(commons_url)
    pages = commons.get('query', {}).get('pages', {})
    for page in pages.values():
        if page.get('imageinfo'):
            return page['imageinfo'][0]['url']
    raise RuntimeError(f'No image found for {query}')


def save_webp(url, country, city):
    code = CODE_BY_COUNTRY[country]
    slug = slugify(city)
    filename = f'{code}-{slug}.webp'
    target = OUTDIR / filename
    if target.exists():
        return {'status':'already_exists','file':filename,'path':str(target)}
    img_bytes = fetch_bytes(url)
    img = Image.open(BytesIO(img_bytes))
    img = ImageOps.exif_transpose(img)
    if img.mode in ('RGBA','LA','P'):
        img = img.convert('RGB')
    if img.width < 200 or img.height < 150:
        raise RuntimeError(f'Image too small for {city} {country}: {img.size}')
    img.thumbnail((1600,1200), Image.Resampling.LANCZOS)
    temp = target.with_suffix('.webp.part')
    img.save(temp, 'WEBP', quality=85, optimize=True)
    temp.replace(target)
    with Image.open(target) as inspected:
        if inspected.width < 200 or inspected.height < 150:
            raise RuntimeError(f'Validated image too small for {city} {country}: {inspected.size}')
    return {'status':'downloaded','file':filename,'path':str(target)}

report = {'continent':'Oceania','countries':[], 'downloaded':[], 'missing':[], 'checked':False}
count = 0
for country, city in CITIES:
    count += 1
    try:
        img_url = find_image_url(country, city)
        result = save_webp(img_url, country, city)
        report['downloaded'].append({'country':country,'city':city,'file':result['file'],'status':result['status']})
        print(f'{count}/{len(CITIES)} OK {country} {city} -> {result["file"]}')
    except Exception as exc:
        report['missing'].append({'country':country,'city':city,'reason':str(exc)})
        print(f'{count}/{len(CITIES)} MISSING {country} {city} -> {exc}')
    time.sleep(2.5)

report['countries'] = sorted({country for country,_ in CITIES})
report['total_countries'] = len(report['countries'])
report['total_cities'] = len(CITIES)
report['download_count'] = len(report['downloaded'])
report['missing_count'] = len(report['missing'])
report['checked'] = True
# ensure report file written
report_path = ROOT / 'Australia_city_image_report_v2.json'
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print('DONE', report['download_count'], report['missing_count'])
print('REPORT', report_path)
