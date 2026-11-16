# Sitio web público de TrackFlow

Aplicación pública de TrackFlow construida con **Next.js App Router, React, TypeScript y Tailwind CSS 4**. Contiene la landing de la empresa en `/` y el formulario B2B de demostración en `/application`, con interfaz en español e inglés. Es un proyecto independiente del backoffice privado ubicado en [`../backoffice/`](../backoffice/README.md).

## Ejecución local

Desde la raíz del repositorio:

```sh
npm --prefix uis/website ci
npm --prefix uis/website run dev
```

Abre la URL que muestra Next.js, normalmente <http://localhost:3000>. Ejecuta lint, comprobación de tipos y compilación con:

```sh
npm --prefix uis/website run lint
npm --prefix uis/website run typecheck
npm --prefix uis/website run build
```

El selector de idioma permite elegir español e inglés. Para ejecutar simultáneamente el backoffice, usa otro puerto, por ejemplo `npm --prefix uis/backoffice run dev -- --port 3001`.

## Limitaciones

La landing y el formulario son un prototipo. El formulario valida los datos en el navegador, pero **no envía ni almacena solicitudes**; no introduzcas información personal o confidencial. El sitio no está conectado a sistemas de seguimiento, inventario o clientes. Algunas imágenes del prototipo se cargan desde servicios externos.
