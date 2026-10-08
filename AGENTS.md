# Acuerdo de trabajo para agentes

Todo agente de programación que trabaje en este repositorio debe seguir este proceso de entrega. No debe pasar directamente de una solicitud a escribir código ni del código al commit.

## Antes de modificar archivos

1. Lee este archivo, los dos documentos de [`memory-bank/`](./memory-bank/README.md), los README pertinentes de la raíz y de las carpetas, y los archivos directamente relacionados con la tarea.
2. Comprueba `git status`, la rama actual y los cambios existentes. Conserva el trabajo del usuario: no reviertas, sobrescribas, prepares ni confirmes cambios ajenos a la tarea.
3. Expón el objetivo, las restricciones, las áreas afectadas y las verificaciones de aceptación. Si falta una decisión necesaria para evitar una implementación insegura o materialmente incorrecta, haz una pregunta breve; si no, aplica el alcance razonable más pequeño.
4. Para tareas de varios pasos, prepara un plan breve. Respeta los límites del repositorio definidos en `memory-bank/contexto-tecnico.md` y la regla aplicable de `.agents/rules/`.

## Durante la implementación

5. Mantén los cambios acotados, mantenibles y documentados. No afirmes que existen integraciones, datos actualizados, autenticación o capacidades de IA que el código no implemente. Identifica los datos de ejemplo y las funciones simuladas.
6. Protege los secretos y los datos personales. Considera falibles los resultados de IA y conserva la revisión humana en decisiones operativas o laborales de impacto.
7. Añade o actualiza pruebas y verificaciones cuando cambie el comportamiento; sigue las convenciones existentes y evita dependencias nuevas si no son necesarias.

## Antes de entregar o confirmar cambios

8. Revisa el diff completo (`git diff --check` y `git diff`), comprueba que no incluya cambios ajenos del usuario y ejecuta las pruebas, compilación, análisis estático o lint pertinentes. Si alguna verificación no puede ejecutarse, explica por qué; no indiques que pasó.
9. Confirma que la documentación y los criterios de aceptación coinciden con la implementación. Resume los archivos y el comportamiento modificados, las verificaciones y sus resultados, las limitaciones y el trabajo pendiente.
10. No crees commits, subas ramas ni abras PR salvo que el usuario lo solicite explícitamente y la configuración del repositorio lo permita. Nunca prepares cambios ajenos. Si solicitan un commit, prepara solo las rutas de esta tarea e informa del commit resultante.

## Criterio de finalización

Una tarea está terminada solo cuando sus criterios de aceptación se han verificado, se ejecutaron las comprobaciones pertinentes y se comunicaron las limitaciones restantes. Si hay un bloqueo, informa cuál es y cuál es el siguiente paso mínimo.
