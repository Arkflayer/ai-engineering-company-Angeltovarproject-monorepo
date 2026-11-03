# Panel interno de TrackFlow

Punto de entrada del espacio de trabajo interno de TrackFlow Tech y de los equipos de operaciones. La interfaz es un prototipo estático y adaptable: los datos operativos de inicio son ilustrativos; el módulo de análisis de incidencias se conecta a la API autenticada que se configura por separado.

## Apertura local

Desde la raíz del repositorio, inicia el servidor estático existente:

```sh
npm run dev
```

Después, abre `http://localhost:3000/uis/backoffice/`. El panel interno solo utiliza recursos locales HTML, CSS y JavaScript, y no requiere compilación.

## Prototipo actual

- `index.html` es la página de inicio e incluye una barra lateral, encabezado, tarjetas de resumen operativo y una tabla de envíos recientes de demostración.
- `styles.css` contiene los estilos y el diseño adaptable exclusivos del panel interno.
- Los valores operativos de ejemplo son datos de demostración. El resumen de inicio no tiene conexión con una fuente de seguimiento de envíos en directo.

## Próximos pasos

Conectar las interfaces de programación de solo lectura aprobadas para inventario y envíos a través de `services/`, una vez definidos los contratos y controles de acceso. No incluyas información sensible de clientes o conductores en datos estáticos de la interfaz y conserva la supervisión humana para cualquier recomendación de alto impacto.

## Análisis de incidencias

La página `incidents.html` permite iniciar sesión con una cuenta de la API, seleccionar o arrastrar un CSV de TrackFlow y consultar sus métricas agregadas. Requiere configurar y arrancar el servicio descrito en `services/api/README.md`; por defecto usa `http://localhost:8000`, configurable antes de cargar la página mediante `window.TRACKFLOW_API_URL`. El token Bearer se conserva únicamente en memoria de la página y se envía al analizar y exportar; cerrar sesión lo elimina. El archivo seleccionado se envía al servidor. No se muestran ni exportan filas de origen o correos; la descarga contiene solo métricas agregadas y se guarda como `results.csv`. El servicio guarda el último resultado en memoria por usuario y proceso; úsalo solo en un entorno interno autorizado y protegido.

La captura de la interfaz con el análisis del fixture de 100 filas se incluye en [`docs/evidence/interfaz-incidencias-100-filas.png`](../../docs/evidence/interfaz-incidencias-100-filas.png). La consola del script está en [`docs/evidence/consola-analisis-100-filas.png`](../../docs/evidence/consola-analisis-100-filas.png).
