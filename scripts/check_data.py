"""Check archive provenance, date coverage, and agreement with the monthly report."""
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
import json

ROOT = Path(__file__).resolve().parent.parent
load = lambda name: json.loads((ROOT / 'data' / name).read_text())
report, history, archive = [load(name) for name in ['august-2026.json', 'history.json', 'archive.json']]
rows = history['months']
assert rows[0]['month'] == '2023-12', 'Historical series must start in December 2023'
assert rows[-1]['month'] == report['as_of'], 'History and featured report must use the same cutoff'
previous = None
for row in rows:
    year, month = map(int, row['month'].split('-'))
    ordinal = year * 12 + month
    assert 1 <= month <= 12
    assert previous is None or ordinal == previous + 1, 'Missing or duplicate month'
    previous = ordinal
    assert all(isinstance(row[key], int) and row[key] >= 0 for key in ['normas','normativas','articulos'])
for metric, key in [('normas','normas_desregulacion'), ('normativas','normas_modificadas_o_eliminadas'), ('articulos','articulos_modificados_o_eliminados')]:
    assert rows[-1][metric] == report['totals'][key]['value'], f'{metric} does not match headline count'
    delta = rows[-1][metric] - rows[-2][metric]
    if delta != report['totals'][key]['delta_month']:
        note = next((note for note in history['reconciliation'] if note['metric'] == metric), None)
        assert note and note['series_delta'] == delta and note['report_delta'] == report['totals'][key]['delta_month'], 'Undocumented discrepancy between official sources'
by_month = {row['month']: row for row in rows}
for item in report['articulos_ultimos_3_meses']:
    if by_month[item['month']]['articulos'] != item['value']:
        note = next((note for note in history['reconciliation'] if note['metric'] == 'articulos' and note['month'] == item['month']), None)
        assert note and note['series_previous'] == by_month[item['month']]['articulos'] and note['report_previous'] == item['value'], 'Undocumented historical revision'
assert sum(sector['normas'] for sector in report['sectores']) == rows[-1]['normas']
entries = archive['entries']
assert len({e['id'] for e in entries}) == len(entries), 'Duplicate archive IDs'
counts = Counter(e['kind'] for e in entries)
assert counts['comunicado'] == archive['news_count']
assert counts['informe'] == archive['report_count']
assert archive['coverage'] == 'partial', 'Document index must not be presented as complete normative inventory'
news_urls = []
for entry in entries:
    assert entry['kind'] in {'norma', 'medida', 'informe', 'comunicado'}
    assert entry['title'].strip() and entry['source'].strip()
    parsed = urlparse(entry['url'])
    assert parsed.scheme == 'https' and parsed.hostname == 'www.argentina.gob.ar', 'Archive link is not an official source'
    published = date.fromisoformat(entry['date'] + ('-01' if entry['date_precision'] == 'month' else ''))
    assert date(2023, 12, 1) <= published <= date.fromisoformat(archive['retrieved_at'])
    if entry['kind'] == 'comunicado': news_urls.append(entry['url'])
    if 'local_example' in entry:
        assert entry['local_example'] in [e['n'] for e in report['ejemplos_destacados']]
assert len(set(news_urls)) == len(news_urls), 'Duplicate indexed publications'
citizen, upcoming = load('citizen.json'), load('upcoming.json')
changes = citizen['entries']
assert len({e['id'] for e in changes}) == len(changes), 'Duplicate citizen explanation IDs'
assert {e['date'][:4] for e in changes} == {'2023', '2024', '2025', '2026'}, 'Explorer must cover every year since 2023'
assert citizen['coverage'] == 'selection'
archive_by_id = {e['id']: e for e in entries}
allowed_topics = {'cotidiana', 'producir', 'transporte', 'invertir'}
for entry in changes:
    assert all(entry.get(key, '').strip() for key in ['id','titulo','resumen','beneficio','antes','ahora','personas','norma','source_url'])
    assert set(entry['intereses']) <= allowed_topics and entry['intereses']
    assert urlparse(entry['source_url']).hostname == 'www.argentina.gob.ar'
    published = date.fromisoformat(entry['date'] + ('-01' if entry['date_precision'] == 'month' else ''))
    assert date(2023, 12, 10) <= published <= date.fromisoformat(citizen['reviewed_at'])
    if 'archive_id' in entry:
        original = archive_by_id[entry['archive_id']]
        assert entry['source_url'] == original['url'] and entry['date'] == original['date'], 'Explanation provenance differs from archive'
for monthly in report['ejemplos_destacados']:
    change = next(e for e in changes if e['id'] == str(monthly['n']))
    assert change['norma'] == monthly['norma']
    for field, value in report['lectura_ciudadana']['ejemplos'][str(monthly['n'])].items():
        assert change[field] == value, 'Monthly explanation and explorer have drifted'
assert any('producir' in e['intereses'] and e['date'][:4] != '2026' for e in changes)
assert len({e['id'] for e in upcoming['entries']}) == len(upcoming['entries'])
for proposal in upcoming['entries']:
    assert proposal['status_kind'] in {'legislativo', 'consulta'}
    if 'deadline' in proposal:
        date.fromisoformat(proposal['deadline'])
    assert all(proposal.get(key, '').strip() for key in ['title','status','reference','description','next_step','support'])
    for key in ['source_url', 'action_url']:
        parsed = urlparse(proposal[key])
        assert parsed.scheme == 'https' and parsed.hostname in {'www.argentina.gob.ar', 'www.senado.gob.ar', 'www.hcdn.gob.ar'}
assert date.fromisoformat(upcoming['reviewed_at']) <= date.today()
print(f'PASS: {len(rows)} consecutive months; report totals agree; {len(entries)} archive records have valid dates, unique IDs, and official source URLs.')
print(f'PASS: {len(changes)} sourced explanations across all four years; monthly IDs preserved; {len(upcoming["entries"])} upcoming initiatives use official participation routes.')
