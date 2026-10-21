"""Verify original integrity, exact crop pixels and source/page coverage."""
from pathlib import Path
from PIL import Image, ImageChops
import json, hashlib
root=Path(__file__).resolve().parents[1]
folder=root/'assets/archief/2.13.132-1164'
manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
assert {r['id'] for r in manifest}=={'0032','0051','0052','0250','0251','0268','0270'}
page=(root/'research/archiefbronnen-1947.html').read_text(encoding='utf-8')
for r in manifest:
    original=folder/r['original']
    assert hashlib.sha256(original.read_bytes()).hexdigest()==r['sha256']
    with Image.open(original) as im, Image.open(folder/r['crop']) as crop:
        assert im.size==(r['width'],r['height'])
        assert ImageChops.difference(im.crop(r['crop_box']),crop).getbbox() is None
    assert r['original'] in page and r['crop'] in page and r['source_url'] in page
assert page.count('<pre>')==7
print('PASS: 7 original hashes; 7 exact pixel crops; image, citation and transcription coverage.')
