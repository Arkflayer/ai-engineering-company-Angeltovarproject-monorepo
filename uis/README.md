# `uis` folder

This folder contains **all projects with a user interface** for the cross-functional AI Engineering company project — for example: a public website, admin dashboard frontend, ecommerce UI, customer portals, Streamlit/Gradio app or other frontend-only tools.

The applications stored here are:

- **[`website`](./website/README.md)** — the company's public-facing web presence.
- **[`backoffice`](./backoffice/README.md)** — the single private Next.js admin app, with operations, candidates, suppliers and incidents.

For internal UI work, reuse `backoffice`; do not create a second admin project under `uis/`. Keep the public `website` separate. Follow [`AGENTS.md`](../AGENTS.md) for dependency approval and the [frontend instructions](../.github/instructions/frontend.instructions.md) for application conventions. Backend APIs and business logic belong in [`services/api/`](../services/api/README.md), using FastAPI and uv.

From the repository root, start the backoffice with:

```sh
npm --prefix uis/backoffice run dev
```

The root `npm run dev` starts a static file server, not this application. See the backoffice README for lint and build commands.

Organize `uis/` by **different concerns** — each subfolder covers a distinct area of the company (for example, public web vs internal operations) and includes its own technical and functional documentation.

- **Main purpose**: to centralize in a single place all frontend applications that support the company's use cases.
- **Recommendation**: document in this file (or in sub-READMEs) the applications you add, their objective, the technology used, and how to run them.

> _Estas instrucciones también están disponibles en [español](./README.es.md)._
