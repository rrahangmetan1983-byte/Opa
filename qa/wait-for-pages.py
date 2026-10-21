"""Wait until the existing GitHub Pages deployment serves this checkout."""
import hashlib
import time
import urllib.request
from pathlib import Path

base = 'https://rrahangmetan1983-byte.github.io/Opa/'
paths = ['index.html', 'app.js', 'styles.css', 'data/research.js']
expected = {p: hashlib.sha256(Path(p).read_bytes()).digest() for p in paths}
deadline = time.monotonic() + 240
while time.monotonic() < deadline:
    try:
        matches = []
        for path in paths:
            request = urllib.request.Request(base + path + '?validation=' + str(int(time.time())),
                                             headers={'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(request, timeout=15) as response:
                matches.append(hashlib.sha256(response.read()).digest() == expected[path])
        if all(matches):
            print('PASS: published HTML, application and research data match this commit.')
            break
    except (OSError, TimeoutError) as error:
        print('Waiting for Pages:', type(error).__name__, flush=True)
    time.sleep(10)
else:
    raise SystemExit('Pages did not serve the expected commit within four minutes.')
