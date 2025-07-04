# AI Study Notes Generator

An intelligent document processing system that uses AI to generate study notes, flashcards, and quizzes from PDF documents. Built with Laravel 12 and Google Gemini 2.0 Flash.

## Features

- 📚 **Document Management**
  - Upload and manage PDF documents
  - Support for multi-file documents
  - Automatic text extraction from PDFs using Smalot PDF Parser
  - **Automatic AI-powered title and description generation** (no need to type them manually)
  - Document organization with titles and descriptions
  - Status tracking for processing
  - Page count tracking

- 📝 **Study Notes Generation**
  - AI-powered study notes creation using Google Gemini 2.0 Flash
  - Intelligent text chunking for large documents (30,000 token limit)
  - Key concepts extraction with detailed analysis
  - Comprehensive content generation with structured format
  - Summary generation for quick review
  - Multi-language support with automatic language detection
  - Robust error handling and retry mechanisms

- 🗂 **Flashcards**
  - Automatic flashcard generation from document content
  - Customizable number of flashcards (1-50)
  - Question and answer pairs
  - Duplicate detection and removal
  - Based on extracted study notes

- 📋 **Quiz Generation**
  - Multiple types of quizzes:
    - Multiple choice questions
    - True/False questions
    - Fill in the blanks
  - Customizable number of questions
  - Detailed explanations for answers
  - Quiz progress tracking

- 🔍 **Enhanced Study Notes**
  - Advanced AI-powered note generation
  - Interactive question generation
  - Detailed content analysis
  - Structured learning materials

- ✉️ **Email Verification System**
  - Secure user registration with email verification
  - 6-digit verification codes sent via email
  - 15-minute expiration for verification codes
  - Email verification required before login
  - Resend verification code functionality
  - Automatic email sending with error handling

- ✅ **Answer Validation**
  - AI-powered answer validation for quiz questions
  - Support for multiple question types:
    - Multiple choice questions (MCQ)
    - Fill in the blanks
    - Short answer questions
  - Intelligent scoring and feedback
  - Detailed validation results with explanations

## Tech Stack

- **Backend**: Laravel 12.x
- **Database**: MySQL 8.0+
- **AI Integration**: Google Gemini 2.0 Flash
- **Authentication**: Laravel Sanctum
- **PDF Processing**: Smalot PDF Parser
- **File Storage**: Laravel Storage
- **HTTP Client**: Guzzle HTTP
- **Email**: Laravel Mail with SMTP support

## Prerequisites

- PHP >= 8.2
- Composer
- MySQL 8.0+
- Google Gemini API Key
- SMTP server for email verification
- Sufficient storage space for PDF files

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-study-notes.git
   cd ai-study-notes
   ```

2. Install dependencies:
   ```bash
   composer install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Configure your `.env` file:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_database
   DB_USERNAME=your_username
   DB_PASSWORD=your_password

   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.0-flash
   GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

   FILESYSTEM_DISK=public

   # Email Configuration (for verification system)
   MAIL_MAILER=smtp
   MAIL_HOST=your_smtp_host
   MAIL_PORT=587
   MAIL_USERNAME=your_email_username
   MAIL_PASSWORD=your_email_password
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS=your_from_email
   MAIL_FROM_NAME="${APP_NAME}"
   ```

5. Run migrations:
   ```bash
   php artisan migrate
   ```

6. Create storage link:
   ```bash
   php artisan storage:link
   ```

7. **(Recommended for large PDFs)**: Increase your PHP memory limit in `php.ini` or at runtime. For example:
   ```ini
   memory_limit = 1024M
   ```
   Or add this to your controller before PDF processing:
   ```php
   ini_set('memory_limit', '1024M');
   ```
   This helps prevent memory errors when processing large or complex PDFs with Smalot PDF Parser.

## AI-Powered Title & Description Generation

- When you upload a document, the system automatically extracts the first 1000 words and sends them to Gemini 2.0 Flash.
- The AI generates a title and description in the same language as the document (French, English, etc.).
- **No need to type the title or description yourself!**
- The system uses an ultra-strict prompt to ensure Gemini returns only a clean JSON object (no code blocks, markdown, or extra fields).
- Robust double-decoding and cleaning logic ensures the title and description are always extracted, even if Gemini's output is not perfect.

## Email Verification System

### Registration Flow
1. User registers with name, email, and password
2. System generates a 6-digit verification code
3. Verification code is sent to user's email
4. User must verify email before logging in
5. Verification codes expire after 15 minutes

### Features
- **Secure Code Generation**: 6-digit numeric codes with proper padding
- **Automatic Expiration**: Codes expire after 15 minutes for security
- **Resend Functionality**: Users can request new codes if needed
- **Error Handling**: Graceful handling of email sending failures
- **Duplicate Prevention**: Users cannot verify already verified emails

### Email Configuration
Make sure to configure your SMTP settings in the `.env` file. The system uses Laravel's built-in mail system to send verification codes.

## Answer Validation System

### Supported Question Types
- **Multiple Choice Questions (MCQ)**: Validates exact answer matches
- **Fill in the Blanks**: AI-powered semantic validation
- **Short Answer Questions**: Intelligent answer comparison using AI

### Features
- **AI-Powered Validation**: Uses Google Gemini for intelligent answer comparison
- **Flexible Scoring**: Provides detailed feedback and scoring
- **Multi-language Support**: Works with questions in any language
- **Robust Error Handling**: Graceful handling of validation failures

### Usage
Send a POST request to `/api/validate-answer` with:
- `question`: The question text
- `correct_answer`: The expected correct answer
- `user_answer`: The user's submitted answer
- `question_type`: Type of question (mcq, fill_blank, short_answer)

## Troubleshooting & FAQ

### Out of Memory Error (PDF Parsing)
- If you see an error like:
  ```
  Allowed memory size of 536870912 bytes exhausted (tried to allocate ...)
  ```
  This means the PDF is too large or complex for the current PHP memory limit. Increase the limit as described above, or split/optimize your PDF.

### AI Title/Description Not Generated or Incorrect
- The system uses a very strict prompt for Gemini, but if you still see issues:
  - Make sure your Gemini API key and endpoint are correct.
  - Try re-uploading the document.
  - Check logs for AI response errors or malformed JSON.
  - The system will always try to extract the correct fields, even if Gemini adds extra formatting.

### Gemini Output Contains Code Blocks or Extra Fields
- The prompt instructs Gemini to return only a JSON object, but if you still see code blocks or extra fields, the backend will clean and double-decode the response to extract only the `title` and `description`.
- If Gemini's output is still not parsed, check the logs for the raw AI response and adjust the prompt or cleaning logic if needed.

### Email Verification Issues
- **Verification Code Not Received**: Check your SMTP configuration and spam folder
- **Code Expired**: Use the resend verification code endpoint
- **Invalid Code**: Ensure you're using the latest code sent to your email
- **Already Verified**: Check if your email is already verified before attempting verification

### Answer Validation Errors
- **AI Service Unavailable**: Check your Gemini API configuration
- **Invalid Question Type**: Ensure question_type is one of: mcq, fill_blank, short_answer
- **Validation Timeout**: Large documents may take longer to process

## API Endpoints

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
  - Parameters:
    - `num_cards`: Number of flashcards to generate (1-50)
- `DELETE /api/documents/{document}/flashcards/{flashcard}` - Delete flashcard

### Quizzes
- `GET /api/documents/{document}/quizzes` - List quizzes
- `POST /api/documents/{document}/quizzes/generate` - Generate quiz
  - Parameters:
    - `type`: Quiz type (multiple_choice, true_false, fill_in_blanks)
    - `num_questions`: Number of questions to generate
- `GET /api/documents/{document}/quizzes/{quiz}` - Get quiz details
- `DELETE /api/documents/{document}/quizzes/{quiz}` - Delete quiz

### Answer Validation
- `POST /api/validate-answer` - Validate user answers using AI
  - Parameters:
    - `question`: Question text
    - `correct_answer`: Expected correct answer
    - `user_answer`: User's submitted answer
    - `question_type`: Type of question (mcq, fill_blank, short_answer)

## AI Service Features

### Text Processing
- **Intelligent Chunking**: Automatically splits large documents into manageable chunks (30,000 token limit)
- **Token Estimation**: Conservative token counting (0.25 tokens per character)
- **Multi-language Support**: Automatic language detection and response generation
- **Unicode Support**: Proper handling of special characters and accents

### Error Handling
- **Robust Response Parsing**: Handles nested JSON responses and malformed AI outputs
- **Retry Mechanisms**: Automatic retry on API failures
- **Graceful Degradation**: Continues processing even if some chunks fail
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

### Performance Optimizations
- **Request Timeouts**: 3-minute timeout for large requests
- **Rate Limiting**: Built-in delays between chunk processing
- **Memory Management**: Efficient text processing and cleanup

## Error Handling

The API uses standard HTTP response codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Email not verified)
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

Error responses follow this format:
```json
{
    "message": "Error description",
    "errors": {
        "field": ["Error details"]
    }
}
```

## Development

1. Start the development server:
   ```bash
   php artisan serve
   ```

2. Run tests:
   ```bash
   php artisan test
   ```

3. Use the development script for full environment:
   ```bash
   composer run dev
   ```

## Database Schema

### Core Models
- **User**: Authentication and user management with email verification fields
- **Document**: Document metadata and organization
- **DocumentFile**: Individual PDF files within documents
- **StudyNote**: Basic study notes generated from documents
- **EnhancedStudyNote**: Advanced AI-generated study materials
- **Flashcard**: Question-answer pairs for memorization
- **Quiz**: Quiz containers with multiple questions
- **QuizQuestion**: Individual quiz questions with answers
- **NoteQuestion**: Questions generated from enhanced study notes

### User Model Fields
- `name`: User's full name
- `email`: Email address (must be verified)
- `password`: Hashed password
- `email_verification_code`: 6-digit verification code
- `email_verification_code_expires_at`: Code expiration timestamp
- `email_verified_at`: Email verification timestamp

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Laravel](https://laravel.com) - The web framework used
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI model for text generation
- [Smalot PDF Parser](https://github.com/smalot/pdfparser) - PDF text extraction
- [Laravel Sanctum](https://laravel.com/docs/sanctum) - API authentication
- [Laravel Mail](https://laravel.com/docs/mail) - Email functionality
