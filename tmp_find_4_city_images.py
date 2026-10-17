import json, urllib.parse, urllib.request
queries = [
    ('Canberra', 'Australia'),
    ('Invercargill', 'New Zealand'),
    ('Apia', 'Samoa'),
    ('Funafuti', 'Tuvalu'),
]
for city, country in queries:
    q = f'{city} {country}'
    url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=' + urllib.parse.quote(q) + '&gsrnamespace=6&gsrprop=title&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&formatversion=2&origin=*'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            data = json.loads(r.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', [])
        print('QUERY', q)
        for p in pages[:5]:
            title = p.get('title')
            print('TITLE', title)
            info = p.get('imageinfo', [])
            if info:
                print('URL', info[0].get('url'))
                desc = info[0].get('extmetadata', {}).get('ImageDescription', {}).get('value', '')
                print('DESC', desc[:200])
        print('---')
    except Exception as e:
        print('ERR', q, e)
