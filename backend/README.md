# AI Study Notes Generator

An intelligent document processing system that uses AI to generate study notes, flashcards, and quizzes from PDF documents.

## Features

- 📚 **Document Management**
  - Upload and manage PDF documents
  - Automatic text extraction from PDFs
  - Document organization and tracking

- 📝 **Study Notes Generation**
  - AI-powered study notes creation
  - Key concepts extraction
  - Summary generation
  - Multi-language support

- 🗂 **Flashcards**
  - Automatic flashcard generation
  - Question and answer pairs
  - Based on document content
  - Spaced repetition support

- 📋 **Quiz Generation**
  - Multiple choice questions
  - True/False questions
  - Fill in the blanks
  - Explanations for answers

## Tech Stack

- **Backend**: Laravel 10.x
- **Database**: MySQL
- **AI Integration**: Google Gemini Pro
- **Authentication**: Laravel Sanctum
- **PDF Processing**: Smalot PDF Parser

## Prerequisites

- PHP >= 8.1
- Composer
- MySQL
- Google Gemini API Key

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

### Study Notes
- `GET /api/documents/{document}/notes` - Get study notes
- `POST /api/documents/{document}/notes/generate` - Generate study notes

### Flashcards
- `GET /api/documents/{document}/flashcards` - List flashcards
- `POST /api/documents/{document}/flashcards/generate` - Generate flashcards
- `DELETE /api/documents/{document}/flashcards/{flashcard}` - Delete flashcard

### Quizzes
- `GET /api/documents/{document}/quizzes` - List quizzes
- `POST /api/documents/{document}/quizzes/generate` - Generate quiz
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
- `500` - Server Error

Error responses follow this format:
```json
{
    "message": "Error description"
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
