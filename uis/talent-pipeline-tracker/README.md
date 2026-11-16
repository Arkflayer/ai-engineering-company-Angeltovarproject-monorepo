This is the active frontend and default destination for new UI development: [Next.js](https://nextjs.org) App Router, React, TypeScript and Tailwind CSS. It was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). Use the versions declared in this application's package manifest.

## Getting Started

From the repository root, run the development server:

```bash
npm --prefix uis/talent-pipeline-tracker run dev
```

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

## Autenticación del Tracker

El login del Tracker usa la API de identidad de TrackFlow (`NEXT_PUBLIC_TRACKFLOW_API_URL`, por defecto `http://localhost:8000`). Las llamadas de candidaturas pasan por el proxy del servidor Next.js en `/api/tracker/*`: este valida el JWT con `GET /auth/me` antes de contactar la API externa. El token de TrackFlow nunca se reenvía al servicio externo.

En despliegues, configura `TRACKFLOW_API_URL` como URL interna/de servidor para la API de identidad y `TRACKER_API_URL` como URL de servidor para la API de candidaturas (por defecto, `https://playground.4geeks.com/tracker/api/v1`). `NEXT_PUBLIC_TRACKFLOW_API_URL` solo se usa en el navegador para login, registro y validación inicial del guard.

El proxy verifica identidad, pero la API externa no ofrece autorización por usuario en este contrato: si el endpoint externo es público, el proxy no convierte sus datos en privados por usuario y no debe presentarse como aislamiento de datos ni protección contra abuso del endpoint externo. Para una autorización real por propietario, el backend de candidaturas debe validar y aplicar el usuario del token.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
