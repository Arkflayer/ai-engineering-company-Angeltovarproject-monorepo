"""Generate a JWT token for screenshots using the running server's secret."""
import json
import os
import sys
from pathlib import Path

# Add the API dir to sys.path
api_dir = str(Path("/workspaces/ai-engineering-company-Angeltovarproject-monorepo/services/api"))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

# Load .env
env_path = Path(api_dir) / ".env"
for line in env_path.read_text().splitlines():
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        os.environ[k] = v

from app.security import get_settings, create_access_token
get_settings.cache_clear()

# Read identity and generate token
identity_path = Path(os.environ["TRACKFLOW_DB_PATH"])
data = json.loads(identity_path.read_text())
for uid, u in data.get("users", {}).items():
    token = create_access_token(data={"sub": u["id"]})
    print(f"TOKEN: Bearer {token}")
    print(f"USER: {u['email']}")
    break