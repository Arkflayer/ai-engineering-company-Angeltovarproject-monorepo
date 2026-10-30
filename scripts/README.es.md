# Scripts del proyecto

## Analizador de incidencias TrackFlow

`analyze.py` recibe la ruta de un CSV UTF-8, valida el esquema de TrackFlow, excluye los registros inválidos, muestra métricas agregadas y ofrece exportar `results.csv`. Nunca imprime ni exporta filas de origen, identificadores personales ni correos.

```sh
uv run --project services/api python scripts/analyze.py data/eval/incidents-trackflow.synthetic.csv
```

El fixture de evaluación contiene 100 registros completamente sintéticos. Las capturas requeridas para la entrega están en [`docs/evidence/`](../docs/evidence/): output de consola y vista web del análisis. Para reproducir el output, responde `s` para guardar el CSV agregado.

La lógica compartida con la interfaz de programación de aplicaciones vive en `services/api/app/domains/incidents/analysis.py`. Las pruebas se ejecutan desde la raíz con `uv run --project services/api python -m unittest discover -s scripts/tests`.
