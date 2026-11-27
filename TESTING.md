# Plan de pruebas — TrackFlow

## Cómo ejecutar las pruebas

### Backend (FastAPI / pytest)

```bash
cd services/api

# Ejecutar todas las pruebas
uv run pytest tests/

# Con cobertura (requiere pytest-cov)
uv run pytest tests/ --cov=app --cov-report=term-missing

# Módulo específico
uv run pytest tests/test_auth.py -v
uv run pytest tests/test_security.py -v
```

### TypeScript / Jest

```bash
# Desde la raíz del monorepo
npx jest --config jest.config.ts

# Con cobertura
npx jest --config jest.config.ts --coverage
```

---

## Suite 1: Autenticación (AUTH-088)

### Endpoint: `POST /auth/login`

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_login_accepts_json_email_password_and_issues_valid_jwt` | Login con JSON retorna JWT válido con sub, token_type bearer y expires_in 1800s |
| ✅ Camino feliz | `test_login_accepts_email_form_and_preserves_oauth2_username_form` | Login vía form-data funciona tanto con field `email` como con `username` |
| ✅ Caso límite | `test_json_login_unknown_email_and_wrong_password_have_same_response` | Email desconocido y contraseña incorrecta producen exactamente el mismo JSON (no filtrar existencia) |
| ✅ Modo fallo | `test_login_rejects_invalid_bodies_without_echoing_password` | Campos vacíos, email inválido, contraseña >1024 chars, array como body, JSON malformed, content-type no soportado → 400/415/422 y nunca se repite la contraseña |
| ✅ Camino feliz | `test_login_uses_stored_id_and_never_exposes_credentials` | El token contiene el UUID (no el email), y la contraseña NUNCA aparece en logs ni en claims |

### Endpoint: `GET /auth/me`

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_auth_me_returns_own_email_role_and_linked_contact_without_secrets` | Retorna email, role, profile. No filtra datos de otros usuarios ni hashes |
| ✅ Caso límite | `test_auth_me_without_profile_returns_null_without_recreating_it` | Si no hay perfil, retorna `profile: null` sin crearlo automáticamente |
| ✅ Modo fallo | `test_auth_me_requires_valid_session_and_rejects_expired_token` | Sin token, token inválido o expirado → 401 |
| ✅ Modo fallo | `test_auth_me_and_json_login_reject_inactive_or_deleted_user` | Usuario inactivo o eliminado → 401 |

### Endpoint: `POST /auth/forgot-password`

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_forgot_password_sends_reset_link_for_existing_user` | Enlace de reset enviado con token en la URL |
| ✅ Caso límite | `test_forgot_password_does_not_send_for_unknown_user` | Email inexistente → 200 genérico (no revelar existencia) |
| ✅ Modo fallo | `test_forgot_password_keeps_generic_response_when_delivery_fails` | Falla del provider de email → sigue respondiendo 200 genérico |
| ✅ Caso límite | `test_forgot_password_logs_safe_provider_status_without_breaking_response` | Log del error no incluye el token ni datos sensibles |

### Funciones de seguridad (generación/validación de tokens, hashing)

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_password_is_salted_and_verified_as_hash` | Hash bcrypt, salteado, verificable |
| ✅ Camino feliz | `test_token_contains_identity_and_configurable_expiration` | Token contiene sub, ver, exp-iat configurables |
| ✅ Caso límite | `test_bcrypt_rejects_passwords_over_72_utf8_bytes_without_truncation` | bcrypt rechaza >72 bytes UTF-8 (no trunca) |
| ✅ Caso límite | `test_legacy_bcrypt_sha256_hashes_remain_verifiable` | Hashes antiguos bcrypt_sha256 siguen siendo verificables |
| ✅ Modo fallo | `test_expired_unsigned_and_wrongly_signed_tokens_are_rejected` | Token expirado, firma incorrecta, JWT malformed → todos rechazados |
| ✅ Modo fallo | `test_secret_and_expiration_configuration_fail_closed` | Secret vacío, muy corto, expiración 0 o no numérica → RuntimeError |

### Endpoints de usuarios (CRUD)

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_registration_creates_initial_profile_without_mixing_credentials` | Registro público crea usuario + perfil, retorna 201 |
| ✅ Camino feliz | `test_directory_lists_all_accounts_and_reads_by_id_without_secrets` | GET /users lista sin exponer hashes ni tokens |
| ✅ Caso límite | `test_users_crud_duplicate_email_and_token_revocation` | Email duplicado → 409; cambio de email+password revoca token anterior |
| ✅ Modo fallo | `test_authenticated_directory_does_not_allow_cross_account_changes_or_profile_access` | Un usuario no puede modificar/leer cuentas ajenas → 403 |
| ✅ Modo fallo | `test_invalid_tokens_are_rejected` | 10 variantes de token inválido (firma, exp, sub, ver, algoritmo) → 401 |

> **Asistencia IA:** Se usó el agente para identificar casos de prueba que inicialmente no se habían considerado, como: verificar que el campo `password_reset_version` esté presente en el registro de usuario, y probar que el token se genera con el UUID en `sub` (no el email). También se detectó que un test no se había actualizado tras añadir `password_reset_version` al modelo — se corrigió y se documenta aquí.

---

## Suite 2: Backoffice — Proveedores (API-042 — Extra)

Cubre endpoints de `/suppliers` con tres niveles por grupo funcional.

### Modelos y almacenamiento

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_create_update_and_seed_are_persistent_and_idempotent` | Crear, actualizar rate/status, seed idempotente, historial de estados, persistencia en disco |
| ✅ Caso límite | `test_rejects_invalid_business_values` | Rate=0, status inválido, país-monea inconsistente, categorías vacías, updated_at en create |
| ✅ Modo fallo | `test_rate_and_status_patch_models_are_restricted` | Rate=0 rechazado, status="paused" rechazado |

### API REST

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_supplier_crud_filter_validation_and_authentication` | CRUD completo + filtros por país/categoría + status history |
| ✅ Caso límite | (integrado en la misma prueba) | Rate=0 → 422, supplier inexistente → 404, delete de deleted → 404 |
| ✅ Modo fallo | (integrado en la misma prueba) | Sin autenticación → 401 |

---

## Suite 3: Incidencias (Backoffice — Extra)

Cubre endpoints de `/api/incidents/*`.

| Tipo | Prueba | Lo que verifica |
|------|--------|-----------------|
| ✅ Camino feliz | `test_valid_csv_returns_aggregates_and_export_has_no_source_email` | CSV válido se analiza, retorna agregados, export no contiene emails de clientes |
| ✅ Caso límite | `test_empty_upload_returns_descriptive_400` | CSV vacío → 400 descriptivo |
| ✅ Caso límite | `test_export_before_analysis_returns_404` | Export sin análisis previo → 404 |
| ✅ Modo fallo | `test_wrong_extension_returns_415` | Archivo no CSV → 415 |
| ✅ Modo fallo | `test_incident_routes_reject_missing_or_invalid_session` | Sin auth o token inválido → 401 |

---

## Suite 4: Utilidades TypeScript (FE-019 — Extra)

Cubre funciones de validación en `src/utils/validation.ts`.

| Función | Tipo | Prueba | Lo que verifica |
|---------|------|--------|-----------------|
| `validateProduct` | ✅ Camino feliz | Producto válido → `{valid: true, errors: []}` |
| `validateProduct` | ✅ Modo fallo | SKU vacío, weightKg=0, weightKg>100, dimensiones fuera de rango, stock/minStock negativo, unitCost=0 |
| `validateShipment` | ✅ Camino feliz | Envío válido → `{valid: true, errors: []}` |
| `validateShipment` | ✅ Modo fallo | quantity=0, declaredValueUSD=0, distanceKm negativo |
| `validateCarrier` | ✅ Camino feliz | Transportista válido → `{valid: true, errors: []}` |
| `validateCarrier` | ✅ Modo fallo | baseRateUSD negativo, avgDeliveryDays=0, onTimeRate >100, maxWeightKg=0, operatesIn vacío |

---

## Cobertura alcanzada

### Backend (pytest --cov)

```
Módulo              Stmts   Miss  Cover
app/auth.py           149     34    77%
app/security.py        74      5    93%
app/email.py           32      6    81%
app/storage.py        106      1    99%
app/user_service.py    28      0   100%
app/domains/suppliers/* 190    8    96%
app/domains/incidents/* 176   37    79%
...
Total                 1004    97    90%
```

**Autenticación (auth.py + security.py + email.py + storage.py + user_service.py):** superior al 70% ✅

### Frontend (Jest --coverage)

```
File                  | % Stmts | % Branch | % Funcs | % Lines
validations.ts        |     100 |      100 |     100 |     100
collections.ts        |       0 |        0 |       0 |       0
search.ts             |       0 |        0 |       0 |       0
transformations.ts    |       0 |        0 |       0 |       0
Total (4 files)       |   30.82 |    52.27 |    8.82 |   32.57
```

> **Nota:** `validations.ts` tiene cobertura del 100%. Los otros archivos de utilidad (`collections.ts`, `search.ts`, `transformations.ts`) no tienen tests aún porque están fuera del alcance del ticket FE-019, que pedía al menos 3 funciones.