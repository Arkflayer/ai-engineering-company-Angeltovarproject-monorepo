# Propuesta de arquitectura del backend de TrackFlow

**Estado:** borrador para revisión del equipo

**Alcance:** propuesta de organización y decisiones iniciales. No describe una API implementada ni integraciones existentes.

## 1. Contexto y objetivos

TrackFlow presta servicios de almacenamiento, preparación de pedidos, transporte, seguimiento y devoluciones a marcas de comercio electrónico en Estados Unidos y España. Sus operaciones dependen de dos almacenes, Los Ángeles y Zaragoza, que usan sistemas distintos; además, la consulta y asignación de transportistas se hace en gran medida de forma manual y hay integraciones heredadas cuya documentación es incompleta.

El backend debe ofrecer una manera coherente de acceder a las capacidades de negocio y permitir integrar esos sistemas gradualmente. La arquitectura debe reflejar los dominios de TrackFlow, pero no asumir que los datos ya están unificados, que las fuentes están disponibles en tiempo real o que todas las integraciones tienen contratos conocidos.

## 2. Patrón arquitectónico propuesto

Propongo comenzar con una **API centralizada, organizada como monolito modular por dominios y con separación en capas**. Las capas describen responsabilidades técnicas; los dominios agrupan las capacidades del negocio. No son enfoques excluyentes.

Las capas principales serían:

1. **API/presentación:** routers FastAPI, validación de solicitudes y respuestas HTTP.
2. **Aplicación:** casos de uso que coordinan tareas como consultar inventario o registrar una devolución.
3. **Dominio:** reglas de negocio, por ejemplo los estados permitidos de un envío o las condiciones que deben revisarse para una devolución.
4. **Infraestructura:** persistencia y adaptadores para WMS, ERP y APIs de transportistas.

### Por qué encaja con TrackFlow

- El equipo tecnológico descrito tiene siete personas. Un servicio desplegable reduce la carga operativa frente a mantener desde el principio varios servicios, contratos de red y despliegues independientes.
- Inventario, pedidos, envíos y devoluciones forman parte de flujos conectados. Mantenerlos en una aplicación con límites modulares facilita coordinarlos mientras se aclaran los contratos y dependencias reales.
- Los sistemas existentes son heterogéneos: dos WMS, un ERP heredado y ocho transportistas. Los adaptadores de infraestructura permiten contener sus formatos y particularidades sin mezclarlos con las reglas internas del negocio.
- La separación por dominios conserva una ruta de evolución: si un módulo requiere más adelante escalado, disponibilidad o despliegue independiente, el equipo podrá evaluar extraerlo con base en evidencia.

No propongo comenzar con microservicios: el contexto no demuestra todavía una necesidad de escalar o desplegar cada dominio por separado, y esa decisión añadiría complejidad operativa y de integración. Tampoco se propone serverless porque no hay requisitos identificados que justifiquen ese modelo de ejecución. La arquitectura podrá revisarse cuando se conozcan mejor el volumen, la disponibilidad requerida y las capacidades de los sistemas heredados.

## 3. Estructura de carpetas y criterio de separación

El backend pertenecería a `services/`, mientras que las interfaces permanecen en `uis/`. Un árbol inicial podría ser:

```text
services/
└── api/
    ├── README.md
    ├── app/
    │   ├── main.py                 # crea la aplicación y conecta los routers
    │   ├── dependencies.py         # dependencias compartidas de FastAPI
    │   ├── api/
    │   │   └── v1/
    │   │       ├── router.py      # agrega los routers de la versión
    │   │       └── health.py
    │   ├── core/
    │   │   ├── config.py           # configuración por entorno
    │   │   └── security.py         # políticas y utilidades transversales
    │   ├── domains/
    │   │   ├── inventory/
    │   │   │   ├── router.py
    │   │   │   ├── schemas.py
    │   │   │   ├── application/
    │   │   │   │   └── service.py
    │   │   │   ├── domain/
    │   │   │   │   └── models.py
    │   │   │   └── infrastructure/
    │   │   │       ├── repository.py
    │   │   │       └── integrations/
    │   │   ├── orders/
    │   │   ├── shipments/
    │   │   ├── carriers/
    │   │   ├── returns/
    │   │   └── clients/
    │   └── db/
    │       └── session.py
    └── tests/
        ├── unit/
        └── integration/
```

Este árbol es una propuesta gradual: solo se crearían los módulos y archivos que tengan alcance en cada entrega.

- **`api/v1/`** organiza la versión de la API y reúne routers de dominio.
- **`domains/`** separa módulos por capacidad de negocio: inventario, pedidos, envíos, transportistas, devoluciones y clientes.
- **`router.py`** define las operaciones HTTP del módulo con `APIRouter`, pero no debe contener todas sus reglas de negocio. La aplicación principal registra estos routers.
- **`schemas.py`** define las estructuras de datos que entran y salen de la API.
- **`application/service.py`** coordina los casos de uso y las operaciones del dominio.
- **`domain/`** agrupa reglas y conceptos propios del negocio, sin depender de los detalles HTTP o de un sistema externo.
- **`infrastructure/repository.py`** concentra el acceso concreto a datos del módulo; **`infrastructure/integrations/`** contiene adaptadores que traducen contratos externos (por ejemplo, un WMS o transportista) a conceptos internos.
- La misma separación se aplicaría a los demás dominios cuando su complejidad lo justifique; no es necesario crear todas las carpetas anticipadamente.
- **`core/` y `dependencies.py`** reúnen configuración y mecanismos verdaderamente transversales; no deben convertirse en contenedores de lógica de negocio.
- **`tests/`** separa pruebas unitarias de reglas y pruebas de integración de rutas o acceso a datos.

Los nombres son una guía de responsabilidades, no una decisión de usar librerías específicas. La elección de persistencia y herramientas se hará cuando se hayan aclarado las fuentes de verdad y las necesidades del primer flujo.

## 4. Organización de routers y endpoints

FastAPI permite separar operaciones HTTP en routers y agregarlos desde la aplicación principal. Propongo un prefijo común versionado, por ejemplo `/api/v1`, y agrupación por dominio. Las rutas de abajo son ejemplos para describir responsabilidades; no son contratos aprobados ni capacidades ya disponibles.

| Router | Ejemplos de rutas | Responsabilidad |
|---|---|---|
| Salud | `GET /health` | Comprobar disponibilidad básica sin revelar configuración sensible. |
| Inventario | `GET /inventory`, `GET /inventory/{sku}` | Consultar existencias por SKU y almacén. La respuesta debe representar la actualidad y fuente de los datos de forma honesta. |
| Pedidos | `POST /orders`, `GET /orders/{order_id}` | Recibir o consultar pedidos con validación y trazabilidad de origen. |
| Envíos | `GET /shipments/{shipment_id}` | Consultar el estado interno e historial disponible de un envío. |
| Tracking público | `GET /tracking/{public_token}` | Devolver al destinatario solo los datos de seguimiento necesarios, usando un identificador opaco. |
| Transportistas | `GET /carriers`, `POST /carrier-recommendations` | Consultar opciones y, si existen datos adecuados, solicitar recomendaciones explicables. |
| Devoluciones | `POST /returns`, `GET /returns/{return_id}` | Crear o consultar una solicitud y su estado; mantener revisión humana donde la decisión lo requiera. |
| Clientes | `GET /clients/{client_id}` | Consultar datos B2B según los permisos del usuario autenticado. |

Cada router debe coordinarse con la lógica de aplicación del dominio correspondiente. Evitar un único archivo con todas las rutas facilita mantener responsabilidades claras y evolucionar módulos sin concentrar toda la API en un punto.

## 5. Investigación de convenciones de FastAPI

La documentación oficial de FastAPI sobre **aplicaciones grandes y múltiples archivos** muestra una estructura con un paquete de aplicación, un módulo principal, módulos separados para routers y dependencias, y el uso de `APIRouter` para dividir operaciones relacionadas. También explica que esos routers se incorporan a una misma aplicación, en lugar de obligar a convertirlos en servicios independientes. Esto respalda la propuesta de `main.py`, `dependencies.py`, `api/v1/` y routers separados por dominio.

La documentación de **Settings and Environment Variables** recomienda mantener configuración externa (incluidos valores que varían por entorno o son sensibles) fuera del código, en variables de entorno, y validarla al cargarla. Por eso se propone centralizar configuración en `core/config.py`, sin incluir secretos en el repositorio.

La documentación de **CORS** explica que el origen incluye protocolo, dominio y puerto, y que la aplicación backend debe indicar qué orígenes, métodos y cabeceras permite. Esto informa la configuración explícita y limitada de CORS descrita en la sección siguiente.

Fuentes oficiales consultadas:

- FastAPI, [Bigger Applications – Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/).
- FastAPI, [Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/).
- FastAPI, [CORS (Cross-Origin Resource Sharing)](https://fastapi.tiangolo.com/tutorial/cors/).

## 6. Frontend y backend como sistemas separados

El repositorio ya separa las interfaces (`uis/website/` y `uis/backoffice/`) de los servicios (`services/`). Mantenerlos en el mismo monorepo permite compartir documentación y coordinar cambios, pero siguen siendo aplicaciones con responsabilidades y configuración distintas; la API también podría desplegarse independientemente de las interfaces.

- **Comunicación:** el frontend enviaría solicitudes HTTP a endpoints documentados por la API. No debe conectarse directamente a bases de datos, WMS, ERP ni credenciales de transportistas. El contrato de rutas y formatos debe acordarse entre quienes mantienen frontend y backend.
- **Variables por entorno:** cada entorno debe poder apuntar a la URL adecuada de la API. La URL pública del backend puede estar en la configuración del frontend, pero cualquier variable incorporada al código que llega al navegador es visible para los usuarios; nunca se deben guardar ahí secretos o credenciales. Los secretos de integración pertenecen al backend y al mecanismo seguro de configuración del entorno.
- **CORS:** si la web y la API tienen distintos orígenes, el backend debe permitir explícitamente los orígenes, métodos y cabeceras necesarios. Evitar un comodín en producción, especialmente si se utilizan credenciales. CORS controla solicitudes de navegadores; no reemplaza autenticación ni autorización.
- **Acceso a datos:** la API debe verificar permisos en cada operación. Ocultar una sección en la interfaz no protege los datos.
- **Tracking público:** la ruta pública debe usar un token no predecible y limitar la información expuesta para evitar que una persona consulte envíos de terceros.
- **Estado existente:** los prototipos web actuales son estáticos y no están conectados a un backend real. Esta propuesta no afirma que haya autenticación, persistencia o integración implementada.

## 7. Riesgos y puntos de atención

1. **Inventario incoherente por falta de fuente de verdad.** Si la API combina datos de Los Ángeles y Zaragoza sin acordar qué sistema es autoridad para cada dato y cómo se resuelven discrepancias, podría mostrar stock incorrecto. Antes de prometer inventario global, hay que documentar fuentes, frecuencia de actualización y reconciliación.
2. **Integraciones asumidas pero no verificadas.** WMS, ERP y transportistas pueden tener contratos, disponibilidad y límites distintos. Diseñar como si todos ofrecieran APIs compatibles produciría errores y retrasos. Hay que confirmar cada mecanismo de integración y aislarlo en un adaptador probado.
3. **Acceso indebido a datos.** Marcas B2B, destinatarios B2C y personal interno no deben ver la misma información. CORS demasiado abierto, permisos ausentes o identificadores públicos predecibles podrían exponer datos. CORS limitado, autorización por usuario/cliente y minimización de datos deben definirse antes del despliegue.
4. **Estados de seguimiento engañosos.** Los transportistas pueden usar estados diferentes o entregar información atrasada. La normalización debe preservar el significado necesario y no llamar “tiempo real” a datos que llegan por sincronización periódica.
5. **Automatización sin supervisión.** Las recomendaciones de transportista y decisiones sobre devoluciones pueden ser incompletas; las evaluaciones de conductores tienen además impacto laboral. Deben ser explicables, auditables y revisables por personas. La propuesta de incentivos de `company-choice.md` no es una política aprobada.
6. **Pérdida de límites modulares.** Si un dominio importa y modifica libremente los detalles internos de otros, la aplicación puede convertirse en un monolito acoplado difícil de cambiar. Las dependencias entre dominios y sus contratos deben ser explícitos.

## 8. Decisiones que deben validarse antes de implementar

- Cuál es la fuente de verdad para inventario, pedidos y estados de envío.
- Qué interfaces y contratos ofrecen el ERP, los dos WMS y cada transportista.
- Qué usuarios, roles y reglas de acceso se necesitan para operaciones, marcas y destinatarios.
- Qué información puede mostrar el tracking público y durante cuánto tiempo.
- Qué frecuencia de actualización y disponibilidad necesita cada flujo.
- Qué requisitos de privacidad, retención y transferencia de datos aplican entre Estados Unidos y España.

Se recomienda iniciar con un flujo acotado, confirmar sus usuarios, fuente de datos y contrato, y validar el enfoque antes de ampliar la API a los demás dominios.

> **Nota de contexto:** los briefings `CONTEXT.md` y `CONTEXT.es.md` difieren en los nombres asociados a la dirección ejecutiva/CEO (Thomas Harry y Daniel Espinoza). Confirmar ese dato con negocio; no afecta las decisiones arquitectónicas de esta propuesta.
