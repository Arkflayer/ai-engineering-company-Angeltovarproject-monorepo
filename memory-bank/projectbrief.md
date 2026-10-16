# TrackFlow — brief del proyecto

## Negocio

TrackFlow es una empresa de logística de última milla y gestión de almacenes fundada en Los Ángeles en 2009. Atiende marcas de comercio electrónico en Estados Unidos y España, con almacenes en Los Ángeles y Zaragoza, cerca de 130 empleados e ingresos anuales aproximados de 9 millones de euros. TrackFlow Tech es la unidad interna encargada de construir los sistemas, integraciones y automatizaciones de la compañía.

## Problema que resuelve

Las marcas de comercio electrónico necesitan almacenar inventario, procesar pedidos, preparar y enviar paquetes, dar seguimiento a entregas y gestionar devoluciones. TrackFlow ofrece esos servicios logísticos, pero su infraestructura actual dificulta operarlos de forma confiable y crecer entre países. Los sistemas de los dos almacenes no comparten inventario; la asignación y consulta de transportistas es mayormente manual; las devoluciones se revisan individualmente; la atención al cliente es repetitiva y carece de una base de conocimiento unificada; y la dirección consolida informes manualmente a partir de información atrasada.

## Objetivos del proyecto

Construir gradualmente sistemas, integraciones y automatizaciones que permitan a TrackFlow:

- Unificar visibilidad de inventario y operaciones de los almacenes de Los Ángeles y Zaragoza.
- Ingerir pedidos de forma más fiable y reducir transcripción y preparación manual.
- Agregar seguimiento y métricas de rendimiento de los ocho transportistas, con recomendaciones explicables.
- Mejorar el flujo de devoluciones y su análisis sin retirar la supervisión humana de decisiones relevantes.
- Resolver consultas repetitivas de forma segura, con soporte bilingüe inglés/español y escalamiento a personas.
- Proporcionar a clientes y dirección informes oportunos y comparativas entre países.
- Modernizar integraciones heredadas y añadir documentación, telemetría y alertas.

## Usuarios y contexto

Los usuarios incluyen personal de almacén, coordinadores de logística y transportistas, agentes de atención, gestores de cuentas, directivos, marcas clientes B2B y destinatarios B2C. El trabajo cruza dos países, zonas horarias, idiomas y marcos regulatorios.

## Límites de veracidad y seguridad

El briefing describe necesidades y oportunidades, no sistemas ya integrados. Los prototipos de este repositorio usan datos de demostración y no representan inventario o seguimiento en vivo. Proteger datos personales y credenciales. Las recomendaciones de IA deben ser explicables y revisables por personas, especialmente cuando afectan devoluciones, empleados, conductores o incentivos. Para discrepancias de nombres o hechos, consultar `CONTEXT.md` y `CONTEXT.es.md` y documentar la diferencia en vez de inventar una resolución.
