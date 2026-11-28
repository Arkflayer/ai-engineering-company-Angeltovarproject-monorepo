-- ============================================================
-- EduTrack — Database for analysis (Day 36)
-- ============================================================
-- Instructions:
-- 1. Open the SQL Editor in your Supabase project
-- 2. Paste the entire contents of this file and run it
-- 3. Verify with: SELECT * FROM enrollments LIMIT 5;
--
-- NOTE: The `students` and `courses` tables exist as context
-- for the future schema. Do NOT modify them in this project.
-- All your work is on the `enrollments` table.
-- ============================================================


-- ------------------------------------------------------------
-- TABLE: students (context only — do not modify)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;

CREATE TABLE students (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    signup_date     DATE NOT NULL
);

-- ------------------------------------------------------------
-- TABLE: courses (context only — do not modify)
-- ------------------------------------------------------------
CREATE TABLE courses (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    category        VARCHAR(50)  NOT NULL,
    instructor_name VARCHAR(100),
    monthly_fee     DECIMAL(6,2) NOT NULL
);

-- ------------------------------------------------------------
-- TABLE: enrollments (this is where you will work)
-- ------------------------------------------------------------
CREATE TABLE enrollments (
    id                    SERIAL PRIMARY KEY,
    student_id            INTEGER      NOT NULL,
    student_name          VARCHAR(100) NOT NULL,
    student_email         VARCHAR(150) NOT NULL,
    course_id             INTEGER      NOT NULL,
    course_title          VARCHAR(150) NOT NULL,
    category              VARCHAR(50)  NOT NULL,
    enrollment_date       DATE         NOT NULL,
    completion_percentage INTEGER      NOT NULL DEFAULT 0,
    passed                BOOLEAN      NOT NULL DEFAULT FALSE,
    monthly_fee_paid      DECIMAL(6,2) NOT NULL,
    instructor            VARCHAR(100)           -- can be NULL (pending data)
);


-- ------------------------------------------------------------
-- DATA: students
-- ------------------------------------------------------------
INSERT INTO students (id, name, email, signup_date) VALUES
(1,  'Emily Watson',      'emily.watson@student.edutrack.com',   '2024-01-15'),
(2,  'Klaus Weber',       'klaus.weber@student.edutrack.com',    '2024-01-20'),
(3,  'Lucia Fernandes',   'lucia.fernandes@student.edutrack.com', '2024-02-03'),
(4,  'Marco Rossi',       'marco.rossi@student.edutrack.com',    '2024-02-10'),
(5,  'Yuki Nakamura',     'yuki.nakamura@student.edutrack.com',  '2024-03-05'),
(6,  'Pierre Dubois',     'pierre.dubois@student.edutrack.com',  '2024-03-18'),
(7,  'Priya Sharma',      'priya.sharma@student.edutrack.com',   '2024-04-01'),
(8,  'James Miller',      'james.miller@test.com',               '2024-04-12'),  -- test record
(9,  'Alex Chen',         'alex.chen@test.com',                  '2024-04-12'),  -- test record
(10, 'Hans Schneider',    'hans.schneider@student.edutrack.com', '2024-05-07');

-- ------------------------------------------------------------
-- DATA: courses
-- ------------------------------------------------------------
INSERT INTO courses (id, title, category, instructor_name, monthly_fee) VALUES
(1, 'Intro to Python',        'Programming', 'Marta López',  49.99),
(2, 'Web Design Basics',      'Design',      'Carlos Vega',  39.99),
(3, 'Data Analysis with SQL', 'Data',        'Marta López',  59.99),
(4, 'Digital Marketing 101',  'Marketing',   'Lucia Prades', 29.99),
(5, 'Advanced Python',        'Programming', 'Carlos Vega',  69.99),
(6, 'UI/UX Fundamentals',     'Design',      NULL,           44.99),  -- instructor pending assignment
(7, 'Email Campaigns',        'Marketing',   'Lucia Prades', 19.99);

-- ------------------------------------------------------------
-- DATA: enrollments
-- ------------------------------------------------------------
INSERT INTO enrollments (id, student_id, student_name, student_email, course_id, course_title, category, enrollment_date, completion_percentage, passed, monthly_fee_paid, instructor) VALUES
(1,  1, 'Emily Watson',      'emily.watson@student.edutrack.com',    1, 'Intro to Python',        'Programming', '2024-03-10', 85, TRUE,  49.99, 'Marta López'),
(2,  1, 'Emily Watson',      'emily.watson@student.edutrack.com',    2, 'Web Design Basics',      'Design',      '2024-04-15', 60, FALSE, 39.99, 'Carlos Vega'),
(3,  2, 'Klaus Weber',       'klaus.weber@student.edutrack.com', 1, 'Intro to Python',        'Programming', '2024-03-12', 92, TRUE,  49.99, 'Marta López'),
(4,  2, 'Klaus Weber',       'klaus.weber@student.edutrack.com', 3, 'Data Analysis with SQL', 'Data',        '2024-05-01', 78, TRUE,  59.99, 'Marta López'),
(5,  3, 'Lucia Fernandes',   'lucia.fernandes@student.edutrack.com', 2, 'Web Design Basics',      'Design',      '2024-06-20',  5, FALSE, 39.99, 'Carlos Vega'),
(6,  3, 'Lucia Fernandes',   'lucia.fernandes@student.edutrack.com', 4, 'Digital Marketing 101',  'Marketing',   '2024-07-01',  3, FALSE, 29.99, 'Lucia Prades'),
(7,  4, 'Marco Rossi',       'marco.rossi@student.edutrack.com',    5, 'Advanced Python',        'Programming', '2024-02-14', 95, TRUE,  69.99, 'Carlos Vega'),
(8,  4, 'Marco Rossi',       'marco.rossi@student.edutrack.com',    1, 'Intro to Python',        'Programming', '2024-08-09', 88, TRUE,  49.99, 'Marta López'),
(9,  5, 'Yuki Nakamura',     'yuki.nakamura@student.edutrack.com',  3, 'Data Analysis with SQL', 'Data',        '2024-09-03', 45, FALSE, 59.99, 'Marta López'),
(10, 5, 'Yuki Nakamura',     'yuki.nakamura@student.edutrack.com',  6, 'UI/UX Fundamentals',     'Design',      '2024-10-11',  0, FALSE, 44.99, NULL),           -- NULL instructor
(11, 6, 'Pierre Dubois',     'pierre.dubois@student.edutrack.com',   6, 'UI/UX Fundamentals',     'Design',      '2024-11-05',  0, FALSE, 44.99, NULL),           -- NULL instructor
(12, 7, 'Priya Sharma',      'priya.sharma@student.edutrack.com', 4, 'Digital Marketing 101',  'Marketing',   '2024-12-01', 70, TRUE,  29.99, 'Lucia Prades'),
(13, 8, 'James Miller',      'james.miller@test.com',         1, 'Intro to Python',        'Programming', '2024-05-22', 30, FALSE, 49.99, 'Marta López'),  -- @test.com email → delete
(14, 9, 'Alex Chen',         'alex.chen@test.com',        2, 'Web Design Basics',      'Design',      '2024-06-30', 10, FALSE, 39.99, 'Carlos Vega'),  -- @test.com email → delete
(15, 7, 'Priya Sharma',      'priya.sharma@student.edutrack.com', 1, 'Intro to Python',        'Programming', '2025-01-10', 55, FALSE, 49.99, 'Marta López'),
(16, 6, 'Pierre Dubois',     'pierre.dubois@student.edutrack.com',   3, 'Data Analysis with SQL', 'Data',        '2025-02-20', 20, FALSE, 59.99, 'Marta López'),
(17, 1, 'Emily Watson',      'emily.watson@student.edutrack.com',    5, 'Advanced Python',        'Programming', '2025-03-05', 40, FALSE, 69.99, 'Carlos Vega');

-- ============================================================
-- MISSING RECORD — read before writing the INSERT
-- ============================================================
-- During the migration from the previous system it was detected
-- that the following enrollment was confirmed by email but was
-- never recorded in the database:
--
--   student_id    : 3
--   student_name  : Lucia Fernandes
--   student_email : lucia.fernandes@student.edutrack.com
--   course_id     : 5
--   course_title  : Advanced Python
--   category      : Programming
--   enrollment_date      : 2025-04-01
--   completion_percentage: 0
--   passed               : false
--   monthly_fee_paid     : 69.99
--   instructor           : Carlos Vega
--
-- Your task (Q6): write the INSERT that adds this record with id = 18
-- ============================================================
