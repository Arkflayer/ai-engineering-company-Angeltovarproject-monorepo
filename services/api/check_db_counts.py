from pathlib import Path
import json

db_path = Path.home() / '.local' / 'share' / 'trackflow' / 'incidents.json'
if not db_path.exists():
    print('DB not found')
else:
    data = json.loads(db_path.read_text(encoding='utf-8'))
    table = data.get('incidents', {})
    print(f'Total records: {len(table)}')
    # Summary
    statuses = {}
    categories = {}
    origins = {}
    branches = {}
    for k, v in table.items():
        s = v.get('status', '')
        statuses[s] = statuses.get(s, 0) + 1
        c = v.get('category', '')
        categories[c] = categories.get(c, 0) + 1
        o = v.get('origin', '')
        origins[o] = origins.get(o, 0) + 1
        b = v.get('branch', '')
        branches[b] = branches.get(b, 0) + 1
    print('Status:', statuses)
    print('Category:', categories)
    print('Origin:', origins)
    print('Branch:', branches)
    
    # Check for test records
    test_ids = []
    for k, v in table.items():
        title = v.get('title', '')
        if 'test' in title.lower() or 'test' in v.get('description', '').lower():
            test_ids.append((k, title))
    if test_ids:
        print(f'\nTest records found: {test_ids}')
    else:
        print('\nNo test records found.')