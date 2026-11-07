# Reglas para agentes del repositorio

Esta carpeta configura los agentes de programación que trabajan en el repositorio; no contiene agentes de producto ni las skills que se desarrollan para TrackFlow. [`AGENTS.md`](../AGENTS.md), en la raíz, define el flujo de entrega obligatorio. Las reglas específicas van en `rules/` y las skills para agentes de programación en `skills/<nombre>/SKILL.md`.

La regla `rules/interfaces.md` se aplica siempre que se cambie `uis/website/**` o `uis/backoffice/**`. La skill de trabajo recurrente con estas interfaces se encuentra en `skills/ui-delivery/SKILL.md` y se solicita para las tareas de interfaz compatibles con su descripción.

El desarrollo frontend nuevo se dirige por defecto a `uis/talent-pipeline-tracker/` con Next.js, TypeScript y Tailwind; el backend usa FastAPI y uv en `services/api/`. Las instrucciones de Copilot en [frontend.instructions.md](../.github/instructions/frontend.instructions.md) y [backend.instructions.md](../.github/instructions/backend.instructions.md) tienen `description` y `applyTo` para adjuntarse a las tareas y archivos pertinentes. No extiendas la regla o skill estática a Next.js.

La política común de aprobación de dependencias está en [`AGENTS.md`](../AGENTS.md); estas instrucciones no la sustituyen. Para comprobar su descubrimiento en VS Code usa Add Context > Instructions o los diagnósticos de personalizaciones. Las instrucciones guían al agente, pero no bloquean técnicamente sus herramientas; si no puedes verificar su carga, informa de esa limitación.

Antes de crear carpetas o archivos, lee el `README.md` existente en la carpeta pertinente. Las reglas deben ser concisas y verificables: cada una identifica las rutas a las que se aplica y las comprobaciones necesarias para dar el trabajo por terminado. No confundas este directorio `.agents/` con `agents/` (agentes de producto) ni `skills/` (capacidades reutilizables del producto).
