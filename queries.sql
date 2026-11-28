-- ============================================================
-- EduTrack — Queries de Auditoría de Datos (Q1–Q9)
-- ============================================================
-- Analista: Angel Tovar
-- Fecha: 2026-11-28
-- Base de datos: edutrack.db (SQLite)
-- Tabla objetivo: enrollments
-- ============================================================

-- ------------------------------------------------------------
-- Q1: Verificación — visualizar los primeros 5 registros
-- ------------------------------------------------------------
SELECT id, student_name, course_title, category, completion_percentage,
       passed, monthly_fee_paid, instructor
FROM enrollments
LIMIT 5;

-- ------------------------------------------------------------
-- Q2: Total de inscripciones registradas
-- ------------------------------------------------------------
SELECT COUNT(*) AS total_enrollments
FROM enrollments;

-- ------------------------------------------------------------
-- Q3: Identificar estudiantes con progreso bajo (< 30%)
-- ------------------------------------------------------------
SELECT id, student_name, course_title, category, completion_percentage,
       enrollment_date, instructor
FROM enrollments
WHERE completion_percentage < 30
ORDER BY completion_percentage ASC, student_name;

-- ------------------------------------------------------------
-- Q4: Identificar cuentas @test.com (SELECT previo a DELETE)
-- ------------------------------------------------------------
SELECT id, student_name, student_email, course_title, completion_percentage
FROM enrollments
WHERE student_email LIKE '%@test.com'
ORDER BY id;

-- ------------------------------------------------------------
-- Q4b: Ejecutar DELETE de cuentas @test.com
-- ------------------------------------------------------------
DELETE FROM enrollments
WHERE student_email LIKE '%@test.com';

-- ------------------------------------------------------------
-- Q4c: Verificar que no queden registros @test.com
-- ------------------------------------------------------------
SELECT COUNT(*) AS registros_test_restantes
FROM enrollments
WHERE student_email LIKE '%@test.com';

-- ------------------------------------------------------------
-- Q5: Identificar registros con instructor NULL (SELECT previo a UPDATE)
-- ------------------------------------------------------------
SELECT id, student_name, course_title, category, enrollment_date, monthly_fee_paid
FROM enrollments
WHERE instructor IS NULL
ORDER BY id;

-- ------------------------------------------------------------
-- Q5b: Actualizar registros con instructor NULL
-- ------------------------------------------------------------
UPDATE enrollments
SET instructor = 'Carlos Vega'
WHERE instructor IS NULL;

-- ------------------------------------------------------------
-- Q5c: Verificar que no queden instructores NULL
-- ------------------------------------------------------------
SELECT COUNT(*) AS instructores_nulos_restantes
FROM enrollments
WHERE instructor IS NULL;

-- ------------------------------------------------------------
-- Q6: Insertar inscripción faltante
--      (Lucia Fernandes → Advanced Python, confirmada por email)
-- ------------------------------------------------------------
INSERT INTO enrollments (id, student_id, student_name, student_email, course_id,
                         course_title, category, enrollment_date, completion_percentage,
                         passed, monthly_fee_paid, instructor)
VALUES (18, 3, 'Lucia Fernandes', 'lucia.fernandes@student.edutrack.com',
        5, 'Advanced Python', 'Programming', '2025-04-01',
        0, FALSE, 69.99, 'Carlos Vega');

-- ------------------------------------------------------------
-- Q6b: Verificar la inscripción insertada
-- ------------------------------------------------------------
SELECT * FROM enrollments WHERE id = 18;

-- ------------------------------------------------------------
-- Q7: Cifras agregadas por categoría de curso
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Q7b: Ranking de categorías por rendimiento (descendente)
-- ------------------------------------------------------------
SELECT category,
       ROUND(AVG(completion_percentage), 1) AS avg_completion,
       ROUND(SUM(monthly_fee_paid), 2)       AS total_revenue,
       ROUND(AVG(monthly_fee_paid), 2)       AS avg_fee
FROM enrollments
GROUP BY category
ORDER BY avg_completion DESC;

-- ------------------------------------------------------------
-- Q7c: Ingresos totales cobrados en toda la tabla
-- ------------------------------------------------------------
SELECT SUM(monthly_fee_paid) AS ingresos_totales
FROM enrollments;

-- ------------------------------------------------------------
-- Q8: Estudiantes con múltiples inscripciones
-- ------------------------------------------------------------
SELECT student_name,
       COUNT(*)                        AS inscripciones,
       ROUND(AVG(completion_percentage), 1) AS avg_completion
FROM enrollments
GROUP BY student_name
HAVING COUNT(*) > 1
ORDER BY inscripciones DESC, avg_completion ASC;

-- ------------------------------------------------------------
-- Q9: Categoría con peor rendimiento (menor % completado promedio)
-- ------------------------------------------------------------
SELECT category,
       ROUND(AVG(completion_percentage), 1) AS avg_completion,
       COUNT(*)                             AS inscripciones,
       SUM(CASE WHEN completion_percentage < 30
                 THEN 1 ELSE 0 END)          AS en_riesgo
FROM enrollments
GROUP BY category
ORDER BY avg_completion ASC
LIMIT 1;