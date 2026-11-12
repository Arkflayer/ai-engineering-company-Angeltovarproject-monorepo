# Carpeta `uis`

Esta carpeta contiene **todos los proyectos con interfaz de usuario** para el proyecto transversal de AI Engineering de la compañía — por ejemplo: un sitio web público, un frontend de panel de administración, una interfaz de ecommerce, portales para clientes, aplicaciones Streamlit/Gradio u otras herramientas sólo-frontend.

Los proyectos que se almacenan aquí son:

- **[`talent-pipeline-tracker`](./talent-pipeline-tracker/README.md)** — aplicación Next.js interna unificada para el pipeline de candidaturas, operaciones, proveedores e incidencias; destino predeterminado para nuevo desarrollo de interfaz.
- **`website`** — la presencia web pública de la compañía.
- **`backoffice`** — prototipo administrativo independiente anterior, conservado como referencia. El nuevo desarrollo interno debe hacerse en `talent-pipeline-tracker`.

Organiza `uis/` por **distintas áreas de la compañía** — cada subcarpeta agrupa un ámbito diferente (por ejemplo, web pública frente a operaciones internas) e incluye su propia documentación técnica y funcional.

El sitio público estático de TrackFlow vive en `website/`. Las interfaces administrativas internas se consolidaron en [`talent-pipeline-tracker/`](./talent-pipeline-tracker/README.md); [`backoffice/`](./backoffice/README.md) se conserva como referencia histórica.

- **Propósito principal**: centralizar en un único lugar todas las aplicaciones frontend que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) las aplicaciones que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlas.

> _These instructions are also available in [English](./README.md)._
