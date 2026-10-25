# TrackFlow — progreso del proyecto

## Estado actual

- La web pública y el backoffice siguen siendo interfaces estáticas; el backend de incidencias y autenticación vive en `services/api/`.
- AUTH-01 usa JWT stateless, usuarios y perfiles exclusivamente en TinyDB y no utiliza cookies ni sesiones de servidor. La clave y `ACCESS_TOKEN_EXPIRE_MINUTES` se exigen por entorno.
- `/users` permite registro público solo en `POST`; las demás rutas de usuarios requieren JWT y GET por ID es solo propio/admin. Perfiles e incidencias requieren JWT; acceso ajeno devuelve `403`, y el perfil no se puede eliminar sin borrar su usuario.
- Los hashes nuevos usan `bcrypt` de libpass. `/docs` sirvió Swagger UI; el flujo HTTP de registro, login y ruta protegida se verificó localmente con datos ficticios.
- Verificación actual: 71 pruebas de API y 4 del analizador, todas aprobadas. No existe runner global de pruebas.
- Cambios en `feature/auth-api`; no se creó commit ni pull request.

## Próximos pasos previstos
1. Adaptar las llamadas del backoffice al login y al envío de tokens sin inferir contratos de sistemas heredados que no están documentados.
2. Para una primera integración, acordar fuente de datos, propietario, contrato API, autenticación, privacidad, manejo de errores y criterios de aceptación antes de implementarla bajo `services/`.
3. Validar el backoffice con usuarios de operaciones y decidir qué módulo aporta más valor (inventario, transportistas, devoluciones o experiencia de cliente).
4. Establecer pruebas automatizadas y observabilidad conforme se incorporen servicios reales.

## Limitaciones conocidas

El contexto empresarial describe necesidades objetivo, no capacidades ya entregadas. Las métricas visibles del backoffice son datos de demostración; el sitio y el dashboard aún no están conectados a WMS, ERP, transportistas, CRM ni sistemas de tickets. Cualquier prueba manual de navegador debe indicarse por separado de las comprobaciones automatizadas.

La identidad local usa TinyDB con un único proceso y no ofrece transacciones, MFA, recuperación de contraseña ni limitación de intentos. La autorización por rol se limita a la gestión de usuarios; no es un sistema general de permisos. La clave JWT es externa y obligatoria; no se han creado cuentas reales ni migrado bases existentes para asignar administradores. El despliegue público requiere controles adicionales. Consulta `services/api/README.md` para el alta inicial y las restricciones.
