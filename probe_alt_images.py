import urllib.parse
import urllib.request
import re

samples = [
    ('Toronto', 'Canada'),
    ('New York', 'United States of America'),
    ('Mexico City', 'Mexico'),
    ('Panama City', 'Panama'),
    ('Havana', 'Cuba'),
]

for city, country in samples:
    q = f'"{city}" "{country}" skyline'
    url = 'https://www.bing.com/images/search?q=' + urllib.parse.quote(q) + '&form=HDRSC2&first=1'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9'})
    html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'ignore')
    matches = re.findall(r'mediaurl=([^&]+)', html)
    seen = []
    for m in matches:
        u = urllib.parse.unquote(m)
        if 'http' in u and u not in seen:
            seen.append(u)
    print('QUERY:', q)
    for u in seen[:5]:
        print(' ', u)
    print('---')
