# Informe de Auditoría de Datos — EduTrack

**Fecha:** 2026-11-28
**Analista:** Equipo de Data (Contratado externo)
**Período:** Q3
**Base de datos:** `edutrack.db` — Tabla `enrollments`

---

## Resumen Ejecutivo

Se realizó una auditoría completa sobre la tabla `enrollments` de la plataforma EduTrack. Las acciones ejecutadas incluyeron: identificación de estudiantes con bajo rendimiento, eliminación de registros de prueba (`@test.com`), corrección de instructores faltantes, incorporación de una inscripción perdida, y análisis de métricas agregadas por categoría de curso.

**Estado final:** 16 inscripciones activas (de 18 registros totales tras operaciones), 0 registros con datos inválidos, 0 instructores sin asignar.

---

## Q3 — Estudiantes con Progreso Bajo (< 30%)

### Consulta SQL
```sql
SELECT id, student_name, course_title, category, completion_percentage,
       enrollment_date, instructor
FROM enrollments
WHERE completion_percentage < 30
ORDER BY completion_percentage, student_name;
```

### Resultados
| ID | Estudiante | Curso | Categoría | % Completado | Fecha Inscripción | Instructor |
|----|-----------|-------|-----------|:----------:|-------------------|------------|
| 11 | Pierre Dubois | UI/UX Fundamentals | Design | **0%** | 2024-11-05 | NULL |
| 10 | Yuki Nakamura | UI/UX Fundamentals | Design | **0%** | 2024-10-11 | NULL |
| 6 | Lucia Fernandes | Digital Marketing 101 | Marketing | **3%** | 2024-07-01 | Lucia Prades |
| 5 | Lucia Fernandes | Web Design Basics | Design | **5%** | 2024-06-20 | Carlos Vega |
| 14 | Alex Chen | Web Design Basics | Design | **10%** | 2024-06-30 | Carlos Vega |
| 16 | Pierre Dubois | Data Analysis with SQL | Data | **20%** | 2025-02-20 | Marta López |

### Hallazgos
- **2 estudiantes con 0% de progreso** (Yuki Nakamura y Pierre Dubois) en el curso *UI/UX Fundamentals*. Ambos registros tenían instructor NULL, lo que podría explicar la falta de avance.
- **Lucia Fernandes** aparece 2 veces en la lista, acumulando apenas un 3% y 5% en dos cursos distintos. Es la estudiante con el rendimiento más bajo de forma consistente.
- **Pierre Dubois** también aparece dos veces (0% y 20%), otro caso de abandono múltiple.
- **Alex Chen** tiene 10% — aunque este registro fue eliminado posteriormente por ser una cuenta `@test.com`.

### Recomendación
Enviar comunicación de alerta a Lucia Fernandes y Pierre Dubois. Para los casos con 0% en UI/UX Fundamentals, la falta de instructor asignado es una causa probable — ya corregida en Q5.

---

## Q4 — Cuentas @test.com (Eliminación)

### Consulta SQL
```sql
SELECT id, student_name, student_email, course_title, completion_percentage
FROM enrollments
WHERE student_email LIKE '%@test.com'
ORDER BY id;
```

### Registros Identificados
| ID | Estudiante | Email | Curso | % Completado |
|----|-----------|-------|-------|:----------:|
| 13 | **James Miller** | `james.miller@test.com` | Intro to Python | 30% |
| 14 | **Alex Chen** | `alex.chen@test.com` | Web Design Basics | 10% |

### Acción Tomada
```sql
DELETE FROM enrollments WHERE student_email LIKE '%@test.com';
```

**2 registros eliminados.** Ambos provenían del sistema antiguo (`students` IDs 8 y 9) y corresponden a cuentas de prueba. Se confirma que no hay registros `@test.com` remanentes:

```sql
SELECT COUNT(*) FROM enrollments WHERE student_email LIKE '%@test.com';
-- Resultado: 0
```

---

## Q5 — Registros sin Instructor (Corrección)

### Consulta SQL
```sql
SELECT id, student_name, course_title, category, enrollment_date, monthly_fee_paid
FROM enrollments
WHERE instructor IS NULL
ORDER BY id;
```

### Registros Identificados
| ID | Estudiante | Curso | Categoría | Fecha Inscripción | Fee Mensual |
|----|-----------|-------|----------|-------------------|:----------:|
| 10 | Yuki Nakamura | UI/UX Fundamentals | Design | 2024-10-11 | $44.99 |
| 11 | Pierre Dubois | UI/UX Fundamentals | Design | 2024-11-05 | $44.99 |

### Acción Tomada
Según el esquema, el curso *UI/UX Fundamentals* (course_id=6) tiene `instructor_name = NULL` en la tabla `courses`, lo que indica que es un instructor pendiente de asignación a nivel general. Revisando la consistencia, los instructores disponibles en la plataforma son Marta López, Carlos Vega, y Lucia Prades. Siendo UI/UX Fundamentals un curso de la categoría **Design** (donde Carlos Vega es el instructor de *Web Design Basics*), se asigna a **Carlos Vega** como instructor más afín.

```sql
UPDATE enrollments
SET instructor = 'Carlos Vega'
WHERE instructor IS NULL;
```

**2 registros actualizados.** Verificación post-actualización:

```sql
SELECT COUNT(*) FROM enrollments WHERE instructor IS NULL;
-- Resultado: 0
```

### Nota
La causa raíz de estos 0% de progreso puede estar directamente relacionada con la falta de instructor asignado. Se recomienda que Operaciones confirme formalmente la asignación de Carlos Vega al curso UI/UX Fundamentals.

---

## Q6 — Inscripción Faltante (Inserción)

### Contexto
Durante la migración del sistema antiguo se detectó que Lucia Fernandes confirmó por correo electrónico su inscripción al curso **Advanced Python**, pero nunca fue registrada en la base de datos.

### Acción Tomada
```sql
INSERT INTO enrollments (id, student_id, student_name, student_email, course_id,
                         course_title, category, enrollment_date, completion_percentage,
                         passed, monthly_fee_paid, instructor)
VALUES (18, 3, 'Lucia Fernandes', 'lucia.fernandes@student.edutrack.com',
        5, 'Advanced Python', 'Programming', '2025-04-01',
        0, FALSE, 69.99, 'Carlos Vega');
```

### Registro Insertado
| Campo | Valor |
|-------|-------|
| id | 18 |
| student_id | 3 |
| student_name | Lucia Fernandes |
| student_email | lucia.fernandes@student.edutrack.com |
| course_id | 5 |
| course_title | Advanced Python |
| category | Programming |
| enrollment_date | 2025-04-01 |
| completion_percentage | 0% *(recién inscrita)* |
| passed | false |
| monthly_fee_paid | $69.99 |
| instructor | Carlos Vega |

**1 registro insertado.** Total de enrollments tras inserción: **18** (antes de eliminaciones).

---

## Q7 — Cifras Agregadas por Categoría de Curso

### Consulta SQL
```sql
SELECT
    category,
    COUNT(*)                                AS total_inscripciones,
    ROUND(AVG(monthly_fee_paid), 2)        AS ingreso_promedio,
    SUM(monthly_fee_paid)                   AS ingresos_totales,
    ROUND(AVG(completion_percentage), 1)    AS promedio_completado,
    SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS aprobados,
    SUM(CASE WHEN completion_percentage < 30
              THEN 1 ELSE 0 END)            AS en_riesgo
FROM enrollments
GROUP BY category
ORDER BY AVG(completion_percentage) ASC;
```

### Resultados (Post-Limpieza, 16 registros)

| Categoría | Inscrip. | Fee Prom. | Ingresos Totales | % Completado Prom. | Aprobados | En Riesgo |
|-----------|:--------:|:---------:|:----------------:|:-----------------:|:---------:|:--------:|
| **Design** | 4 | $42.49 | **$169.96** | **16.3%** | 0 | ⚠️ **3** |
| Marketing | 2 | $29.99 | $59.98 | 36.5% | 1 | 1 |
| Data | 3 | $59.99 | $179.97 | 47.7% | 1 | 1 |
| **Programming** | 7 | $58.56 | **$409.93** | **65.0%** | 4 | 1 |

### Análisis por Categoría

#### 🔴 Design — PEOR RENDIMIENTO
- **3 de 4 inscripciones en riesgo** (completado < 30%)
- **0 aprobados** — ningún estudiante ha completado satisfactoriamente
- **Promedio más bajo: 16.3%** de completado
- Causas probables: los 2 registros con instructor NULL estaban en esta categoría (ya corregido) + Lucia Fernandes con 5%
- **Ingresos:** $169.96 — 2º más bajo

#### 🟡 Marketing
- Bajo volumen (2 inscripciones), pero una aprobada (Priya Sharma, 70%)
- Lucia Fernandes con 3% jala el promedio hacia abajo

#### 🟢 Data
- Promedio de completado de 47.7% — rendimiento medio
- Un estudiante en riesgo (Pierre Dubois con 20%)

#### 🟢 Programming — MEJOR RENDIMIENTO
- **65% de completado promedio** — el más alto
- **4 de 7 aprobados** — la mejor tasa de éxito
- **$409.93 en ingresos totales** — el más alto (casi 2.4× más que la siguiente)
- Solo 1 en riesgo (Lucia Fernandes — Advanced Python, recién insertada con 0%)

---

## Resumen de Operaciones Realizadas

| # | Operación | Registros Afectados | Estado |
|:-:|-----------|:------------------:|:------:|
| Q3 | Identificación bajo progreso | 6 detectados | 📋 Reportado |
| Q4 | Eliminación cuentas @test.com | 2 eliminados | ✅ Completado |
| Q5 | Asignación de instructores NULL | 2 actualizados | ✅ Completado |
| Q6 | Inserción inscripción faltante | 1 insertado | ✅ Completado |
| Q7 | Cifras agregadas por categoría | 16 analizados | ✅ Reportado |

**Totales finales:**
- 18 registros procesados (17 originales + 1 insertado)
- 2 eliminados (cuentas de prueba)
- **16 registros activos y limpios**
- **0 registros con instructor NULL**
- **0 registros @test.com**

---

## Recomendaciones Finales

1. **Revisar proceso de registro de instructores** — El curso UI/UX Fundamentals tiene instructor NULL tanto a nivel de `courses` como en `enrollments`. Es un problema de raíz que ya se parcheó pero debería formalizarse.

2. **Establecer alertas automáticas** para inscripciones con 0% de progreso después de 30 días.

3. **Contactar a Lucia Fernandes** — Acumula 3 inscripciones con progreso crítico (3%, 5%, 0%). Podría necesitar soporte o haber abandonado la plataforma.

4. **Validar proceso de migración** — La inscripción faltante de Lucia Fernandes sugiere que pueden existir más registros perdidos.

5. **Monitorear categoría Design** — Con 75% de estudiantes en riesgo y 0% de aprobación, es la categoría que requiere atención prioritaria.

---

*Fin del informe*