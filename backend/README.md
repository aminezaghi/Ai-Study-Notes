# AI Study Notes Generator

An intelligent document processing system that uses AI to generate study notes, flashcards, and quizzes from PDF documents. Built with Laravel 12 and Google Gemini 2.0 Flash.

## Features

- 📚 **Document Management**
  - Upload and manage PDF documents
  - Support for multi-file documents
  - Automatic text extraction from PDFs using Smalot PDF Parser
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

## Tech Stack

- **Backend**: Laravel 12.x
- **Database**: MySQL 8.0+
- **AI Integration**: Google Gemini 2.0 Flash
- **Authentication**: Laravel Sanctum
- **PDF Processing**: Smalot PDF Parser
- **File Storage**: Laravel Storage
- **HTTP Client**: Guzzle HTTP

## Prerequisites

- PHP >= 8.2
- Composer
- MySQL 8.0+
- Google Gemini API Key
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
   ```

5. Run migrations:
   ```bash
   php artisan migrate
   ```

6. Create storage link:
   ```bash
   php artisan storage:link
   ```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/user` - Get authenticated user

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents` - Upload new document
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
- `403` - Forbidden
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
- **User**: Authentication and user management
- **Document**: Document metadata and organization
- **DocumentFile**: Individual PDF files within documents
- **StudyNote**: Basic study notes generated from documents
- **EnhancedStudyNote**: Advanced AI-generated study materials
- **Flashcard**: Question-answer pairs for memorization
- **Quiz**: Quiz containers with multiple questions
- **QuizQuestion**: Individual quiz questions with answers
- **NoteQuestion**: Questions generated from enhanced study notes

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
