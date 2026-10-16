# API de análisis de incidencias de TrackFlow

Puntos de acceso FastAPI para analizar archivos CSV localmente. La validación y la agregación comparten la implementación de `scripts/analyze.py`, ubicada en `app/domains/incidents/analysis.py`. Ni las respuestas de la API ni las exportaciones contienen filas de origen o correos de clientes.

## Ejecución local

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r services/api/requirements.txt
uvicorn app.main:app --app-dir services/api --reload
```

- `POST /api/incidents/analyze` acepta un campo `file` en `multipart/form-data` y devuelve un resumen JSON agregado. Tamaño máximo: 25 MiB.
- `GET /api/incidents/results/export` devuelve el análisis más reciente, guardado en memoria, como CSV agregado. El resultado solo existe en el proceso actual y se pierde al reiniciarlo; no es persistente ni está aislado por usuario.
- `GET /health` ofrece una comprobación básica del estado del servicio y devuelve `{"estado":"correcto"}`.

Para desarrollo local, la API permite los orígenes del backoffice estático en el puerto 3000. Si es necesario, configura la lista explícita de orígenes permitidos mediante `TRACKFLOW_UI_ORIGINS` (orígenes separados por comas); no uses un comodín en producción.

Las filas inválidas se cuentan y se excluyen del análisis. Los encabezados ausentes o incorrectos, los archivos vacíos y el texto UTF-8 inválido devuelven errores 400 descriptivos; una extensión incorrecta devuelve 415 y los archivos demasiado grandes, 413. Este prototipo no ofrece autenticación: úsalo únicamente en un entorno interno de confianza hasta que se implementen controles de acceso.
