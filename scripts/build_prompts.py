"""Generate the public AI conversation starters from their reviewed Markdown source."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parent.parent


def prompt_data():
    source = (ROOT / 'prompts/participacion.md').read_text()
    def section(start, end):
        return source.split(start + '\n\n', 1)[1].split('\n' + end, 1)[0].strip()
    common = section('## Prompt común', '## Canal 1')
    return {
        'norma': common + '\n\n' + section('## Canal 1 — Reportar una norma', '## Canal 2'),
        'igj': common + '\n\n' + section('## Canal 2 — Consulta pública de la IGJ', '## Notas'),
    }


if __name__ == '__main__':
    result = json.dumps(prompt_data(), ensure_ascii=False, indent=2) + '\n'
    target = ROOT / 'data/participation-prompts.json'
    if '--check' in sys.argv:
        if not target.exists() or target.read_text() != result:
            raise SystemExit('AI prompts are out of date. Run python3 scripts/build_prompts.py')
        print('AI prompts match the reviewed source.')
    else:
        target.write_text(result)
        print('Generated both AI conversation starters.')
