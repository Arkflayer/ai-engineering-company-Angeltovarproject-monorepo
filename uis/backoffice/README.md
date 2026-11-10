# Panel interno de TrackFlow

Aplicación Next.js 16 con App Router para el espacio interno de operaciones de TrackFlow Tech. Incluye un dashboard ilustrativo, un directorio de proveedores conectado a la API autenticada y un analizador de incidencias CSV.

## Ejecución local

Requiere Node.js 20.9 o superior.

```sh
cd uis/backoffice
npm ci
npm run dev
```

Abre `http://localhost:3000`. Las rutas principales son `/`, `/suppliers` y `/incidents`. El backoffice se inicia dentro de su carpeta; `npm run dev` desde la raíz sirve el sitio estático y no esta aplicación.

La API debe estar configurada y ejecutándose según [`services/api/README.md`](../../services/api/README.md), normalmente en `http://localhost:8000`. Si usa otro host, define `NEXT_PUBLIC_TRACKFLOW_API_URL` en el entorno del frontend antes de arrancarlo. La API debe permitir el origen del frontend en `TRACKFLOW_UI_ORIGINS`.

## Directorio de proveedores

La ruta `/suppliers` requiere una cuenta válida de la API. Tras iniciar sesión, descarga el listado una vez y filtra por país y categoría en el cliente, sin recargar la página ni volver a consultar el servidor. Permite registrar proveedores, actualizar tarifas o estado y consultar el historial de cambios. El token Bearer solo se conserva en memoria mientras la página está abierta. Los proveedores son datos de demostración en TinyDB; no existe integración con compras o ERP.

## Análisis de incidencias

La ruta `/incidents` permite iniciar sesión, seleccionar o arrastrar un CSV UTF-8 de hasta 25 MiB, analizarlo y descargar solo métricas agregadas. El archivo permanece en el navegador hasta pulsar «Analizar archivo»; entonces se envía a la API autenticada. El botón requiere sesión y un archivo CSV válido. Los correos y filas de origen no se muestran ni se exportan. Los resultados se guardan en memoria por usuario y proceso en la API y se pierden al reiniciarla. Usa solo datos y entornos autorizados.

## Dashboard

La ruta `/` contiene métricas y envíos ficticios para demostración. No representa inventario ni seguimiento en vivo.
