# Reglas para desarrollar interfaces

**Alcance:** `uis/website/**` y `uis/backoffice/**`.

- Antes de editar, lee `uis/README.md` y el README de la aplicación afectada. Mantén el código, los recursos y los diseños del sitio público y del backoffice interno en sus carpetas respectivas.
- Conserva el HTML/CSS/JS sin framework existente y el selector español/inglés del sitio, salvo que la tarea cambie explícitamente la tecnología o el comportamiento. No incorpores un sistema de compilación ni dependencias para una interfaz estática pequeña.
- Usa regiones semánticas, etiquetas correctamente asociadas a los campos, controles operables con teclado, foco visible y diseños adaptables. Los controles que solo muestran un icono deben tener un nombre accesible.
- Mantén las referencias a recursos estáticos relativas al HTML correspondiente. Comprueba que los archivos locales existan y que los enlaces lleven a la página prevista.
- Identifica claramente los valores simulados o de ejemplo; no presentes inventario ni seguimiento de paquetes como información en directo si no hay una integración real. No incluyas secretos de API ni datos personales de clientes en el código del frontend.
- Antes de entregar, revisa el HTML/CSS/JS afectado, ejecuta `git diff --check` y las comprobaciones disponibles de sintaxis y referencias. Documenta las comprobaciones manuales en navegador que no se hayan podido automatizar.
