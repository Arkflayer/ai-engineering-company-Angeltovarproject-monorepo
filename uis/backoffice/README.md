# Backoffice de TrackFlow

Punto de entrada del espacio de trabajo interno de TrackFlow Tech y de los equipos de operaciones. La interfaz es un prototipo estático y adaptable: los datos que muestra son ilustrativos; no autentica usuarios ni se conecta a sistemas de producción.

## Apertura local

Desde la raíz del repositorio, inicia el servidor estático existente:

```sh
npm run dev
```

Después, abre `http://localhost:3000/uis/backoffice/`. El backoffice solo utiliza recursos locales HTML/CSS/JavaScript y no requiere un paso de compilación.

## Prototipo actual

- `index.html` es la página de entrada e incluye una barra lateral, encabezado, tarjetas de resumen operativo y una tabla de envíos recientes.
- `styles.css` contiene los estilos y el diseño adaptable exclusivos del backoffice.
- Los valores operativos de ejemplo están identificados explícitamente como datos de demostración. No hay conexión con API, seguimiento de envíos en directo, autenticación ni persistencia.

## Próximos pasos

Conectar las API de solo lectura aprobadas para inventario y envíos a través de `services/`, una vez definidos los contratos y controles de acceso. No incluyas información sensible de clientes o conductores en datos estáticos de frontend y conserva la supervisión humana para cualquier recomendación de alto impacto.
