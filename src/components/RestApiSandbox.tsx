import React, { useState } from 'react';
import { Book, Student, IssuedBook } from '../types';
import { Network, ArrowRight, CornerDownRight, Zap, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';

interface RestApiSandboxProps {
  books: Book[];
  students: Student[];
  issuedBooks: IssuedBook[];
  onAddBookSimulated: (b: Book) => void;
  onIssueBookSimulated: (req: { bookId: number; studentId: string }) => { success: boolean; message: string; data?: IssuedBook };
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface LibraryEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  dtoPattern: string;
  controllerSnippet: string;
  dtoSnippet: string;
  defaultPayload?: string;
  queryParams?: { key: string; value: string; placeholder: string }[];
}

export default function RestApiSandbox({ books, students, issuedBooks, onAddBookSimulated, onIssueBookSimulated }: RestApiSandboxProps) {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('get-books');
  const [customPayload, setCustomPayload] = useState<string>('');
  const [queryInputs, setQueryInputs] = useState<Record<string, string>>({});
  const [apiResponse, setApiResponse] = useState<{ status: number; statusText: string; body: any } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const endpoints: LibraryEndpoint[] = [
    {
      id: 'get-books',
      method: 'GET',
      path: '/api/books/search',
      description: 'Search catalog query with optional title, author, or genre filters.',
      dtoPattern: 'Query parameters mapped to SearchCriteria',
      defaultPayload: undefined,
      queryParams: [
        { key: 'title', value: 'Code', placeholder: 'Partial title...' },
        { key: 'genre', value: 'Computer Science', placeholder: 'Exact category...' }
      ],
      controllerSnippet: `@GetMapping("/search")
public ResponseEntity<List<BookResponseDto>> searchBooks(
        @RequestParam(required = false) String title,
        @RequestParam(required = false) String genre) {
    
    log.info("REST request to search books with title: {} and genre: {}", title, genre);
    List<BookResponseDto> results = bookService.searchAndMapToDto(title, genre);
    return ResponseEntity.ok(results);
}`,
      dtoSnippet: `@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookResponseDto {
    private Long id;
    private String isbn;
    private String title;
    private String author;
    private String genre;
    private int availableQuantity;
    private String shelfLocation;
}`
    },
    {
      id: 'post-book',
      method: 'POST',
      path: '/api/books',
      description: 'Add a new book into the inventory. Handled exclusively by Administrators.',
      dtoPattern: 'BookCreateDto payload validator',
      defaultPayload: `{\n  "isbn": "978-0131103627",\n  "title": "The C Programming Language",\n  "author": "Brian W. Kernighan, Dennis M. Ritchie",\n  "genre": "Computer Science",\n  "quantity": 3,\n  "shelfLocation": "A-01"\n}`,
      controllerSnippet: `@PostMapping
@PreAuthorize("hasRole('ROLE_ADMIN')")
public ResponseEntity<BookResponseDto> createBook(@Valid @RequestBody BookCreateDto bookCreateDto) {
    log.info("REST REST API call to create book with ISBN: {}", bookCreateDto.getIsbn());
    
    BookResponseDto savedBook = bookService.createNewBook(bookCreateDto);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedBook);
}`,
      dtoSnippet: `@Data
public class BookCreateDto {
    @NotBlank(message = "ISBN cannot be blank")
    @Pattern(regexp = "^\\\\d{3}-\\\\d{10}$", message = "Invalid ISBN-13 syntax")
    private String isbn;

    @NotBlank(message = "Title must not be blank")
    private String title;

    @NotBlank(message = "Author is required")
    private String author;

    private String genre;

    @Min(value = 1, message = "Total copies must be at least 1")
    private int quantity;

    private String shelfLocation;
}`
    },
    {
      id: 'issue-book',
      method: 'POST',
      path: '/api/issued-books/issue',
      description: 'Issue a book copy to a student. Enforces inventory subtraction and automatic due matching.',
      dtoPattern: 'IssueRequestDto with validation',
      defaultPayload: `{\n  "bookId": 1,\n  "studentId": "STU101"\n}`,
      controllerSnippet: `@PostMapping("/issue")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public ResponseEntity<?> issueBook(@Valid @RequestBody IssueRequestDto requestDto) {
    log.info("Request to issue book ID {} to Student {}", requestDto.getBookId(), requestDto.getStudentId());
    
    try {
        IssuedBookResponseDto response = issueService.processIssue(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    } catch (BookOutOfStockException ex) {
        return ResponseEntity.badRequest().body(new ApiErrorResponse("OUT_OF_STOCK", ex.getMessage()));
    } catch (StudentNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiErrorResponse("STUDENT_NOT_FOUND", ex.getMessage()));
    }
}`,
      dtoSnippet: `@Data
public class IssueRequestDto {
    @NotNull(message = "Book ID is required")
    private Long bookId;

    @NotBlank(message = "Student Matric ID is required")
    private String studentId;
}`
    },
    {
      id: 'return-book',
      method: 'POST',
      path: '/api/issued-books/return',
      description: 'Record library book return. Restores shelf volume and outputs calculated overtime fine checks.',
      dtoPattern: 'ReturnResponseDto output mapping',
      queryParams: [
        { key: 'issueId', value: '2', placeholder: 'Active Issued ID...' }
      ],
      controllerSnippet: `@PostMapping("/return/{issueId}")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public ResponseEntity<ReturnResponseDto> returnBook(@PathVariable Long issueId) {
    log.info("REST API processing return for reservation ID: {}", issueId);
    
    ReturnResponseDto result = issueService.processReturn(issueId);
    return ResponseEntity.ok(result);
}`,
      dtoSnippet: `@Data
@AllArgsConstructor
public class ReturnResponseDto {
    private Long issueId;
    private Long bookId;
    private String studentId;
    private String returnDate;
    private double fineCalculated;
    private String status; // RETURNED
}`
    }
  ];

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];

  // Sync inputs when endpoint changes
  React.useEffect(() => {
    setApiResponse(null);
    if (currentEndpoint.defaultPayload) {
      setCustomPayload(currentEndpoint.defaultPayload);
    } else {
      setCustomPayload('');
    }
    const initials: Record<string, string> = {};
    currentEndpoint.queryParams?.forEach(qp => {
      initials[qp.key] = qp.value;
    });
    setQueryInputs(initials);
  }, [selectedEndpointId]);

  const handleSendRequest = () => {
    setIsLoading(true);
    setApiResponse(null);

    // Simulate Network Delay 250ms
    setTimeout(() => {
      try {
        if (currentEndpoint.id === 'get-books') {
          const filterTitle = (queryInputs['title'] || '').toLowerCase();
          const filterGenre = (queryInputs['genre'] || '').toLowerCase();

          const list = books.filter(b => {
            const matchT = filterTitle ? b.title.toLowerCase().includes(filterTitle) : true;
            const matchG = filterGenre ? b.genre.toLowerCase().includes(filterGenre) : true;
            return matchT && matchG;
          });

          // mapping to DTO payload (removing admin internals if any)
          const dtoArray = list.map(b => ({
            id: b.id,
            isbn: b.isbn,
            title: b.title,
            author: b.author,
            genre: b.genre,
            availableQuantity: b.availableQuantity,
            shelfLocation: b.shelfLocation
          }));

          setApiResponse({
            status: 200,
            statusText: 'OK',
            body: dtoArray
          });
        } 
        
        else if (currentEndpoint.id === 'post-book') {
          const body = JSON.parse(customPayload);
          if (!body.isbn || !body.title || !body.author || !body.quantity) {
            setApiResponse({
              status: 400,
              statusText: 'Bad Request',
              body: {
                timestamp: new Date().toISOString(),
                status: 400,
                error: 'Bad Request',
                message: 'Validation failed: title, isbn, author, and quantity are mandatory parameters.',
                errors: [
                  { field: 'title', message: 'Title must not be blank' },
                  { field: 'isbn', message: 'Invalid ISBN-13 syntax' }
                ]
              }
            });
            setIsLoading(false);
            return;
          }

          // Trigger state insertion in parent
          const newBookObj: Book = {
            id: books.length + 1,
            isbn: body.isbn,
            title: body.title,
            author: body.author,
            genre: body.genre || 'General',
            quantity: Number(body.quantity),
            availableQuantity: Number(body.quantity),
            shelfLocation: body.shelfLocation || 'A-01'
          };

          onAddBookSimulated(newBookObj);

          setApiResponse({
            status: 201,
            statusText: 'Created',
            body: {
              id: newBookObj.id,
              isbn: newBookObj.isbn,
              title: newBookObj.title,
              author: newBookObj.author,
              genre: newBookObj.genre,
              quantity: newBookObj.quantity,
              availableQuantity: newBookObj.availableQuantity,
              shelfLocation: newBookObj.shelfLocation
            }
          });
        } 
        
        else if (currentEndpoint.id === 'issue-book') {
          const body = JSON.parse(customPayload);
          const studentId = body.studentId;
          const bookId = Number(body.bookId);

          // Find student and books for exception checking
          const studentFound = students.some(s => s.id.toUpperCase() === studentId.toUpperCase());
          const targetBook = books.find(b => b.id === bookId);

          if (!studentFound) {
            setApiResponse({
              status: 404,
              statusText: 'Not Found',
              body: {
                timestamp: new Date().toISOString(),
                status: 404,
                error: 'StudentNotFoundException',
                message: `Student registration record '${studentId}' was not found in the database.`,
                path: '/api/issued-books/issue'
              }
            });
          } else if (!targetBook) {
            setApiResponse({
              status: 404,
              statusText: 'Not Found',
              body: {
                timestamp: new Date().toISOString(),
                status: 404,
                error: 'BookNotFoundException',
                message: `Book catalog item ID #${bookId} was not found on active shelves.`,
                path: '/api/issued-books/issue'
              }
            });
          } else if (targetBook.availableQuantity <= 0) {
            setApiResponse({
              status: 400,
              statusText: 'Bad Request',
              body: {
                timestamp: new Date().toISOString(),
                status: 400,
                error: 'BookOutOfStockException',
                message: `Book '${targetBook.title}' cannot be issued. Active stock is 0.`,
                path: '/api/issued-books/issue'
              }
            });
          } else {
            // Success issuing!
            const res = onIssueBookSimulated({ bookId, studentId });
            if (res.success && res.data) {
              setApiResponse({
                status: 201,
                statusText: 'Created',
                body: {
                  id: res.data.id,
                  bookId: res.data.bookId,
                  studentId: res.data.studentId,
                  issueDate: res.data.issueDate,
                  dueDate: res.data.dueDate,
                  fineAmount: res.data.fineAmount,
                  status: res.data.status
                }
              });
            } else {
              setApiResponse({
                status: 400,
                statusText: 'Bad Request',
                body: { error: 'UnknownIssueError', message: res.message }
              });
            }
          }
        } 
        
        else if (currentEndpoint.id === 'return-book') {
          const issueId = Number(queryInputs['issueId']);
          const targetIssue = issuedBooks.find(i => i.id === issueId);

          if (!targetIssue) {
            setApiResponse({
              status: 404,
              statusText: 'Not Found',
              body: {
                timestamp: new Date().toISOString(),
                status: 404,
                error: 'IssueRecordNotFoundException',
                message: `No active issue transaction found for transaction receipt query ID #${issueId}.`,
                path: `/api/issued-books/return`
              }
            });
          } else if (targetIssue.status === 'RETURNED') {
            setApiResponse({
              status: 400,
              statusText: 'Bad Request',
              body: {
                timestamp: new Date().toISOString(),
                status: 400,
                error: 'BookAlreadyReturnedException',
                message: `Library record #${issueId} is already marked as returned on ${targetIssue.returnDate}.`,
                path: `/api/issued-books/return`
              }
            });
          } else {
            // Calculate a neat fine if overdue
            const today = '2026-06-08';
            const dueTime = new Date(targetIssue.dueDate).getTime();
            const currTime = new Date(today).getTime();
            const diffDays = Math.max(0, Math.floor((currTime - dueTime) / (1000 * 60 * 60 * 24)));
            const fine = diffDays * 2.0; // $2 per day

            setApiResponse({
              status: 200,
              statusText: 'OK',
              body: {
                issueId: targetIssue.id,
                bookId: targetIssue.bookId,
                studentId: targetIssue.studentId,
                returnDate: today,
                daysOverdue: diffDays,
                fineCalculated: fine,
                status: 'RETURNED'
              }
            });
          }
        }
      } catch (err: any) {
        setApiResponse({
          status: 500,
          statusText: 'Internal Server Error',
          body: { error: 'JsonParseError', message: 'The request body contained invalid JSON formatting. ' + err.message }
        });
      }
      setIsLoading(false);
    }, 250);
  };

  return (
    <div id="api-sandbox-root" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden box-border mt-8 hover:shadow-md transition-all">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white border-b border-indigo-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Interactive Spring Boot REST API Playground</h2>
            <p className="text-xs text-indigo-200">Test client-backend contracts with instant mock payloads and DTO exceptions parsing</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[500px]">
        {/* Endpoints sidebar navigation */}
        <div className="lg:w-1/3 bg-slate-50 border-r border-slate-200 p-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3 px-2">API Endpoints Routing</span>
          <div className="space-y-1">
            {endpoints.map((ep) => (
              <button
                id={`api-btn-${ep.id}`}
                key={ep.id}
                onClick={() => setSelectedEndpointId(ep.id)}
                className={`w-full text-left p-3 rounded-xl transition-all border flex flex-col gap-1.5 cursor-pointer ${
                  selectedEndpointId === ep.id
                    ? 'bg-white border-indigo-200 ring-4 ring-indigo-50 shadow-sm'
                    : 'border-transparent hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md font-mono ${
                    ep.method === 'GET' ? 'bg-sky-100 text-sky-800' :
                    ep.method === 'POST' ? 'bg-emerald-100 text-emerald-800' :
                    ep.method === 'PUT' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 truncate">{ep.path}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{ep.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
            <h5 className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              DTO Pattern Concept
            </h5>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              <strong>Data Transfer Objects</strong> allow the client and server to communicate clean structures without exposing core relational model state, decoupling the JPA entity layer from HTTP requests.
            </p>
          </div>
        </div>

        {/* Console details of selected endpoint */}
        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* Top API info with badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-extrabold rounded-xl font-mono ${
                  currentEndpoint.method === 'GET' ? 'bg-sky-100 text-sky-800' :
                  currentEndpoint.method === 'POST' ? 'bg-emerald-100 text-emerald-800' :
                  currentEndpoint.method === 'PUT' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {currentEndpoint.method}
                </span>
                <span className="font-mono text-sm font-bold text-slate-900">{currentEndpoint.path}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{currentEndpoint.description}</p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              DTO: <span className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 font-bold">{currentEndpoint.dtoPattern}</span>
            </div>
          </div>

          {/* Code references in Java */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Spring Controller Mapping</span>
              <pre className="bg-slate-950 text-indigo-300 p-4 rounded-xl font-mono text-[11px] overflow-auto max-h-[180px] leading-relaxed shadow-inner">
                {currentEndpoint.controllerSnippet}
              </pre>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Transfer Dto Class Mappings</span>
              <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] overflow-auto max-h-[180px] leading-relaxed shadow-inner">
                {currentEndpoint.dtoSnippet}
              </pre>
            </div>
          </div>

          {/* Sandbox Playground */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mt-2 bg-slate-50">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Zap className="text-amber-500 w-4 h-4" />
                REST CLIENT SIMULATION RUNNER
              </span>
              <button
                id="send-api-req-btn"
                onClick={handleSendRequest}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1 shrink-0 shadow-sm"
              >
                {isLoading ? 'Simulating Transit...' : 'Send HTTP Request'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payload/Params editor */}
              <div>
                {currentEndpoint.queryParams && currentEndpoint.queryParams.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Query Request Parameters</span>
                    {currentEndpoint.queryParams.map((qp) => (
                      <div key={qp.key} className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono text-slate-600 font-bold">{qp.key}</label>
                        <input
                          id={`query-input-${qp.key}`}
                          type="text"
                          value={queryInputs[qp.key] || ''}
                          onChange={(e) => setQueryInputs({ ...queryInputs, [qp.key]: e.target.value })}
                          placeholder={qp.placeholder}
                          className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                ) : currentEndpoint.defaultPayload ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">JSON Request DTO Body</span>
                      <span className="text-[10px] text-slate-400 font-mono">application/json</span>
                    </div>
                    <textarea
                      id="api-payload-field"
                      rows={7}
                      value={customPayload}
                      onChange={(e) => setCustomPayload(e.target.value)}
                      className="w-full bg-slate-900 font-mono text-[11px] p-3 rounded-lg text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 leading-relaxed max-h-[220px]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                    <span className="text-xs text-slate-400 font-medium">No HTTP Request Body Required.</span>
                    <span className="text-[10px] text-slate-400 mt-1">This GET endpoint relies solely on the path trigger.</span>
                  </div>
                )}
              </div>

              {/* Response output */}
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">REST API Live Response Console</span>
                {apiResponse ? (
                  <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div className={`px-3 py-2 border-b flex items-center gap-1.5 text-[11px] font-mono font-bold ${
                      apiResponse.status >= 200 && apiResponse.status < 300 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                      {apiResponse.status >= 200 && apiResponse.status < 300 ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      HTTP {apiResponse.status} {apiResponse.statusText}
                    </div>
                    <pre className="flex-1 p-3 font-mono text-[11px] overflow-auto max-h-[170px] bg-slate-950 text-slate-200">
                      {JSON.stringify(apiResponse.body, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 bg-white">
                    <CornerDownRight className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="text-[11px] font-medium font-mono">Submit request above to inspect active pipeline</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
