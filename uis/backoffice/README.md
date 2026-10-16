# Panel interno de TrackFlow

Punto de entrada del espacio de trabajo interno de TrackFlow Tech y de los equipos de operaciones. La interfaz es un prototipo estático y adaptable: los datos que muestra son ilustrativos; no autentica usuarios ni se conecta a sistemas de producción.

## Apertura local

Desde la raíz del repositorio, inicia el servidor estático existente:

```sh
npm run dev
```

Después, abre `http://localhost:3000/uis/backoffice/`. El panel interno solo utiliza recursos locales HTML, CSS y JavaScript, y no requiere compilación.

## Prototipo actual

- `index.html` es la página de inicio e incluye una barra lateral, encabezado, tarjetas de resumen operativo y una tabla de envíos recientes.
- `styles.css` contiene los estilos y el diseño adaptable exclusivos del panel interno.
- Los valores operativos de ejemplo están identificados explícitamente como datos de demostración. No hay conexión con API, seguimiento de envíos en directo, autenticación ni persistencia.

## Próximos pasos

Conectar las interfaces de programación de solo lectura aprobadas para inventario y envíos a través de `services/`, una vez definidos los contratos y controles de acceso. No incluyas información sensible de clientes o conductores en datos estáticos de la interfaz y conserva la supervisión humana para cualquier recomendación de alto impacto.

## Análisis de incidencias

La página `incidents.html` permite seleccionar o arrastrar un CSV de TrackFlow y consultar sus métricas agregadas. Requiere iniciar el servicio descrito en `services/api/README.md`; por defecto usa `http://localhost:8000`, configurable antes de cargar la página mediante `window.TRACKFLOW_API_URL`. El archivo seleccionado se envía al servidor. No se muestran ni exportan filas de origen o correos; la descarga contiene solo métricas agregadas. El servicio guarda el último resultado en la memoria del proceso y no tiene autenticación, por lo que debe usarse únicamente en un entorno interno autorizado.
