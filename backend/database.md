# Database Schema Documentation

This document provides a complete overview of the database structure for the AI Study Notes Generator application.

## Table Overview

The database consists of the following tables:

### Core Application Tables
1. **users** - User authentication and profile management
2. **documents** - Document metadata and organization
3. **document_files** - Individual PDF files within documents
4. **study_notes** - Basic study notes generated from documents
5. **enhanced_study_notes** - Advanced AI-generated study materials
6. **flashcards** - Question-answer pairs for memorization
7. **quizzes** - Quiz containers with multiple questions
8. **quiz_questions** - Individual quiz questions with answers
9. **note_questions** - Questions generated from enhanced study notes

### Authentication & System Tables
10. **personal_access_tokens** - API authentication tokens
11. **password_reset_tokens** - Password reset functionality
12. **sessions** - User session management
13. **cache** - Application caching
14. **cache_locks** - Cache locking mechanism
15. **jobs** - Background job processing
16. **job_batches** - Batch job management
17. **failed_jobs** - Failed job tracking

---

## Detailed Table Structures

### 1. users
**Purpose**: User authentication and profile management with email verification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `name` | varchar(255) | NOT NULL | User's full name |
| `email` | varchar(255) | NOT NULL, UNIQUE | User's email address |
| `email_verification_code` | varchar(6) | NULLABLE | 6-digit verification code |
| `email_verification_code_expires_at` | timestamp | NULLABLE | Code expiration timestamp |
| `email_verified_at` | timestamp | NULLABLE | Email verification timestamp |
| `password` | varchar(255) | NOT NULL | Hashed password |
| `remember_token` | varchar(100) | NULLABLE | Remember me token |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Relationships**:
- Has many `documents`
- Has many `personal_access_tokens` (polymorphic)

---

### 2. documents
**Purpose**: Document metadata and organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique document identifier |
| `user_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to users table |
| `title` | varchar(255) | NOT NULL | Document title (AI-generated) |
| `description` | text | NULLABLE | Document description (AI-generated) |
| `status` | enum | NOT NULL | Processing status: 'pending', 'processing', 'completed', 'failed' |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Enum Values**:
- `status`: `pending`, `processing`, `completed`, `failed`

**Relationships**:
- Belongs to `users`
- Has many `document_files`
- Has many `study_notes`
- Has many `enhanced_study_notes`
- Has many `flashcards`
- Has many `quizzes`

---

### 3. document_files
**Purpose**: Individual PDF files within documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique file identifier |
| `document_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to documents table |
| `original_filename` | varchar(255) | NOT NULL | Original PDF filename |
| `file_path` | varchar(255) | NOT NULL | Storage path for the file |
| `page_count` | int | DEFAULT 0 | Number of pages in the PDF |
| `extracted_text` | longtext | NOT NULL | Extracted text content from PDF |
| `order` | int | DEFAULT 0 | File order within document |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Relationships**:
- Belongs to `documents`

---

### 4. study_notes
**Purpose**: Basic study notes generated from documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique note identifier |
| `document_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to documents table |
| `content` | longtext | NOT NULL | Detailed study notes content |
| `summary` | text | NOT NULL | Brief summary of the content |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Relationships**:
- Belongs to `documents`

---

### 5. enhanced_study_notes
**Purpose**: Advanced AI-generated study materials with structured content

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique enhanced note identifier |
| `document_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to documents table |
| `section_title` | varchar(255) | NOT NULL | Title of the study section |
| `key_points` | json | NULLABLE | Array of key learning points |
| `definitions` | json | NULLABLE | Array of important definitions |
| `examples` | json | NULLABLE | Array of relevant examples |
| `order` | int | DEFAULT 0 | Section order within document |
| `lesson_intro` | text | NULLABLE | Introduction to the lesson |
| `section_summary` | text | NULLABLE | Summary of the section |
| `next_topic` | varchar(255) | NULLABLE | Next topic to study |
| `task` | text | NULLABLE | Learning task or exercise |
| `explanation` | text | NULLABLE | Detailed explanation |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Relationships**:
- Belongs to `documents`
- Has many `note_questions`

---

### 6. flashcards
**Purpose**: Question-answer pairs for memorization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique flashcard identifier |
| `document_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to documents table |
| `question` | text | NOT NULL | Flashcard question |
| `answer` | text | NOT NULL | Flashcard answer |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Relationships**:
- Belongs to `documents`

---

### 7. quizzes
**Purpose**: Quiz containers with multiple questions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique quiz identifier |
| `document_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to documents table |
| `title` | varchar(255) | NOT NULL | Quiz title |
| `type` | enum | NOT NULL | Quiz type |
| `difficulty` | enum | DEFAULT 'medium' | Quiz difficulty level |
| `total_questions` | int | NOT NULL | Number of questions in quiz |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Enum Values**:
- `type`: `multiple_choice`, `true_false`, `fill_in_blanks`
- `difficulty`: `easy`, `medium`, `hard`

**Relationships**:
- Belongs to `documents`
- Has many `quiz_questions`

---

### 8. quiz_questions
**Purpose**: Individual quiz questions with answers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique question identifier |
| `document_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to documents table |
| `quiz_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to quizzes table |
| `question` | text | NOT NULL | Question text |
| `type` | enum | NOT NULL | Question type |
| `options` | json | NULLABLE | Array of answer options (for multiple choice) |
| `correct_answer` | text | NOT NULL | Correct answer |
| `explanation` | text | NULLABLE | Explanation for the answer |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Enum Values**:
- `type`: `multiple_choice`, `true_false`, `fill_in_blanks`

**Relationships**:
- Belongs to `documents`
- Belongs to `quizzes`

---

### 9. note_questions
**Purpose**: Questions generated from enhanced study notes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique question identifier |
| `enhanced_note_id` | bigint unsigned | FOREIGN KEY, NOT NULL | Reference to enhanced_study_notes table |
| `type` | enum | NOT NULL | Question type |
| `question` | text | NOT NULL | Question text |
| `choices` | json | NULLABLE | Array of answer choices |
| `correct_answer` | text | NOT NULL | Correct answer |
| `order` | int | DEFAULT 0 | Question order within note |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Enum Values**:
- `type`: `mcq`, `fill_blank`, `short_answer`

**Relationships**:
- Belongs to `enhanced_study_notes`

---

### 10. personal_access_tokens
**Purpose**: API authentication tokens (Laravel Sanctum)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique token identifier |
| `tokenable_type` | varchar(255) | NOT NULL | Polymorphic model type |
| `tokenable_id` | bigint unsigned | NOT NULL | Polymorphic model ID |
| `name` | varchar(255) | NOT NULL | Token name |
| `token` | varchar(64) | NOT NULL, UNIQUE | Hashed token value |
| `abilities` | text | NULLABLE | Token permissions |
| `last_used_at` | timestamp | NULLABLE | Last usage timestamp |
| `expires_at` | timestamp | NULLABLE | Token expiration timestamp |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Relationships**:
- Polymorphic relationship with `users`

---

### 11. password_reset_tokens
**Purpose**: Password reset functionality

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `email` | varchar(255) | PRIMARY KEY | User's email address |
| `token` | varchar(255) | NOT NULL | Reset token |
| `created_at` | timestamp | NULLABLE | Token creation timestamp |

---

### 12. sessions
**Purpose**: User session management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar(255) | PRIMARY KEY | Session identifier |
| `user_id` | bigint unsigned | NULLABLE, INDEX | Reference to users table |
| `ip_address` | varchar(45) | NULLABLE | User's IP address |
| `user_agent` | text | NULLABLE | User's browser agent |
| `payload` | longtext | NOT NULL | Session data |
| `last_activity` | int | NOT NULL, INDEX | Last activity timestamp |

**Relationships**:
- Belongs to `users` (optional)

---

### 13. cache
**Purpose**: Application caching

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | varchar(255) | PRIMARY KEY | Cache key |
| `value` | mediumtext | NOT NULL | Cached value |
| `expiration` | int | NOT NULL | Expiration timestamp |

---

### 14. cache_locks
**Purpose**: Cache locking mechanism

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | varchar(255) | PRIMARY KEY | Lock key |
| `owner` | varchar(255) | NOT NULL | Lock owner identifier |
| `expiration` | int | NOT NULL | Lock expiration timestamp |

---

### 15. jobs
**Purpose**: Background job processing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique job identifier |
| `queue` | varchar(255) | NOT NULL, INDEX | Queue name |
| `payload` | longtext | NOT NULL | Job data |
| `attempts` | tinyint unsigned | NOT NULL | Number of attempts |
| `reserved_at` | int unsigned | NULLABLE | Reservation timestamp |
| `available_at` | int unsigned | NOT NULL | Available timestamp |
| `created_at` | int unsigned | NOT NULL | Creation timestamp |

---

### 16. job_batches
**Purpose**: Batch job management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar(255) | PRIMARY KEY | Batch identifier |
| `name` | varchar(255) | NOT NULL | Batch name |
| `total_jobs` | int | NOT NULL | Total number of jobs |
| `pending_jobs` | int | NOT NULL | Number of pending jobs |
| `failed_jobs` | int | NOT NULL | Number of failed jobs |
| `failed_job_ids` | longtext | NOT NULL | Array of failed job IDs |
| `options` | mediumtext | NULLABLE | Batch options |
| `cancelled_at` | int | NULLABLE | Cancellation timestamp |
| `created_at` | int | NOT NULL | Creation timestamp |
| `finished_at` | int | NULLABLE | Completion timestamp |

---

### 17. failed_jobs
**Purpose**: Failed job tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY, AUTO_INCREMENT | Unique failed job identifier |
| `uuid` | varchar(255) | NOT NULL, UNIQUE | Job UUID |
| `connection` | text | NOT NULL | Queue connection |
| `queue` | text | NOT NULL | Queue name |
| `payload` | longtext | NOT NULL | Job payload |
| `exception` | longtext | NOT NULL | Exception details |
| `failed_at` | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Failure timestamp |

---

## Database Relationships

### One-to-Many Relationships
- **users** → **documents** (A user can have multiple documents)
- **documents** → **document_files** (A document can have multiple files)
- **documents** → **study_notes** (A document can have multiple study notes)
- **documents** → **enhanced_study_notes** (A document can have multiple enhanced notes)
- **documents** → **flashcards** (A document can have multiple flashcards)
- **documents** → **quizzes** (A document can have multiple quizzes)
- **quizzes** → **quiz_questions** (A quiz can have multiple questions)
- **enhanced_study_notes** → **note_questions** (An enhanced note can have multiple questions)

### Polymorphic Relationships
- **users** ↔ **personal_access_tokens** (Users can have multiple API tokens)

### Optional Relationships
- **users** ↔ **sessions** (Users can have multiple sessions, sessions can exist without users)

---

## Indexes

### Primary Keys
- All tables have auto-incrementing `id` primary keys
- `password_reset_tokens` uses `email` as primary key
- `sessions` uses `id` as primary key
- `cache` uses `key` as primary key
- `cache_locks` uses `key` as primary key
- `job_batches` uses `id` as primary key

### Foreign Key Indexes
- `documents.user_id` → `users.id`
- `document_files.document_id` → `documents.id`
- `study_notes.document_id` → `documents.id`
- `enhanced_study_notes.document_id` → `documents.id`
- `flashcards.document_id` → `documents.id`
- `quizzes.document_id` → `documents.id`
- `quiz_questions.document_id` → `documents.id`
- `quiz_questions.quiz_id` → `quizzes.id`
- `note_questions.enhanced_note_id` → `enhanced_study_notes.id`

### Additional Indexes
- `users.email` (UNIQUE)
- `personal_access_tokens.token` (UNIQUE)
- `personal_access_tokens.tokenable_type` and `tokenable_id` (polymorphic)
- `sessions.user_id` (INDEX)
- `sessions.last_activity` (INDEX)
- `jobs.queue` (INDEX)
- `failed_jobs.uuid` (UNIQUE)

---

## Data Types and Constraints

### Text Fields
- **VARCHAR(255)**: Names, titles, emails, file paths
- **VARCHAR(6)**: Email verification codes
- **TEXT**: Descriptions, summaries, questions, answers
- **LONGTEXT**: Large content, extracted text, job payloads

### JSON Fields
- **key_points**: Array of learning points
- **definitions**: Array of definitions
- **examples**: Array of examples
- **options**: Array of answer choices
- **choices**: Array of question choices

### Timestamps
- **created_at**: Record creation time
- **updated_at**: Record modification time
- **email_verified_at**: Email verification time
- **email_verification_code_expires_at**: Code expiration time
- **last_used_at**: Token last usage time
- **expires_at**: Token expiration time
- **failed_at**: Job failure time

### Enums
- **Document Status**: `pending`, `processing`, `completed`, `failed`
- **Quiz Type**: `multiple_choice`, `true_false`, `fill_in_blanks`
- **Quiz Difficulty**: `easy`, `medium`, `hard`
- **Question Type**: `mcq`, `fill_blank`, `short_answer`

---

## Migration History

The database schema has evolved through the following migrations:

1. **0001_01_01_000000_create_users_table.php** - Initial user and session tables
2. **0001_01_01_000001_create_cache_table.php** - Cache system tables
3. **0001_01_01_000002_create_jobs_table.php** - Background job tables
4. **2023_06_07_113931_create_documents_table.php** - Core documents table
5. **2025_06_07_111242_create_personal_access_tokens_table.php** - API authentication
6. **2025_06_07_113936_create_study_notes_table.php** - Basic study notes
7. **2025_06_07_113940_create_flashcards_table.php** - Flashcards system
8. **2025_06_07_114404_create_document_files_table.php** - Document file management
9. **2024_03_19_113946_create_quiz_questions_table.php** - Initial quiz questions
10. **2024_03_20_000001_create_quizzes_table.php** - Quiz containers
11. **2024_03_20_000002_modify_quiz_questions_table.php** - Enhanced quiz questions
12. **2024_03_21_000001_create_enhanced_study_notes_table.php** - Advanced study notes
13. **2024_03_21_000002_create_note_questions_table.php** - Note questions
14. **2024_03_21_000003_modify_note_questions_correct_answer_column.php** - Question answer field
15. **2024_03_22_000000_add_course_fields_to_enhanced_study_notes.php** - Course structure fields
16. **2025_07_03_162556_modify_user_table.php** - Email verification system

---

## Notes

- All foreign keys use `CASCADE` on delete to maintain referential integrity
- The email verification system was added later to enhance security
- JSON fields are used for flexible data storage (arrays, objects)
- The system supports multiple file uploads per document with ordering
- Enhanced study notes provide structured learning materials with questions
- The quiz system supports multiple question types and difficulty levels
- Background job processing is supported for long-running operations
- Caching is implemented for performance optimization 