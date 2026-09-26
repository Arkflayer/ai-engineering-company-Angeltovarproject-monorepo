# CONTEXT — TrackFlow · Hito 3: Talent Pipeline Tracker

> **Ruta en el repositorio:** `03-talent-pipeline-tracker/CONTEXT-trackflow.md`

---

El departamento de **People & Talent** de tu empresa está en medio de una campaña de selección activa. La posición abierta ha recibido más de 100 candidaturas en menos de dos semanas y el equipo está desbordado: llevan el seguimiento de los candidatos en una hoja de cálculo compartida, escriben las notas de las entrevistas en documentos separados y actualizan los estados manualmente por hilos de correo. El proceso se está desmoronando.

El equipo de Tecnología ya ha construido y expuesto una **API REST** para gestionar el pipeline de candidaturas. Tu trabajo es construir el **frontend** que el equipo de People empezará a usar el lunes. El sistema debe permitir ver todas las candidaturas de un vistazo, filtrarlas por estado y por etapa, y acceder al detalle de cada una sin perder el contexto del listado.

---

## Tu empresa

Eres parte del equipo **TrackFlow Tech**, la unidad tecnológica interna de TrackFlow, una empresa de logística de última milla y gestión de almacenes con operaciones en Los Ángeles y Zaragoza. El equipo está en plena transformación digital y cada herramienta que construyes tiene impacto directo en las operaciones del día siguiente.

---

## El encargo

Ana Whitfield, Head of Warehouse Operations, ha enviado el siguiente correo con copia a Andrés Kim, CTO:

> **Para:** Andrés Kim (CTO) **CC:** Equipo TrackFlow Tech **Asunto:** URGENTE — Herramienta de gestión de candidaturas — necesaria ya
> 
> Andrés,
> 
> Te escribo con copia al equipo porque esto no puede esperar más. Estamos gestionando el proceso de selección del **Asistente de Dirección** para la sede de Zaragoza en una hoja de Excel que ya nadie controla. Tenemos más de cien candidaturas, tres personas tocando el archivo y esta mañana hemos descubierto que alguien sobreescribió las notas de dos entrevistas de la semana pasada.
> 
> Javier me confirmó ayer que el backend está listo. Necesito que alguien del equipo monte el frontend esta semana. El proceso de selección no se puede parar.
> 
#### Lo que la herramienta debe hacer

- Mostrar todas las candidaturas en un listado — nombre, puesto, estado actual y etapa actual de un vistazo.
- Permitir filtrar por estado y por etapa, y buscar por nombre o email sin recargar la página.
- Abrir la vista de detalle de un candidato y, desde ahí, cambiar su estado o etapa con una sola interacción.
- Añadir notas internas a una candidatura y eliminarlas cuando ya no sean relevantes.
- Registrar nuevas candidaturas directamente desde la interfaz y editar los datos de una cuando haya que corregir algo.
> Gracias, Ana

---

## Contexto del proceso de selección

| Campo | Valor |
|-------|-------|
| Puesto | Asistente de Dirección |
| Empresa | TrackFlow |
| Ubicación | Sede Zaragoza |
| Perfil buscado | Experiencia en asistencia ejecutiva, gestión de agenda y viajes, inglés profesional, manejo de herramientas ofimáticas |

---

## API y datos

La API ya está lista y está documentada en [https://playground.4geeks.com/tracker/api/v1/docs](https://playground.4geeks.com/tracker/api/v1/docs). Todas las peticiones deben gestionarse de forma asíncrona — la interfaz debe comunicar los estados de carga y manejar los errores con claridad. El equipo no puede permitirse una herramienta que falle en silencio o que deje al usuario sin saber qué está pasando.

Esta es una herramienta interna real que va a usar gente real desde el primer día. Constrúyela como tal.

Los campos, valores y estructura son los definidos en la especificación técnica del backend. No es necesario adaptarlos.

### Valores de `status`

| Valor API | Etiqueta en la UI |
|-----------|-------------------|
| `received` | Recibida |
| `in_progress` | En proceso |
| `selected` | Seleccionada |
| `discarded` | Descartada |

### Valores de `stage`

| Valor API | Etiqueta en la UI |
|-----------|-------------------|
| `pending` | Pendiente de revisión |
| `review` | En revisión |
| `personal_interview` | Entrevista personal |
| `technical_interview` | Entrevista técnica |
| `offer_presented` | Oferta presentada |

> Los valores crudos de la API (`in_progress`, `personal_interview`, etc.) no deben aparecer nunca en la interfaz. Usa siempre las etiquetas de esta tabla.

---

## Cómo iniciar el proyecto

Este hito forma parte del monorepo del curso. No necesitas clonar ningún repositorio nuevo — el tuyo ya existe.

1. Abre el monorepo en el que has trabajado durante el curso en **GitHub Codespaces** o clónalo localmente si prefieres trabajar en tu máquina.
2. Navega a la carpeta `/uis` y crea el directorio de este hito:

```
/uis/talent-pipeline-tracker/
```

3. Inicializa un proyecto Next.js con TypeScript dentro de esa carpeta:

```
cd uis/talent-pipeline-tracker
npx create-next-app@latest . --typescript --app --tailwind --eslint
```

4. Crea un archivo `.env.local` en la raíz de tu app con la URL base de la API:

```
NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1
```

5. Instala las dependencias:

```
npm install
```

6. Arranca el servidor de desarrollo:

```
npm run dev
```

---

## Criterios de aceptación específicos

- Los estados y etapas muestran etiquetas legibles, nunca valores de API.
- Las notas internas son visibles únicamente en el detalle del candidato.
- El formulario de registro incluye todos los campos requeridos por la API.

---

*Documento interno — 4Geeks Academy · AI Engineering Track* *Contexto de uso exclusivo en la generación de proyectos del programa*
