"""Check editorial invariants against the pre-edit working-tree snapshot.

Usage: python3 scripts/editorial-review/check_preservation.py BASELINE_DIR [SITE_DIR]
This complements the existing site validators and the separate strict Castle check.
"""

from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

from check_castle import Document, Node


def values(doc, tag, attr):
    return {dict(n.attrs)[attr] for n in doc.nodes
            if n.tag == tag and attr in dict(n.attrs)}


def matching(doc, tag):
    return [n.normalized() for n in doc.nodes if n.tag == tag]


def plain(node):
    return ''.join(plain(c) if isinstance(c, Node) else c for c in node.children)


def select(doc, tag, key, value):
    return [n for n in doc.nodes if n.tag == tag and dict(n.attrs).get(key) == value]


def main():
    baseline = Path(sys.argv[1])
    site = Path(sys.argv[2] if len(sys.argv) > 2 else '_site')
    source = baseline / 'source'
    originals = json.loads((baseline / 'tracked_hashes.json').read_text())
    posts = sorted(p for p in source.glob('_posts/*.md') if 'castle' not in p.name)
    assert len(posts) == 9
    allowed = {str(p.relative_to(source)) for p in posts} | {
        'AGENTS.md', 'index.md', 'posts.md', 'open-source.md', 'isolation-forest.md',
        'publications.md', 'videos.md', 'archive.html', '_data/projects.yml',
        '_data/open_source.yml', '_data/videos.yml', '_data/publications.yml',
        '_includes/site/post.html', '_includes/site/post-cta.html',
        '_includes/site/if-demo.html', '_includes/site/orbit-demo.html',
        '_includes/site/lux-demo.html',
    }
    for path, digest in originals.items():
        if path not in allowed:
            assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == digest, path
    for p in posts:
        old, new = p.read_text(), Path(p.relative_to(source)).read_text()
        front = lambda s: re.sub(r'^(description|last_modified_at):.*\n', '',
                                s.split('---', 2)[1], flags=re.M)
        assert front(old) == front(new), f'Protected front matter: {p.name}'
        assert 'last_modified_at: 2026-09-06' in new
        for block in re.findall(r'^```[^\n]*\n.*?^```', old, re.M | re.S):
            assert block in new, f'Code/equation block: {p.name}'
    assert Path('AGENTS.md').read_text().startswith((source / 'AGENTS.md').read_text())

    old_files = {p.relative_to(baseline / 'rendered') for p in (baseline / 'rendered').rglob('*.html')}
    new_files = {p.relative_to(site) for p in site.rglob('*.html')}
    assert old_files == new_files, 'Published HTML routes changed'
    json_count = anchor_count = 0
    demo_pages = {name: [] for name in ('if', 'orbit', 'lux')}
    for path in sorted(old_files):
        old = Document((baseline / 'rendered' / path).read_text())
        new = Document((site / path).read_text())
        ids_before = {dict(n.attrs)['id'] for n in old.nodes if 'id' in dict(n.attrs)}
        ids_after = [dict(n.attrs)['id'] for n in new.nodes if 'id' in dict(n.attrs)]
        assert ids_before <= set(ids_after), (path, 'lost anchors', ids_before - set(ids_after))
        assert len(ids_after) == len(set(ids_after)), (path, 'duplicate anchors')
        anchor_count += len(ids_before)
        assert values(old, 'a', 'href') <= values(new, 'a', 'href'), (path, 'lost destinations', values(old, 'a', 'href') - values(new, 'a', 'href'))
        assert values(old, 'img', 'src') == values(new, 'img', 'src'), (path, 'figure sources')
        assert matching(old, 'math') == matching(new, 'math'), (path, 'MathML')
        assert matching(old, 'pre') == matching(new, 'pre'), (path, 'rendered code')
        assert matching(old, 'title') == matching(new, 'title'), (path, 'title')
        for attr, value in [('rel', 'canonical')]:
            assert [n.normalized() for n in select(old, 'link', attr, value)] == [n.normalized() for n in select(new, 'link', attr, value)], (path, value)
        for attr, key in [('property', 'og:image'), ('property', 'og:image:width'),
                          ('property', 'og:image:height'), ('property', 'og:url'),
                          ('property', 'og:title'), ('name', 'robots')]:
            assert [n.normalized() for n in select(old, 'meta', attr, key)] == [n.normalized() for n in select(new, 'meta', attr, key)], (path, key)
        for script in select(new, 'script', 'type', 'application/ld+json'):
            json.loads(plain(script))
            json_count += 1
        old_person = re.findall(r'"(?:@id|url)"\s*:\s*"([^"]*#person)"', (baseline / 'rendered' / path).read_text())
        new_person = re.findall(r'"(?:@id|url)"\s*:\s*"([^"]*#person)"', (site / path).read_text())
        assert old_person == new_person, (path, 'person entity references')
        for name in demo_pages:
            if any(f'/assets/js/{name}-demo.js?' in url for url in values(new, 'script', 'src')):
                demo_pages[name].append(str(path))

    for name, pages in demo_pages.items():
        assert len(pages) == 1, (name, pages)
    for p in posts:
        rel = str(p.relative_to(source))
        date, slug = p.name[:10], p.name[11:-3]
        path = Path(date.replace('-', '/')) / slug / 'index.html'
        doc = Document((site / path).read_text())
        row = select(doc, 'p', 'class', 'post-date')
        assert len(row) == 1
        text = plain(row[0])
        assert 'Originally published' in text and 'Updated' in text and 'min read' in text, (rel, text)
        times = [n for n in doc.nodes if n.tag == 'time']
        assert any(dict(n.attrs).get('datetime', '').startswith(date) for n in times)
        assert any(dict(n.attrs).get('datetime', '').startswith('2026-09-06') for n in times)
        desc = re.search(r'^description: "(.*)"$', Path(rel).read_text(), re.M)[1]
        for attr, key in [('name', 'description'), ('property', 'og:description')]:
            assert dict(select(doc, 'meta', attr, key)[0].attrs)['content'] == desc, (rel, key)
        assert any(plain(n) == desc for n in select(doc, 'p', 'class', 'post-summary'))
        assert 'Questions or corrections? Email me.' in (site / path).read_text()

    # Seven optional holds: compare actual baseline values, never refreshed counts.
    old_home, new_home = (source / 'index.md').read_text(), Path('index.md').read_text()
    strip = lambda s: re.search(r'<ul class="proof-grid".*?</ul>', s, re.S)[0]
    assert strip(old_home) == strip(new_home)
    common = re.search(r'The common thread.*?</p>', old_home)[0]
    assert common in new_home
    for path in ['_config.yml', '_includes/site/footer.html']:
        assert (source / path).read_bytes() == Path(path).read_bytes()
    interview = re.search(r'        title: "AI Innovators Ep\. 10".*?(?=\n      -|\Z)', (source / '_data/videos.yml').read_text(), re.S)[0]
    assert interview in Path('_data/videos.yml').read_text()
    counts = re.search(r'For the full record.*', (source / 'publications.md').read_text())[0]
    assert counts in Path('publications.md').read_text()
    for name, cue in [('2024-08-15-finding-ai-generated-faces-in-the-wild.md', 'The "in the wild"'),
                      ('2016-08-18-calibrating-the-lux-dark-matter-experiment.md', 'The technique outlived')]:
        old = (source / '_posts' / name).read_text()
        paragraph = next(p for p in old.split('\n\n') if p.startswith(cue))
        assert paragraph in (Path('_posts') / name).read_text()
    wild = Path('_posts/2024-08-15-finding-ai-generated-faces-in-the-wild.md').read_text()
    assert 'the generative landscape did not hold still' in wild and 'mostly slips through' in wild

    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    old_map = ET.parse(baseline / 'rendered/sitemap.xml')
    new_map = ET.parse(site / 'sitemap.xml')
    assert {n.text for n in old_map.findall('.//s:loc', ns)} == {n.text for n in new_map.findall('.//s:loc', ns)}
    assert not any('/tags/' in n.text or '/categories/' in n.text or n.text.endswith('/archive/') for n in new_map.findall('.//s:loc', ns))
    for path in ['posts/index.html', 'archive/index.html', 'tags/index.html', 'categories/index.html']:
        s = (site / path).read_text()
        assert 'Agentic AI Summit' not in s and 'agentic-ai-summit' not in s, path
    css = Path('assets/css/modern.css').read_text()
    assert css.count('{') == css.count('}')
    assert not (site / 'scripts/editorial-review').exists(), 'Internal review leaked into site'
    print(f'Preserved scope, nine front matters/code blocks, {len(old_files)} HTML routes, {anchor_count} old anchors, distinct destinations, figures, MathML, canonical/OG identity, and seven optional holds.')
    print(f'Parsed {json_count} JSON-LD blocks; verified nine updated headers/descriptions, person references, sitemap/taxonomy, and isolated demo scripts: {demo_pages}.')


if __name__ == '__main__':
    main()
