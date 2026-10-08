---
name: ui-delivery
description: Planificar, implementar y verificar cambios pequeños en las interfaces estáticas de TrackFlow. Usar al modificar páginas, diseños, estilos, interacciones o navegación en uis/website/ o uis/backoffice/.
---

# Skill: entrega de interfaces

Implementa un cambio de interfaz acotado en la aplicación correcta de TrackFlow, preservando accesibilidad, navegación local y afirmaciones veraces sobre el producto.

## Entradas

- Objetivo específico de la interfaz y criterios de aceptación. Solicita aclaraciones si no están claros los usuarios o el comportamiento esperado.
- Aplicación objetivo: `uis/website/` (pública) o `uis/backoffice/` (interna).
- Implementación existente y restricciones pertinentes de diseño o contenido.

## Procedimiento

1. Lee `AGENTS.md`, `.agents/rules/interfaces.md`, `memory-bank/README.md`, `memory-bank/contexto-tecnico.md`, `uis/README.md` y el README de la aplicación objetivo, si existe. Antes de editar, inspecciona la página y los recursos o scripts relacionados.
2. Comprueba `git status --short --branch`. No sobrescribas ni prepares cambios existentes del usuario.
3. Define un plan breve y comprobaciones de aceptación concretas. Limita el alcance a la aplicación y funcionalidad solicitadas.
4. Implementa con la tecnología y las convenciones existentes. Mantén separadas la navegación y la estructura pública e interna; usa rutas relativas para los recursos. Asegúrate de que los controles tengan nombres accesibles, los formularios tengan etiquetas, el foco de teclado sea visible y el diseño sea utilizable en pantallas estrechas.
5. Identifica todos los datos de demostración como datos de muestra. No presentes como funcionalidad real el inventario simulado, el seguimiento de paquetes, la autenticación ni las acciones de backend.
6. Comprueba que cada `href`, `src` y acción de formulario local que deba resolverse exista. Ejecuta las comprobaciones de sintaxis disponibles para JavaScript modificado y `git diff --check`. Si hay pruebas o scripts aplicables en el repositorio, ejecútalos y registra el resultado.
7. Revisa el diff completo para detectar archivos no previstos, problemas de accesibilidad, enlaces rotos y afirmaciones no sustentadas sobre el producto. Actualiza la documentación de la aplicación si corresponde.
8. Informa del resumen, las verificaciones realizadas y sus resultados, las limitaciones y las comprobaciones pendientes en navegador. No hagas commit ni abras un PR a menos que el usuario lo solicite expresamente.

## Criterios de aceptación (todos deben cumplirse)

- [ ] Todos los archivos modificados están en la aplicación `uis/` correcta; no se mezclan las áreas públicas e internas.
- [ ] El comportamiento solicitado está implementado y cumple los criterios de aceptación del usuario.
- [ ] Las páginas modificadas tienen un título claro y contenido principal semántico; los controles interactivos se pueden usar con teclado y tienen nombres accesibles; los campos de formulario tienen etiquetas asociadas.
- [ ] Existen todas las hojas de estilo, scripts, imágenes y páginas locales referenciadas, y la navegación apunta a la página prevista dentro de la aplicación.
- [ ] Los valores operativos estáticos o de demostración están identificados visiblemente como datos de muestra; no se afirma que existan integraciones que aún no están implementadas.
- [ ] Pasan las verificaciones aplicables de sintaxis de JavaScript y referencias, y `git diff --check` no encuentra errores de espacios en blanco.
- [ ] El diff final no contiene trabajo previo ajeno, y se informan explícitamente las comprobaciones manuales en navegador que no se hayan realizado.

Si no se puede cumplir algún criterio, no afirmes que la entrega está completa: explica el bloqueo y el siguiente paso.
