import React, { useState } from 'react';
import { Book, Student, IssuedBook } from '../types';
import { 
  ShieldCheck, LogIn, Lock, BookOpen, Plus, Edit2, Trash2, CalendarRange, 
  RotateCcw, DollarSign, BarChart3, AlertTriangle, CheckCircle, ChevronDown, Check
} from 'lucide-react';

interface AdminDashboardProps {
  books: Book[];
  students: Student[];
  issuedBooks: IssuedBook[];
  onAddBook: (b: Book) => void;
  onUpdateBook: (b: Book) => void;
  onDeleteBook: (id: number) => void;
  onIssueBook: (req: { bookId: number; studentId: string }) => { success: boolean; message: string };
  onReturnBook: (issueId: number) => { success: boolean; message: string; fineCalculated: number };
}

export default function AdminDashboard({
  books,
  students,
  issuedBooks,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onIssueBook,
  onReturnBook
}: AdminDashboardProps) {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('password');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Books inventory state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Computer Science');
  const [quantity, setQuantity] = useState(3);
  const [shelfLocation, setShelfLocation] = useState('A-01');
  const [addBookSuccess, setAddBookSuccess] = useState<string | null>(null);

  // Edit book state
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editShelf, setEditShelf] = useState('');

  // Book issue inputs
  const [issueBookId, setIssueBookId] = useState<number | ''>('');
  const [issueStudentId, setIssueStudentId] = useState('');
  const [issueResult, setIssueResult] = useState<{ success: boolean; message: string } | null>(null);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (usernameInput === 'admin' && passwordInput === 'password') {
      setIsLoggedIn(true);
    } else {
      setLoginError('Invalid Administrator credentials! Use admin / password as provided in the hint.');
    }
  };

  // Add Book handler
  const handleAddBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddBookSuccess(null);
    if (!isbn || !title || !author) return;

    const newBook: Book = {
      id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
      isbn,
      title,
      author,
      genre,
      quantity,
      availableQuantity: quantity,
      shelfLocation
    };

    onAddBook(newBook);
    setAddBookSuccess(`Book "${title}" added successfully database index!`);
    
    // Clear inputs
    setIsbn('');
    setTitle('');
    setAuthor('');
    setQuantity(3);
    setShelfLocation('A-01');
    setTimeout(() => setAddBookSuccess(null), 3000);
  };

  // Edit Book inline triggers
  const startEditBook = (b: Book) => {
    setEditingBookId(b.id);
    setEditTitle(b.title);
    setEditAuthor(b.author);
    setEditQuantity(b.quantity);
    setEditShelf(b.shelfLocation);
  };

  const saveEditBookSubmit = (id: number) => {
    const originalBook = books.find(b => b.id === id);
    if (!originalBook) return;

    // Adjusting available quantity relative to changed total quantity
    const qtyDiff = editQuantity - originalBook.quantity;
    const newAvailable = Math.max(0, originalBook.availableQuantity + qtyDiff);

    const updated: Book = {
      ...originalBook,
      title: editTitle,
      author: editAuthor,
      quantity: editQuantity,
      availableQuantity: newAvailable,
      shelfLocation: editShelf
    };

    onUpdateBook(updated);
    setEditingBookId(null);
  };

  // Issue Book handler
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueResult(null);
    if (!issueBookId || !issueStudentId) return;

    const res = onIssueBook({
      bookId: Number(issueBookId),
      studentId: issueStudentId.trim().toUpperCase()
    });

    setIssueResult(res);
    if (res.success) {
      setIssueBookId('');
      setIssueStudentId('');
    }
    setTimeout(() => setIssueResult(null), 5000);
  };

  // Return trigger
  const [returnResult, setReturnResult] = useState<string | null>(null);
  const handleReturnAction = (id: number) => {
    setReturnResult(null);
    const res = onReturnBook(id);
    if (res.success) {
      if (res.fineCalculated > 0) {
        setReturnResult(`SUCCESS: Book returned. Current local Date indicates overdue penalty calculated: $${res.fineCalculated.toFixed(2)} USD.`);
      } else {
        setReturnResult('SUCCESS: Book returned successfully with no outstanding fine penalty.');
      }
    }
    setTimeout(() => setReturnResult(null), 5000);
  };

  // Admin calculations metrics
  const totalBooks = books.reduce((acc, b) => acc + b.quantity, 0);
  const issuedList = issuedBooks.filter(i => i.status === 'ISSUED');
  const completedList = issuedBooks.filter(i => i.status === 'RETURNED');
  const outstandingFines = issuedBooks.reduce((acc, i) => acc + (i.status === 'ISSUED' ? i.fineAmount : 0), 0);

  // Authentication barrier
  if (!isLoggedIn) {
    return (
      <div id="admin-login-barrier" className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-950 to-indigo-850 p-6 text-white text-center border-b border-indigo-900">
          <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Admin Console Sign-In</h2>
          <p className="text-xs text-indigo-200 mt-1">Authenticate as library administrator to modify parameters</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Username</label>
            <div className="relative">
              <input
                id="admin-user-field"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Security Password</label>
            <div className="relative">
              <input
                id="admin-pass-field"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer shadow-md select-none active:scale-95 text-xs mt-2"
          >
            Authenticate Credentials
          </button>

          {loginError && <p id="login-error-alert" className="text-xs text-red-500 text-center font-semibold">{loginError}</p>}

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-mono mt-2">
            🔑 <strong className="text-slate-700">Autocompleting Test Credentials:</strong><br />
            • Username: <span className="font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded ring-1 ring-slate-200 select-all">admin</span><br />
            • Password: <span className="font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded ring-1 ring-slate-200 select-all">password</span>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div id="admin-panel" className="flex flex-col gap-8">
      {/* Dynamic statistics metrics block */}
      <div id="admin-kpis" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Shelf Copies</span>
            <h4 id="kpi-total-copies" className="text-2xl font-black text-slate-800 mt-1">{totalBooks}</h4>
            <p className="text-[10px] text-slate-500 mt-1">{books.length} Catalog items</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Borrows</span>
            <h4 id="kpi-active-issues" className="text-2xl font-black text-slate-800 mt-1">{issuedList.length}</h4>
            <p className="text-[10px] text-slate-500 mt-1">{completedList.length} Returned histories</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CalendarRange className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Students</span>
            <h4 id="kpi-total-students" className="text-2xl font-black text-slate-800 mt-1">{students.length}</h4>
            <p className="text-[10px] text-slate-500 mt-1">Academics enrolled</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between text-rose-600">
          <div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Outstanding Fines</span>
            <h4 id="kpi-total-fines" className="text-2xl font-black mt-1 text-rose-700">${outstandingFines.toFixed(2)}</h4>
            <p className="text-[10px] text-rose-500 mt-1">Due calculations</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Book Issue & Returns Transaction Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Issue Book Column form */}
        <div id="issue-book-engine" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarRange className="w-5 h-5 text-indigo-600" />
                  Issue Book Registration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Generates automated checkout due dates for students</p>
              </div>
            </div>

            <form onSubmit={handleIssueSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Catalog Book</label>
                <select
                  id="issue-book-select"
                  required
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700"
                >
                  <option value="">Choose a book...</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.availableQuantity <= 0}>
                      {b.title} ({b.author}) — {b.availableQuantity} left
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Enter Student ID</label>
                <select
                  id="issue-student-select"
                  required
                  value={issueStudentId}
                  onChange={(e) => setIssueStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 font-mono"
                >
                  <option value="">Choose a registered student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-indigo-900">
                  <span>Current Issue Date:</span>
                  <span className="font-bold">2026-06-08 (Today)</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-indigo-900">
                  <span>Auto Return Duration:</span>
                  <span className="font-bold">14 Academic Days</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-indigo-900">
                  <span>Scheduled Return Due Date:</span>
                  <span className="font-bold text-indigo-600 underline">2026-06-22</span>
                </div>
              </div>

              <button
                id="issue-book-submit"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm mt-1"
              >
                Approve Issue Transaction
              </button>

              {issueResult && (
                <div id="issue-result-alert" className={`p-3 rounded-lg text-[10px] font-semibold flex items-center gap-2 ${
                  issueResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                }`}>
                  {issueResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  {issueResult.message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Return Book list table */}
        <div id="return-book-engine" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              Active Subscriptions Returns Processing
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Assess returned textbooks, calculate tardiness fines and restore shelf space</p>
          </div>

          <div className="space-y-3 max-h-[295px] overflow-y-auto pr-1 flex-1">
            {issuedList.length > 0 ? (
              issuedList.map((rec) => {
                const bookObj = books.find(b => b.id === rec.bookId);
                const studentObj = students.find(s => s.id === rec.studentId);
                return (
                  <div id={`admin-return-card-${rec.id}`} key={rec.id} className="border border-slate-200 p-3 rounded-xl hover:border-indigo-150 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-indigo-600 px-1.5 py-0.5 bg-indigo-50 rounded uppercase font-mono">{rec.studentId}</span>
                        <span className="text-[11px] font-bold text-slate-700">{studentObj?.name}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 truncate max-w-[280px]">“{bookObj?.title}”</p>
                      
                      <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-mono">
                        <span>Issued: {rec.issueDate}</span>
                        <span>Due: <span className={rec.fineAmount > 0 ? 'text-red-500 font-bold' : ''}>{rec.dueDate}</span></span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end gap-2 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      {rec.fineAmount > 0 && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded flex items-center">
                          Overdue Fine: ${rec.fineAmount.toFixed(2)}
                        </span>
                      )}
                      <button
                        id={`return-btn-submit-${rec.id}`}
                        onClick={() => handleReturnAction(rec.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors active:scale-95 select-none shrink-0"
                      >
                        Record Return
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div id="admin-no-borrowers" className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl my-auto">
                <CheckCircle className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
                <p className="text-xs font-semibold">No active student borrows currently logged</p>
                <p className="text-[10px] text-slate-400 mt-1">All catalog volume are stored safe on catalog shelves</p>
              </div>
            )}
          </div>

          {returnResult && (
            <div id="return-alert" className="p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-[10px] font-bold mt-4 leading-relaxed">
              {returnResult}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Stock manager Section - View / Add / Edit / Update / Delete */}
      <div id="catalog-control-center" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Primary Inventory Stock Management
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Database CRUD interface to edit, add, or delete library rows</p>
          </div>

          <button
            id="toggle-add-book-form"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Close Intake Form' : 'Ingest New Row'}
          </button>
        </div>

        {/* Dynamic add book form overlay */}
        {showAddForm && (
          <form id="add-book-form" onSubmit={handleAddBookSubmit} className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">ISBN Value (Required)</label>
              <input
                id="add-book-isbn"
                type="text"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g. 978-0131103627"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Textbook Title</label>
              <input
                id="add-book-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Structure and Interpretation of Computer Programs"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Primary Author(s)</label>
              <input
                id="add-book-author"
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Harold Abelson"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Genre Category</label>
              <select
                id="add-book-genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="System Design">System Design</option>
                <option value="Fiction / Fantasy">Fiction / Fantasy</option>
                <option value="Fiction / Classics">Fiction / Classics</option>
                <option value="Self-Help">Self-Help</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Book Quantity</label>
              <input
                id="add-book-qty"
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Shelf Coordinate Room Coordinate</label>
              <input
                id="add-book-shelf"
                type="text"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="e.g. D-04"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <button
                id="add-book-form-submit"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                Ingest to Catalog Rows
              </button>
              {addBookSuccess && (
                <span id="add-book-success-msg" className="ml-3 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  {addBookSuccess}
                </span>
              )}
            </div>
          </form>
        )}

        {/* Current Inventry Stock table */}
        <div className="overflow-x-auto">
          <table id="tbl-admin-books" className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3.5 text-slate-400 font-semibold uppercase tracking-mono">ID</th>
                <th className="px-6 py-3.5 text-slate-400 font-semibold uppercase tracking-mono">Detail Description</th>
                <th className="px-6 py-3.5 text-slate-400 font-semibold uppercase tracking-mono">Genre</th>
                <th className="px-6 py-3.5 text-slate-400 font-semibold uppercase tracking-mono text-center">Volume</th>
                <th className="px-6 py-3.5 text-slate-400 font-semibold uppercase tracking-mono">Library Coordinate</th>
                <th className="px-6 py-3.5 text-slate-400 font-semibold uppercase tracking-mono text-right">Row Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {books.map((b) => {
                const isEditing = editingBookId === b.id;
                return (
                  <tr id={`admin-book-row-${b.id}`} key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-400">#{b.id}</td>
                    
                    {/* Inline editing checks */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 max-w-sm">
                          <input
                            id={`edit-title-field-${b.id}`}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                          />
                          <input
                            id={`edit-author-field-${b.id}`}
                            type="text"
                            value={editAuthor}
                            onChange={(e) => setEditAuthor(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-800 text-sm leading-snug">{b.title}</div>
                          <div className="text-slate-500 mt-0.5">by {b.author} <span className="text-[10px] text-slate-400 font-mono">• ISBN: {b.isbn}</span></div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase font-mono">
                        {b.genre}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {isEditing ? (
                        <input
                          id={`edit-quantity-field-${b.id}`}
                          type="number"
                          min={1}
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Number(e.target.value))}
                          className="bg-slate-50 border border-slate-200 rounded w-16 p-1 text-xs text-center"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-slate-700">{b.availableQuantity} available</span>
                          <span className="text-[10px] text-slate-400">of {b.quantity} total</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          id={`edit-shelf-field-${b.id}`}
                          type="text"
                          value={editShelf}
                          onChange={(e) => setEditShelf(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded p-1 text-xs font-mono max-w-[80px]"
                        />
                      ) : (
                        <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded">
                          {b.shelfLocation}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              id={`save-edit-btn-${b.id}`}
                              onClick={() => saveEditBookSubmit(b.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded cursor-pointer select-none transition-colors"
                            >
                              Save Row
                            </button>
                            <button
                              id={`cancel-edit-btn-${b.id}`}
                              onClick={() => setEditingBookId(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded cursor-pointer select-none transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              id={`edit-btn-${b.id}`}
                              onClick={() => startEditBook(b)}
                              className="p-2 border border-slate-200 rounded hover:border-indigo-200 hover:bg-indigo-50/20 text-indigo-600 transition-all cursor-pointer"
                              title="Update row properties"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-btn-${b.id}`}
                              onClick={() => onDeleteBook(b.id)}
                              className="p-2 border border-slate-200 rounded hover:border-rose-200 hover:bg-rose-50/20 text-rose-600 transition-all cursor-pointer"
                              title="Delete catalog entity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
