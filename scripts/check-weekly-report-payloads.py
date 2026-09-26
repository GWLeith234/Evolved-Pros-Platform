#!/usr/bin/env python3
"""Fail CI if a weekly report payload with real data is committed.

Shape fixtures (every string EXAMPLE, every number 0) are allowed only
outside the shell directories. A report.json sitting next to a PWA shell
always fails: those directories are what the server ships.
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'apps' / 'web' / 'weekly-reports'
SHELLS = ('adcellerant', 'evolved-pros', 'evolvex360', 'gwleith-money')
SKIP = {'.git', 'node_modules', '.next', 'dist', '.turbo', 'coverage'}


def value_problems(value, path='$'):
    problems = []
    if isinstance(value, dict):
        for key, item in value.items():
            problems.extend(value_problems(item, f'{path}.{key}'))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            problems.extend(value_problems(item, f'{path}[{index}]'))
    elif isinstance(value, str):
        if value != 'EXAMPLE':
            problems.append(f'{path} is {value[:60]!r}')
    elif isinstance(value, bool) or value is None:
        pass
    elif isinstance(value, (int, float)):
        if value != 0:
            problems.append(f'{path} is {value}')
    else:
        problems.append(f'{path} has type {type(value).__name__}')
    return problems


def looks_real(text: str) -> str | None:
    import re
    if re.search(r'\$\d', text):
        return 'contains a dollar amount'
    if re.search(r'\d{9,}', text):
        return 'contains a long digit run'
    if re.search(r'[A-Z0-9._%+-]+@(?!example\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}', text, re.I):
        return 'contains an email address'
    return None


def check_file(path: Path) -> list[str]:
    rel = path.relative_to(ROOT).as_posix()
    shell_hit = any(rel == f'apps/web/weekly-reports/{slug}/report.json' for slug in SHELLS)
    if shell_hit:
        return [f'{rel} must not be committed next to a PWA shell']
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError:
        return [f'{rel} is not JSON']
    problems = value_problems(data)
    raw = looks_real(path.read_text())
    if raw:
        problems.append(raw)
    if not problems:
        return []
    return [f'{rel} looks like real report data: ' + '; '.join(problems[:8])]


def scan(root: Path) -> list[str]:
    errors = []
    for path in root.rglob('report.json'):
        if any(part in SKIP for part in path.parts):
            continue
        errors.extend(check_file(path))
    fixtures = root / 'apps' / 'web' / 'weekly-reports' / 'fixtures'
    if fixtures.is_dir():
        for path in fixtures.glob('*.shape.json'):
            problems = value_problems(json.loads(path.read_text()))
            raw = looks_real(path.read_text())
            if problems or raw:
                detail = '; '.join(problems[:8])
                if raw:
                    detail = (detail + '; ' if detail else '') + raw
                errors.append(f'{path.relative_to(root).as_posix()} shape fixture is not EXAMPLE/0: {detail}')
    return errors


def self_test() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        shell = base / 'apps' / 'web' / 'weekly-reports' / 'adcellerant'
        shell.mkdir(parents=True)
        (shell / 'report.json').write_text('{"business":"EXAMPLE"}')
        # check_file uses relative_to(ROOT), so test the predicate directly.
        assert 'must not be committed' in check_shell_name('apps/web/weekly-reports/adcellerant/report.json')
        shape = {'business': 'EXAMPLE', 'kpis': [{'value': 'EXAMPLE', 'stale': False, 'n': 0}]}
        assert value_problems(shape) == []
        assert value_problems({'business': 'Vista Reach'}) 
        assert looks_real('debt $150000') == 'contains a dollar amount'
        assert looks_real('{"business":"EXAMPLE"}') is None
    print('weekly-report-payloads: self-test ok')


def check_shell_name(rel: str) -> str:
    if any(rel == f'apps/web/weekly-reports/{slug}/report.json' for slug in SHELLS):
        return f'{rel} must not be committed next to a PWA shell'
    return ''


def main() -> int:
    self_test()
    errors = scan(ROOT)
    if errors:
        for error in errors:
            print(f'weekly-report-payloads: FAIL {error}', file=sys.stderr)
        return 1
    print('weekly-report-payloads: PASS')
    return 0


if __name__ == '__main__':
    sys.exit(main())
