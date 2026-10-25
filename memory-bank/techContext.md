# TrackFlow — contexto técnico

## Stack actual

- Sitio público: HTML, CSS y JavaScript sin framework en `uis/website/`; interfaz español/inglés, recursos locales y páginas estáticas.
- Aplicación interna: prototipo HTML/CSS estático en `uis/backoffice/`, con diseño separado y datos de demostración.
- Ejecución local: `npm run dev` desde la raíz usa `npx serve . -l 3000`.
- `packages/shared/` contiene una estructura inicial para un paquete TypeScript. No hay runner de workspaces ni suite de pruebas global configurada.
- Backend: FastAPI en `services/api/`, con análisis de incidencias y autenticación JWT; usuarios y perfiles se guardan exclusivamente en TinyDB. Las interfaces aún no envían tokens. Toda API o lógica de servidor nueva pertenece a `services/`.
- AUTH-01 usa `OAuth2PasswordBearer`, `python-jose` y hashes nuevos `bcrypt` de libpass vía `from passlib.hash import bcrypt`; verifica hashes históricos `bcrypt_sha256`. Clave JWT obligatoria cargada desde `services/api/.env` (ignorado por Git) o entorno. `ACCESS_TOKEN_EXPIRE_MINUTES` también es obligatoria (sin fallback hardcodeado). Las rutas de datos requieren JWT y respetan la propiedad del recurso. Resultados de incidencias separados por `user_uuid` en memoria. No se usan sesiones ni cookies.
- POST `/auth/login` acepta JSON `email`/`password` o formulario con `email` (alias OAuth2 `username`) y devuelve JWT. GET `/auth/me` requiere sesión y devuelve solo email, rol actual de TinyDB y perfil propio; perfil eliminado se representa como null sin recreación. Entradas inválidas no repiten contraseñas; Swagger mantiene su formulario OAuth2 y documenta ambos formatos de login.
- `User` se valida en `services/api/app/models.py`: `id`, `email`, `hashed_password`, `is_active`, `role`, `created_at` UTC y `auth_version`. `UserRole` admite `admin`, `manager`, `user`. POST crea cuentas activas con rol `user`; solo el alta inicial local en una base vacía crea `admin`. Cuentas inactivas no pueden autenticarse. No se migran automáticamente registros históricos.
- `/users` requiere sesión para todo excepto POST de registro público. GET lista el directorio completo; GET por ID admite propietario/admin y devuelve 403 para cuenta ajena. PUT/PATCH y DELETE admiten propietario o admin, y solo admin cambia `role`. `manager` no administra otras cuentas. Las respuestas solo incluyen `id`, `email`, `role`, `is_active`, `created_at`; cambiar contraseña o rol revoca los tokens del usuario modificado. Añadir rate limiting antes de exponer registro a Internet.
- `Profile` se valida en el mismo módulo y guarda `id`, `user_id`, `name`, `phone`, `address` y el contacto opcional `contact_email`. `user_id` enlaza uno a uno con `User.id`; los otros módulos conservan `user_uuid`. POST /users acepta el perfil inicial con los nombres nuevos. Alta conjunta bajo bloqueo con reversión de la cuenta si falla el perfil, sin garantías transaccionales frente a fallos de disco. La API impide eliminar Profile sin eliminar User; el DELETE de perfil responde 409 al dueño y 403 si es ajeno.
- GET/PUT `/profiles/me` requieren sesión y usan exclusivamente la identidad del JWT. PUT permite cambios parciales de `name`, `phone`, `address`, rechaza credenciales e identificadores y permite borrar teléfono/dirección con null. No hay excepción administrativa para perfiles ajenos. Las lecturas históricas aceptan `user_uuid`/`display_name` sin reescritura; solo una actualización explícita normaliza ese perfil. Rutas antiguas conservadas; sus respuestas usan `user_id`/`name`.
- Rutas privadas sin sesión responden 401; el acceso autenticado a perfiles ajenos responde 403. Público: health, login, docs y POST /users. Las rutas de perfiles e incidencias están autenticadas.
- `services/api/app/user_service.py` ofrece creación, búsqueda por ID/email, listado, actualización y eliminación sin depender de HTTP. Comparte `UserRegistration`, `UserUpdate` y `UserAdminUpdate` y delega en `IdentityStore`; las rutas, auth y el alta inicial usan el servicio. Las búsquedas ausentes devuelven `None`; actualizar/eliminar un usuario inexistente genera `UserNotFoundError`. La opción interna `allow_role_change` solo la habilita la ruta tras comprobar admin. Autorización y filtrado de respuestas permanecen en la API.
- TinyDB requiere un solo proceso/worker. Su archivo de identidad predeterminado está fuera del monorepo servido por HTTP. Alta inicial local con `python -m app.bootstrap`; configuración y comandos en `services/api/README.md`.
- Pruebas de API: `uv run --project services/api python -m unittest discover -s services/api/tests -v`; regresión del analizador: `uv run --project services/api python -m unittest discover -s scripts/tests -v`.

## Decisiones de arquitectura

- Mantener web pública y backoffice en aplicaciones independientes bajo `uis/`, cada una con su propia entrada, documentación, estilos y responsabilidades.
- Mantener la implementación de las interfaces estáticas pequeña, sin framework ni bundler si no existe una necesidad concreta.
- Mantener APIs centralizadas en `services/` hasta que una razón técnica justifique separarlas.
- Separar agentes de producto (`agents/`) y capacidades de producto (`skills/`) de la configuración de agentes de programación (`.agents/`).
- Mantener `CONTEXT.md` y `CONTEXT.es.md` como briefing detallado de negocio. Esta memoria resume hechos y decisiones; no los reemplaza.

## Restricciones de implementación

- No afirmar que hay autenticación, persistencia, integración con sistemas heredados, inventario real o seguimiento en vivo sin implementación comprobable.
- Etiquetar los valores simulados y no incluir secretos, PII ni registros operativos reales.
- Asegurar semántica HTML, accesibilidad de teclado, foco visible, diseño adaptable y rutas locales válidas.
- Preservar el selector bilingüe del sitio público salvo que el requerimiento lo cambie explícitamente.
- Antes de editar, leer el README pertinente. Antes de entregar, revisar diff, referencias locales y sintaxis de scripts afectados; correr pruebas si están configuradas e informar las limitaciones.
- Supervisión humana requerida para decisiones operativas o laborales de impacto; las recomendaciones de IA deben indicar fundamentos y limitaciones.
