# TrackFlow — contexto técnico

## Estructura del monorepo

Respeta las responsabilidades existentes de las carpetas principales:

- `uis/talent-pipeline-tracker/` — frontend activo y destino predeterminado de nuevas funcionalidades; interfaz administrativa privada unificada para pipeline, operaciones, proveedores e incidencias, con Next.js App Router, React, TypeScript y Tailwind CSS. `uis/backoffice/` se conserva como referencia legacy; el nuevo desarrollo interno va en el tracker.
- `uis/website/` — sitio público e interfaces web para clientes.
- `services/` — API de backend y servicios en segundo plano. Mantén las API centralizadas hasta que exista una razón clara para separarlas.
- `agents/` — asistentes de IA concretos, con instrucciones, herramientas, pruebas y un README por agente.
- `skills/` — procedimientos reutilizables y autocontenidos para agentes (instrucciones y, opcionalmente, scripts, recursos y pruebas).
- `data/` — datos de origen, pipelines, datos procesados y de evaluación; no coloques aquí código de aplicaciones.
- `packages/` y `shared/` — código tipado reutilizable y recursos o esquemas compartidos pequeños, respectivamente.
- `workflows/` — definiciones de automatización entre sistemas; `infra/` — despliegue e infraestructura; `scripts/` — utilidades específicas; `docs/` — arquitectura y decisiones transversales.

## Implementación conocida actualmente

- La aplicación Next.js usa `src/app/`, componentes React tipados y Tailwind como primera opción para estilos. Desde la raíz se inicia con `npm --prefix uis/talent-pipeline-tracker run dev`; lint y build usan ese prefijo con `run lint` y `run build`.
- El sitio público de TrackFlow es estático y usa HTML, CSS y JavaScript sin framework en `uis/website/`; ofrece la interfaz en español e inglés y usa recursos locales.
- El `package.json` de la raíz inicia un servidor estático con `npx serve . -l 3000`, no Next.js. No hay ejecutor de workspaces ni suite global configurada; la API sí tiene pruebas unittest y el frontend tiene scripts de lint y build.
- El backend centralizado usa FastAPI en `services/api/`, con uv para entornos y ejecución y `pyproject.toml` como manifiesto de referencia. Los comandos y requisitos locales están en [`services/api/README.md`](../services/api/README.md); usa ejecución bloqueada (`uv run --locked`) para evitar resolver versiones sin aprobación.
- `packages/shared/` contiene la estructura inicial de un paquete TypeScript compartido.
- `CONTEXT.md` y `CONTEXT.es.md`, en la raíz, son las descripciones detalladas de la empresa; este banco de memoria recoge pautas de trabajo y no las sustituye.

## Convenciones de implementación

1. Antes de editar, revisa el README más cercano y la implementación relacionada. Coloca el código nuevo en la carpeta del dominio correcto y añade o actualiza un README local para cada aplicación, servicio, agente, pipeline o skill.
2. Usa Next.js, TypeScript y Tailwind para el frontend y FastAPI con uv para el backend. Reutiliza código y dependencias existentes. Solicita aprobación antes de añadir, eliminar o actualizar paquetes, como exige `AGENTS.md`; sincroniza solo con lockfile compatible sin cambiar versiones. No introduzcas gestores o frameworks alternativos por iniciativa propia.
3. Para interfaces, usa HTML semántico, etiquetas y estados de foco accesibles, diseños adaptables y estados claros de carga, vacío, error y demostración. Mantén separados los diseños públicos e internos.
4. Usa rutas relativas para los recursos de las interfaces estáticas y las convenciones de App Router para Next.js. Conserva el comportamiento existente en español e inglés del sitio salvo que el cambio requiera explícitamente otra cosa. Trabaja en `website` solo si se solicita expresamente; su regla y skill estáticas no se aplican a Next.js. No retires `backoffice` sin una decisión explícita.
5. Define claramente los contratos de servicios/API, valida las entradas y nunca expongas secretos ni datos personales reales en el control de versiones. Mantén las API y la lógica de negocio en `services/api/`, sin duplicarlas en Next.js.
6. Considera falibles las recomendaciones de IA: indica sus fundamentos y limitaciones, y permite revisión humana en decisiones de alto impacto.
7. Antes de finalizar, ejecuta comprobaciones proporcionales al cambio (como mínimo, revisa los diffs y verifica las referencias a archivos; ejecuta pruebas, compilación y lint si están configurados). Informa solo de las comprobaciones realmente realizadas, de las brechas conocidas y de las integraciones no implementadas.
