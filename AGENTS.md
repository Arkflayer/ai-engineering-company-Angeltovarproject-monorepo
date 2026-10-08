# Acuerdo de trabajo para agentes

Todo agente de programación que trabaje en este repositorio debe seguir este proceso de entrega. No debe pasar directamente de una solicitud a escribir código ni del código al commit.

## Antes de modificar archivos

1. Al inicio de cada sesión, lee `memory-bank/projectbrief.md`, `memory-bank/techContext.md` y `memory-bank/progress.md`. Después lee este archivo, el `README.md` raíz y los README de cada carpeta afectada, además de los archivos directamente relacionados con la tarea.
2. Comprueba `git status`, la rama actual y los cambios existentes. Conserva el trabajo del usuario: no reviertas, sobrescribas, prepares ni confirmes cambios ajenos a la tarea.
3. Expón el objetivo, las restricciones, las áreas afectadas y las verificaciones de aceptación. Si falta una decisión necesaria para evitar una implementación insegura o materialmente incorrecta, haz una pregunta breve; si no, aplica el alcance razonable más pequeño.
4. Para tareas de varios pasos, prepara un plan breve. Respeta los límites del repositorio definidos en `memory-bank/techContext.md` y la regla aplicable de `.agents/rules/`.

## Durante la implementación

5. Mantén los cambios acotados, mantenibles y documentados. No afirmes que existen integraciones, datos actualizados, autenticación o capacidades de IA que el código no implemente. Identifica los datos de ejemplo y las funciones simuladas.
6. Protege los secretos y los datos personales. Considera falibles los resultados de IA y conserva la revisión humana en decisiones operativas o laborales de impacto.
7. Añade o actualiza pruebas y verificaciones cuando cambie el comportamiento; sigue las convenciones existentes y evita dependencias nuevas si no son necesarias.

## Flujo obligatorio antes de cada commit

Antes de crear o modificar cualquier commit, sigue estos pasos en orden:

1. **Verificar rama y estado:** confirma que estás en la rama de trabajo solicitada y examina `git status`; nunca cambies ni confirmes trabajo en `main` sin autorización explícita.
2. **Revisar el contenido preparado:** inspecciona el diff completo (`git diff --cached` y, cuando corresponda, `git diff`) y la lista de rutas. Retira del staging todo cambio ajeno o no solicitado; no sobrescribas ni prepares cambios preexistentes del usuario.
3. **Ejecutar verificaciones:** ejecuta `git diff --cached --check` y las pruebas, compilación, análisis estático o lint pertinentes. Si una comprobación no puede ejecutarse, regístralo con claridad y no afirmes que pasó.
4. **Comprobar documentación y aceptación:** confirma que README, memoria y criterios de aceptación coinciden con la implementación y que no se presentan como reales integraciones o datos simulados.
5. **Confirmar autorización y reportar:** crea o modifica el commit solo si el desarrollador lo solicitó expresamente; informa del hash, resumen y verificaciones. Abre o actualiza una pull request solo si el desarrollador lo solicita expresamente.

## Archivos y datos protegidos

No modifiques sin confirmación explícita del desarrollador:

- `CONTEXT.md`, `CONTEXT.es.md` y `company-choice.md`, que son briefings/fuentes de decisión empresarial.
- Archivos de secretos o configuración local (`.env*`, credenciales, tokens, llaves privadas) y datos reales o personales dentro de `data/raw/`.
- Datos reales de clientes, destinatarios, conductores o empleados, en cualquier ubicación.

No edites manualmente el contenido interno de `.git/`. Nunca trabajes en `main` si la tarea requiere una rama de feature; si no puedes verificar la rama correcta, detente y consulta al desarrollador.

## Antes de entregar

Revisa el diff final, confirma que la documentación y los criterios de aceptación coinciden con la implementación, y resume archivos/comportamiento modificados, verificaciones y resultados, limitaciones y trabajo pendiente. Si alguna verificación falla, no indiques que la tarea está completa.

## Criterio de finalización

Una tarea está terminada solo cuando sus criterios de aceptación se han verificado, se ejecutaron las comprobaciones pertinentes y se comunicaron las limitaciones restantes. Si hay un bloqueo, informa cuál es y cuál es el siguiente paso mínimo.
