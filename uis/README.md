# `uis` folder

This folder contains **all projects with a user interface** for the cross-functional AI Engineering company project — for example: a public website, admin dashboard frontend, ecommerce UI, customer portals, Streamlit/Gradio app or other frontend-only tools.

The applications stored here are:

- **[`talent-pipeline-tracker`](./talent-pipeline-tracker/README.md)** — the unified internal admin frontend and default destination for new UI development, using Next.js App Router, React, TypeScript and Tailwind CSS first. Includes candidate pipeline, operations overview, suppliers and incident analysis routes.
- **`website`** — the company's public-facing web presence.
- **`backoffice`** — the previous standalone admin prototype retained in the repository for reference; new internal UI work belongs in `talent-pipeline-tracker`.

La aplicación administrativa consolidada está en [`talent-pipeline-tracker/`](./talent-pipeline-tracker/README.md). El antiguo [`backoffice/`](./backoffice/README.md) se conserva como referencia histórica; sus flujos se han incorporado a la app unificada.

For new internal frontend work, reuse `talent-pipeline-tracker`; do not create standalone HTML pages or JavaScript scripts. Change the public `website` only when explicitly requested. Follow [`AGENTS.md`](../AGENTS.md) for dependency approval and the [frontend instructions](../.github/instructions/frontend.instructions.md) for application conventions. Backend APIs and business logic belong in [`services/api/`](../services/api/README.md), using FastAPI and uv.

From the repository root, start Next.js with:

```sh
npm --prefix uis/talent-pipeline-tracker run dev
```

The root `npm run dev` starts a static file server, not this application. See the application's README for lint and build commands.

Organize `uis/` by **different concerns** — each subfolder covers a distinct area of the company (for example, public web vs internal operations) and includes its own technical and functional documentation.

- **Main purpose**: to centralize in a single place all frontend applications that support the company's use cases.
- **Recommendation**: document in this file (or in sub-READMEs) the applications you add, their objective, the technology used, and how to run them.

> _Estas instrucciones también están disponibles en [español](./README.es.md)._
