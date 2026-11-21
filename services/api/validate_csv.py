import csv, sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))
_SHARED = Path.cwd().parents[1] / 'packages' / 'shared'
if str(_SHARED) not in sys.path:
    sys.path.insert(0, str(_SHARED))

from validation.csv_validation import validate_row, analyze_csv

csv_path = Path.cwd().parents[1] / 'data' / 'eval' / 'incidents-trackflow.synthetic.csv'
with csv_path.open('r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    total = 0
    seen_ids = set()
    for row in reader:
        total += 1
        errors = validate_row(row, seen_ids)
        if errors:
            print(f'INVALIDA fila {total}: {errors}')
            print(f'  incident_id={row.get("incident_id")!r}')
            print(f'  status={row.get("status")!r}')
            print(f'  category={row.get("category")!r}')
            print(f'  country={row.get("country")!r}')
    
    print(f'\nTotal filas: {total}')

# Also run analyze for summary
with csv_path.open('r', encoding='utf-8', newline='') as f:
    analysis = analyze_csv(f)
    print(f'\nAnalisis: validos={analysis["valid_records"]}, invalidos={analysis["invalid_records"]}')
    print(f'Breakdown: {analysis["invalid_breakdown"]}')