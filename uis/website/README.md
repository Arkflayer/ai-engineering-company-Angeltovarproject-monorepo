# Sitio web público de TrackFlow

Sitio público estático de TrackFlow, construido con HTML, CSS y JavaScript en el navegador. Las páginas son `index.html` (página principal de la empresa y sus servicios) y `application.html` (formulario de consulta para posibles clientes). `lang.js`, `styles.css` y `validation.js` son recursos locales compartidos.

## Ejecución local

From the repository root:

```sh
npm run dev
```

Abre `http://localhost:3000/uis/website/`. El selector de idioma permite elegir español e inglés. Tailwind y Google Fonts se cargan desde CDN externos; los archivos CSS y JavaScript locales permanecen en este directorio.

## Limitaciones

El sitio público es un prototipo estático. La validación del formulario se ejecuta en el navegador; el formulario no envía datos a un backend ni guarda consultas. No hay conexión con sistemas de seguimiento, inventario o clientes.
