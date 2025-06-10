# Technical Roadmap: AI Study Notes Generator

## 1. Project Setup & Architecture

### Backend (Laravel) Structure:
```
laravel-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── DocumentController.php
│   │   │   ├── StudyNoteController.php
│   │   │   ├── FlashcardController.php
│   │   │   └── QuizController.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Document.php
│   │   ├── StudyNote.php
│   │   ├── Flashcard.php
│   │   └── Quiz.php
│   ├── Services/
│   │   ├── PDFProcessingService.php
│   │   ├── AIService.php
│   │   ├── StudyNoteGenerationService.php
│   │   └── FlashcardGenerationService.php
│   └── Jobs/
│       └── ProcessPDFDocument.php
```

### Frontend (Next.js) Structure:
```
nextjs-frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── documents/[id]/
│   │   ├── flashcards/
│   │   └── quiz/
│   ├── components/
│   │   ├── ui/
│   │   ├── documents/
│   │   ├── flashcards/
│   │   └── study-notes/
│   ├── services/
│   │   ├── api.ts
│   │   └── auth.ts
│   └── store/
│       └── zustand stores
```

## 2. Database Schema

```sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255),
    remember_token VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    title VARCHAR(255),
    description TEXT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Document Files table
CREATE TABLE document_files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT,
    original_filename VARCHAR(255),
    file_path VARCHAR(255),
    page_count INT DEFAULT 0,
    extracted_text LONGTEXT,
    order INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Study Notes table
CREATE TABLE study_notes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT,
    content LONGTEXT,
    summary TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Flashcards table
CREATE TABLE flashcards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT,
    question TEXT,
    answer TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Quizzes table
CREATE TABLE quizzes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT,
    title VARCHAR(255),
    type ENUM('multiple_choice', 'true_false', 'fill_in_blanks'),
    total_questions INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Quiz Questions table
CREATE TABLE quiz_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT,
    quiz_id BIGINT,
    question TEXT,
    type ENUM('multiple_choice', 'true_false', 'fill_in_blanks'),
    options JSON NULL,
    correct_answer TEXT,
    explanation TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);
```

## 3. Implementation Steps

### Phase 1: Project Setup & Authentication

1. **Backend Setup**:
   - Create new Laravel project
   - Install required packages:
     ```bash
     composer require laravel/sanctum
     composer require smalot/pdfparser
     composer require guzzlehttp/guzzle
     ```
   - Configure Laravel Sanctum for API authentication
   - Set up database migrations

2. **Frontend Setup**:
   - Create Next.js project with TypeScript
   - Install dependencies:
     ```bash
     npm install @tanstack/react-query zustand axios @mantine/core
     ```
   - Set up authentication context and API services

### Phase 2: PDF Processing & Storage

1. **File Storage Setup**:
   ```php
   // config/filesystems.php
   'local' => [
       'driver' => 'local',
       'root' => storage_path('app/public'),
       'url' => env('APP_URL').'/storage',
       'visibility' => 'public',
   ]
   ```

2. **PDF Processing Service**:
   ```php
   // app/Services/PDFProcessingService.php
   class PDFProcessingService
   {
       private $parser;
       
       public function __construct()
       {
           $this->parser = new \Smalot\PdfParser\Parser();
       }
       
       public function extractText($filePath)
       {
           $pdf = $this->parser->parseFile(storage_path('app/public/' . $filePath));
           return $pdf->getText();
       }
   }
   ```

### Phase 3: AI Integration

1. **AI Service Configuration**:
   ```php
   // app/Services/AIService.php
   use Illuminate\Support\Facades\Http;
   
   class AIService
   {
       private $apiKey;
       private $apiEndpoint;
       
       public function __construct()
       {
           $this->apiKey = config('services.gemini.api_key');
           $this->apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
       }
       
       public function generateSummary($text)
       {
           $response = Http::withHeaders([
               'Content-Type' => 'application/json',
           ])->post($this->apiEndpoint . '?key=' . $this->apiKey, [
               'contents' => [
                   [
                       'parts' => [
                           [
                               'text' => "Generate a concise summary of the following text:\n\n" . $text
                           ]
                       ]
                   ]
               ],
               'generationConfig' => [
                   'temperature' => 0.7,
                   'topK' => 40,
                   'topP' => 0.95,
                   'maxOutputTokens' => 1024,
               ]
           ]);
           
           if ($response->successful()) {
               return $response->json('candidates.0.content.parts.0.text');
           }
           
           throw new \Exception('Failed to generate summary: ' . $response->body());
       }
       
       public function generateFlashcards($text)
       {
           $response = Http::withHeaders([
               'Content-Type' => 'application/json',
           ])->post($this->apiEndpoint . '?key=' . $this->apiKey, [
               'contents' => [
                   [
                       'parts' => [
                           [
                               'text' => "Generate a set of flashcards from the following text. Format your response as a JSON array where each item has 'question' and 'answer' fields. Make the questions concise and answers comprehensive:\n\n" . $text
                           ]
                       ]
                   ]
               ],
               'generationConfig' => [
                   'temperature' => 0.3,
                   'topK' => 40,
                   'topP' => 0.95,
                   'maxOutputTokens' => 2048,
               ]
           ]);
           
           if ($response->successful()) {
               $aiResponse = $response->json('candidates.0.content.parts.0.text');
               return json_decode($aiResponse, true);
           }
           
           throw new \Exception('Failed to generate flashcards: ' . $response->body());
       }
   }
   ```

### Phase 4: Frontend Implementation

1. **Document Upload Component**:
   ```typescript
   // components/documents/UploadForm.tsx
   const UploadForm = () => {
     const uploadDocument = async (file: File) => {
       const formData = new FormData();
       formData.append('file', file);
       
       await api.post('/documents', formData);
     };
     
     return (
       // Upload form implementation
     );
   };
   ```

2. **Study Notes Display**:
   ```typescript
   // components/study-notes/NotesViewer.tsx
   const NotesViewer = ({ documentId }: { documentId: string }) => {
     const { data: notes } = useQuery(['notes', documentId], 
       () => api.get(`/documents/${documentId}/notes`)
     );
     
     return (
       // Notes display implementation
     );
   };
   ```

## 4. API Endpoints

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Documents
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    
    // Study Notes
    Route::get('/documents/{id}/notes', [StudyNoteController::class, 'index']);
    
    // Flashcards
    Route::get('/documents/{id}/flashcards', [FlashcardController::class, 'index']);
    
    // Quiz
    Route::get('/documents/{id}/quiz', [QuizController::class, 'generate']);
});
```

## 5. Optional Features

1. **Export Functionality**:
   - Implement PDF export using `dompdf/dompdf`
   - CSV export for flashcards
   - Integration with Anki for spaced repetition

2. **Spaced Repetition System**:
   - Add review scheduling table
   - Implement SM-2 algorithm for spacing
   - Add review sessions feature

## 6. Development Phases

1. **Phase 1 (Week 1-2)**:
   - Project setup
   - Authentication
   - Basic PDF upload and storage

2. **Phase 2 (Week 3-4)**:
   - PDF processing
   - AI integration
   - Basic note generation

3. **Phase 3 (Week 5-6)**:
   - Flashcard generation
   - Quiz generation
   - UI implementation

4. **Phase 4 (Week 7-8)**:
   - Export features
   - Spaced repetition
   - Testing and optimization

## Technical Recommendations

1. **Authentication**: Use Laravel Sanctum for API authentication as it's lightweight and perfect for SPA applications.

2. **File Storage**: Use Laravel's local storage for simplicity and ease of setup:
   - Store files in `storage/app/public`
   - Run `php artisan storage:link` to create public symlink
   - Configure proper file permissions
   - Implement regular backups of the storage directory

3. **State Management**: Use Zustand for frontend state management:
   - Simpler than Redux
   - Perfect for medium-sized applications
   - Easy integration with React Query

4. **API Integration**: Use React Query for API calls:
   - Built-in caching
   - Automatic background updates
   - Loading/error states

5. **Performance Considerations**:
   - Process PDFs in background jobs
   - Cache AI-generated content
   - Implement pagination for documents/flashcards
   - Use lazy loading for PDF previews
   - Monitor storage space usage
   - Implement file size limits
   - Add file cleanup routines for old/unused files 