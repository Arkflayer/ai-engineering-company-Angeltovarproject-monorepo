# Carpeta `data/eval`

Esta carpeta está orientada a **evaluación y validación**: datasets de evaluación, “golden sets”, resultados de experimentos, métricas, y artefactos usados para medir calidad de modelos, RAG, agentes o pipelines.

- **Propósito principal**: centralizar los insumos y salidas de evaluación para asegurar mejoras medibles a lo largo de los hitos del proyecto.
- **Recomendación**: documenta cada set de evaluación (qué mide, cómo se construyó, criterios de éxito) y evita incluir datos sensibles; si es necesario, usa datos sintéticos o anonimizados.

## Fixture de aceptación de incidencias

`incidents-trackflow.synthetic.csv` es un fixture de 100 registros sintéticos para verificar el analizador TrackFlow. No procede de exportaciones de clientes: todos los correos usan el dominio reservado `.invalid` y las descripciones son generadas. Contiene 95 registros válidos y cinco inválidos, uno por cada regla de aceptación (seguimiento, transportista-país, categoría, correo y puntuación ausente en una incidencia cerrada).

La prueba `scripts/tests/test_incident_analysis.py` contrasta las distribuciones exactas de categoría, estado, país y satisfacción definidas en el briefing. Ejecutar desde la raíz: `uv run --project services/api python -m unittest discover -s scripts/tests -v`.
