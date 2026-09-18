"""Check voice-revision invariants against the actual unchanged-tree snapshot.

Adapted from the historical September 6 checker. The current brief authorizes
new dates, four policy replacements, selected copy, and two display-only scripts.
The academic homepage replaces the historical homepage-hold expectations.

Usage: python3 scripts/editorial-review/voice-revision/check_preservation.py BASELINE_DIR [SITE_DIR]
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

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from check_castle import Document, Node


# SECOND-09: only the five articles edited in the September 18 second pass
# receive a new modification date. Expectations are independent of source data.
EXPECTED_MODIFIED_DATES = {
    '_posts/2016-08-18-calibrating-the-lux-dark-matter-experiment.md': '2026-09-18',
    '_posts/2019-08-13-open-source-isolation-forest-spark-scala.md': '2026-09-18',
    '_posts/2021-09-02-using-deep-learning-to-detect-abusive-sequences-of-member-activity.md': '2026-09-17',
    '_posts/2023-06-20-detecting-ai-generated-profile-photos.md': '2026-09-17',
    '_posts/2024-08-15-finding-ai-generated-faces-in-the-wild.md': '2026-09-18',
    '_posts/2024-09-23-announcing-onnx-support-in-isolation-forest.md': '2026-09-17',
    '_posts/2025-02-10-brown-physics-ai-winter-school-workshop.md': '2026-09-18',
    '_posts/2026-01-09-brown-physics-ai-winter-school-workshop.md': '2026-09-17',
    '_posts/2026-03-18-announcing-extended-isolation-forest-support.md': '2026-09-18',
}


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
    assert {str(p.relative_to(source)) for p in posts} == set(EXPECTED_MODIFIED_DATES)
    allowed = {str(p.relative_to(source)) for p in posts} | {
        'AGENTS.md', 'index.md', 'isolation-forest.md', 'videos.md',
        '_config.yml', '_data/home.yml', '_data/open_source.yml', '_data/videos.yml',
        '_includes/site/if-demo.html', '_includes/site/orbit-demo.html',
        '_includes/site/lux-demo.html', 'assets/js/lux-demo.js', 'assets/js/orbit-demo.js',
    }
    for path, digest in originals.items():
        if path not in allowed:
            assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == digest, path
    for p in posts:
        old, new = p.read_text(), Path(p.relative_to(source)).read_text()
        front = lambda s: re.sub(r'^(description|last_modified_at):.*\n', '',
                                s.split('---', 2)[1], flags=re.M)
        assert front(old) == front(new), f'Protected front matter: {p.name}'
        expected_date = EXPECTED_MODIFIED_DATES[str(p.relative_to(source))]
        modified = re.search(r'^last_modified_at: (\d{4}-\d{2}-\d{2})$',
                             new.split('---', 2)[1], re.M)
        assert modified and modified[1] == expected_date, (p.name, 'last_modified_at', expected_date)
        for block in re.findall(r'^```[^\n]*\n.*?^```', old, re.M | re.S):
            assert block in new, f'Code/equation block: {p.name}'
    agents = ' '.join(Path('AGENTS.md').read_text().split())
    for rule in [
        'The thesis-grounded voice revision supersedes the former wording holds',
        'Shorter copy must preserve the actual scope of each result:',
        'Use James Verbus’s supplied 2016 Ph.D. thesis as the primary voice reference',
        'Also review source-as-narrator wording',
        'Apply the current thesis-grounded editorial instructions to copy; Castle protection and the approved academic design remain unchanged.',
    ]:
        assert rule in agents, rule
    assert 'All other editorial holds remain.' not in agents


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
        # VOICE-SEQ-01 and VOICE-RAG-01 delete introductory forward-link
        # narration. The destinations and their actual resources remain.
        removed_forward_links = {
            '2021/09/02/using-deep-learning-to-detect-abusive-sequences-of-member-activity/index.html': {'#resources'},
            '2025/02/10/brown-physics-ai-winter-school-workshop/index.html': {'#a-saved-corpus-coverage-example'},
        }.get(str(path), set())
        assert all(href[1:] in ids_after for href in removed_forward_links)
        lost = values(old, 'a', 'href') - values(new, 'a', 'href')
        assert lost <= removed_forward_links, (path, 'lost destinations', lost)
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
        assert any(dict(n.attrs).get('datetime', '').startswith(EXPECTED_MODIFIED_DATES[rel])
                   for n in times), (rel, 'rendered update date', EXPECTED_MODIFIED_DATES[rel])
        desc = re.search(r'^description: "(.*)"$', Path(rel).read_text(), re.M)[1]
        for attr, key in [('name', 'description'), ('property', 'og:description')]:
            assert dict(select(doc, 'meta', attr, key)[0].attrs)['content'] == desc, (rel, key)
        assert any(plain(n) == desc for n in select(doc, 'p', 'class', 'post-summary'))
        assert 'Questions or corrections? Email me.' in (site / path).read_text()

    # VOICE-RULES-01 replaces obsolete holds; preserve the actual academic home,
    # publication counts, and complete shared visual design from this baseline.
    old_home, new_home = (source / 'index.md').read_text(), Path('index.md').read_text()
    without_date = lambda s: re.sub(r'^last_modified_at:.*$', '', s, flags=re.M)
    assert without_date(old_home) == without_date(new_home), 'Academic home structure/bio'
    for path in ['assets/css/modern.css', '_includes/site/head.html',
                 '_includes/site/footer.html', 'publications.md', '_data/publications.yml']:
        assert (source / path).read_bytes() == Path(path).read_bytes(), path
    config = (source / '_config.yml').read_text().replace(
        '  - "AGENTS.md"\n', '  - "AGENTS.md"\n  - "CODEX_VOICE_REVISION_BRIEF.md"\n')
    assert Path('_config.yml').read_text() == config, 'Only exclude the private brief'
    assert 'Much of the implementation was AI-assisted.' in Path(
        '_posts/2026-03-18-announcing-extended-isolation-forest-support.md').read_text()
    # Only the five authorized message changes may alter JavaScript.
    changes = {
        'lux': [
            ('Sub-keV recoil — the regime this calibration unlocked.', 'Recoil energy below 1 keV.'),
            ('Few-keV recoil — the heart of the WIMP-search region.', 'Recoil energy between 1 and 10 keV.'),
            ('Near the 74 keV kinematic endpoint — a full backscatter.', 'Near the 74 keV maximum recoil energy.'),
        ],
        'orbit': [
            ('Greedy controller engaged — it gets there. Watch the thrust history.',
             'Greedy controller running. Compare its burn history and total Δv with the Hohmann transfer.'),
            ('"Target orbit reached with Δv " + fmt(sim.dvUsed) +\n'
             '          " — Hohmann needs " + fmt(plan.total) +\n'
             '          " (" + fmt(efficiency, 0) + "% efficiency)."',
             '"Target-orbit tolerances reached with Δv " + fmt(sim.dvUsed) + ". Hohmann Δv: " + fmt(plan.total) + "."'),
        ],
    }
    for name, replacements in changes.items():
        path = f'assets/js/{name}-demo.js'
        expected = (source / path).read_text()
        for old, new in replacements:
            assert expected.count(old) == 1, (name, old)
            expected = expected.replace(old, new)
        assert Path(path).read_text() == expected, (name, 'algorithm/event logic changed')
    for name in ['if', 'lux', 'orbit']:
        path = f'_includes/site/{name}-demo.html'
        old = Document((source / path).read_text())
        new = Document(Path(path).read_text())
        old_buttons, new_buttons = matching(old, 'button'), matching(new, 'button')
        if name == 'orbit':
            for button in old_buttons:
                button[1] = [(k, 'Run the greedy feedback controller and compare its thrust history and Δv with the Hohmann transfer.'
                              if k == 'title' and v.startswith('A myopic feedback controller:') else v)
                             for k, v in button[1]]
        assert old_buttons == new_buttons, (name, 'controls')
        for tag in ['canvas', 'input', 'output']:
            assert matching(old, tag) == matching(new, tag), (name, tag)
        assert any('hidden' in dict(n.attrs) and f'data-{name}-demo' in dict(n.attrs)
                   for n in new.nodes), (name, 'progressive enhancement')
        before = int(re.search(r'\?v=(\d+)', (source / path).read_text())[1])
        after = int(re.search(r'\?v=(\d+)', Path(path).read_text())[1])
        assert after == before + (name != 'if'), (name, 'cache version')

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
    assert not (site / 'scripts').exists(), 'Internal scripts/review leaked into site'
    assert not list(site.glob('CODEX_VOICE_REVISION_BRIEF*')), 'Private brief leaked into site'

    print(f'Preserved scope, nine front matters/code blocks, {len(old_files)} HTML routes, {anchor_count} old anchors, distinct destinations, figures, MathML, canonical/OG identity, and the current academic design.')
    print(f'Parsed {json_count} JSON-LD blocks; verified nine updated headers/descriptions, person references, sitemap/taxonomy, and isolated demo scripts: {demo_pages}.')


if __name__ == '__main__':
    main()
