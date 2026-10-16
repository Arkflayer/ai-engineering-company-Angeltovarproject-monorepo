# TrackFlow — contexto empresarial

## Empresa

TrackFlow es una empresa de entregas de última milla y gestión de almacenes fundada en Los Ángeles en 2009. Presta servicio a marcas de comercio electrónico en Estados Unidos y España, con almacenes en Los Ángeles y Zaragoza, aproximadamente 130 empleados y una facturación anual aproximada de 9 millones de euros. TrackFlow Tech es la unidad tecnológica interna que construye sistemas, integraciones y automatizaciones para la empresa.

## Modelo operativo

TrackFlow almacena el inventario de sus clientes, recibe y procesa pedidos, prepara y empaqueta productos, entrega los envíos a los transportistas, hace seguimiento de las entregas y gestiona las devoluciones. Entre sus usuarios hay marcas clientes B2B, destinatarios de paquetes B2C, operarios de almacén, coordinadores logísticos, agentes de atención al cliente, gestores de cuentas y directivos. La operación abarca dos países, zonas horarias, idiomas y marcos regulatorios.

## Departamentos y necesidades conocidas

- **Operaciones de almacén (Ana Whitfield):** dos sistemas de almacén desconectados, visibilidad incompleta del inventario, transcripción manual de pedidos recibidos por correo, preparación en papel y detección tardía de discrepancias. Necesita inventario unificado, ingesta de pedidos, visibilidad operativa y alertas de stock bajo.
- **Última milla y gestión de transportistas (Carlos Vega):** ocho transportistas; la asignación y la consulta de estados son manuales y no hay datos estructurados de rendimiento. Necesita recomendaciones explicables de transportistas, seguimiento unificado e informes de rendimiento.
- **Logística inversa (Sofía Ramos):** las devoluciones representan entre el 18 % y el 25 % del volumen; su aprobación e inspección son manuales e inconsistentes. Necesita aprobación configurable, flujos de recogida, inspección asistida y análisis de tendencias.
- **Experiencia del cliente (Valentina Cruz):** 15 agentes atienden consultas B2B/B2C por canales desconectados; muchas consultas son repetitivas y no existe una base de conocimiento unificada ni atención fuera del horario laboral. Necesita atención inicial automatizada y segura, gestión de tickets, conocimiento multilingüe y visibilidad de CX.
- **Comercial y relación con clientes (Miguel Torres):** los registros de cuentas y los informes están en hojas de cálculo personales y correos. Necesita perfiles unificados, informes repetibles, visibilidad del riesgo de renovación y alertas.
- **Tecnología (CTO Andrés Kim):** ERP heredado, dos sistemas de gestión de almacén, scripts punto a punto sin documentar, bases de datos en distintas nubes y falta de telemetría central. Necesita documentación, bases de datos y observabilidad, monitorización y automatización fiable.
- **Dirección ejecutiva (CEO Daniel Espinoza):** informes semanales manuales y desactualizados, sin una visión unificada por país. Necesita indicadores oportunos, informes automatizados, comparativas, alertas por umbral y consultas en lenguaje natural.

## Principios de producto

1. Mejorar la precisión operativa y la visibilidad para el cliente sin fingir que los sistemas heredados desconectados ya están integrados.
2. Mantener supervisión humana en decisiones importantes (por ejemplo, asignación de conductores, decisiones sobre devoluciones, evaluación de empleados e incentivos); los resultados de IA deben ser explicables y revisables.
3. Minimizar los datos personales y de envíos; nunca confirmar credenciales ni datos reales de clientes o conductores en el repositorio.
4. Identificar claramente los datos de muestra y las capacidades simuladas. No describir estimaciones como seguimiento o existencias en tiempo real.
5. Tener en cuenta el contexto de Estados Unidos y España, incluida la localización y las zonas horarias o monedas que correspondan.

## Fuente de contexto y gestión de discrepancias

La descripción detallada de la empresa está en `CONTEXT.md` (inglés) y `CONTEXT.es.md` (español), en la raíz. La elección original del proyecto y una propuesta de evaluación e incentivos para conductores están en `company-choice.md`; esta última debe tratarse como una propuesta que requiere salvaguardas de equidad, privacidad, laborales y de revisión humana, no como una política de producción aprobada. Si hay diferencias de nombres o detalles entre documentos, señala la discrepancia en lugar de elegir un dato sin indicarlo.
