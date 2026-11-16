@# TrackFlow — progreso del proyecto

## Integración administrativa (validación pendiente)

- PR #5 (`feat(suppliers): add supplier directory`) verificado como fusionado en `main`; repositorio local actualizado desde `main` antes de comenzar esta integración.
- Rama de trabajo: `feature/unified-admin-ui` (sin commit ni push).
- En la rama `feature/unified-admin-ui` se consolidan las interfaces privadas en `uis/backoffice/`: operaciones `/`, candidaturas `/candidates` y `/candidates/[id]`, proveedores `/suppliers` e incidencias `/incidents`.
- Las métricas de operaciones son ilustrativas; proveedores e incidencias usan autenticación FastAPI. La aplicación de candidaturas mantiene su API configurada por separado.
- Los `.env.example` documentan configuración; los archivos locales `.env.local` deben crearse manualmente y no compartirse. `services/api/.env.example` documenta `TRACKFLOW_UI_ORIGINS`.
- Se ejecutaron anteriormente 76 pruebas de API y 7 del analizador; todas pasaron. La validación de lint/build frontend para esta reorganización está pendiente.
- Se añadieron Tailwind CSS 4.3.3 y su plugin PostCSS a las dependencias de `backoffice`, a petición/aprobación del usuario; `npm ci` sincronizó el lockfile correctamente.

## Estado actual

- El frontend administrativo activo para nuevas interfaces es `uis/backoffice/`, con Next.js App Router, React, TypeScript y Tailwind; el backend usa FastAPI con uv.
- La web pública sigue siendo estática. En `backoffice`, el dashboard de operaciones es ilustrativo y proveedores/análisis CSV consumen la API autenticada en `services/api/`.
- AUTH-01 usa JWT stateless, usuarios y perfiles exclusivamente en TinyDB y no utiliza cookies ni sesiones de servidor. La clave y `ACCESS_TOKEN_EXPIRE_MINUTES` se exigen por entorno.
- `/users` permite registro público solo en `POST`; las demás rutas de usuarios requieren JWT y GET por ID es solo propio/admin. Perfiles e incidencias requieren JWT; acceso ajeno devuelve `403`, y el perfil no se puede eliminar sin borrar su usuario.
- Los hashes nuevos usan `bcrypt` de libpass. `/docs` sirvió Swagger UI; el flujo HTTP de registro, login y ruta protegida se verificó localmente con datos ficticios.
- Verificación de esta iteración: 76 pruebas de API y 7 del analizador aprobadas. No existe runner global de pruebas.
- Las instrucciones globales y por carpeta establecen aprobación previa para añadir, eliminar o actualizar dependencias. La sincronización de paquetes ya declarados requiere lockfile compatible sin cambios de versiones.
- PR #5 está fusionado en `main`; la integración posterior continúa en `feature/unified-admin-ui`. El flujo interactivo contra la API requiere una cuenta de prueba.
- Las comprobaciones de carga automática en VS Code y comportamiento del agente en nuevas solicitudes quedan pendientes de validación manual.

## Próximos pasos previstos
1. Ejecutar lint, typecheck y build desde `uis/backoffice/`; validar visualmente las cuatro áreas y revisar compatibilidad de la versión destino de Next.js.
2. Consolidación de interfaces privadas en `uis/backoffice/`; en `uis/` deben quedar únicamente `website/` y `backoffice/`.
3. Validar en navegador los flujos de proveedores y análisis CSV contra la API local, con una cuenta y archivos de prueba ficticios.
4. Para nuevas integraciones, acordar fuente de datos, propietario, contrato API, autenticación, privacidad, manejo de errores y criterios de aceptación antes de implementarlas bajo `services/`.

## Limitaciones conocidas

El contexto empresarial describe necesidades objetivo, no capacidades ya entregadas. Las métricas visibles de operaciones son datos de demostración; el sitio y el dashboard aún no están conectados a WMS, ERP, transportistas, CRM ni sistemas de tickets. Cualquier prueba manual de navegador debe indicarse por separado de las comprobaciones automatizadas.

La identidad local usa TinyDB con un único proceso y no ofrece transacciones, MFA, recuperación de contraseña ni limitación de intentos. La autorización por rol se limita a la gestión de usuarios; no es un sistema general de permisos. La clave JWT es externa y obligatoria; no se han creado cuentas reales ni migrado bases existentes para asignar administradores. El despliegue público requiere controles adicionales. Consulta `services/api/README.md` para el alta inicial y las restricciones.
