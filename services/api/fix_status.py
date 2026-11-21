from pathlib import Path
import json

db_path = Path.home() / '.local' / 'share' / 'trackflow' / 'incidents.json'
data = json.loads(db_path.read_text(encoding='utf-8'))
table = data.get('incidents', {})

# Fix TRF-000001 back to open
for k, v in table.items():
    if v.get('status') == 'in_progress':
        v['status'] = 'open'
        print(f"Fixed {k} ({v.get('id')}): in_progress -> open")
        break

data['incidents'] = table
db_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')

# Verify
statuses = {}
categories = {}
for k, v in table.items():
    s = v.get('status', '')
    statuses[s] = statuses.get(s, 0) + 1
    c = v.get('category', '')
    categories[c] = categories.get(c, 0) + 1

print("Statuses:", statuses)
print("Categories:", categories)
print("Total:", len(table))