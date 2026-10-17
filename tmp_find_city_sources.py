import json, urllib.parse, urllib.request

queries = [
    ('Bahamas','Andros Town'),
    ('Bahamas','Great Harbour Cay'),
    ('Mexico','Tampico'),
    ('Trinidad and Tobago','Scarborough'),
]

for country, city in queries:
    q = f'{city} {country}'
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query',
        'format': 'json',
        'generator': 'search',
        'gsrsearch': q,
        'gsrnamespace': 6,
        'gsrlimit': 8,
        'prop': 'imageinfo',
        'iiprop': 'url|extmetadata|size|mime',
        'iiurlwidth': 1500,
    })
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=40).read().decode('utf-8'))
    except Exception as exc:
        print('ERROR', city, exc)
        continue
    pages = data.get('query', {}).get('pages', {})
    print('\n###', city)
    for page in sorted(pages.values(), key=lambda p: p.get('index', 0)):
        title = page.get('title')
        info = page.get('imageinfo', [{}])[0]
        meta = info.get('extmetadata', {})
        license_name = (meta.get('LicenseShortName') or {}).get('value') or ''
        license_url = (meta.get('LicenseUrl') or {}).get('value') or ''
        desc = (meta.get('ImageDescription') or {}).get('value') or ''
        print('TITLE:', title)
        print('LICENSE:', license_name, license_url)
        print('DESC:', desc[:240])
        print('FILE:', info.get('url'))
        print('---')
