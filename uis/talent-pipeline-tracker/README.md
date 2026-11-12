This is the active frontend and default destination for new UI development: [Next.js](https://nextjs.org) App Router, React, TypeScript and Tailwind CSS. It was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). Use the versions declared in this application's package manifest.

## Getting Started

From the repository root, run the development server:

```bash
npm --prefix uis/talent-pipeline-tracker run dev
```

## Áreas administrativas

Esta aplicación reúne las interfaces internas que antes estaban separadas entre el pipeline y `uis/backoffice/`:

- `/` — pipeline de candidaturas (API configurada de forma independiente).
- `/operations` — resumen operativo con **datos ilustrativos**, no conectado a envíos reales.
- `/suppliers` — directorio autenticado de proveedores mediante la API FastAPI.
- `/incidents` — análisis autenticado de CSV y exportación agregada mediante la API FastAPI.

Los módulos de proveedores e incidencias necesitan una cuenta válida del backend. El token se conserva solo en memoria mientras la página está abierta. La interfaz no se conecta a un sistema de compras, WMS, transportistas ni seguimiento en vivo.

### Variables de entorno

Usa [`.env.example`](./.env.example) como referencia. Para desarrollo local, crea manualmente `.env.local` en esta carpeta (está ignorado por Git) y configura:

```dotenv
NEXT_PUBLIC_TRACKFLOW_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=https://playground.4geeksacademy.com/tracker/api/v1
```

La primera URL sirve a proveedores e incidencias; la segunda conserva la integración actual del pipeline de candidaturas. Si el backend usa otro host, cambia la primera y añade el origen exacto del frontend a `TRACKFLOW_UI_ORIGINS` en `services/api/.env`. No guardes secretos en variables `NEXT_PUBLIC_*`: se exponen al navegador. Consulta [la configuración del backend](../../services/api/README.md#autenticación-y-configuración).
Inside this application folder, use `npm run dev`. The repository root's `npm run dev` serves static files and does not start Next.js. Use the URL printed by Next.js, normally [http://localhost:3000](http://localhost:3000); use another port if that port is occupied.

You can start editing the page by modifying [`src/app/page.tsx`](./src/app/page.tsx). The page auto-updates as you edit the file.

## Development Rules

- Follow [`AGENTS.md`](../../AGENTS.md), the [frontend instructions](../../.github/instructions/frontend.instructions.md), and the local [`AGENTS.md`](./AGENTS.md); preserve the Next.js-generated rules and consult its version-specific documentation before coding.
- Reuse `src/app/`, `src/components/`, `src/services/`, `src/types/` and the `@/*` alias. Use typed React components, not standalone HTML pages or JavaScript scripts.
- Prioritize Tailwind and existing styles. Do not add CSS frameworks, component libraries or other dependencies without explicit approval.
- Keep backend APIs and business logic in [`services/api/`](../../services/api/README.md), using FastAPI and uv. Verify actual integration before describing it as implemented.
- Follow the root dependency policy: existing packages may be synced with `npm ci` only with a compatible lockfile and no version changes; missing or outdated lockfiles require consultation, not a silent `npm install`.

For code changes, run the relevant checks from the repository root:

```sh
npm --prefix uis/talent-pipeline-tracker run lint
npm --prefix uis/talent-pipeline-tracker run build
```

Report failed or blocked checks without installing new packages automatically.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
