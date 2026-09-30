"""Validate the generated static site: routes, local assets and unhydrated content."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

root = Path(__file__).resolve().parents[1] / 'dist'
class Document(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('href', 'src', 'component-url', 'renderer-url'):
            value = attrs.get(key, '')
            url = urlsplit(value)
            if not value or url.scheme or url.netloc or not url.path:
                continue
            target = root / unquote(url.path).lstrip('/') if url.path.startswith('/') else self.path.parent / unquote(url.path)
            if target.is_dir():
                target = target / 'index.html'
            assert target.is_file(), f'{self.path.relative_to(root)}: broken {key}={value}'

pages = list(root.rglob('*.html'))
assert len(pages) > 1300, 'Recipe and item routes were not generated'
for path in pages:
    Document(path).feed(path.read_text())
for scope in ('base', 'space'):
    html = (root / scope / 'recipes/rocket-part/index.html').read_text()
    for value in ('投入原料', '制造设备', 'rocket-fuel', 'processing-unit'):
        assert value in html, f'Missing static recipe content: {value}'
    assert 'client="load"' not in html, 'Recipe pages must not require React hydration'
    assert 'astro-island' in (root / scope / 'index.html').read_text(), 'Search island missing'
print(f'Validated {len(pages)} static pages: all local links/assets resolve; recipe content is prerendered.')
