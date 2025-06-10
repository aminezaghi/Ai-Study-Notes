# AI Study Notes Generator

An intelligent document processing system that uses AI to generate study notes, flashcards, and quizzes from PDF documents.

## Features

- 📚 **Document Management**
  - Upload and manage PDF documents
  - Support for multi-file documents
  - Automatic text extraction from PDFs
  - Document organization with titles and descriptions
  - Status tracking for processing
  - Page count tracking

- 📝 **Study Notes Generation**
  - AI-powered study notes creation
  - Key concepts extraction
  - Comprehensive content generation
  - Summary generation for quick review
  - Multi-language support

- 🗂 **Flashcards**
  - Automatic flashcard generation
  - Customizable number of flashcards (1-50)
  - Question and answer pairs
  - Based on document content
  - Duplicate detection and removal

- 📋 **Quiz Generation**
  - Multiple types of quizzes:
    - Multiple choice questions
    - True/False questions
    - Fill in the blanks
  - Customizable number of questions
  - Detailed explanations for answers
  - Quiz progress tracking

## Tech Stack

- **Backend**: Laravel 10.x
- **Database**: MySQL 8.0+
- **AI Integration**: Google Gemini Pro
- **Authentication**: Laravel Sanctum
- **PDF Processing**: Smalot PDF Parser
- **File Storage**: Laravel Storage

## Prerequisites

- PHP >= 8.1
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
- `GET /api/documents/{document}/notes/{note}` - Get specific note

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

3. Monitor the queue (for background jobs):
   ```bash
   php artisan queue:work
   ```

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
