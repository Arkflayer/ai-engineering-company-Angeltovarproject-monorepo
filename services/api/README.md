# API de análisis de incidencias de TrackFlow

Puntos de acceso FastAPI para analizar archivos CSV localmente. La validación y la agregación comparten la implementación de `scripts/analyze.py`, ubicada en `app/domains/incidents/analysis.py`. Ni las respuestas de la API ni las exportaciones contienen filas de origen o correos de clientes.

## Ejecución local

```sh
cd services/api
uv sync
cp .env.example .env
# Sustituye el marcador TRACKFLOW_JWT_SECRET en .env por el resultado de: openssl rand -hex 32
uv run python -m app.bootstrap --email tu-cuenta@example.com
uv run uvicorn app.main:app --reload --host 127.0.0.1
```

Requiere Python 3.14 o superior. La aplicación carga `services/api/.env` sin reemplazar variables ya definidas en el entorno. `.env` está excluido de Git; conserva allí la clave y no la compartas. El archivo `.env.example` es solo una plantilla: no contiene una clave válida. El alta inicial crea la primera cuenta con rol `admin`, pide la contraseña dos veces sin mostrarla y solo funciona si no hay usuarios. Ejecútala con la API detenida. `POST /users` permite registrar cuentas públicas con rol `user`; no hay credenciales predeterminadas. No pongas contraseñas en argumentos, URLs o archivos versionados. Las cuentas de bases anteriores no se convierten automáticamente en administradores; si no hay ninguno, se requiere una migración local explícita y autorizada, sin eliminar ni sobrescribir datos existentes.

La clave del ejemplo se genera en la sesión de terminal, sin imprimirla. Para conservar sesiones entre reinicios, proporciona la misma clave desde un gestor de secretos; generar otra invalida los tokens anteriores. No uses la clave de las pruebas.

- `POST /api/incidents/analyze` requiere sesión, acepta un campo `file` en `multipart/form-data` y devuelve un resumen JSON agregado. Tamaño máximo: 25 MiB.
- `GET /api/incidents/results/export` requiere sesión y devuelve únicamente el último análisis del usuario autenticado como CSV agregado. Los resultados se guardan en memoria por `user_uuid`, se pierden al reiniciar y se eliminan al borrar la cuenta.
- `GET /health` ofrece una comprobación básica del estado del servicio y devuelve `{"estado":"correcto"}`.

## Autenticación y configuración

- `TRACKFLOW_JWT_SECRET`: obligatorio, al menos 32 bytes aleatorios; guárdalo en `services/api/.env` o inyéctalo desde un gestor de secretos. La API no arranca si falta o es demasiado corto. Nunca lo escribas en el código ni lo guardes en Git.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: obligatoria; la plantilla `.env.example` propone `30`. Admite enteros entre 1 y 1440. La API no arranca si falta: no hay expiración hardcodeada ni alias alternativo.
- `TRACKFLOW_DB_PATH`: ubicación del JSON de TinyDB. Por defecto, `~/.local/share/trackflow/identity.json`, fuera del monorepo que sirve el frontend estático. Si cambias la ruta, usa un directorio privado fuera de cualquier árbol servido por HTTP o versionado. El archivo nuevo se crea con permisos `0600` y su directorio con `0700`.
- `TRACKFLOW_UI_ORIGINS`: orígenes CORS explícitos separados por comas; por defecto `http://localhost:3000,http://127.0.0.1:3000`. Se admiten `Authorization`, `Content-Type` y los métodos de gestión. CORS no sustituye a la autenticación.

`POST /auth/login` es público y acepta `application/json` con `email` y `password`:

```json
{
	"email": "persona@example.com",
	"password": "contraseña-ficticia-no-reutilizar"
}
```

También admite formularios `application/x-www-form-urlencoded` con `email` y `password`; por compatibilidad OAuth2, `username` se acepta como alias del email en el formulario. Así sigue funcionando **Authorize** de `/docs`. No pongas credenciales reales en comandos del historial. Devuelve `access_token`, `token_type: "bearer"` y `expires_in` en segundos. El email se valida, las credenciales se contrastan con el hash almacenado y solo las cuentas activas reciben token.

JSON mal formado devuelve `400`; un formato de contenido no admitido, `415`; campos ausentes, inválidos o adicionales en JSON, `422`, sin repetir contraseñas en el error. Las credenciales incorrectas devuelven `401` tanto si el email existe como si no.

`GET /auth/me` requiere `Authorization: Bearer <access_token>` y devuelve únicamente `email`, `role` y `profile` del usuario autenticado. `profile` incluye `id`, `user_id`, `name`, `phone`, `address` y el contacto opcional `contact_email`. No devuelve hashes, contraseñas ni versiones de credenciales. La identidad y el rol se consultan en TinyDB a partir del JWT; no se selecciona otro usuario mediante parámetros de la solicitud. La API no crea sesiones de servidor ni cookies.

Si la cuenta sigue siendo válida pero se eliminó su perfil, devuelve `200` con `profile: null`, sin recrearlo. Esto es distinto de `GET /profiles/me`, que devuelve `404` si falta el perfil. Un token ausente, inválido, caducado o de una cuenta inactiva/eliminada devuelve `401`.

Las solicitudes privadas envían `Authorization: Bearer <access_token>`. `OAuth2PasswordBearer` extrae el token y `get_current_user` valida su firma HS256 con `python-jose`, expiración y existencia del usuario. El claim `sub` contiene el UUID `id` persistido en la tabla `users` de TinyDB, no el número interno `doc_id`. `Profile` lo enlaza mediante `user_id`; otros módulos conservan la referencia `user_uuid`. El token no incluye email, contraseña ni datos de contacto; un JWT está firmado, no cifrado.

Se guardan hashes con sal en `hashed_password` usando `bcrypt` de `libpass` (`from passlib.hash import bcrypt`); nunca se guardan contraseñas legibles. Las contraseñas nuevas deben tener entre 12 y 72 bytes UTF-8 para evitar que bcrypt las trunque; eso equivale a entre 12 y 72 caracteres ASCII, y menos caracteres si contienen símbolos multibyte. Hashes históricos `bcrypt_sha256` se pueden verificar, pero todos los hashes nuevos usan bcrypt. Cambiar la contraseña o el rol rota la versión de credenciales e invalida todos los tokens anteriores del usuario modificado; eliminar el usuario también invalida sus tokens. Una cuenta con `is_active=false` no puede iniciar sesión ni usar tokens existentes. Las respuestas y los errores de validación no incluyen contraseñas ni hashes.

Sin token válido, las rutas privadas responden `401` con `WWW-Authenticate: Bearer`. Credenciales incorrectas y emails desconocidos tienen la misma respuesta. `/health`, `/auth/login`, `POST /users` y la documentación OpenAPI son públicos; la documentación no contiene registros de usuarios. `POST /users` es la excepción explícita de registro público; aplica rate limiting y verificación contra abuso antes de exponerlo a Internet.

## Usuarios y perfiles

Todos los endpoints de usuarios requieren sesión **excepto `POST /users`**, que permite el registro inicial sin token. Todas las rutas de perfiles y de incidencias requieren sesión. `GET /users` lista el directorio completo y las lecturas de usuario devuelven campos públicos sin hashes ni datos de perfil. `user` y `manager` pueden modificar credenciales o eliminar únicamente su propia cuenta; `admin` puede hacerlo sobre cualquier cuenta y es el único que puede cambiar `role`. `manager` no obtiene permisos administrativos. Los perfiles y los resultados de incidencias siguen siendo privados de su propietario, incluso para un admin. Intentar modificar o consultar un perfil ajeno devuelve `403`; una ruta protegida sin credenciales válidas devuelve `401`.

| Método y ruta | Función |
| --- | --- |
| `POST /users` | Registro público: crear una cuenta con `email`, `password` y campos opcionales de perfil inicial `name`, `phone`, `address`. Devuelve `201`; siempre asigna rol `user`. |
| `GET /users` | Listar todos los usuarios del directorio interno autenticado. |
| `GET /users/me` | Consultar la cuenta de la sesión. |
| `GET /users/{user_uuid}` | Consultar la propia cuenta o cualquier cuenta si quien llama es admin; un usuario ajeno recibe `403`, y un ID inexistente `404`. |
| `PUT /users/{user_uuid}` | Actualizar email y/o contraseña de la cuenta propia o, para un admin, de otra cuenta. Solo admin puede enviar `role`. Devuelve `200`. |
| `PATCH /users/{user_uuid}` | Alias de actualización conservado por compatibilidad, con las mismas validaciones y permisos que `PUT`. |
| `DELETE /users/{user_uuid}` | Eliminar la cuenta propia o, para un admin, cualquier cuenta, junto con su perfil y resultado en memoria. Devuelve `204`. |
| `POST /profiles` | Recuperar el perfil propio si faltara; rechaza duplicados. |
| `GET /profiles` | Listar solo el perfil propio, si existe. |
| `GET /profiles/me` | Devolver el perfil del usuario autenticado, sin aceptar un identificador externo. |
| `PUT /profiles/me` | Actualizar exclusivamente `name`, `phone` y `address` del perfil de la sesión. |
| `GET /profiles/{user_uuid}` | Consultar el perfil propio. |
| `PATCH /profiles/{user_uuid}` | Cambiar nombre visible y datos de contacto propios. |
| `DELETE /profiles/{user_uuid}` | Rechaza la eliminación aislada con `409`; elimina la cuenta con `DELETE /users/{user_uuid}`. |

`DELETE /profiles/{user_uuid}` se conserva como ruta protegida por compatibilidad, pero responde `409` para el dueño porque no se permite separar un perfil de su cuenta. Un acceso al perfil ajeno responde `403`; para eliminar ambos datos se usa `DELETE /users/{user_uuid}` con los permisos correspondientes.

En el registro, `name` se guarda como `Profile.name`, con un máximo de 120 caracteres; `phone` admite hasta 40 y `address` hasta 500. Si no se indican, se crea un perfil con nombre vacío y contacto nulo. Ninguno de esos campos se guarda en `User`. La validación ocurre antes de escribir. Usuario y perfil se crean bajo el mismo bloqueo local y la cuenta se retira si falla la creación del perfil; esto no convierte TinyDB en una base transaccional frente a fallos de disco.

`PUT` y `PATCH` de `/users` aceptan actualizaciones parciales: al menos un campo, sin valores nulos y sin campos de perfil. Solo `admin` puede enviar `role`, incluso si alguien intenta asignarse su rol actual. Un rol desconocido devuelve `422`; una modificación ajena sin permisos o un cambio de rol sin ser admin devuelve `403`; un email duplicado, `409`. Admin recibe `404` al actualizar o eliminar una cuenta inexistente. No se pueden modificar `id`, `is_active`, `created_at`, `hashed_password` o `auth_version` mediante estos endpoints.

El modelo interno `User`, definido en `app/models.py`, se serializa en TinyDB con estos campos:

| Campo | Contenido |
| --- | --- |
| `id` | UUID generado por el servidor. |
| `email` | Email de acceso validado y normalizado. |
| `hashed_password` | Hash con sal; nunca la contraseña original. |
| `is_active` | Estado de acceso, `true` por defecto. |
| `role` | `UserRole` restringe los valores a `admin`, `manager` o `user`; `POST /users` usa `user` por defecto. |
| `created_at` | Fecha de creación ISO 8601 en UTC, generada por el servidor. |
| `auth_version` | Versión interna que permite invalidar sesiones al cambiar contraseña o rol. |

La API de usuarios devuelve únicamente `id`, `email`, `role`, `is_active` y `created_at`; nunca hashes ni versiones de credenciales. Para registros históricos sin fecha de creación, devuelve `created_at: null` en lugar de inventar una fecha. El rol se lee del registro de TinyDB en cada solicitud, no se confía en un rol enviado en el token o en el cuerpo. La autorización administrativa se limita a las operaciones de usuarios aquí descritas; no representa un sistema general de permisos para todos los dominios.

El modelo `Profile`, definido también en `app/models.py`, guarda `id`, `user_id`, `name`, `phone` y `address`, además del campo opcional de contacto `contact_email` ya existente. `user_id` es el UUID de `User.id`. Los campos de contacto se validan tanto en la API como antes de escribir en TinyDB; no se admiten credenciales ni campos adicionales en un perfil. La relación es uno a uno: nunca puede haber dos perfiles para el mismo usuario, ni perfiles de usuarios inexistentes. Al crear una cuenta siempre se crea su perfil; la API no permite eliminarlo de forma independiente y `DELETE /users/{user_uuid}` elimina cuenta y perfil juntos. Un perfil ausente en una base antigua puede recuperarse con `POST /profiles`. No se permite cambiar `id` ni `user_id` desde el cliente. Los emails de acceso se normalizan sin distinción de mayúsculas y los duplicados devuelven `409`.

### Perfil de la sesión

`GET /profiles/me` identifica al dueño a partir del JWT y devuelve su perfil con los nombres `user_id` y `name`. `PUT /profiles/me` acepta únicamente uno o varios de estos campos:

```json
{
	"name": "Persona ficticia",
	"phone": "+34 000000000",
	"address": "Dirección ficticia"
}
```

Los campos omitidos conservan su valor. `phone` y `address` admiten `null` para borrar el contacto; `name` no admite `null`. Un objeto vacío, valores demasiado largos o campos ajenos al contrato (`id`, `user_id`, `user_uuid`, `display_name`, `role`, credenciales o `contact_email`) devuelven `422` sin guardar cambios. La identidad nunca se toma del cuerpo. Incluso un admin solo puede modificar su propio perfil mediante `/me`.

Ambas rutas requieren sesión válida (`401` si falta o no es válida) y devuelven `404` si el usuario no tiene perfil. No crean uno implícitamente. Las rutas de perfil por identificador requieren sesión y responden `403` al intentar acceder al perfil de otra persona. Las rutas anteriores se conservan por compatibilidad y sus respuestas también usan los nombres nuevos.

Los perfiles históricos con `user_uuid` y `display_name` se leen como `user_id` y `name` sin reescribir el archivo. Una actualización explícita del dueño normaliza ese perfil a los campos nuevos, conservando su `id`. La unicidad y el borrado en cascada reconocen ambos formatos. Los nombres antiguos siguen aceptándose donde corresponde en las entradas de las rutas anteriores, pero no en `PUT /profiles/me`. No se ejecutan migraciones masivas ni se modifican automáticamente bases reales.

Compatibilidad: se pueden autenticar registros anteriores que usaban `password_hash`; al cambiar su contraseña se reemplaza ese campo por `hashed_password`. Para registros antiguos sin `is_active`, se conserva el acceso previo. No se reescriben bases existentes, no se asignan roles retroactivamente ni se inventa una fecha histórica de creación. La adaptación completa de datos anteriores requiere una migración explícita y autorizada.

## Capa de servicios de usuarios

`app/user_service.py` centraliza las operaciones reutilizables sin depender de FastAPI. Todas reciben como primer argumento el `IdentityStore` abierto por la aplicación; no crean conexiones globales ni almacenan usuarios fuera de TinyDB.

| Función | Comportamiento |
| --- | --- |
| `create_user(store, email, password, bootstrap=False, name=None, phone=None, address=None)` | Valida credenciales y perfil inicial y delega su alta con hash y rol `user`. Los parámetros opcionales se pasan por nombre; solo el alta local con `bootstrap=True` crea un `admin`. |
| `get_user_by_id(store, user_uuid)` | Devuelve el registro interno o `None` si no existe. |
| `get_user_by_email(store, email)` | Busca el email sin distinguir mayúsculas, eliminando espacios exteriores; devuelve el registro o `None`. |
| `list_users(store)` | Devuelve todos los registros internos para que la API filtre los campos públicos. |
| `update_user(store, user_uuid, changes, allow_role_change=False)` | Valida credenciales y conserva la unicidad; solo código interno autorizado por la ruta administrativa pasa `allow_role_change=True`. Cambiar contraseña o rol rota las sesiones. |
| `delete_user(store, user_uuid)` | Elimina la cuenta y su perfil. La ruta HTTP elimina además el resultado de incidencias en memoria. |

Altas y cambios usan `UserRegistration`, `UserUpdate` y `UserAdminUpdate`, definidos en `app/models.py`. Los datos inválidos generan `ValidationError`; los conflictos de email, `ValueError`; actualizar o eliminar una cuenta inexistente genera `UserNotFoundError`. La comprobación de existencia y la modificación se realizan bajo el mismo bloqueo local del almacén. `allow_role_change` es una opción interna del servicio, nunca un campo aceptado en el cuerpo HTTP.

Las rutas `/users`, el login, la comprobación de sesión y el alta inicial usan esta capa. Los registros devueltos son internos y contienen el hash: no deben serializarse directamente como respuesta HTTP. Las rutas mantienen sus modelos de respuesta sin hashes, la autenticación y las comprobaciones de propiedad. La capa de servicios no reemplaza esos controles de acceso ni añade rutas públicas de búsqueda por email.

## Pruebas y límites

Desde la raíz del monorepo:

```sh
uv run --project services/api python -m unittest discover -s services/api/tests -v
uv run --project services/api python -m unittest discover -s scripts/tests -v
```

Las pruebas usan cuentas ficticias y TinyDB en directorios temporales. Cubren hashes, JWT manipulados o caducados, revocación, CRUD, persistencia, unicidad concurrente en un proceso, perfiles iniciales y reversión del alta, permisos de `user`/`manager`/`admin`, propiedad e aislamiento de exportaciones.

TinyDB es la única persistencia de usuarios y perfiles. No crees tablas `User` o `Profile` en Supabase/PostgreSQL ni modelos SQLModel de identidad; si otros módulos usan PostgreSQL, enlazan al propietario solo mediante el UUID de TinyDB (`user_uuid`). Su archivo contiene emails, contacto y hashes: protégelo también en copias de seguridad. Usa **un solo proceso/worker**; los bloqueos de esta implementación son locales al proceso. No ejecutes varias instancias ni el alta inicial a la vez que el servidor. TinyDB no ofrece transacciones ni garantías de recuperación frente a fallos de disco. Los resultados de incidencias no son persistentes.

Las filas CSV inválidas se cuentan y se excluyen del análisis. Encabezados ausentes o incorrectos, archivos vacíos y texto UTF-8 inválido devuelven `400`; una extensión incorrecta devuelve `415` y los archivos demasiado grandes, `413`.

El frontend todavía no envía tokens: sus llamadas privadas devolverán `401` hasta la siguiente fase. No se implementan refresh tokens, recuperación de contraseña, MFA ni limitación de intentos de login. Antes de exponer la API a Internet, añade HTTPS, limitación de intentos y revisión de despliegue y permisos, especialmente del acceso autenticado al directorio completo de usuarios. Esta entrega no convierte el prototipo en una plataforma lista para producción.
