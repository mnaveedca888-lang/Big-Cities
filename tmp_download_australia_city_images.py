import json
import os
import re
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(r"C:\Users\LBG\Desktop\New folder\React router")
IMAGE_DIR = ROOT / "backend" / "public" / "Images" / "Australia cities images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

COUNTRY_CODES = {
    "Australia": "au",
    "Fiji": "fj",
    "Kiribati": "ki",
    "Marshall Islands": "mh",
    "Federated States of Micronesia": "fm",
    "Nauru": "nr",
    "New Zealand": "nz",
    "Palau": "pw",
    "Samoa": "ws",
    "Tonga": "to",
    "Tuvalu": "tv",
    "Vanuatu": "vu",
    "Solomon Islands": "sb",
    "Papua New Guinea": "pg",
}

CITY_DATA = {
    "Australia": [
        "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Cairns", "Darwin",
        "Canberra", "Hobart", "Townsville", "Newcastle", "Broome", "Port Hedland", "Ayers Rock",
        "Christmas Island", "Cocos (Keeling) Islands"
    ],
    "Fiji": ["Nadi", "Suva"],
    "Kiribati": ["Tarawa", "Kiritimati"],
    "Marshall Islands": ["Majuro", "Kwajalein"],
    "Federated States of Micronesia": ["Palikir", "Pohnpei", "Weno", "Yap", "Kosrae"],
    "Nauru": ["Yaren"],
    "New Zealand": ["Auckland", "Christchurch", "Wellington", "Queenstown", "Dunedin", "Hamilton", "Rotorua", "Palmerston North",
        "Napier", "New Plymouth", "Nelson", "Invercargill", "Whangārei", "Blenheim", "Taupō", "Gisborne", "Kerikeri"],
    "Palau": ["Koror"],
    "Samoa": ["Apia"],
    "Solomon Islands": ["Honiara"],
    "Tonga": ["Nuku'alofa"],
    "Tuvalu": ["Funafuti"],
    "Vanuatu": ["Port Vila", "Luganville"],
    "Papua New Guinea": ["Port Moresby"],
}

HEADERS = {'User-Agent': 'AustraliaCityImageDownloader/1.0 (local asset verification; contact repository admin)'}


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = value.replace('’', "'").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", '-', value)
    return value.strip('-')


def clean_query(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def fetch_json(url: str):
    for attempt in range(1, 6):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=45) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < 5:
                time.sleep(3 * attempt)
                continue
            raise
        except Exception:
            if attempt < 5:
                time.sleep(2 * attempt)
                continue
            raise


def fetch_bytes(url: str):
    for attempt in range(1, 6):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=45) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < 5:
                time.sleep(4 * attempt)
                continue
            raise
        except Exception:
            if attempt < 5:
                time.sleep(2 * attempt)
                continue
            raise


def find_wikipedia_image(city: str, country: str):
    query = clean_query(f"{city} {country}")
    search_url = (
        "https://en.wikipedia.org/w/api.php?"
        f"action=query&list=search&srsearch={urllib.parse.quote(query)}&srlimit=8&format=json&utf8=1"
    )
    data = fetch_json(search_url)
    search_results = data.get('query', {}).get('search', [])
    if not search_results:
        raise RuntimeError(f"No Wikipedia search result for {query}")

    candidates = []
    for item in search_results:
        title = item.get('title', '')
        snippet = item.get('snippet', '')
        if not title:
            continue
        normalized = (title + ' ' + snippet).lower()
        q = query.lower()
        if city.lower() in normalized or q in normalized or country.lower() in normalized:
            candidates.append(title)
    if not candidates:
        candidates.append(search_results[0]['title'])

    for title in candidates:
        title_for_url = title.replace(' ', '_')
        summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title_for_url)}"
        try:
            summary = fetch_json(summary_url)
        except Exception:
            continue
        thumbnail = summary.get('thumbnail') or {}
        image_url = thumbnail.get('source') or summary.get('originalimage', {}).get('source')
        if image_url:
            return image_url, title

    # Fallback: search Wikimedia Commons directly for the search query
    commons_url = (
        "https://commons.wikimedia.org/w/api.php?"
        "action=query&generator=search&gsrsearch=" + urllib.parse.quote(query + ' city') +
        "&gsrnamespace=6&gsrprop=title&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*"
    )
    try:
        commons = fetch_json(commons_url)
        pages = commons.get('query', {}).get('pages', {})
        for page in pages.values():
            imageinfo = page.get('imageinfo', [])
            if imageinfo:
                return imageinfo[0]['url'], page.get('title', '')
    except Exception:
        pass
    raise RuntimeError(f"No valid image found for {query}")


def download_city_image(city: str, country: str, code: str):
    query = clean_query(f"{city} {country}")
    slug = slugify(city)
    filename = f"{code}-{slug}.webp"
    output_path = IMAGE_DIR / filename
    if output_path.exists():
        return {'status': 'existing', 'file': filename, 'path': str(output_path)}

    image_url, title = find_wikipedia_image(city, country)
    image_bytes = fetch_bytes(image_url)

    try:
        img = Image.open(BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        if img.width < 200 or img.height < 150:
            raise RuntimeError(f"Image too small for {query}: {img.size}")
        img.thumbnail((1600, 1200), Image.Resampling.LANCZOS)
        temp_path = output_path.with_suffix('.webp.part')
        img.save(temp_path, 'WEBP', quality=85, optimize=True)
        temp_path.replace(output_path)
    except Exception as exc:
        raise RuntimeError(f"Saving failed for {query} via {title}: {exc}")

    # final validation
    with Image.open(output_path) as img:
        if img.width < 200 or img.height < 150:
            raise RuntimeError(f"Validated image too small for {query}: {img.size}")
    return {'status': 'downloaded', 'file': filename, 'path': str(output_path), 'source': image_url, 'title': title}


def main():
    results = []
    unresolved = []
    missing = []

    for country, cities in CITY_DATA.items():
        code = COUNTRY_CODES.get(country)
        if not code:
            continue
        for city in cities:
            time.sleep(1.2)
            try:
                result = download_city_image(city, country, code)
                results.append({'country': country, 'city': city, 'code': code, 'result': result})
            except Exception as exc:
                unresolved.append({'country': country, 'city': city, 'reason': str(exc)})

    report = {
        'continent_label': 'Oceania',
        'countries_inspected': len(COUNTRY_CODES),
        'cities_identified': sum(len(v) for v in CITY_DATA.values()),
        'images_successfully_downloaded_and_verified': sum(1 for item in results if item['result']['status'] in ('downloaded', 'existing')),
        'cities_missing_images': unresolved,
        'image_directory': str(IMAGE_DIR),
        'download_results': results,
    }

    report_path = ROOT / 'Australia_city_image_report.json'
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

    print('COUNTRIES_INSPECTED', report['countries_inspected'])
    print('CITIES_IDENTIFIED', report['cities_identified'])
    print('IMAGES_DOWNLOADED', report['images_successfully_downloaded_and_verified'])
    print('UNRESOLVED', len(unresolved))
    for item in unresolved[:10]:
        print(item)

    if unresolved:
        print('REPORT_PATH', report_path)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
