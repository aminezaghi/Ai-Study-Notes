# StudyMate - AI-Powered Study Platform

**StudyMate** is a comprehensive AI-powered study platform that transforms PDF documents into interactive study materials, including notes, flashcards, and quizzes. The platform consists of a Laravel backend API and a Next.js frontend application.

## 🎯 Overview

StudyMate leverages Google Gemini 2.0 Flash to automatically generate study materials from PDF documents. Users can upload PDFs, and the system creates structured study notes, interactive flashcards, and customizable quizzes with AI-powered validation.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Usage Guide](#usage-guide)
10. [Development](#development)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)
13. [License](#license)

---

## ✨ Features

### Core Features
- 📚 **Document Management**
  - Upload and manage PDF documents
  - Support for multi-file documents
  - Automatic text extraction from PDFs using Smalot PDF Parser
  - **Automatic AI-powered title and description generation**
  - Document organization with titles and descriptions
  - Status tracking for processing
  - Page count tracking

- 📝 **Study Materials Generation**
  - AI-powered study notes creation using Google Gemini 2.0 Flash
  - Intelligent text chunking for large documents (30,000 token limit)
  - Key concepts extraction with detailed analysis
  - Comprehensive content generation with structured format
  - Summary generation for quick review
  - Multi-language support with automatic language detection

- 🗂 **Interactive Flashcards**
  - Automatic flashcard generation from document content
  - Customizable number of flashcards (1-50)
  - Question and answer pairs
  - Duplicate detection and removal
  - Interactive study interface

- 📋 **AI-Powered Quizzes**
  - Multiple types of quizzes:
    - Multiple choice questions
    - True/False questions
    - Fill in the blanks
  - Customizable number of questions
  - Detailed explanations for answers
  - Quiz progress tracking
  - AI-powered answer validation

- 🔍 **Enhanced Study Notes**
  - Advanced AI-powered note generation
  - Interactive question generation
  - Detailed content analysis
  - Structured learning materials
  - Section-based organization

### User Experience Features
- ✉️ **Email Verification System**
  - Secure user registration with email verification
  - 6-digit verification codes sent via email
  - 15-minute expiration for verification codes
  - Resend verification code functionality
  - Email verification required before login

- 🎨 **Modern UI/UX**
  - Responsive design with glassmorphism effects
  - Dark/light mode toggle
  - Smooth animations using GSAP and Framer Motion
  - Toast notifications for all actions
  - Accessible UI components using Radix UI

- 🔒 **Security**
  - JWT-based authentication
  - API rate limiting
  - Secure file upload handling
  - Data validation and sanitization

---

## 🛠 Tech Stack

### Backend (Laravel API)
- **Framework**: Laravel 12.x
- **Database**: MySQL 8.0+
- **AI Integration**: Google Gemini 2.0 Flash
- **Authentication**: Laravel Sanctum
- **PDF Processing**: Smalot PDF Parser
- **File Storage**: Laravel Storage
- **HTTP Client**: Guzzle HTTP
- **Email**: Laravel Mail with SMTP support

### Frontend (Next.js)
- **Framework**: Next.js 15 (App Router, SSR/CSR)
- **Language**: TypeScript, React 19
- **Styling**: Tailwind CSS, custom animations, glassmorphism
- **UI Components**: Radix UI, shadcn/ui, Lucide icons
- **State Management**: React Query, Zustand
- **Animation**: GSAP, Framer Motion
- **Forms**: React Hook Form
- **Notifications**: Sonner (toasts)
- **HTTP Client**: Axios

### Database
- **Primary**: MySQL 8.0+
- **Caching**: Redis (optional)
- **Session Storage**: Database/Redis

---

## 📋 Prerequisites

- **PHP** >= 8.2
- **Node.js** >= 18.0
- **Composer** (PHP package manager)
- **npm/yarn/pnpm** (Node package manager)
- **MySQL** 8.0+
- **Google Gemini API Key**
- **SMTP Server** for email verification
- **Sufficient storage space** for PDF files

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/studymate.git
cd studymate
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
composer install
```

#### Environment Configuration
```bash
cp .env.example .env
php artisan key:generate
```

#### Configure Environment Variables
Edit `.env` file:

```env
# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=studymate
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# File Storage
FILESYSTEM_DISK=public

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USERNAME=your_email_username
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your_from_email
MAIL_FROM_NAME="${APP_NAME}"

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### Database Setup
```bash
php artisan migrate
php artisan storage:link
```

#### Start Backend Server
```bash
php artisan serve
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
# or
yarn install
# or
pnpm install
```

#### Environment Configuration
Create `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

#### Start Frontend Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The frontend will be available at `http://localhost:3000`

---

## 🗄 Database Schema

### Core Tables

#### 1. users
**Purpose**: User authentication and profile management with email verification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY | Unique user identifier |
| `name` | varchar(255) | NOT NULL | User's full name |
| `email` | varchar(255) | NOT NULL, UNIQUE | User's email address |
| `email_verification_code` | varchar(6) | NULLABLE | 6-digit verification code |
| `email_verification_code_expires_at` | timestamp | NULLABLE | Code expiration timestamp |
| `email_verified_at` | timestamp | NULLABLE | Email verification timestamp |
| `password` | varchar(255) | NOT NULL | Hashed password |
| `remember_token` | varchar(100) | NULLABLE | Remember me token |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

#### 2. documents
**Purpose**: Document metadata and organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY | Unique document identifier |
| `user_id` | bigint unsigned | FOREIGN KEY | Reference to users table |
| `title` | varchar(255) | NOT NULL | Document title (AI-generated) |
| `description` | text | NULLABLE | Document description (AI-generated) |
| `status` | enum | NOT NULL | Processing status |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Status Values**: `pending`, `processing`, `completed`, `failed`

#### 3. document_files
**Purpose**: Individual PDF files within documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY | Unique file identifier |
| `document_id` | bigint unsigned | FOREIGN KEY | Reference to documents table |
| `original_filename` | varchar(255) | NOT NULL | Original PDF filename |
| `file_path` | varchar(255) | NOT NULL | Storage path for the file |
| `page_count` | int | DEFAULT 0 | Number of pages in the PDF |
| `extracted_text` | longtext | NOT NULL | Extracted text content from PDF |
| `order` | int | DEFAULT 0 | File order within document |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

#### 4. enhanced_study_notes
**Purpose**: Advanced AI-generated study materials

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY | Unique enhanced note identifier |
| `document_id` | bigint unsigned | FOREIGN KEY | Reference to documents table |
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

#### 5. flashcards
**Purpose**: Question-answer pairs for memorization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY | Unique flashcard identifier |
| `document_id` | bigint unsigned | FOREIGN KEY | Reference to documents table |
| `question` | text | NOT NULL | Flashcard question |
| `answer` | text | NOT NULL | Flashcard answer |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

#### 6. quizzes
**Purpose**: Quiz containers with multiple questions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY | Unique quiz identifier |
| `document_id` | bigint unsigned | FOREIGN KEY | Reference to documents table |
| `title` | varchar(255) | NOT NULL | Quiz title |
| `type` | enum | NOT NULL | Quiz type |
| `difficulty` | enum | DEFAULT 'medium' | Quiz difficulty level |
| `total_questions` | int | NOT NULL | Number of questions in quiz |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

**Type Values**: `multiple_choice`, `true_false`, `fill_in_blanks`
**Difficulty Values**: `easy`, `medium`, `hard`

#### 7. quiz_questions
**Purpose**: Individual quiz questions with answers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigint unsigned | PRIMARY KEY | Unique question identifier |
| `document_id` | bigint unsigned | FOREIGN KEY | Reference to documents table |
| `quiz_id` | bigint unsigned | FOREIGN KEY | Reference to quizzes table |
| `question` | text | NOT NULL | Question text |
| `type` | enum | NOT NULL | Question type |
| `options` | json | NULLABLE | Array of answer options |
| `correct_answer` | text | NOT NULL | Correct answer |
| `explanation` | text | NULLABLE | Explanation for the answer |
| `created_at` | timestamp | NULLABLE | Record creation timestamp |
| `updated_at` | timestamp | NULLABLE | Record update timestamp |

### Database Relationships

- **users** → **documents** (One-to-Many)
- **documents** → **document_files** (One-to-Many)
- **documents** → **enhanced_study_notes** (One-to-Many)
- **documents** → **flashcards** (One-to-Many)
- **documents** → **quizzes** (One-to-Many)
- **quizzes** → **quiz_questions** (One-to-Many)
- **enhanced_study_notes** → **note_questions** (One-to-Many)

---

## 🔗 API Endpoints

### Authentication & Email Verification
- `POST /api/register` - Register a new user (requires email verification)
- `POST /api/login` - Login user (requires verified email)
- `POST /api/logout` - Logout user
- `GET /api/user` - Get authenticated user
- `POST /api/verify-email` - Verify email with 6-digit code
- `POST /api/resend-verification-code` - Resend verification code

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents` - Upload new document (AI auto-generates title/description)
- `GET /api/documents/{id}` - Get document details
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/documents/{id}/files` - List document files
- `POST /api/documents/{id}/files` - Add file to document

### Study Notes
- `GET /api/documents/{document}/notes` - Get study notes
- `POST /api/documents/{document}/notes/generate` - Generate study notes

### Enhanced Study Notes
- `GET /api/documents/{document}/enhanced-notes` - Get enhanced study notes
- `POST /api/documents/{document}/enhanced-notes/generate` - Generate enhanced study notes
- `GET /api/documents/{document}/enhanced-notes/{enhancedNote}` - Get specific enhanced note
- `DELETE /api/documents/{document}/enhanced-notes/{enhancedNote}` - Delete enhanced note

### Flashcards
- `GET /api/documents/{document}/flashcards` - List flashcards
- `POST /api/documents/{document}/flashcards/generate` - Generate flashcards
  - Parameters: `num_cards` (1-50)
- `DELETE /api/documents/{document}/flashcards/{flashcard}` - Delete flashcard

### Quizzes
- `GET /api/documents/{document}/quizzes` - List quizzes
- `POST /api/documents/{document}/quizzes/generate` - Generate quiz
  - Parameters: `type`, `num_questions`
- `GET /api/documents/{document}/quizzes/{quiz}` - Get quiz details
- `DELETE /api/documents/{document}/quizzes/{quiz}` - Delete quiz

### Answer Validation
- `POST /api/validate-answer` - Validate user answers using AI
  - Parameters: `question`, `correct_answer`, `user_answer`, `question_type`

---

## 📖 Usage Guide

### 1. User Registration and Verification
1. Register with name, email, and password
2. Check email for 6-digit verification code
3. Enter verification code on verification page
4. Login with verified account

### 2. Document Upload
1. Navigate to dashboard
2. Click "Upload Document" button
3. Select PDF file(s)
4. AI automatically generates title and description
5. Document is processed and study materials are generated

### 3. Study Materials
- **Enhanced Notes**: Structured learning materials with key points, definitions, and examples
- **Flashcards**: Interactive question-answer pairs for memorization
- **Quizzes**: Multiple choice, true/false, and fill-in-the-blank questions

### 4. Interactive Learning
- Navigate between different study materials using tabs
- Practice with flashcards in interactive mode
- Take quizzes with AI-powered answer validation
- Track progress and performance

---

## 🔧 Development

### Backend Development
```bash
cd backend

# Install dependencies
composer install

# Run migrations
php artisan migrate

# Run tests
php artisan test

# Start development server
php artisan serve
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Key Development Notes

#### Backend
- **Memory Limit**: Increase PHP memory limit for large PDF processing
- **AI Integration**: Robust error handling for Gemini API responses
- **File Storage**: Proper file cleanup and storage management
- **Email System**: Configure SMTP for email verification

#### Frontend
- **Hydration**: Avoid `Math.random()` in render to prevent hydration errors
- **Animations**: Check element existence before GSAP animations
- **State Management**: Clear React Query cache on logout
- **CORS**: Ensure backend allows frontend origin

---

## 🐛 Troubleshooting

### Common Backend Issues

#### Out of Memory Error (PDF Parsing)
```bash
# Increase PHP memory limit
ini_set('memory_limit', '1024M');
```

#### AI Title/Description Generation Issues
- Verify Gemini API key and endpoint
- Check logs for AI response errors
- Ensure proper JSON parsing in response

#### Email Verification Problems
- Check SMTP configuration
- Verify email credentials
- Check spam folder for verification codes

### Common Frontend Issues

#### Hydration Errors
- Use `useMemo` for random values
- Ensure consistent SSR/CSR rendering

#### CORS Issues
- Configure backend CORS settings
- Check API base URL configuration

#### Animation Issues
- Verify DOM element existence before animations
- Use `useLayoutEffect` for DOM-dependent animations

### API Error Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Email not verified)
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

---

## 🏗 Project Structure

### Backend Structure
```
backend/
├── app/
│   ├── Http/Controllers/     # API controllers
│   ├── Models/              # Eloquent models
│   ├── Services/            # Business logic services
│   └── Mail/                # Email templates
├── database/
│   ├── migrations/          # Database migrations
│   └── seeders/             # Database seeders
├── routes/
│   └── api.php             # API routes
├── storage/
│   └── app/public/         # File storage
└── tests/                  # Test files
```

### Frontend Structure
```
frontend/
├── app/                    # Next.js app directory
│   ├── register/          # Registration page
│   ├── login/             # Login page
│   ├── verify-email/      # Email verification
│   └── dashboard/         # Main dashboard
├── components/            # UI components
├── hooks/                 # Custom React hooks
├── lib/                   # API client and utilities
├── styles/                # Global styles
└── types/                 # TypeScript types
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PSR-12 coding standards for PHP
- Use TypeScript for all frontend code
- Write tests for new features
- Update documentation for API changes
- Ensure responsive design for UI components

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Laravel](https://laravel.com) - The web framework used
- [Next.js](https://nextjs.org) - The React framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI model for text generation
- [Smalot PDF Parser](https://github.com/smalot/pdfparser) - PDF text extraction
- [Laravel Sanctum](https://laravel.com/docs/sanctum) - API authentication
- [React Query](https://tanstack.com/query) - Data fetching and caching
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Radix UI](https://radix-ui.com) - Accessible UI components

---

## 📞 Support

For support, email [your-email@example.com] or create an issue in the GitHub repository.

---

## 🔮 Future Enhancements

- Real-time collaboration features
- Advanced analytics and progress tracking
- Mobile app development
- Integration with more AI models
- Advanced quiz types and gamification
- Bulk document processing
- API rate limiting and usage analytics
- Multi-language UI support