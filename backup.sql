--
-- PostgreSQL database dump
--

\restrict snlUvY8YXuW8fd9NkIvpJHmJE0b6t0b9WdTADp0NgFcxgjmNHEIElec4Jbgyd7T

-- Dumped from database version 18.1 (Homebrew)
-- Dumped by pg_dump version 18.1 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: course_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_type AS ENUM (
    'מדריך_עוזר',
    'מדריך',
    'מדריך_עוזר_משולב_עם_מדריך',
    'קרוסאובר'
);


--
-- Name: update_external_tests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_external_tests_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$;


--
-- Name: update_student_skills_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_skills_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$;


--
-- Name: update_student_test_scores_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_test_scores_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: course_instructors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_instructors (
    id integer NOT NULL,
    course_id integer NOT NULL,
    instructor_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: course_instructors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.course_instructors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_instructors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.course_instructors_id_seq OWNED BY public.course_instructors.id;


--
-- Name: course_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_students (
    id integer NOT NULL,
    course_id integer,
    student_id integer,
    enrolled_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: course_students_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.course_students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.course_students_id_seq OWNED BY public.course_students.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    course_type public.course_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT end_date_after_start CHECK ((end_date >= start_date))
);


--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: evaluation_criteria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_criteria (
    id integer NOT NULL,
    subject_id integer,
    name_he character varying(500) NOT NULL,
    description_he text,
    display_order integer DEFAULT 0,
    is_critical boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    score_descriptions jsonb,
    max_score integer
);


--
-- Name: evaluation_criteria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_criteria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_criteria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_criteria_id_seq OWNED BY public.evaluation_criteria.id;


--
-- Name: evaluation_item_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_item_scores (
    id integer NOT NULL,
    evaluation_id integer,
    criterion_id integer,
    score integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evaluation_item_scores_score_check CHECK (((score >= 0) AND (score <= 10)))
);


--
-- Name: evaluation_item_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_item_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_item_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_item_scores_id_seq OWNED BY public.evaluation_item_scores.id;


--
-- Name: evaluation_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_subjects (
    id integer NOT NULL,
    name_he character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    max_raw_score integer NOT NULL,
    passing_raw_score integer NOT NULL,
    description_he text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: evaluation_subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_subjects_id_seq OWNED BY public.evaluation_subjects.id;


--
-- Name: external_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_tests (
    id integer NOT NULL,
    student_id integer NOT NULL,
    physics_score numeric(5,2),
    physiology_score numeric(5,2),
    eye_contact_score numeric(5,2),
    equipment_score numeric(5,2),
    decompression_score numeric(5,2),
    average_score numeric(5,2) GENERATED ALWAYS AS ((((((COALESCE(physics_score, (0)::numeric) + COALESCE(physiology_score, (0)::numeric)) + COALESCE(eye_contact_score, (0)::numeric)) + COALESCE(equipment_score, (0)::numeric)) + COALESCE(decompression_score, (0)::numeric)) / (NULLIF(((((
CASE
    WHEN (physics_score IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN (physiology_score IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (eye_contact_score IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (equipment_score IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (decompression_score IS NOT NULL) THEN 1
    ELSE 0
END), 0))::numeric)) STORED,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT external_tests_decompression_score_check CHECK (((decompression_score >= (0)::numeric) AND (decompression_score <= (100)::numeric))),
    CONSTRAINT external_tests_equipment_score_check CHECK (((equipment_score >= (0)::numeric) AND (equipment_score <= (100)::numeric))),
    CONSTRAINT external_tests_eye_contact_score_check CHECK (((eye_contact_score >= (0)::numeric) AND (eye_contact_score <= (100)::numeric))),
    CONSTRAINT external_tests_physics_score_check CHECK (((physics_score >= (0)::numeric) AND (physics_score <= (100)::numeric))),
    CONSTRAINT external_tests_physiology_score_check CHECK (((physiology_score >= (0)::numeric) AND (physiology_score <= (100)::numeric)))
);


--
-- Name: external_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: external_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_tests_id_seq OWNED BY public.external_tests.id;


--
-- Name: instructors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructors (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id_number character varying(20)
);


--
-- Name: instructors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.instructors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instructors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.instructors_id_seq OWNED BY public.instructors.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    subject_id integer,
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: student_absences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_absences (
    id integer NOT NULL,
    student_id integer,
    absence_date date NOT NULL,
    reason character varying(500),
    is_excused boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: student_absences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_absences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_absences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_absences_id_seq OWNED BY public.student_absences.id;


--
-- Name: student_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_evaluations (
    id integer NOT NULL,
    student_id integer,
    subject_id integer,
    instructor_id integer,
    course_name character varying(200),
    lesson_name character varying(300),
    evaluation_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    raw_score integer NOT NULL,
    percentage_score numeric(5,2) NOT NULL,
    final_score numeric(5,2) NOT NULL,
    is_passing boolean NOT NULL,
    has_critical_fail boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_final_test boolean DEFAULT false
);


--
-- Name: student_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_evaluations_id_seq OWNED BY public.student_evaluations.id;


--
-- Name: student_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_skills (
    id integer NOT NULL,
    student_id integer NOT NULL,
    meters_30 boolean DEFAULT false,
    meters_40 boolean DEFAULT false,
    guidance boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: student_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_skills_id_seq OWNED BY public.student_skills.id;


--
-- Name: student_test_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_test_scores (
    id integer NOT NULL,
    student_id integer NOT NULL,
    test_type_id integer NOT NULL,
    score numeric(5,2),
    passed boolean,
    evaluation_id integer,
    test_date date,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: student_test_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_test_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_test_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_test_scores_id_seq OWNED BY public.student_test_scores.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    unit_id character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id_number character varying(20),
    photo_url character varying(500)
);


--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: test_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_categories (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name_he character varying(200) NOT NULL,
    course_type character varying(50) NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: test_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_categories_id_seq OWNED BY public.test_categories.id;


--
-- Name: test_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_types (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    category_id integer,
    name_he character varying(200) NOT NULL,
    score_type character varying(50) DEFAULT 'percentage'::character varying NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_score_type CHECK (((score_type)::text = ANY ((ARRAY['percentage'::character varying, 'pass_fail'::character varying, 'evaluation'::character varying])::text[])))
);


--
-- Name: test_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_types_id_seq OWNED BY public.test_types.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(50) DEFAULT 'student'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'instructor'::character varying, 'tester'::character varying, 'student'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: course_instructors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_instructors ALTER COLUMN id SET DEFAULT nextval('public.course_instructors_id_seq'::regclass);


--
-- Name: course_students id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_students ALTER COLUMN id SET DEFAULT nextval('public.course_students_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: evaluation_criteria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_criteria ALTER COLUMN id SET DEFAULT nextval('public.evaluation_criteria_id_seq'::regclass);


--
-- Name: evaluation_item_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_item_scores ALTER COLUMN id SET DEFAULT nextval('public.evaluation_item_scores_id_seq'::regclass);


--
-- Name: evaluation_subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_subjects ALTER COLUMN id SET DEFAULT nextval('public.evaluation_subjects_id_seq'::regclass);


--
-- Name: external_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_tests ALTER COLUMN id SET DEFAULT nextval('public.external_tests_id_seq'::regclass);


--
-- Name: instructors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors ALTER COLUMN id SET DEFAULT nextval('public.instructors_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: student_absences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_absences ALTER COLUMN id SET DEFAULT nextval('public.student_absences_id_seq'::regclass);


--
-- Name: student_evaluations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_evaluations ALTER COLUMN id SET DEFAULT nextval('public.student_evaluations_id_seq'::regclass);


--
-- Name: student_skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_skills ALTER COLUMN id SET DEFAULT nextval('public.student_skills_id_seq'::regclass);


--
-- Name: student_test_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_scores ALTER COLUMN id SET DEFAULT nextval('public.student_test_scores_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: test_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_categories ALTER COLUMN id SET DEFAULT nextval('public.test_categories_id_seq'::regclass);


--
-- Name: test_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_types ALTER COLUMN id SET DEFAULT nextval('public.test_types_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: course_instructors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_instructors (id, course_id, instructor_id, assigned_at, created_at, updated_at) FROM stdin;
23	13	28	2026-01-29 09:15:32.401575	2026-01-29 09:15:32.401575	2026-01-29 09:15:32.401575
25	16	28	2026-01-31 00:27:36.093965	2026-01-31 00:27:36.093965	2026-01-31 00:27:36.093965
26	15	28	2026-01-31 00:27:56.289885	2026-01-31 00:27:56.289885	2026-01-31 00:27:56.289885
\.


--
-- Data for Name: course_students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_students (id, course_id, student_id, enrolled_at, created_at, updated_at) FROM stdin;
57	13	58	2026-01-29 09:15:32.401575+02	2026-01-29 09:15:32.401575+02	2026-01-29 09:15:32.401575+02
60	16	60	2026-01-31 00:27:36.093965+02	2026-01-31 00:27:36.093965+02	2026-01-31 00:27:36.093965+02
61	15	60	2026-01-31 00:27:56.289885+02	2026-01-31 00:27:56.289885+02	2026-01-31 00:27:56.289885+02
62	15	58	2026-01-31 00:27:56.289885+02	2026-01-31 00:27:56.289885+02	2026-01-31 00:27:56.289885+02
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, name, course_type, start_date, end_date, description, is_active, created_at, updated_at) FROM stdin;
13	שמיר 2026	מדריך	2026-01-29	2026-02-07	בדיקה ראשונית	t	2026-01-29 09:15:32.401575+02	2026-01-29 09:15:32.401575+02
16	קרוסאובר שמיר	קרוסאובר	2026-01-30	2026-02-06	\N	t	2026-01-31 00:27:12.902497+02	2026-01-31 00:27:36.093965+02
15	מדריך עוזר שמיר	מדריך_עוזר	2026-01-29	2026-02-06	\N	t	2026-01-30 11:04:20.072292+02	2026-01-31 00:27:56.289885+02
\.


--
-- Data for Name: evaluation_criteria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_criteria (id, subject_id, name_he, description_he, display_order, is_critical, created_at, updated_at, score_descriptions, max_score) FROM stdin;
183	19	איכות גוף השיעור	איכות העברת גוף השיעור, כולל שיוך המסרים למצבי צלילה אמיתיים, מתן דוגמאות מעולם הצלילה ושימוש בעזרים מקוריים (עד 10 נקודות)	9	f	2026-01-25 22:09:24.020221+02	2026-01-25 22:26:05.448741+02	\N	10
132	16	כניסה והתרגלות	כניסה למים וביצוע התרגלות	5	t	2026-01-24 20:55:48.553301+02	2026-01-24 20:55:48.553301+02	{"1": "לא ביצע התרגלות.", "4": "ביצע התרגלות ולימד לפחות 1 מתוך: ריקון מסכה, ריקון ווסת.", "7": "עזר וכיוון בכניסה, ביצע התרגלות ולימד את שני הריקונים.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה, נתן משוב חיובי וחזר על סימנים וכללים."}	\N
133	16	סיור והובלה	הובלת הצולל בצלילה תוך שמירה על איזון ובטיחות	6	t	2026-01-24 20:55:48.553994+02	2026-01-24 20:55:48.553994+02	{"1": "לא מאורגן, או לא אחז בצולל, לא וידא פתפום או ביצע העמקה פתאומית-מהירה.", "4": "אחז בצולל, העמיק בהדרגה תוך וידוא פתפום, אך לא שמר על איזון הצולל/לא מנע פגיעה בטבע.", "7": "אחז בצולל, העמיק בהדרגה תוך וידוא פתפום, שמר על איזון הצולל ומנע פגיעה בטבע.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה ובאופן תיירותי (הסב את תשומת הלב לדגה ולאלמוגים)."}	\N
134	16	יציאה וסיכום	עזרה ביציאה וביצוע סיכום	7	f	2026-01-24 20:55:48.554676+02	2026-01-24 20:55:48.554676+02	{"1": "לא עזר לצולל ביציאה או לא עשה סיכום.", "4": "ביצע עד וכולל 2 מהפעילויות: עזר לצולל ביציאה, סייע בהורדת ציוד, עשה סיכום, נתן משוב חיובי.", "7": "ביצע לפחות 3 מהפעילויות הנ\\"ל.", "10": "ביצע את כל הפעילויות הנ\\"ל ברמה גבוהה, והפנה לקורס צלילה."}	\N
128	16	הכרות והצהרה רפואית	ביצוע היכרות, קבלת שם הצולל, והחתמה על הצהרה רפואית	1	t	2026-01-24 20:55:48.549952+02	2026-01-24 20:55:48.549952+02	{"1": "לא ביצע הכרות, ו/או לא החתים על הצהרה רפואית.", "4": "הציג את שמו וקבל את שם הצולל, והחתים על הצהרה רפואית.", "7": "הציג את עצמו, קיבל מידע מהצולל על ניסיון קודם במים, והחתים על ההצהרה תוך הסבר על חשיבותה.", "10": "בצע את 2 הנקודות שבסעיף הקודם ברמה גבוהה והפיג חששות אצל הצולל."}	\N
129	16	סיפור הצלילה ואזהרה	סיפור על הצלילה והזהרה שאין מדובר בלימוד צלילה	2	f	2026-01-24 20:55:48.551003+02	2026-01-24 20:55:48.551003+02	{"1": "לא עבר כלל על סיפור הצלילה, ו/או לא הזהיר שאין מדובר בלימוד צלילה.", "4": "עבר בתמצות על מסלול הצלילה, והזהיר שאין מדובר בלימוד צלילה.", "7": "נתן את סיפור הצלילה בפרוט (מסלול, דגה ואלמוגים וכו') והזהיר שאין מדובר בלימוד צלילה.", "10": "בצע את הסעיף הקודם ברמה גבוהה ויצר ציפייה חיובית אצל הצולל."}	\N
130	16	תדריך	תדריך כולל כללים, סימנים ובדיקת ידע	3	t	2026-01-24 20:55:48.551691+02	2026-01-24 20:55:48.551691+02	{"1": "לא נתן תדריך.", "4": "עבר על לפחות 3 כללים מתוך: פתפום, אופן נשימה, אופן התנועה, איזון, שמירת טבע. ולימד 2 סימנים מתוך: הכל בסדר, לא בסדר, למעלה, למטה.", "7": "עבר והסביר את כל הכללים שלעיל ולימד את כל הסימנים שלעיל, ובדק ידע.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה, והדגיש את החשיבות של ביצוע הכללים ושמירת הטבע."}	\N
131	16	התאמת ציוד והתלבשות	בדיקת התאמת ציוד ועזרה להתלבשות	4	f	2026-01-24 20:55:48.552488+02	2026-01-24 20:55:48.552488+02	{"1": "בדק עד וכולל 3 פריטים מתוך: התאמת מסכה, התאמת סנפירים, לחץ אוויר, כמות משקולות, מאזן וסת מורכבים.", "4": "בדק לפחות 4 פריטים מתוך הנ\\"ל ועזר לצולל להתלבש.", "7": "בדק את כל הפריטים שלעיל, התלבש לפני הצולל ועזר לצולל להתלבש.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה, ושלח את הצולל לשתות לפני הלבישו."}	\N
143	18	מטרת הצלילה ("מה" ו"למה") ותנאיה	הגדרת מטרת וסוג הצלילה ותנאי הצלילה הצפויים	1	t	2026-01-24 20:55:48.56089+02	2026-01-24 20:55:48.56089+02	{"1": "לא הגדיר את מטרת וסוג (זרם, לילה וכו') הצלילה ולא עבר על תנאי הצלילה הצפויים.", "4": "הגדיר את מטרת הצלילה ועבר על פחות מ- 4 מתנאי הצלילה הצפויים: גובה גלים, כיוון גלים, זרמים, רוח, ראות, מועד הצלילה ביום, טמפרטורה, גאות/שפל, רמת הצוללים.", "7": "הגדיר את מטרת וסוג הצלילה ועבר על 4 או יותר מתנאי הצלילה הצפויים.", "10": "הגדיר את מטרת וסוג הצלילה, הסביר את חשיבותה ועבר על כל תנאי הצלילה הצפויים."}	\N
144	18	תיאור אתר הצלילה	תיאור מפורט של אתר הצלילה כולל נושאים רלוונטיים	2	f	2026-01-24 20:55:48.562008+02	2026-01-24 20:55:48.562008+02	{"1": "לא תיאר כלל את אתר הצלילה.", "4": "התייחס לאתר הצלילה עד וכולל 4 מהנושאים הבאים: תיאור כללי, עומקים, כיוונים, עומק, זמן תחתית מרבי, היסטוריה, סובב ימי.", "7": "התייחס לאתר הצלילה בלפחות 5 מהנושאים הנ\\"ל.", "10": "בצע את הסעיף הקודם ברמה גבוהה ובאופן חיובי תוך יצירת קשר בין תנאי הצלילה ובחירת האתר ויצר ציפייה חיובית אצל הצולל."}	\N
145	18	תיאור מהלך הצלילה ("איך")	תיאור מסלול הצלילה ומהלכה	3	t	2026-01-24 20:55:48.562642+02	2026-01-24 20:55:48.562642+02	{"1": "לא תיאר כלל את מהלך הצלילה או תיאר שלא ע\\"פ המערך.", "4": "תיאר את מסלול הצלילה כולל נק' לאורך מסלול, לחצי אוויר נדרשים בכל נק' וכו'.", "7": "תיאר את מסלול הצלילה מסיום התדריך ועד החזרה למעדנו ויצר ציפייה חיובית אצל הצולל.", "10": "בצע את הסעיף הקודם ברמה גבוהה ובאופן חיובי תוך יצירת קשר בין תנאי הצלילה ומהלכה, תיאר את מהלך הצלילה מסיום התדריך ועד החזרה למעדנו ויצר ציפייה חיובית אצל הצולל."}	\N
146	18	דגשים והוראות מקצועיות ("איך" מקצועי)	מתן דגשים על נהלים מקצועיים	4	t	2026-01-24 20:55:48.563151+02	2026-01-24 20:55:48.563151+02	{"1": "לא נתן כלל דגשים ולא עבר כלל על נהלים מקצועיים.", "4": "נתן לפחות דגש 1 בהתייחס לנק' הפתפוס ו/או נק' בעייתיות בצלילה, ועבר בצורה חלקית או לא.", "7": "נתן את רוב הדגשים, ועבר בצורה מלאה, ברורה וע\\"פ המערך על התנהלים מקצועיים.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה תוך הפגת חששות ובדיקת ידע."}	\N
147	18	הוראות בטיחות (וכללי התנהגות) וסימנים מוסכמים	מתן הוראות בטיחות וסימנים מוסכמים	5	t	2026-01-24 20:55:48.563627+02	2026-01-24 20:55:48.563627+02	{"1": "לא היתה כל התייחסות להוראות בטיחות או לא ניתנו כלל סימנים מוסכמים.", "4": "נתנו רוב הוראות הבטיחות הכלליות הרלוונטיות, אבל לא ניתנו סימנים מוסכמים או לא היתה התייחסות לשמירת הסובב הימי.", "7": "נתנו רוב הוראות הבטיחות הכלליות והספציפיות הרלוונטיות, ניתנו רוב הסימנים המוסכמים הכללים והספציפיות והיתה התייחסות לשמירת הסובב הימי.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה תוך התייחסות והסימנים ובדיקת ידע."}	\N
148	18	מקרים ותגובות	התייחסות למקרים ותגובות בהקשר לצלילה	6	t	2026-01-24 20:55:48.564101+02	2026-01-24 20:55:48.564101+02	{"1": "לא היתה כל התייחסות למקרים ותגובות.", "4": "התייחס למקרים ותגובות אל ללא קשר עם הצלילה כפי שעלתה מהתדריך עד כה.", "7": "התייחס למקרים ותגובות בהקשר לצלילה כפי שעלתה מהתדריך עד כה, תוך מתן הנחות מעשיות שתאמו את רמת הצולל.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה תוך כיסוי כל המצבים האפשריים ובדיקת ידע."}	\N
149	18	איכות העברת התדריך	איכות העברת התדריך כולל קשר עין, שימוש אפקטיבי בקול, וכו'	7	f	2026-01-24 20:55:48.564619+02	2026-01-24 20:55:48.564619+02	{"1": "המועמד הפגין חוות עצבנית או לא שלט בכתה.", "4": "המועמד קיים 3 מהנקודות הבאות: קשר עין עם חניכים, שימוש אפקטיבי בקול, חזות רגועה, שליטה בכתה.", "7": "המועמד קיים את כל הנקודות שלעיל תוך חזרה על הנקודות הנדרשות ע\\"פ בדיקת הידע.", "10": "מילא אחר הסעיף הקודם ברמה גבוהה תוך מתן משוב חיובי בבדיקת הידע והרגשת החשיבות של שמירת הטבע."}	\N
158	20	תדריך	מתן תדריך לפני הפעילות במים	1	f	2026-01-24 20:55:48.570218+02	2026-01-24 20:55:48.570218+02	{"1": "לא ניתן תדריך - ניגש ישר לביצוע, ו/או ניתן מידע שגוי.", "4": "יותר/פחות מדי זמן הוקדש לדיבורים, הוסבר רק חלק מה\\"איך\\", הוראות בטיחות לא שלמות.", "7": "נעשה שימוש יעיל בזמן, הוסבר \\"מה\\" וכל ה\\"איך\\", ניתנו הוראות בטיחות וסימנים מוסכמים.", "10": "מילא אחר האמור לעיל ברמה גבוהה, הסביר את ה\\"למה\\" והפיג חששות."}	\N
159	20	הדגמה	הדגמת התרגיל או המיומנות לחניכים	2	t	2026-01-24 20:55:48.5707+02	2026-01-24 20:55:48.5707+02	{"1": "המורך לא היה מסוגל להדגים או לבצע את התרגיל / לא ביצע ע\\"פ המערך.", "4": "התרגיל בוצע בצורה לא מושלמת ו/או לא כל החניכים ידעו איך ומה לעשות אחרי ההדגמה.", "7": "התרגיל בוצע נכון וטוב.", "10": "התרגיל בוצע ברמה גבוהה ואיפשר לחניכים לראות ולהבין איך לבצע."}	\N
160	20	פתרון בעיות - תרגול	זיהוי בעיות והגבה נכונה תוך הפגת חששות	3	t	2026-01-24 20:55:48.571169+02	2026-01-24 20:55:48.571169+02	{"1": "לא זיהה בעיות / סיכן צולל.", "4": "לא זיהה את כל הבעיות ו/או הגיב באיטיות ובחוסר ביטחון, אך לא נוצרו מצבי סיכון.", "7": "זיהה את הבעיות המרכזיות והגיב נכון תוך הפגת חששות.", "10": "מנע היווצרות בעיות, זיהה את הבעיות המרכזיות והגיב נכון תוך הפגת חששות."}	\N
161	20	הערכה ו"תיקון או חיזוק"	הערכת ביצוע החניכים ומתן תיקון או חיזוק	4	f	2026-01-24 20:55:48.571686+02	2026-01-24 20:55:48.571686+02	{"1": "מתעלם מאיכות הביצוע של החניכים.", "4": "מתרכז רק בתיקון / נותן תיקון אך אינו עוקבי.", "7": "נותן תיקון וחיזוק.", "10": "מקפיד להעריך כל ביצוע ולתת תיקון או חיזוק בהתאם לצורך."}	\N
162	20	סיכום	מתן סיכום וחזרה על נקודות חשובות	5	f	2026-01-24 20:55:48.572378+02	2026-01-24 20:55:48.572378+02	{"1": "לא נתן כל סיכום או נתן משוב חיובי בלבד.", "4": "נתן משוב חיובי, חזר על ה\\"מה\\" ו\\"למה\\" והדגיש נקודות חשובות.", "7": "נתן משוב חיובי, חזר על ה\\"מה\\" ו\\"למה\\" תוך הדגשת נקודות חשובות והסביר טעויות.", "10": "מילא אחר האמור לעיל ברמה גבוהה ונתן הצעות לשיפור."}	\N
163	20	שליטה והובלה	שליטה בחניכים והובלה בהתאם לתנאי השיעור	6	t	2026-01-24 20:55:48.572752+02	2026-01-24 20:55:48.572752+02	{"1": "מסכן את החניכים ו/או לא עובד ע\\"פ מערך ההדרכה ו/או לא בהתאם לתנאי השיעור ואינו מסכן חניכים.", "4": "לא מאורגן, אין שימוש יעיל בזמן אך עובד בהתאם לתנאי השיעור ואינו מסכן חניכים.", "7": "עובד ע\\"פ מסלול התקדמות מדורג באופן מאורגן ובטוח, נותן הוראות ברורות ויעיל בשימוש בזמן.", "10": "מילא אחר האמור לעיל ברמה גבוהה ונתן משוב חיובי."}	\N
167	17	איכות העברת המבוא	איכות העברת סעיף המבוא, כולל שיתוף הכתה	4	f	2026-01-25 22:09:24.01268+02	2026-01-25 22:26:05.448741+02	\N	5
164	17	מוכנות לשיעור	הכנת דף תקציר וציוד לשיעור	1	f	2026-01-25 22:09:24.010069+02	2026-01-25 22:11:03.481505+02	{"1": "הגיע לא מוכן לשיעור (ללא דף תקציר, או שלא ידע את סדר המערך).", "4": "הגיע מוכן בצורה לא מספקת (עם דף תקציר ללא שרטוט, פרט ציוד בודד או לא מתאים).", "7": "הגיע מוכן בצורה מספקת (למשל - עם דף תקציר כולל שרטוט הלוח, עם פרטי הציוד המתאימים).", "10": "הגיע מוכן בצורה טובה (למשל - עם דף תקציר כולל שרטוט לוח וסימון שלבי מילוי, עם פרטי הציוד ואמצעי עזר נוספים, הבין את הקשר בין מערך השיעור שלו למכלול הקורס כולו)."}	\N
165	17	קשר - מבוא	יצירת קשר ומוטיבציה ללמידה	2	f	2026-01-25 22:09:24.011853+02	2026-01-25 22:11:03.481505+02	{"1": "יצר קשר שלילי או לא מתאים, או הציג שם ונושא בלבד.", "4": "ניסה לעורר מוטיבציה ללמידה.", "7": "הצליח לעורר מוטיבציה חיובית ללמידה.", "10": "מילא אחר הסעיף הקודם ושייך את הנושא באופן מעשי לצלילה."}	\N
166	17	נושאי הלימוד ומטרות	הצגת נושאי הלימוד ומטרות השיעור	3	f	2026-01-25 22:09:24.012236+02	2026-01-25 22:11:03.481505+02	{"1": "לא הציג את נושאי הלימוד ואת מטרות השיעור.", "4": "מטרות השיעור ו/או נושאיו הוצגו, אבל המטרות לא הוגדרו כהתנהגותיות.", "7": "מטרות השיעור ונושאיו הוצגו, והמטרות הוגדרו כהתנהגותיות.", "10": "מילא אחר הסעיף הקודם והציג את נושאי הלימוד בשילוב עם המטרות והסביר את חשיבותם."}	\N
175	19	מוכנות לשיעור	הכנת דף תקציר וציוד לשיעור	1	f	2026-01-25 22:09:24.017575+02	2026-01-25 22:09:24.017575+02	{"1": "הגיע לא מוכן לשיעור (ללא דף תקציר, או שלא ידע את סדר המערך).", "4": "הגיע מוכן בצורה לא מספקת (עם דף תקציר וללא שרטוט, או שידע את סדר המערך אבל לא הבין את הגיון המערך).", "7": "הגיע מוכן בצורה מספקת (למשל - עם דף תקציר כולל שרטוט הלוח, או שהבין את הגיון המערך).", "10": "הגיע מוכן בצורה טובה (למשל - עם דף תקציר כולל שרטוט לוח וסימון שלבי מילוי, עם פרטי הציוד ואמצעי עזר נוספים וכו', או שהבין גם את הקשר בין מערך השיעור שלו למכלול הקורס כולו)."}	\N
176	19	קשר - מבוא	יצירת קשר ומוטיבציה ללמידה	2	f	2026-01-25 22:09:24.017866+02	2026-01-25 22:09:24.017866+02	{"1": "יצר קשר שלילי או לא מתאים, או הציג שם ונושא בלבד.", "4": "ניסה לעורר מוטיבציה ללמידה.", "7": "הצליח לעורר מוטיבציה חיובית ללמידה.", "10": "מילא אחר הסעיף הקודם ושייך את הנושא באופן מעשי לצלילה."}	\N
177	19	נושאי הלימוד ומטרות	הצגת נושאי הלימוד ומטרות השיעור	3	f	2026-01-25 22:09:24.018151+02	2026-01-25 22:09:24.018151+02	{"1": "לא הציג את נושאי הלימוד ואת מטרות השיעור.", "4": "מטרות השיעור ו/או נושאיו הוצגו, אבל המטרות לא הוגדרו כהתנהגותיות.", "7": "מטרות השיעור ונושאיו הוצגו, והמטרות הוגדרו כהתנהגותיות.", "10": "מילא אחר הסעיף הקודם והציג את נושאי הלימוד בשילוב עם המטרות והסביר את חשיבותם."}	\N
179	19	דגשים ומסרים הכרחיים להעברה	העברת כל המסרים ההכרחיים בצורה מדויקת	5	t	2026-01-25 22:09:24.01915+02	2026-01-25 22:09:24.01915+02	{"1": "העביר מסר לא בטוח, לא בטיחותי ולא מספיק על מנת להשיג את המטרה, אינו שולט בנושאי השיעור.", "4": "לא העביר את כל המסרים ההכרחיים ו/או העביר בצורה לא מדויקת, אך השיג את מטרת השיעור.", "7": "העביר את כל המסרים ההכרחיים בצורה מדויקת ובטוחה, והשיג את מטרת השיעור.", "10": "מילא אחר הסעיף הקודם וקישר את המסרים לנושאי לימוד בקורסים מתקדמים."}	\N
180	19	סדר והגיון בהעברת המידע - הצגת נושאי הלימוד	הצגת הנושאים בצורה מבולבלת וחסרת הגיון	6	f	2026-01-25 22:09:24.01946+02	2026-01-25 22:09:24.01946+02	{"1": "הציג את הנושאים בצורה מבולבלת וחסרת הגיון.", "4": "הציג את הנושאים מהידוע ללא ידוע ומהמחשוב להכרחי, אך באופן לא חד משמעי וללא קשר ביניהם.", "7": "הציג את הנושאים ע\\"פ סדר וע\\"פ מערך ההדרכה ונתן מידע ברור וחד משמעי.", "10": "השיג את הסעיף הקודם תוך שיוך המידע לחלקי הקורס האחרים, ועם קשר ביניהם."}	\N
181	19	הקנית מיומנויות, ועזרי לימוד	שימוש בעזרים ובציוד להעברת המסרים	7	f	2026-01-25 22:09:24.019747+02	2026-01-25 22:09:24.019747+02	{"1": "לא עשה שימוש נאות בעזרים, או עבר על המסרים ההכרחיים בקצרה, או יצר רושם שלילי/ לא מקצועי.", "4": "עשה שימוש סביר בעזר לימוד אחד לפחות, ו/או עבר על רוב המסרים ההכרחיים יותר מפעם אחת.", "7": "עשה שימוש מוצלח בעזר לימוד אחד לפחות, ועבר על כל המסרים ההכרחיים - רובם מס' פעמים.", "10": "עשה שימוש מוצלח מס' עזרים, תוך מעבר על כל המסרים ההכרחיים מס' פעמים ובדרכים שונות."}	\N
182	19	הערכה ו"תיקון או חיזוק"	הערכת הבנת החומר המועבר והתאמת מהלך השיעור	8	f	2026-01-25 22:09:24.019979+02	2026-01-25 22:09:24.019979+02	{"1": "לא העריך כלל את הבנת החניכים את החומר המועבר.", "4": "העריך את ההבנה של חלק מהחומר המועבר, ולא התייחס לכך במהלך השיעור.", "7": "העריך את הבנת חלק החומר המועבר ושינה את מהלך השיעור בהתאם, או שיבח חלק קטן מהחניכים.", "10": "העריך את הבנת כל החומר המועבר, שינה את מהלך השיעור בהתאם, ושיבח לרוב חניכים שקלטו."}	\N
184	19	סיכום	סיכום השיעור וחזרה על מטרות ומסרים הכרחיים	10	f	2026-01-25 22:09:24.020471+02	2026-01-25 22:09:24.020471+02	{"1": "לא היה סיכום.", "4": "הסיכום התייחס לנושא אחד בלבד מהנושאים הבאים: מסרים הכרחיים, מטרות השיעור, שיוך המידע.", "7": "חזר על מטרות השיעור ומסרים הכרחיים.", "10": "עבר בצורה עניינית על מסרים הכרחיים, מטרות השיעור, וכיצד לשייך את המידע לצלילה."}	\N
178	19	איכות העברת המבוא	איכות העברת סעיף המבוא, כולל שיתוף הכתה (עד 5 נקודות)	4	f	2026-01-25 22:09:24.01844+02	2026-01-25 22:26:05.448741+02	\N	5
185	19	איכות הסיכום	איכות העברת הסיכום, כולל הדגשת המסרים ההכרחיים (עד 5 נקודות)	11	f	2026-01-25 22:09:24.020698+02	2026-01-25 22:26:05.448741+02	\N	5
168	17	דגשים ומסרים הכרחיים להעברה	העברת כל המסרים ההכרחיים בצורה מדויקת	5	t	2026-01-25 22:09:24.013133+02	2026-01-25 22:11:03.481505+02	{"1": "העביר מסר לא בטוח, לא בטיחותי ולא מספיק על מנת להשיג את המטרה, אינו שולט בנושאי השיעור.", "4": "לא העביר את כל המסרים ההכרחיים ו/או העביר בצורה לא מדויקת, אך השיג את מטרת השיעור.", "7": "העביר את כל המסרים ההכרחיים בצורה מדויקת ובטוחה, והשיג את מטרת השיעור.", "10": "מילא אחר הסעיף הקודם וקישר את המסרים לנושאי לימוד בקורסים מתקדמים."}	\N
169	17	סדר והגיון בהעברת המידע - הצגת נושאי הלימוד	הצגת הנושאים בצורה מבולבלת וחסרת הגיון	6	f	2026-01-25 22:09:24.013533+02	2026-01-25 22:11:03.481505+02	{"1": "הציג את הנושאים בצורה מבולבלת וחסרת הגיון.", "4": "הציג את הנושאים מהידוע ללא ידוע ומהמחשוב להכרחי, אך באופן לא חד משמעי וללא קשר ביניהם.", "7": "הציג את הנושאים ע\\"פ סדר וע\\"פ מערך ההדרכה ונתן מידע ברור וחד משמעי.", "10": "השיג את הסעיף הקודם תוך שיוך המידע לחלקי הקורס האחרים, ועם קשר ביניהם."}	\N
170	17	הקנית מיומנויות, ושימוש בציוד ככלי עזר להעברה	שימוש בעזרים ובציוד להעברת המסרים	7	f	2026-01-25 22:09:24.013993+02	2026-01-25 22:11:03.481505+02	{"1": "לא עשה שימוש נאות בעזרים, או עבר על המסרים ההכרחיים בקצרה, או יצר רושם שלילי.", "4": "עשה שימוש סביר בעזר לימוד אחד לפחות, ו/או עבר על רוב המסרים ההכרחיים.", "7": "השתמש היטב בפריט הציוד ו/או עבר על כל המסרים ההכרחיים - רובם מספר פעמים.", "10": "מילא אחר הסעיף הקודם תוך מעבר על כל המסרים ההכרחיים מס' פעמים ובדרכים שונות."}	\N
171	17	הערכה ו"תיקון או חיזוק"	הערכת הבנת החומר המועבר והתאמת מהלך השיעור	8	f	2026-01-25 22:09:24.014394+02	2026-01-25 22:11:03.481505+02	{"1": "לא העריך כלל את הבנת החניכים את החומר המועבר.", "4": "העריך את ההבנה של חלק מהחומר המועבר, ולא התייחס לכך במהלך השיעור.", "7": "העריך את הבנת חלק החומר המועבר ושינה את מהלך השיעור בהתאם, או שיבח חלק קטן מהחניכים.", "10": "העריך את הבנת כל החומר המועבר, שינה את מהלך השיעור בהתאם, ושיבח לרוב חניכים שקלטו."}	\N
173	17	סיכום	סיכום השיעור וחזרה על מטרות ומסרים הכרחיים	10	f	2026-01-25 22:09:24.015145+02	2026-01-25 22:11:03.481505+02	{"1": "לא היה סיכום.", "4": "הסיכום התייחס לנושא אחד בלבד מהנושאים הבאים: מסרים הכרחיים, מטרות השיעור, שיוך המידע.", "7": "חזר על מטרות השיעור ומסרים הכרחיים.", "10": "עבר בצורה עניינית על מסרים הכרחיים, מטרות השיעור, וכיצד לשייך את המידע לצלילה."}	\N
172	17	איכות גוף השיעור	איכות העברת גוף השיעור, כולל שיוך המסרים למצבי צלילה אמיתיים, מתן דוגמאות מעולם הצלילה ושימוש בעזרים מקוריים שתרמו לשיעור	9	f	2026-01-25 22:09:24.014816+02	2026-01-25 22:26:05.448741+02	\N	10
174	17	איכות הסיכום	איכות העברת הסיכום, כולל הדגשת המסרים ההכרחיים	11	f	2026-01-25 22:09:24.01541+02	2026-01-25 22:26:05.448741+02	\N	5
\.


--
-- Data for Name: evaluation_item_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_item_scores (id, evaluation_id, criterion_id, score, created_at, updated_at) FROM stdin;
2396	284	175	4	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2397	284	176	7	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2398	284	177	7	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2399	284	178	5	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2400	284	179	10	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2401	284	180	7	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2402	284	181	7	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2403	284	182	4	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2404	284	183	9	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2405	284	184	7	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2406	284	185	4	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02
2407	285	175	1	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2408	285	176	4	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2409	285	177	7	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2410	285	178	5	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2411	285	179	1	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2412	285	180	10	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2413	285	181	10	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2414	285	182	10	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2415	285	183	10	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2416	285	184	10	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2417	285	185	5	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02
2418	286	164	1	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2419	286	165	7	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2420	286	166	4	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2421	286	167	4	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2422	286	168	4	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2423	286	169	7	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2424	286	170	7	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2425	286	171	7	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2426	286	172	6	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2427	286	173	4	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2428	286	174	5	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02
2429	287	128	10	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02
2430	287	129	10	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02
2431	287	130	10	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02
2432	287	131	10	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02
2433	287	132	10	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02
2434	287	133	10	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02
2435	287	134	10	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02
2436	288	175	4	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2437	288	176	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2438	288	177	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2439	288	178	4	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2440	288	179	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2441	288	180	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2442	288	181	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2443	288	182	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2444	288	183	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2445	288	184	7	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
2446	288	185	5	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02
\.


--
-- Data for Name: evaluation_subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_subjects (id, name_he, code, max_raw_score, passing_raw_score, description_he, display_order, created_at, updated_at) FROM stdin;
16	צלילת הכרות	intro_dive	70	40	הערכת צלילת הכרות - 7 קריטריונים	1	2026-01-24 20:55:48.548714+02	2026-01-28 18:06:37.23576+02
17	שיעור ציוד	equipment_lesson	100	55	הערכת שיעור ציוד - 11 קריטריונים	2	2026-01-24 20:55:48.555347+02	2026-01-28 18:06:37.238308+02
18	העברת תדריך לפני צלילה	pre_dive_briefing	70	40	הערכת תדריך לפני צלילה - 7 קריטריונים	3	2026-01-24 20:55:48.560283+02	2026-01-28 18:06:37.240092+02
19	העברת הרצאה	lecture_delivery	100	55	הערכת העברת הרצאה - 11 קריטריונים	4	2026-01-24 20:55:48.565183+02	2026-01-28 18:06:37.243875+02
20	העברת שיעור מים	water_lesson	60	33	הערכת שיעור מים - 6 קריטריונים	5	2026-01-24 20:55:48.569762+02	2026-01-28 18:06:37.245741+02
\.


--
-- Data for Name: external_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_tests (id, student_id, physics_score, physiology_score, eye_contact_score, equipment_score, decompression_score, created_at, updated_at) FROM stdin;
33	58	60.00	70.00	80.00	90.00	100.00	2026-01-28 22:49:08.792409	2026-01-28 22:49:08.792409
\.


--
-- Data for Name: instructors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instructors (id, first_name, last_name, email, phone, created_at, updated_at, id_number) FROM stdin;
28	אייל	מילר	miller@tidf.com	\N	2026-01-28 22:31:43.292636+02	2026-01-28 22:31:43.292636+02	313883001
30	נדב	מנקרמן בוחן	menakerman@gmail.com	0547944155	2026-01-31 12:49:15.682769+02	2026-01-31 12:51:00.206698+02	031953193
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lessons (id, name, subject_id, description, display_order, is_active, created_at, updated_at) FROM stdin;
23	סיכונים בירידה	19	\N	2	t	2026-01-25 23:56:30.728712+02	2026-01-25 23:56:30.728712+02
25	סיכונים בעליה	19	\N	4	t	2026-01-25 23:56:30.729772+02	2026-01-25 23:56:30.729772+02
26	כללי התנהגות 1	19	\N	5	t	2026-01-25 23:56:30.730329+02	2026-01-25 23:56:30.730329+02
27	כללי התנהגות 2	19	\N	6	t	2026-01-25 23:56:30.730833+02	2026-01-25 23:56:30.730833+02
28	כללי התנהגות 3	19	\N	7	t	2026-01-25 23:56:30.731346+02	2026-01-25 23:56:30.731346+02
29	כללי התנהגות 4	19	\N	8	t	2026-01-25 23:56:30.731854+02	2026-01-25 23:56:30.731854+02
30	כללי התנהגות 5	19	\N	9	t	2026-01-25 23:56:30.732353+02	2026-01-25 23:56:30.732353+02
31	הסביבה החדשה 1	19	\N	10	t	2026-01-25 23:56:30.732777+02	2026-01-25 23:56:30.732777+02
32	הסביבה החדשה 2	19	\N	11	t	2026-01-25 23:56:30.733234+02	2026-01-25 23:56:30.733234+02
33	סקובה 1	20	\N	1	t	2026-01-25 23:56:30.733647+02	2026-01-25 23:56:30.733647+02
34	סקובה 2	20	\N	2	t	2026-01-25 23:56:30.734674+02	2026-01-25 23:56:30.734674+02
35	סקובה 3	20	\N	3	t	2026-01-25 23:56:30.735083+02	2026-01-25 23:56:30.735083+02
36	סקובה 4	20	\N	4	t	2026-01-25 23:56:30.73551+02	2026-01-25 23:56:30.73551+02
37	סקובה 5	20	\N	5	t	2026-01-25 23:56:30.735914+02	2026-01-25 23:56:30.735914+02
38	קמס 1	20	\N	6	t	2026-01-25 23:56:30.736302+02	2026-01-25 23:56:30.736302+02
22	צלילת הכירות	16	\N	1	t	2026-01-25 23:56:30.727508+02	2026-01-25 23:57:12.333555+02
24	סיכונים בשהיה	19	\N	3	t	2026-01-25 23:56:30.729271+02	2026-01-25 23:57:18.292547+02
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: student_absences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_absences (id, student_id, absence_date, reason, is_excused, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_evaluations (id, student_id, subject_id, instructor_id, course_name, lesson_name, evaluation_date, raw_score, percentage_score, final_score, is_passing, has_critical_fail, notes, created_at, updated_at, is_final_test) FROM stdin;
284	58	19	28	\N	סיכונים בירידה	2026-01-29 09:22:58.454+02	71	71.00	71.00	t	f	\N	2026-01-29 09:22:58.454212+02	2026-01-29 09:22:58.454212+02	f
285	58	19	28	\N	כללי התנהגות 2	2026-01-29 09:23:55.221+02	73	73.00	73.00	f	t	\N	2026-01-29 09:23:55.221584+02	2026-01-29 09:23:55.221584+02	f
286	58	17	\N	\N	שנורקל	2026-01-29 16:15:14.622+02	56	56.00	56.00	t	f	\N	2026-01-29 16:15:14.622462+02	2026-01-29 16:15:14.622462+02	f
287	58	16	\N	\N	צלילת הכירות	2026-01-29 16:24:55.372+02	70	100.00	100.00	t	f	\N	2026-01-29 16:24:55.372643+02	2026-01-29 16:24:55.372643+02	f
288	58	19	28	\N	סיכונים בירידה	2026-01-30 12:51:35.87+02	69	69.00	69.00	t	f	\N	2026-01-30 12:51:35.869984+02	2026-01-30 12:51:35.869984+02	t
\.


--
-- Data for Name: student_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_skills (id, student_id, meters_30, meters_40, guidance, created_at, updated_at) FROM stdin;
22	58	f	f	f	2026-01-28 22:49:08.793873	2026-01-30 12:52:14.562136
\.


--
-- Data for Name: student_test_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_test_scores (id, student_id, test_type_id, score, passed, evaluation_id, test_date, notes, created_at, updated_at) FROM stdin;
1	58	22	85.00	t	\N	\N	\N	2026-01-30 10:19:41.096999	2026-01-30 10:19:41.096999
2	58	13	92.00	t	\N	\N	\N	2026-01-30 10:26:42.815491	2026-01-30 10:26:42.815491
3	58	14	1.00	f	\N	\N	\N	2026-01-30 10:36:15.360235	2026-01-30 10:36:15.360235
4	58	23	66.00	t	\N	\N	\N	2026-01-30 10:47:07.70142	2026-01-30 10:47:07.70142
5	58	24	77.00	t	\N	\N	\N	2026-01-30 10:47:14.156645	2026-01-30 10:47:14.156645
6	58	25	84.00	t	\N	\N	\N	2026-01-30 10:47:17.966623	2026-01-30 11:00:07.704759
7	58	26	11.00	f	\N	\N	\N	2026-01-30 10:47:21.852274	2026-01-30 11:02:32.38217
10	60	4	100.00	t	\N	\N	\N	2026-01-30 11:09:47.957791	2026-01-30 11:09:47.957791
11	60	8	70.00	t	\N	\N	\N	2026-01-30 12:40:11.222058	2026-01-30 12:40:11.222058
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, first_name, last_name, email, phone, unit_id, created_at, updated_at, id_number, photo_url) FROM stdin;
58	נעם	מנקרמן	noam@tidf.com	\N	\N	2026-01-28 22:36:11.962551+02	2026-01-28 22:36:11.962551+02	123456789	\N
60	דר	מנקרמן	dar@tidf.com	\N	\N	2026-01-30 11:03:36.634264+02	2026-01-30 11:03:36.634264+02	031953192	\N
\.


--
-- Data for Name: test_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_categories (id, code, name_he, course_type, display_order, created_at) FROM stdin;
1	assistant_external_tests	מבחנים עיוניים	מדריך_עוזר	1	2026-01-30 10:01:37.788801
2	assistant_skills	מיומנויות	מדריך_עוזר	2	2026-01-30 10:01:37.788801
3	assistant_instructor_tests	מבחני מדריך עוזר	מדריך_עוזר	3	2026-01-30 10:01:37.788801
4	instructor_water_tests	מבחני מים	מדריך	1	2026-01-30 10:01:37.788801
5	instructor_classroom_tests	מבחני כיתה	מדריך	2	2026-01-30 10:01:37.788801
6	instructor_external_tests	מבחנים עיוניים	מדריך	3	2026-01-30 10:01:37.788801
\.


--
-- Data for Name: test_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_types (id, code, category_id, name_he, score_type, display_order, created_at) FROM stdin;
1	assistant_instructor_exam	1	ציון מבחן מדריך עוזר	percentage	1	2026-01-30 10:01:37.788801
2	diving_authority_exam	1	ציון מבחן רשות הצלילה	percentage	2	2026-01-30 10:01:37.788801
3	three_stars_exam	1	ציון מבחן שלושה כוכבים	percentage	3	2026-01-30 10:01:37.788801
4	skill_30m	2	30 מטר	pass_fail	1	2026-01-30 10:01:37.788801
5	skill_40m	2	40 מטר	pass_fail	2	2026-01-30 10:01:37.788801
6	skill_rescue	2	הצלה	pass_fail	3	2026-01-30 10:01:37.788801
7	assistant_intro	3	הכרות	pass_fail	1	2026-01-30 10:01:37.788801
8	assistant_briefing	3	תדריך	percentage	2	2026-01-30 10:01:37.788801
9	assistant_equipment	3	ציוד	percentage	3	2026-01-30 10:01:37.788801
10	assistant_rescue	3	הצלה	pass_fail	4	2026-01-30 10:01:37.788801
11	assistant_extra_1	3	נוסף 1	pass_fail	5	2026-01-30 10:01:37.788801
12	assistant_extra_2	3	נוסף 2	pass_fail	6	2026-01-30 10:01:37.788801
13	water_cmas	4	קמס	percentage	1	2026-01-30 10:01:37.788801
14	water_scuba_1	4	סקובה 1	percentage	2	2026-01-30 10:01:37.788801
15	water_scuba_3	4	סקובה 3	percentage	3	2026-01-30 10:01:37.788801
16	water_scuba_5	4	סקובה 5	percentage	4	2026-01-30 10:01:37.788801
17	water_extra	4	נוסף	percentage	5	2026-01-30 10:01:37.788801
18	classroom_behavior	5	כללי התנהגות	percentage	1	2026-01-30 10:01:37.788801
19	classroom_risks	5	סיכוני צלילה	percentage	2	2026-01-30 10:01:37.788801
20	classroom_free_lecture	5	הרצאה חופשית	percentage	3	2026-01-30 10:01:37.788801
21	classroom_extra	5	נוסף	percentage	4	2026-01-30 10:01:37.788801
22	ext_physics	6	פיזיקה	percentage	1	2026-01-30 10:01:37.788801
23	ext_physiology	6	פיזיולוגיה	percentage	2	2026-01-30 10:01:37.788801
24	ext_eye_contact	6	קשר עין	percentage	3	2026-01-30 10:01:37.788801
25	ext_equipment	6	ציוד	percentage	4	2026-01-30 10:01:37.788801
26	ext_decompression	6	דקומפרסיה	percentage	5	2026-01-30 10:01:37.788801
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) FROM stdin;
35	hamdi@tidf.com	$2b$10$0oUldVO2VcPx6ZnDr/2x/.7ryVrILhFj1zD/XVqVBmaguTd/fgtp.	מיכאל	חמדי	admin	t	2026-01-31 12:35:56.505172+02	2026-01-31 12:58:36.299794+02
36	menakerman@gmail.com	$2b$10$00aWeQ1tx7cyEdrvdR2DjesaSuDcsfMXwbIb9rGI2PhkxBWgbDFfi	נדב	מנקרמן בוחן	instructor	t	2026-01-31 12:49:15.682769+02	2026-01-31 12:58:39.031729+02
31	miller@tidf.com	$2b$10$w99m5ZYvMMy2T2WSkUGCrOeSS9a.z0uKh10BhrYjlf1PvPr7bYCmi	אייל	מילר	instructor	t	2026-01-28 22:31:43.292636+02	2026-01-28 22:31:43.292636+02
30	nadav@tidf.com	$2b$10$erTDXvSJehacK9jwtjfueO5kiMhkoJwCh5YzQmT/7QUR3AzmbXtca	נדב	מנהל	admin	t	2026-01-28 22:26:33.087983+02	2026-01-29 16:21:17.390684+02
34	liron@tidf.com	$2b$10$5wCe.2aw29CC0MBRAhyjKukkiPBe/s/bOXHGflXMKFaecl22g5KQW	לירון	תירוש	admin	t	2026-01-30 10:07:59.375154+02	2026-01-31 12:58:32.37478+02
\.


--
-- Name: course_instructors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.course_instructors_id_seq', 26, true);


--
-- Name: course_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.course_students_id_seq', 62, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.courses_id_seq', 16, true);


--
-- Name: evaluation_criteria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_criteria_id_seq', 188, true);


--
-- Name: evaluation_item_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_item_scores_id_seq', 2446, true);


--
-- Name: evaluation_subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_subjects_id_seq', 20, true);


--
-- Name: external_tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_tests_id_seq', 35, true);


--
-- Name: instructors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instructors_id_seq', 30, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lessons_id_seq', 39, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: student_absences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_absences_id_seq', 18, true);


--
-- Name: student_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_evaluations_id_seq', 288, true);


--
-- Name: student_skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_skills_id_seq', 24, true);


--
-- Name: student_test_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_test_scores_id_seq', 11, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.students_id_seq', 60, true);


--
-- Name: test_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.test_categories_id_seq', 12, true);


--
-- Name: test_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.test_types_id_seq', 52, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 36, true);


--
-- Name: course_instructors course_instructors_course_id_instructor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_instructors
    ADD CONSTRAINT course_instructors_course_id_instructor_id_key UNIQUE (course_id, instructor_id);


--
-- Name: course_instructors course_instructors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_instructors
    ADD CONSTRAINT course_instructors_pkey PRIMARY KEY (id);


--
-- Name: course_students course_students_course_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_course_id_student_id_key UNIQUE (course_id, student_id);


--
-- Name: course_students course_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: evaluation_criteria evaluation_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_criteria
    ADD CONSTRAINT evaluation_criteria_pkey PRIMARY KEY (id);


--
-- Name: evaluation_item_scores evaluation_item_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_item_scores
    ADD CONSTRAINT evaluation_item_scores_pkey PRIMARY KEY (id);


--
-- Name: evaluation_subjects evaluation_subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_subjects
    ADD CONSTRAINT evaluation_subjects_code_key UNIQUE (code);


--
-- Name: evaluation_subjects evaluation_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_subjects
    ADD CONSTRAINT evaluation_subjects_pkey PRIMARY KEY (id);


--
-- Name: external_tests external_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_tests
    ADD CONSTRAINT external_tests_pkey PRIMARY KEY (id);


--
-- Name: external_tests external_tests_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_tests
    ADD CONSTRAINT external_tests_student_id_key UNIQUE (student_id);


--
-- Name: instructors instructors_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_email_key UNIQUE (email);


--
-- Name: instructors instructors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: student_absences student_absences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_absences
    ADD CONSTRAINT student_absences_pkey PRIMARY KEY (id);


--
-- Name: student_evaluations student_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_evaluations
    ADD CONSTRAINT student_evaluations_pkey PRIMARY KEY (id);


--
-- Name: student_skills student_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_pkey PRIMARY KEY (id);


--
-- Name: student_skills student_skills_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_student_id_key UNIQUE (student_id);


--
-- Name: student_test_scores student_test_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_scores
    ADD CONSTRAINT student_test_scores_pkey PRIMARY KEY (id);


--
-- Name: student_test_scores student_test_scores_student_id_test_type_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_scores
    ADD CONSTRAINT student_test_scores_student_id_test_type_id_key UNIQUE (student_id, test_type_id);


--
-- Name: students students_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_email_key UNIQUE (email);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: test_categories test_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT test_categories_code_key UNIQUE (code);


--
-- Name: test_categories test_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT test_categories_pkey PRIMARY KEY (id);


--
-- Name: test_types test_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_types
    ADD CONSTRAINT test_types_code_key UNIQUE (code);


--
-- Name: test_types test_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_types
    ADD CONSTRAINT test_types_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_course_instructors_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_instructors_course_id ON public.course_instructors USING btree (course_id);


--
-- Name: idx_course_instructors_instructor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_instructors_instructor_id ON public.course_instructors USING btree (instructor_id);


--
-- Name: student_skills trigger_update_student_skills_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_student_skills_updated_at BEFORE UPDATE ON public.student_skills FOR EACH ROW EXECUTE FUNCTION public.update_student_skills_updated_at();


--
-- Name: student_test_scores trigger_update_student_test_scores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_student_test_scores_updated_at BEFORE UPDATE ON public.student_test_scores FOR EACH ROW EXECUTE FUNCTION public.update_student_test_scores_updated_at();


--
-- Name: course_students update_course_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_students_updated_at BEFORE UPDATE ON public.course_students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evaluation_criteria update_evaluation_criteria_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evaluation_criteria_updated_at BEFORE UPDATE ON public.evaluation_criteria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evaluation_item_scores update_evaluation_item_scores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evaluation_item_scores_updated_at BEFORE UPDATE ON public.evaluation_item_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evaluation_subjects update_evaluation_subjects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evaluation_subjects_updated_at BEFORE UPDATE ON public.evaluation_subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instructors update_instructors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lessons update_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_absences update_student_absences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_student_absences_updated_at BEFORE UPDATE ON public.student_absences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_evaluations update_student_evaluations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_student_evaluations_updated_at BEFORE UPDATE ON public.student_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students update_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: course_instructors course_instructors_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_instructors
    ADD CONSTRAINT course_instructors_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_instructors course_instructors_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_instructors
    ADD CONSTRAINT course_instructors_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- Name: course_students course_students_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_students course_students_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_students
    ADD CONSTRAINT course_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: evaluation_criteria evaluation_criteria_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_criteria
    ADD CONSTRAINT evaluation_criteria_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.evaluation_subjects(id) ON DELETE CASCADE;


--
-- Name: evaluation_item_scores evaluation_item_scores_criterion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_item_scores
    ADD CONSTRAINT evaluation_item_scores_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES public.evaluation_criteria(id) ON DELETE RESTRICT;


--
-- Name: evaluation_item_scores evaluation_item_scores_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_item_scores
    ADD CONSTRAINT evaluation_item_scores_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.student_evaluations(id) ON DELETE CASCADE;


--
-- Name: external_tests external_tests_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_tests
    ADD CONSTRAINT external_tests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.evaluation_subjects(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_absences student_absences_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_absences
    ADD CONSTRAINT student_absences_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_evaluations student_evaluations_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_evaluations
    ADD CONSTRAINT student_evaluations_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;


--
-- Name: student_evaluations student_evaluations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_evaluations
    ADD CONSTRAINT student_evaluations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_evaluations student_evaluations_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_evaluations
    ADD CONSTRAINT student_evaluations_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.evaluation_subjects(id) ON DELETE RESTRICT;


--
-- Name: student_skills student_skills_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_test_scores student_test_scores_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_scores
    ADD CONSTRAINT student_test_scores_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.student_evaluations(id) ON DELETE SET NULL;


--
-- Name: student_test_scores student_test_scores_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_scores
    ADD CONSTRAINT student_test_scores_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_test_scores student_test_scores_test_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_scores
    ADD CONSTRAINT student_test_scores_test_type_id_fkey FOREIGN KEY (test_type_id) REFERENCES public.test_types(id) ON DELETE CASCADE;


--
-- Name: test_types test_types_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_types
    ADD CONSTRAINT test_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.test_categories(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict snlUvY8YXuW8fd9NkIvpJHmJE0b6t0b9WdTADp0NgFcxgjmNHEIElec4Jbgyd7T

