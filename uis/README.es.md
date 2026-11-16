# Carpeta `uis`

Esta carpeta contiene **todos los proyectos con interfaz de usuario** para el proyecto transversal de AI Engineering de la compañía — por ejemplo: un sitio web público, un frontend de panel de administración, una interfaz de ecommerce, portales para clientes, aplicaciones Streamlit/Gradio u otras herramientas sólo-frontend.

Los proyectos que se almacenan aquí son:

- **[`website`](./website/README.md)** — la presencia web pública de la compañía.
- **[`backoffice`](./backoffice/README.md)** — única aplicación privada Next.js de administración, con operaciones, candidaturas, proveedores e incidencias.

Organiza `uis/` por **distintas áreas de la compañía** — cada subcarpeta agrupa un ámbito diferente (por ejemplo, web pública frente a operaciones internas) e incluye su propia documentación técnica y funcional.

El sitio público Next.js de TrackFlow vive en [`website/`](./website/README.md). Todas las interfaces privadas (operaciones, candidaturas, proveedores e incidencias) comparten [`backoffice/`](./backoffice/README.md); no mantengas una tercera aplicación dentro de `uis/`.

- **Propósito principal**: centralizar en un único lugar todas las aplicaciones frontend que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) las aplicaciones que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlas.

> _These instructions are also available in [English](./README.md)._
