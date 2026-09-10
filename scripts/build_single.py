"""Build a self-contained homepage and archive from their hosted sources."""
from pathlib import Path
import base64
import json
import sys

root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
archive = (root / 'archivo/index.html').read_text().split('<main id="archive-view">', 1)[1].split('</main>', 1)[0]
archive = archive.replace('href="../data/', 'href="data/')
html = html.replace('<html lang="es-AR">', '<html lang="es-AR" data-portable>')
html = html.replace('</main>', f'</main>\n  <main id="archive-view" hidden>{archive}</main>', 1)
html = html.replace('href="archivo/"', 'href="#archivo"')
html = html.replace('<script src="navigation.js"></script>', '<script src="archive.js"></script>\n  <script src="navigation.js"></script>')
for image_path in ('assets/desregulacion-emblem-web.png', 'assets/favicon.png'):
    data = base64.b64encode((root / image_path).read_bytes()).decode('ascii')
    html = html.replace(image_path, f'data:image/png;base64,{data}')
html = html.replace('<link rel="stylesheet" href="styles.css" />', f'<style>\n{(root / "styles.css").read_text()}</style>')
embedded = []
for name, filename in [('report', 'august-2026'), ('history', 'history'), ('citizen', 'citizen'), ('upcoming', 'upcoming'), ('archive', 'archive'), ('participation-prompts', 'participation-prompts')]:
    data = json.loads((root / 'data' / f'{filename}.json').read_text())
    payload = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
    embedded.append(f'<script id="{name}-data" type="application/json">{payload}</script>')
html = html.replace('<script src="site.js"></script>', '\n'.join(embedded) + '\n  <script src="site.js"></script>')
for filename in ('site', 'app', 'history', 'participation-ai', 'explorer', 'archive', 'navigation'):
    html = html.replace(f'<script src="{filename}.js"></script>', f'<script>\n{(root / f"{filename}.js").read_text()}</script>')
target = root / 'index.single.html'
if '--check' in sys.argv:
    if not target.exists() or target.read_text() != html:
        raise SystemExit('index.single.html is out of date. Run python3 scripts/build_single.py')
    print('Portable homepage and archive are in sync.')
else:
    target.write_text(html)
    print('Generated index.single.html with both views.')
