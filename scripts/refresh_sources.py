"""Snapshot public ministry metadata and the exact monthly series behind its charts.

Requires beautifulsoup4 and curl. Fetches public sources only; never submits forms.
The document index is not represented as the ministry's itemized normative ledger.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, urlencode, urlparse, parse_qs
import csv
import hashlib
import io
import json
import re
import subprocess
import tempfile
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://www.argentina.gob.ar'
MINISTRY = BASE + '/desregulacion'
NEWS = MINISTRY + '/noticias'
REPORTS = MINISTRY + '/desregulacion-en-numeros'
CUTOFF = '2023-12-10'
CACHE = Path(tempfile.gettempdir()) / 'desregulacion-public-sources'
CACHE.mkdir(exist_ok=True)
MONTHS = {name: i + 1 for i, name in enumerate(['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'])}


def fetch(url):
    # Cached per day so repeated runs do not refetch the full public archive.
    key = hashlib.sha256((date.today().isoformat() + url).encode()).hexdigest()
    target = CACHE / key
    if not target.exists():
        result = subprocess.run(['curl', '-L', '--fail', '--silent', '--show-error', '--retry', '2', '--max-time', '40', '-A', 'Mozilla/5.0', url], capture_output=True, check=True)
        target.write_bytes(result.stdout)
    return target.read_text(encoding='utf-8-sig')


def clean(text):
    return ' '.join(text.split())


def parse_news(url):
    soup = BeautifulSoup(fetch(url), 'html.parser')
    records = []
    for card in soup.select('a.panel'):
        heading, timestamp = card.find('h3'), card.find('time')
        if not heading or not timestamp:
            continue
        published = timestamp.get('datetime', '')[:10]
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', published):
            raise ValueError(f'Unrecognized publication date on {url}')
        if published < CUTOFF:
            continue
        link = urljoin(BASE, card['href'])
        description = card.select_one('.text-muted')
        records.append({
            'id': 'comunicado-' + hashlib.sha256(link.encode()).hexdigest()[:12],
            'kind': 'comunicado', 'date': published, 'date_precision': 'day',
            'title': clean(heading.get_text(' ')),
            'description': clean(description.get_text(' ')) if description else '',
            'url': link, 'source': 'Ministerio de Desregulación y Transformación del Estado',
            'index_url': url,
        })
    if not records:
        raise ValueError(f'No publication records found at {url}; inspect before updating')
    return records


def main():
    page = fetch(MINISTRY)
    sheet_ids = re.findall(r'"idSpread"\s*:\s*"([^"]+)"', page)
    if not sheet_ids:
        raise ValueError('Public chart spreadsheet reference not found')
    sheet_id = sheet_ids[0]
    sheet_base = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?'
    source_sheets = {'normas': 'Normas', 'normativas': 'Normativas', 'articulos': 'Artículos'}
    series = {}
    for metric, name in source_sheets.items():
        url = sheet_base + urlencode({'tqx': 'out:csv', 'sheet': name})
        rows = list(csv.reader(io.StringIO(fetch(url))))
        values = {}
        for row in rows[1:]:
            if len(row) < 2 or not row[0]:
                continue
            if not re.fullmatch(r'\d{4}-\d{2}', row[0]):
                raise ValueError(f'Unexpected month in {name}: {row}')
            values[row[0]] = int(row[1].replace('.', '').replace(',', ''))
        series[metric] = {'url': url, 'values': values}
    months = sorted(series['normas']['values'])
    if any(sorted(s['values']) != months for s in series.values()):
        raise ValueError('Monthly series do not cover the same dates')
    history = [{'month': month, **{key: series[key]['values'][month] for key in series}} for month in months]
    snapshot = json.loads((ROOT / 'data/august-2026.json').read_text())
    expected = snapshot['totals']
    if months[-1] != snapshot['as_of']:
        raise ValueError('A new edition is available; update the featured report before refreshing the historical cutoff')
    aug = next(row for row in history if row['month'] == '2026-08')
    for metric, key in [('normas','normas_desregulacion'), ('normativas','normas_modificadas_o_eliminadas'), ('articulos','articulos_modificados_o_eliminados')]:
        if aug[metric] != expected[key]['value']:
            raise ValueError(f'Source revision detected for August {metric}; review before publishing')
    reconciliation = []
    for metric, key in [('normas','normas_desregulacion'), ('normativas','normas_modificadas_o_eliminadas'), ('articulos','articulos_modificados_o_eliminados')]:
        series_delta = history[-1][metric] - history[-2][metric]
        report_delta = expected[key]['delta_month']
        if series_delta != report_delta:
            previous_report = next((item['value'] for item in snapshot['articulos_ultimos_3_meses'] if item['month'] == history[-2]['month']), None) if metric == 'articulos' else None
            reconciliation.append({'metric': metric, 'month': history[-2]['month'], 'series_previous': history[-2][metric], 'series_delta': series_delta, 'report_delta': report_delta, 'report_previous': previous_report, 'report_url': snapshot['source']['official_pdf'], 'status': 'unreconciled'})
    history_data = {
        'retrieved_at': date.today().isoformat(), 'coverage_start': CUTOFF,
        'source_url': MINISTRY, 'spreadsheet_url': f'https://docs.google.com/spreadsheets/d/{sheet_id}/edit',
        'source_sheets': {key: value['url'] for key, value in series.items()},
        'description': 'Serie acumulada publicada en los gráficos del Ministerio. Los valores se conservan tal como los publica la fuente y pueden incorporar revisiones metodológicas.',
        'months': history, 'reconciliation': reconciliation,
    }

    first = BeautifulSoup(fetch(NEWS), 'html.parser')
    page_numbers = [int(parse_qs(urlparse(a['href']).query).get('page', ['0'])[0]) for a in first.select('.pagination a[href]')]
    last = max(page_numbers, default=0)
    if last > 100:
        raise ValueError('Unexpected pagination size; inspect source')
    urls = [NEWS] + [f'{NEWS}?page={page}' for page in range(1, last + 1)]
    records = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for index, items in enumerate(pool.map(parse_news, urls)):
            records.extend(items)
            print(f'Indexed page {index + 1}/{len(urls)}: {len(items)} publications', flush=True)
    by_url = {record['url']: record for record in records}
    if len(by_url) != len(records):
        raise ValueError('Duplicate publication across pages; pagination may have changed during fetch')
    records = list(by_url.values())

    soup = BeautifulSoup(fetch(REPORTS), 'html.parser')
    report_count = 0
    for link in soup.select('a[href]'):
        href = urljoin(BASE, link['href'])
        title = clean(link.get_text(' '))
        if not href.lower().endswith('.pdf') or 'Informe' not in title:
            continue
        year = re.search(r'20\d{2}', title)
        names = [name for name in MONTHS if name in title.lower()]
        if not year or not names:
            raise ValueError(f'Cannot date report: {title}')
        month = 'enero' if 'enero' in names else names[0]
        period = f'{year[0]}-{MONTHS[month]:02d}'
        records.append({'id': 'informe-' + period, 'kind': 'informe', 'date': period, 'date_precision': 'month', 'title': re.sub(r'\s*\(pdf,.*', '', title, flags=re.I), 'description': 'Informe mensual de la Unidad de Evaluación de Impacto. El período identifica la edición, no su fecha de publicación.', 'url': href, 'source': 'Unidad de Evaluación de Impacto', 'index_url': REPORTS})
        report_count += 1
    if report_count == 0:
        raise ValueError('No monthly reports found')

    # Curated official legal references establish the start of the process.
    records.extend(json.loads((ROOT / 'data/archive-foundations.json').read_text()))
    monthly = json.loads((ROOT / 'data/august-2026.json').read_text())
    for entry in monthly['ejemplos_destacados']:
        records.append({'id': f'medida-2026-08-{entry["n"]}', 'kind': 'medida', 'date': '2026-08', 'date_precision': 'month', 'title': entry['titulo'], 'description': entry['detalle'], 'norma': entry['norma'], 'url': monthly['source']['official_pdf'] + '#page=3', 'source': 'Destacados del informe de agosto de 2026', 'local_example': entry['n']})
    archive_data = {
        'retrieved_at': date.today().isoformat(), 'coverage_start': CUTOFF,
        'coverage': 'partial',
        'coverage_note': 'Este archivo reúne publicaciones desde diciembre de 2023. Un documento puede incluir varias medidas y una medida puede aparecer en más de una publicación. El inventario individual de las 770 normas está en construcción.',
        'sources': [NEWS, REPORTS], 'news_pages_indexed': len(urls),
        'news_count': len(by_url), 'report_count': report_count,
        'entries': sorted(records, key=lambda e: (e['date'], e['id']), reverse=True),
    }
    # Write only after every required source was read and validated.
    for filename, data in [('history.json', history_data), ('archive.json', archive_data)]:
        (ROOT / 'data' / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'Saved {len(history)} months and {len(records)} archive records ({len(by_url)} news, {report_count} reports).')

if __name__ == '__main__':
    main()
