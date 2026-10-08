# TrackFlow — contexto técnico

## Estructura del monorepo

Respeta las responsabilidades existentes de las carpetas principales:

- `uis/website/` — sitio público e interfaces web para clientes.
- `uis/backoffice/` — interfaz interna para operaciones/administración; cada aplicación tiene su propia entrada, diseño y documentación.
- `services/` — API de backend y servicios en segundo plano. Mantén las API centralizadas hasta que exista una razón clara para separarlas.
- `agents/` — asistentes de IA concretos, con instrucciones, herramientas, pruebas y un README por agente.
- `skills/` — procedimientos reutilizables y autocontenidos para agentes (instrucciones y, opcionalmente, scripts, recursos y pruebas).
- `data/` — datos de origen, pipelines, datos procesados y de evaluación; no coloques aquí código de aplicaciones.
- `packages/` y `shared/` — código tipado reutilizable y recursos o esquemas compartidos pequeños, respectivamente.
- `workflows/` — definiciones de automatización entre sistemas; `infra/` — despliegue e infraestructura; `scripts/` — utilidades específicas; `docs/` — arquitectura y decisiones transversales.

## Implementación conocida actualmente

- El sitio público de TrackFlow es estático y usa HTML, CSS y JavaScript sin framework en `uis/website/`; ofrece la interfaz en español e inglés y usa recursos locales.
- `uis/backoffice/` está destinado a la aplicación interna. Mantén su estructura y página de entrada autocontenidas; no des a entender que existen backend o autenticación si no se han implementado.
- El `package.json` de la raíz inicia actualmente un servidor estático con `npx serve . -l 3000`. Todavía no hay un ejecutor de espacios de trabajo, framework ni conjunto de pruebas automatizadas establecido.
- `packages/shared/` contiene la estructura inicial de un paquete TypeScript compartido.
- `CONTEXT.md` y `CONTEXT.es.md`, en la raíz, son las descripciones detalladas de la empresa; este banco de memoria recoge pautas de trabajo y no las sustituye.

## Convenciones de implementación

1. Antes de editar, revisa el README más cercano y la implementación relacionada. Coloca el código nuevo en la carpeta del dominio correcto y añade o actualiza un README local para cada aplicación, servicio, agente, pipeline o skill.
2. Prefiere la tecnología menos compleja que ya admita el repositorio. Evita incorporar dependencias o herramientas de compilación innecesarias; si añades alguna, documenta su configuración y sus comandos.
3. Para interfaces, usa HTML semántico, etiquetas y estados de foco accesibles, diseños adaptables y estados claros de carga, vacío, error y demostración. Mantén separados los diseños públicos e internos.
4. Usa rutas relativas para los recursos de cada interfaz. Conserva el comportamiento existente en español e inglés del sitio salvo que el cambio requiera explícitamente otra cosa.
5. Define claramente los contratos de servicios/API, valida las entradas y nunca expongas secretos ni datos personales reales en el control de versiones. Coloca la lógica de servidor únicamente en `services/`.
6. Considera falibles las recomendaciones de IA: indica sus fundamentos y limitaciones, y permite revisión humana en decisiones de alto impacto.
7. Antes de finalizar, ejecuta comprobaciones proporcionales al cambio (como mínimo, revisa los diffs y verifica las referencias a archivos; ejecuta pruebas, compilación y lint si están configurados). Informa solo de las comprobaciones realmente realizadas, de las brechas conocidas y de las integraciones no implementadas.
