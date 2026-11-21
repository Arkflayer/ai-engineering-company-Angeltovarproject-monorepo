import requests

# Login
r = requests.post("http://localhost:8000/auth/login", json={
    "email": "andres.kim@trackflow.com",
    "password": "TrackFlow2024!"
})
token = r.json().get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}

# Get list to find the test incident
r = requests.get("http://localhost:8000/api/incidents", headers=headers)
items = r.json()

# Find the test incident (created in test, not from CSV)
test_item = None
for item in items:
    if item.get("title") == "Test incident" and "Test" in item.get("description", ""):
        test_item = item
        break

if test_item:
    print(f"Found test incident: {test_item.get('id')} - {test_item.get('title')}")
    # Delete it directly from TinyDB
    from tinydb import TinyDB
    from pathlib import Path
    from app.security import get_settings
    
    settings = get_settings()
    db = TinyDB(settings.incidents_db_path)
    incidents_table = db.table("incidents")
    
    from tinydb import Query
    removed = incidents_table.remove(Query().id == test_item.get("id"))
    print(f"Removed {len(removed)} records")
    db.close()
    
    # Verify
    r2 = requests.get("http://localhost:8000/api/incidents/summary", headers=headers)
    print(f"Summary: {r2.json()}")
else:
    print("No test incident found")
    # Check counts anyway
    r2 = requests.get("http://localhost:8000/api/incidents/summary", headers=headers)
    print(f"Summary: {r2.json()}")