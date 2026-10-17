import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / 'North_America_city_image_manifest.json'
REVIEW_DIR = ROOT / 'North_America_city_image_review'
COLUMNS = 3
ROWS = 5
CELL_WIDTH = 400
CELL_HEIGHT = 280
IMAGE_SIZE = (370, 210)


def load_font(size):
    font_path = Path('C:/Windows/Fonts/arial.ttf')
    try:
        return ImageFont.truetype(str(font_path), size)
    except OSError:
        return ImageFont.load_default()


def make_sheet(entries, start_index, batch_number, prefix):
    sheet = Image.new('RGB', (COLUMNS * CELL_WIDTH, ROWS * CELL_HEIGHT), 'white')
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(18)
    detail_font = load_font(14)

    for offset, entry in enumerate(entries):
        filename = entry.get('filename')
        if not filename:
            continue
        image_path = ROOT / 'backend' / 'public' / 'Images' / 'North America cities images' / filename
        if not image_path.is_file():
            continue
        with Image.open(image_path) as source:
            source.load()
            image = ImageOps.contain(source.convert('RGB'), IMAGE_SIZE)

        column = offset % COLUMNS
        row = offset // COLUMNS
        left = column * CELL_WIDTH
        top = row * CELL_HEIGHT
        image_left = left + (CELL_WIDTH - image.width) // 2
        image_top = top + 4 + (IMAGE_SIZE[1] - image.height) // 2
        sheet.paste(image, (image_left, image_top))

        index = start_index + offset
        draw.text((left + 12, top + 218), f'{index}. {entry["city"]}', fill='black', font=title_font)
        draw.text((left + 12, top + 240), entry['country'], fill='black', font=detail_font)
        draw.text((left + 12, top + 259), filename, fill='black', font=detail_font)

    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    output = REVIEW_DIR / f'{prefix}_{batch_number:02d}.jpg'
    sheet.save(output, 'JPEG', quality=92, optimize=True)
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch-size', type=int, default=COLUMNS * ROWS)
    parser.add_argument('--status')
    parser.add_argument('--prefix', default='contact_sheet')
    args = parser.parse_args()
    if args.batch_size < 1 or args.batch_size > COLUMNS * ROWS:
        raise SystemExit(f'--batch-size must be between 1 and {COLUMNS * ROWS}')

    manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
    entries = [
        entry for entry in manifest['cities']
        if entry.get('filename') and (not args.status or entry.get('download_status') == args.status)
    ]
    outputs = []
    for start in range(0, len(entries), args.batch_size):
        batch = entries[start:start + args.batch_size]
        outputs.append(make_sheet(batch, start + 1, len(outputs) + 1, args.prefix))
    print(f'Generated {len(outputs)} contact sheets for {len(entries)} manifest entries.')
    for output in outputs:
        print(output.relative_to(ROOT))


if __name__ == '__main__':
    main()