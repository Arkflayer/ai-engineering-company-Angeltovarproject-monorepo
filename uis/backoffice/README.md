# TrackFlow Backoffice

La aplicación privada única de TrackFlow para operaciones, candidaturas, proveedores e incidencias. Usa Next.js App Router, React, TypeScript y Tailwind CSS; mantén la web pública separada en `uis/website/`. Usa las versiones declaradas en el manifiesto.

## Getting Started

From the repository root, run the development server:

```bash
npm --prefix uis/backoffice run dev
```

## Áreas administrativas

Esta aplicación reúne todas las interfaces administrativas privadas del proyecto:

- `/` — Operaciones (datos ilustrativos).
- `/candidates` y `/candidates/[id]` — lista y detalle del pipeline de candidaturas (API configurada de forma independiente).
- `/suppliers` — directorio autenticado de proveedores mediante la API FastAPI.
- `/incidents` — análisis autenticado de CSV y exportación agregada mediante la API FastAPI.

Los módulos de proveedores e incidencias necesitan una cuenta válida del backend. El token se conserva solo en memoria mientras la página está abierta. La interfaz no se conecta a un sistema de compras, WMS, transportistas ni seguimiento en vivo.

### Variables de entorno

Usa [`.env.example`](./.env.example) como referencia. En Codespaces/local el frontend llama al backend a través de un proxy same-origin de Next.js; por defecto ese proxy conecta a `127.0.0.1:8000` dentro del contenedor. Si la API está en otro host, configura en `uis/backoffice/.env.local` la variable de servidor:

```dotenv
TRACKFLOW_API_URL=https://<backend-origin>
NEXT_PUBLIC_API_URL=<candidate-api-base-url>
```

Registro, inicio de sesión, proveedores e incidencias usan `/api/trackflow/*`; el navegador no contacta directamente el puerto reenviado de Codespaces, evitando sus redirecciones de autenticación y restricciones CORS. `TRACKFLOW_API_URL` solo se necesita si FastAPI no está en `127.0.0.1:8000` dentro del contenedor. Next.js carga las variables al arrancar, así que reinicia el servidor tras cambiar `.env.local`.
`NEXT_PUBLIC_API_URL` configura por separado la integración del pipeline de candidaturas. No guardes secretos en variables `NEXT_PUBLIC_*`: se exponen al navegador. Como el proxy es same-origin, no es necesario añadir la URL del frontend a `TRACKFLOW_UI_ORIGINS` para las llamadas del backoffice; consulta [la configuración del backend](../../services/api/README.md#autenticación-y-configuración) para otros clientes.
`npm run dev` desde esta carpeta inicia Next.js. Desde la raíz del repositorio usa `npm --prefix uis/backoffice run dev`; el `npm run dev` raíz solo sirve archivos estáticos. Abre la URL que muestra Next.js, normalmente [http://localhost:3000](http://localhost:3000).

## Desarrollo

- Sigue [`AGENTS.md`](../../AGENTS.md), las [instrucciones de frontend](../../.github/instructions/frontend.instructions.md) y el [`AGENTS.md` local](./AGENTS.md). Antes de modificar código, consulta la documentación de la versión instalada de Next.js en `node_modules/next/dist/docs/`.
- Reutiliza `src/app/`, `src/components/`, `src/services/`, `src/types/` y el alias `@/*`. Prioriza Tailwind y los estilos existentes; no añadas frameworks, bibliotecas o dependencias sin aprobación explícita.
- Las API y la lógica de negocio pertenecen a FastAPI en [`services/api/`](../../services/api/README.md). Comprueba cada integración antes de describirla como funcional.
- Respeta la política de dependencias raíz; no ejecutes `npm install` para resolver lockfiles sin consultar.

Ejecuta las comprobaciones desde la raíz del repositorio:

```sh
npm --prefix uis/backoffice run lint
npm --prefix uis/backoffice run typecheck
npm --prefix uis/backoffice run build
```

Para guías del App Router y despliegue, consulta la [documentación de Next.js](https://nextjs.org/docs).