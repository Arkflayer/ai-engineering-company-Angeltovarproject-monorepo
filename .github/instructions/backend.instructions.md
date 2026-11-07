---
description: "Usar al desarrollar endpoints, modelos, autenticacion, servicios, pruebas o configuracion del backend FastAPI y sus entornos uv."
applyTo: "services/api/**"
---

# Backend FastAPI Con uv

- Sigue `AGENTS.md` raiz y `services/api/README.md`, especialmente la aprobacion de dependencias y la proteccion de secretos y datos. Usa las versiones declaradas por el proyecto; no cambies gestor ni version de Python por iniciativa propia.
- Gestiona el entorno y la ejecucion con uv. `services/api/pyproject.toml` es el manifiesto de referencia. Sincroniza dependencias existentes con `uv sync --locked` solo cuando haya un lockfile compatible; aplica la politica global si falta o requiere cambios. No uses pip, Poetry o Pipenv para crear un entorno paralelo.
- Reutiliza los routers en `app/domains/`, los modelos Pydantic existentes y las capas de servicios. Manten validacion, autorizacion y filtrado de respuestas en sus abstracciones actuales; no expongas registros internos directamente.
- Conserva FastAPI como backend centralizado. No crees una API paralela en Next.js ni cambies persistencia o contratos sin un requerimiento explicito. Reutiliza autenticacion y aislamiento por usuario; no inventes permisos ni integraciones.
- Ante discrepancias entre `pyproject.toml`, lockfiles y `requirements.txt`, consulta antes de resolver versiones o regenerar archivos. No anadas ni actualices paquetes sin la aprobacion exigida en `AGENTS.md`.
- Reutiliza las pruebas unittest y sus utilidades en `services/api/tests/`. Usa datos ficticios y almacenamiento temporal; no cambies bases reales, secretos o configuracion local para probar.

## Comandos Desde La Raiz

```sh
uv run --locked --project services/api uvicorn app.main:app --reload --host 127.0.0.1
uv run --locked --project services/api python -m unittest discover -s services/api/tests -v
uv run --locked --project services/api python -m unittest discover -s scripts/tests -v
```

Estos comandos requieren un lockfile compatible y la configuracion local descrita en el README de la API. Si uv necesita resolver versiones nuevas, consulta antes de continuar. Para cambios del backend ejecuta las pruebas pertinentes y comprueba el diff; documenta cualquier comprobacion bloqueada sin afirmar que paso.