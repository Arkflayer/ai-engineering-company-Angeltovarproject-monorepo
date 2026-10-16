# TrackFlow — progreso del proyecto

## Estado actual

- La memoria empresarial y técnica, el acuerdo de agentes y las reglas de interfaz están documentados en español.
- La web pública vive en `uis/website/`; mantiene páginas estáticas en español e inglés y no envía datos a un backend.
- `uis/backoffice/` contiene un dashboard interno estático con ejemplos claramente marcados; sus secciones sin integración se identifican como pendientes/sin conexión.
- No se han añadido APIs nuevas ni servicios de backend. No existe una suite de pruebas automatizadas global.
- La rama de trabajo prevista para esta entrega es `feature/agent-memory-bank`; `main` debe permanecer intacta. La entrega actual solicita publicar una pull request hacia `main` del fork.

## Próximos pasos previstos

1. Definir con las áreas de negocio el alcance del primer servicio o flujo operativo a implementar, sin inferir contratos de sistemas heredados que no están documentados.
2. Para una primera integración, acordar fuente de datos, propietario, contrato API, autenticación, privacidad, manejo de errores y criterios de aceptación antes de implementarla bajo `services/`.
3. Validar el backoffice con usuarios de operaciones y decidir qué módulo aporta más valor (inventario, transportistas, devoluciones o experiencia de cliente).
4. Establecer pruebas automatizadas y observabilidad conforme se incorporen servicios reales.

## Limitaciones conocidas

El contexto empresarial describe necesidades objetivo, no capacidades ya entregadas. Las métricas visibles del backoffice son datos de demostración; el sitio y el dashboard aún no están conectados a WMS, ERP, transportistas, CRM ni sistemas de tickets. Cualquier prueba manual de navegador debe indicarse por separado de las comprobaciones automatizadas.
