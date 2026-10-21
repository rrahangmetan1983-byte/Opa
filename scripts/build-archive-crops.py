"""Recreate lossless source-resolution crops from the versioned originals."""
from pathlib import Path
from PIL import Image
import json, hashlib
folder=Path(__file__).resolve().parents[1]/'assets/archief/2.13.132-1164'
for record in json.loads((folder/'manifest.json').read_text(encoding='utf-8')):
    original=folder/record['original']
    assert hashlib.sha256(original.read_bytes()).hexdigest()==record['sha256']
    with Image.open(original) as image:
        image.crop(record['crop_box']).save(folder/record['crop'])
print('7 lossless crops recreated without resampling.')
