# Plan de pruebas y ejecución

## Alcance y decisiones

Antes de implementar los nuevos tests, se planifican los siguientes escenarios. Se prioriza afirmar decisiones de negocio (emisión/rechazo de identidad, autorización, validación, persistencia y aislamiento) en vez de detalles de serialización HTTP. Los casos usan usuarios ficticios y almacenes temporales; las pruebas de endpoints llaman la lógica de rutas/servicios directamente cuando sea viable. Las pruebas de regresión ya existentes se mantienen.

### Revisión asistida por IA

En una revisión de los casos límite, la IA sugirió comprobar explícitamente que los tokens malformados no autentican, que la contraseña en el límite de bcrypt se valida antes de autenticar y que ni el registro duplicado ni los accesos cruzados dejan cambios o exponen datos. Esas propuestas se contrastaron con las reglas del servicio y se incorporaron en `test_token.py`, `test_login.py`, `test_register.py`, `test_users.py` y `test_profiles.py`; las pruebas afirman decisiones de negocio, no detalles de respuesta HTTP.

### FastAPI — autenticación e identidad

| Endpoint/grupo | Camino feliz | Caso límite | Modo de fallo | Motivo |
|---|---|---|---|---|
| `POST /users` (registro) | Crea usuario `user` y perfil inicial | Email duplicado, campos opcionales ausentes, password en mínimo permitido | Email/password/perfil inválidos; no deja registros parciales | Evitar duplicados y cuentas incompletas |
| `POST /auth/login` | Credenciales válidas producen JWT verificable | Login JSON y formulario OAuth2; longitud máxima bcrypt | Usuario desconocido, contraseña incorrecta, usuario inactivo y cuerpo malformado | Cubrir entradas y rechazo uniforme |
| `GET /auth/me` (token/sesión) | JWT actual resuelve usuario y perfil propio | Perfil eliminado; expiración exacta/claims incompletos | Token expirado, manipulado, firma incorrecta, usuario borrado/inactivo o `auth_version` revocada | Prevenir sesiones obsoletas y exposición ajena |
| `GET /users`, `GET /users/me`, `GET /users/{id}` | Lista/consulta autorizada | Cuenta inexistente | Sin token, token inválido, acceso cruzado sin rol admin | Confirmar autenticación y propiedad |
| `PUT/PATCH /users/{id}` | Dueño actualiza credenciales; admin administra rol | Actualización parcial y cambio a email existente | Rol no permitido, datos nulos/inválidos, objetivo inexistente, acceso ajeno | Evitar escalada y preservar unicidad |
| `DELETE /users/{id}` | Admin elimina cuenta y perfil relacionado | Cuenta ya inexistente | Acceso ajeno o token de cuenta eliminada | Mantener ciclo de vida e invalidar identidad |
| `GET/POST /profiles`, `GET/PUT /profiles/me`, `GET/PATCH/DELETE /profiles/{id}` | Dueño consulta/actualiza perfil propio; creación autorizada | Perfil ausente, actualización parcial y borrado de contacto opcional | Credenciales/campos no permitidos, duplicado, acceso ajeno y eliminación individual del perfil | Asegurar privacidad y vínculo usuario-perfil |

Se ejecutará cobertura focalizada del módulo `app/auth.py`, que implementa parseo de credenciales, login y resolución de identidad; objetivo mínimo 70%.

### Actividad adicional API-042 — backoffice (no auth)

| Grupo | Camino feliz | Caso límite | Modo de fallo | Motivo |
|---|---|---|---|---|
| Proveedores (`/suppliers`) | Crear, consultar y actualizar proveedor | Filtros/valores vacíos y transiciones repetidas o sin cambio | Entrada inválida/ID ausente, sin sesión o acceso cruzado | Validar reglas CRUD y sesión sin cubrir serialización |
| Incidencias (`/api/incidents`) | Analizar CSV válido y exportar el agregado propio | CSV vacío/sin filas válidas o límite de tamaño | Encabezados/UTF-8/extensión incorrectos, sin sesión, exportar sin análisis | Proteger la ingesta y el aislamiento por usuario |

Para ambos grupos se busca al menos 60% de cobertura de los módulos del dominio probados, utilizando datos temporales y entradas ficticias.

### TypeScript — Jest (actividad FE-019)

- Almacenamiento de token: set/remove en browser y comportamiento seguro sin `window`.
- Login: solicitud válida, configuración ausente y respuesta de credenciales rechazada.
- Registro: envío correcto y manejo de duplicado/error de validación.
- Solicitud autenticada (`apiRequest`): adjunta bearer y rechaza 401 notificando sesión no autorizada.

Cada helper incluirá camino feliz y fallo, con `fetch` y `localStorage` controlados en pruebas, sin llamadas de red.

## Ejecución

Desde la raíz del monorepo, el runner de UV incluye las dependencias de `services/api` y descubre la suite backend:

```sh
uv run pytest
uv run pytest --cov=app.auth --cov-report=term-missing
uv run pytest --cov=app.domains.suppliers --cov=app.domains.incidents --cov-report=term-missing
npm --prefix uis/backoffice test -- --coverage
```

Para sincronizar el entorno de pruebas desde cero, usa `uv sync --locked` desde la raíz. Si necesitas ejecutar con el entorno propio de la API, también puedes usar `uv run --locked --project services/api pytest`.

La suite backend conserva además la regresión `unittest`:

```sh
uv run --locked --project services/api python -m unittest discover -s services/api/tests -v
```

## Suites

- `services/api/tests/test_auth.py`, `test_security.py`, `test_api.py`: regresión existente de autenticación, usuarios/perfiles, firma/hash y rutas de incidencias. Algunos casos heredados usan `TestClient` y validan respuestas HTTP; se conservan como regresión, pero no se presentan como pruebas unitarias puras de lógica.
- Nuevos módulos `test_login.py`, `test_register.py`, `test_token.py`, `test_users.py`, `test_profiles.py`: decisiones de autenticación e identidad invocando funciones de ruta/servicio directamente cuando es viable, sin afirmar serialización HTTP.
- Suite de proveedores e incidencias: reglas de CRUD, validaciones, autorización y aislamiento del backoffice.
- `uis/backoffice/__tests__/api.test.ts`: funciones de autenticación, almacenamiento y consumo del API con dependencias de navegador/red simuladas.

## Resultados verificados

Resultados de ejecución en el entorno local:

- `uv run --locked pytest -q` desde la raíz y `uv run --locked --project services/api pytest -q`: **109 passed, 125 subtests passed** en ambos comandos. La ejecución `unittest` separada descubre 76 métodos heredados; pytest también recoge los casos `unittest` de sus módulos sin contarlos necesariamente igual que el runner unittest.
- `uv run --locked pytest --cov=app.auth --cov=app.domains.suppliers --cov=app.domains.incidents --cov-report=term-missing -q`: **109 passed**, incluyendo 125 subtests. Cobertura: `app/auth.py` **100%**; proveedores (`models.py`, `router.py`, `storage.py`) **100%, 100% y 99%**; incidencias (`analysis.py`, `router.py`) **80% y 90%**. Cobertura agregada de los módulos medidos: **93%**.
- `uv run --locked pytest --cov=app.auth --cov-report=term-missing -q`: `app/auth.py` **100%**.
- `npm --prefix uis/backoffice test -- --coverage`: **9 passed**. `uis/backoffice/src/lib/api.ts`: **71.42% statements, 50% branches, 80% functions y 75.43% lines**. Incluye configuración ausente de API URL en login y almacenamiento seguro sin `window`.
- `npm --prefix uis/backoffice run typecheck`: correcto.
- `npm --prefix uis/backoffice run lint`: correcto, sin advertencias (se excluye `coverage/`, que contiene reportes generados).
- `npm --prefix uis/backoffice run build`: correcto.
- `uv lock --check`, `uv lock --project services/api --check` y `git diff --check`: correctos.

El entorno de pruebas de la API utiliza `httpx2` para evitar la deprecación de Starlette. El comando de regresión `unittest` indicado arriba se conserva como alternativa para ejecutar las pruebas heredadas.
