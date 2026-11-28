# EduTrack — Informe de Auditoría de Datos (Q3)

**Fecha del análisis:** 2026-11-28
**Analista:** Angel Tovar (contratado externo)
**Período:** Q3
**Base de datos:** edutrack.db — Tabla: `enrollments`

---

## Q1 — Verificación inicial

**Consulta:** `SELECT id, student_name, course_title, category, completion_percentage, passed, monthly_fee_paid, instructor FROM enrollments LIMIT 5;`

**Resultado:**

| id | student_name | course_title | category | completion_percentage | passed | monthly_fee_paid | instructor |
|----|-------------|-------------|----------|:-------------------:|:-----:|:---------------:|-----------|
| 1 | Emily Watson | Intro to Python | Programming | 85 | 1 | 49.99 | Marta López |
| 2 | Emily Watson | Web Design Basics | Design | 60 | 0 | 39.99 | Carlos Vega |
| 3 | Klaus Weber | Intro to Python | Programming | 92 | 1 | 49.99 | Marta López |
| 4 | Klaus Weber | Data Analysis with SQL | Data | 78 | 1 | 59.99 | Marta López |
| 5 | Lucia Fernandes | Web Design Basics | Design | 5 | 0 | 39.99 | Carlos Vega |

Los datos se importaron correctamente. Se observan 5 registros iniciales con distintos niveles de progreso.

---

## Q2 — Total de inscripciones

**Consulta:** `SELECT COUNT(*) AS total_enrollments FROM enrollments;`

**Resultado:** 17

La tabla `enrollments` contiene **17 inscripciones** antes de cualquier modificación.

---

## Q3 — Estudiantes con progreso bajo (< 30%)

**Consulta:**
```sql
SELECT id, student_name, course_title, category, completion_percentage,
       enrollment_date, instructor
FROM enrollments
WHERE completion_percentage < 30
ORDER BY completion_percentage ASC, student_name;
```

**Resultado:** 6 filas

| id | student_name | course_title | category | completion_percentage | enrollment_date | instructor |
|----|-------------|-------------|----------|:-------------------:|-----------------|-----------|
| 11 | Pierre Dubois | UI/UX Fundamentals | Design | 0 | 2024-11-05 | NULL |
| 10 | Yuki Nakamura | UI/UX Fundamentals | Design | 0 | 2024-10-11 | NULL |
| 6 | Lucia Fernandes | Digital Marketing 101 | Marketing | 3 | 2024-07-01 | Lucia Prades |
| 5 | Lucia Fernandes | Web Design Basics | Design | 5 | 2024-06-20 | Carlos Vega |
| 14 | Alex Chen | Web Design Basics | Design | 10 | 2024-06-30 | Carlos Vega |
| 16 | Pierre Dubois | Data Analysis with SQL | Data | 20 | 2025-02-20 | Marta López |

Se identificaron **6 inscripciones** con progreso inferior al 30%. Destacan:
- **Yuki Nakamura y Pierre Dubois** con 0% en *UI/UX Fundamentals* (ambos con instructor NULL — posible causa raíz).
- **Lucia Fernandes** aparece 2 veces en la lista (3% y 5%), siendo la estudiante con rendimiento más bajo de forma consistente.

---

## Q4 — Cuentas @test.com

**Consulta previa (SELECT):**
```sql
SELECT id, student_name, student_email, course_title, completion_percentage
FROM enrollments
WHERE student_email LIKE '%@test.com'
ORDER BY id;
```

**Resultado del SELECT:** 2 filas

| id | student_name | student_email | course_title | completion_percentage |
|----|-------------|--------------|-------------|:-------------------:|
| 13 | James Miller | james.miller@test.com | Intro to Python | 30 |
| 14 | Alex Chen | alex.chen@test.com | Web Design Basics | 10 |

**DELETE ejecutado:**
```sql
DELETE FROM enrollments WHERE student_email LIKE '%@test.com';
```

**Verificación post-DELETE:**
```sql
SELECT COUNT(*) AS registros_test_restantes FROM enrollments WHERE student_email LIKE '%@test.com';
```

**Resultado:** 0

Se eliminaron **2 registros** de prueba importados del sistema antiguo. No quedan cuentas `@test.com` en la tabla.

---

## Q5 — Registros con instructor NULL

**Consulta previa (SELECT):**
```sql
SELECT id, student_name, course_title, category, enrollment_date, monthly_fee_paid
FROM enrollments
WHERE instructor IS NULL
ORDER BY id;
```

**Resultado del SELECT:** 2 filas

| id | student_name | course_title | category | enrollment_date | monthly_fee_paid |
|----|-------------|-------------|----------|-----------------|:---------------:|
| 10 | Yuki Nakamura | UI/UX Fundamentals | Design | 2024-10-11 | 44.99 |
| 11 | Pierre Dubois | UI/UX Fundamentals | Design | 2024-11-05 | 44.99 |

**UPDATE ejecutado:**
```sql
UPDATE enrollments SET instructor = 'Carlos Vega' WHERE instructor IS NULL;
```

**Verificación post-UPDATE:**
```sql
SELECT COUNT(*) AS instructores_nulos_restantes FROM enrollments WHERE instructor IS NULL;
```

**Resultado:** 0

Se actualizaron **2 registros** que llegaron sin instructor desde una integración con un partner. Se asignó **Carlos Vega** como instructor, siendo el instructor más afín a la categoría Design.

---

## Q6 — Inscripción faltante

**INSERT ejecutado:**
```sql
INSERT INTO enrollments (id, student_id, student_name, student_email, course_id,
                         course_title, category, enrollment_date, completion_percentage,
                         passed, monthly_fee_paid, instructor)
VALUES (18, 3, 'Lucia Fernandes', 'lucia.fernandes@student.edutrack.com',
        5, 'Advanced Python', 'Programming', '2025-04-01',
        0, FALSE, 69.99, 'Carlos Vega');
```

**Verificación:**
```sql
SELECT * FROM enrollments WHERE id = 18;
```

**Resultado:**

| id | student_id | student_name | student_email | course_id | course_title | category | enrollment_date | completion_percentage | passed | monthly_fee_paid | instructor |
|----|-----------|-------------|--------------|---------|-------------|----------|---------------|:-------------------:|:-----:|:---------------:|-----------|
| 18 | 3 | Lucia Fernandes | lucia.fernandes@student.edutrack.com | 5 | Advanced Python | Programming | 2025-04-01 | 0 | 0 | 69.99 | Carlos Vega |

Se insertó **1 registro** correspondiente a la inscripción de Lucia Fernandes en *Advanced Python* que fue confirmada por correo pero nunca registrada en el sistema.

---

## Q7 — Cifras agregadas por categoría de curso

**Consulta:**
```sql
SELECT category,
       COUNT(*)                                  AS total_inscripciones,
       ROUND(AVG(monthly_fee_paid), 2)           AS fee_promedio,
       SUM(monthly_fee_paid)                     AS ingresos_totales,
       ROUND(AVG(completion_percentage), 1)       AS completado_promedio,
       SUM(CASE WHEN passed THEN 1 ELSE 0 END)    AS aprobados,
       SUM(CASE WHEN completion_percentage < 30
                 THEN 1 ELSE 0 END)               AS en_riesgo
FROM enrollments
GROUP BY category
ORDER BY completado_promedio ASC;
```

**Resultado:** 4 filas

| category | total_inscripciones | fee_promedio | ingresos_totales | completado_promedio | aprobados | en_riesgo |
|---------|:-----------------:|:-----------:|:---------------:|:-----------------:|:--------:|:--------:|
| Design | 4 | 42.49 | 169.96 | 16.3 | 0 | 3 |
| Marketing | 2 | 29.99 | 59.98 | 36.5 | 1 | 1 |
| Data | 3 | 59.99 | 179.97 | 47.7 | 1 | 1 |
| Programming | 7 | 58.56 | 409.93 | 65.0 | 4 | 1 |

---

## Q7b — Ranking de categorías por rendimiento

**Consulta:**
```sql
SELECT category,
       ROUND(AVG(completion_percentage), 1) AS avg_completion,
       ROUND(SUM(monthly_fee_paid), 2)       AS total_revenue,
       ROUND(AVG(monthly_fee_paid), 2)       AS avg_fee
FROM enrollments
GROUP BY category
ORDER BY avg_completion DESC;
```

**Resultado:**

| category | avg_completion | total_revenue | avg_fee |
|---------|:-------------:|:------------:|:------:|
| Programming | 65.0 | 409.93 | 58.56 |
| Data | 47.7 | 179.97 | 59.99 |
| Marketing | 36.5 | 59.98 | 29.99 |
| Design | 16.3 | 169.96 | 42.49 |

---

## Q7c — Ingresos totales cobrados

**Consulta:**
```sql
SELECT SUM(monthly_fee_paid) AS ingresos_totales FROM enrollments;
```

**Resultado:** 819.84

Los ingresos totales cobrados en la plataforma ascienden a **$819.84**.

---

## Q8 — Estudiantes con múltiples inscripciones

**Consulta:**
```sql
SELECT student_name,
       COUNT(*)                        AS inscripciones,
       ROUND(AVG(completion_percentage), 1) AS avg_completion
FROM enrollments
GROUP BY student_name
HAVING COUNT(*) > 1
ORDER BY inscripciones DESC, avg_completion ASC;
```

**Resultado:** 7 filas

| student_name | inscripciones | avg_completion |
|-------------|:------------:|:-------------:|
| Lucia Fernandes | 3 | 2.7 |
| Emily Watson | 3 | 61.7 |
| Yuki Nakamura | 2 | 22.5 |
| Priya Sharma | 2 | 62.5 |
| Pierre Dubois | 2 | 10.0 |
| Marco Rossi | 2 | 91.5 |
| Klaus Weber | 2 | 85.0 |

Hay **7 estudiantes** con más de una inscripción. Destaca **Lucia Fernandes** con 3 inscripciones y apenas 2.7% de completado promedio. En el extremo opuesto, **Marco Rossi** tiene 91.5% de promedio en sus 2 cursos.

---

## Q9 — Categoría con peor rendimiento

**Consulta:**
```sql
SELECT category,
       ROUND(AVG(completion_percentage), 1) AS avg_completion,
       COUNT(*)                             AS inscripciones,
       SUM(CASE WHEN completion_percentage < 30
                 THEN 1 ELSE 0 END)          AS en_riesgo
FROM enrollments
GROUP BY category
ORDER BY avg_completion ASC
LIMIT 1;
```

**Resultado:**

| category | avg_completion | inscripciones | en_riesgo |
|---------|:-------------:|:------------:|:--------:|
| Design | 16.3 | 4 | 3 |

**Design** es la categoría con peor rendimiento:
- **16.3%** de completado promedio (el más bajo)
- **0 estudiantes aprobados** de 4 inscritos
- **3 de 4 estudiantes en riesgo** (completado < 30%)
- Causa principal: los 2 registros con instructor NULL pertenecían a esta categoría, más Lucia Fernandes con 5% en Web Design Basics

---

## Resumen de operaciones

| Operación | Tipo | Registros afectados |
|-----------|------|:------------------:|
| Q4 — DELETE cuentas @test.com | Eliminación | 2 |
| Q5 — UPDATE instructores NULL | Actualización | 2 |
| Q6 — INSERT inscripción faltante | Inserción | 1 |
| **Total neto** | → | **16 registros activos** |

**Estado final de la base de datos:**
- 16 inscripciones activas y limpias
- 0 registros con instructor NULL
- 0 cuentas @test.com remanentes
- Ingresos totales: $819.84
- Categoría con peor rendimiento: **Design** (16.3% completado)
- Estudiante más crítica: **Lucia Fernandes** (3 inscripciones, 2.7% promedio)

---

*Fin del informe — EduTrack Data Audit Q3*