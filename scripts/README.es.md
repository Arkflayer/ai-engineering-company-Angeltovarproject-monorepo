# Scripts del proyecto

## Analizador de incidencias TrackFlow

`analyze.py` recibe la ruta de un CSV UTF-8, valida el esquema de TrackFlow, excluye los registros inválidos, muestra métricas agregadas y ofrece exportar `resultados.csv`. Nunca imprime ni exporta filas de origen, identificadores personales ni correos.

```sh
python scripts/analyze.py incidencias-trackflow.csv
```

La lógica compartida con la interfaz de programación de aplicaciones vive en `services/api/app/domains/incidents/analysis.py`. Las pruebas se ejecutan desde la raíz con `python -m unittest discover -s scripts/tests`.
