# TrackFlow — contexto técnico

## Stack actual

- Sitio público: HTML, CSS y JavaScript sin framework en `uis/website/`; interfaz español/inglés, recursos locales y páginas estáticas.
- Aplicación interna: prototipo HTML/CSS estático en `uis/backoffice/`, con diseño separado y datos de demostración.
- Ejecución local: `npm run dev` desde la raíz usa `npx serve . -l 3000`.
- `packages/shared/` contiene una estructura inicial para un paquete TypeScript. No hay runner de workspaces ni suite de pruebas global configurada.
- No se incorporó un backend para estas interfaces. Toda API o lógica de servidor nueva pertenece a `services/`.

## Decisiones de arquitectura

- Mantener web pública y backoffice en aplicaciones independientes bajo `uis/`, cada una con su propia entrada, documentación, estilos y responsabilidades.
- Mantener la implementación de las interfaces estáticas pequeña, sin framework ni bundler si no existe una necesidad concreta.
- Mantener APIs centralizadas en `services/` hasta que una razón técnica justifique separarlas.
- Separar agentes de producto (`agents/`) y capacidades de producto (`skills/`) de la configuración de agentes de programación (`.agents/`).
- Mantener `CONTEXT.md` y `CONTEXT.es.md` como briefing detallado de negocio. Esta memoria resume hechos y decisiones; no los reemplaza.

## Restricciones de implementación

- No afirmar que hay autenticación, persistencia, integración con sistemas heredados, inventario real o seguimiento en vivo sin implementación comprobable.
- Etiquetar los valores simulados y no incluir secretos, PII ni registros operativos reales.
- Asegurar semántica HTML, accesibilidad de teclado, foco visible, diseño adaptable y rutas locales válidas.
- Preservar el selector bilingüe del sitio público salvo que el requerimiento lo cambie explícitamente.
- Antes de editar, leer el README pertinente. Antes de entregar, revisar diff, referencias locales y sintaxis de scripts afectados; correr pruebas si están configuradas e informar las limitaciones.
- Supervisión humana requerida para decisiones operativas o laborales de impacto; las recomendaciones de IA deben indicar fundamentos y limitaciones.
