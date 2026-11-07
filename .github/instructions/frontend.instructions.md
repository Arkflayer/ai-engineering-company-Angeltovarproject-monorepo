---
description: "Usar al desarrollar pantallas, componentes, estilos, rutas o llamadas API del frontend Next.js, React, TypeScript y Tailwind de talent-pipeline-tracker."
applyTo: "uis/talent-pipeline-tracker/**"
---

# Frontend Next.js

- Sigue `AGENTS.md` raiz, especialmente la politica de aprobacion de dependencias, y `uis/talent-pipeline-tracker/AGENTS.md`. Antes de escribir codigo Next.js consulta la guia pertinente de su version en `node_modules/next/dist/docs/`; si no esta disponible, informa del limite sin instalar paquetes automaticamente.
- Usa las versiones declaradas por la aplicacion y npm como gestor existente. No cambies framework, gestor ni estructura para una tarea pequena.
- Implementa rutas en `src/app/` con App Router y componentes React en TypeScript (`.tsx`). Reutiliza `src/components/`, `src/types/` y el alias `@/*`. No crees entradas HTML ni scripts JS independientes para nuevas pantallas.
- Tailwind CSS es la primera opcion para estilos. Reutiliza las utilidades y estilos existentes; usa CSS global solo cuando haya una necesidad concreta no resuelta. No incorpores otro framework CSS o biblioteca de componentes sin aprobacion.
- Prefiere Server Components para componentes nuevos sin interaccion; usa `use client` solo donde sean necesarios estado, eventos o APIs del navegador. No conviertas componentes existentes en bloque ni anadas abstracciones o memoizacion sin necesidad.
- Reutiliza `src/services/` para comunicacion con FastAPI y respeta los contratos existentes. Conserva la logica de negocio y las API en `services/api/`; no las dupliques en route handlers o server actions de Next.js.
- Incluye estados de carga, vacio y error, semantica HTML, nombres accesibles, foco visible y diseno adaptable. Identifica datos de muestra; no afirmes que hay autenticacion, persistencia o integraciones sin comprobarlas. Nunca expongas secretos del backend al navegador.
- Solo trabaja en `uis/website/` o `uis/backoffice/` si la solicitud los identifica expresamente; sus reglas de HTML/CSS/JS no se aplican a esta aplicacion.

## Comandos Desde La Raiz

```sh
npm --prefix uis/talent-pipeline-tracker run dev
npm --prefix uis/talent-pipeline-tracker run lint
npm --prefix uis/talent-pipeline-tracker run build
```

El comando `npm run dev` de la raiz sirve archivos estaticos, no Next.js. Para cambios de codigo ejecuta las comprobaciones pertinentes de lint y build; informa de fallos o requisitos no verificables sin instalar paquetes nuevos. Comprueba el diff antes de entregar.