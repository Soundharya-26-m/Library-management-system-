import React, { useState } from 'react';
import { Book, Student, IssuedBook } from '../types';
import { Search, UserPlus, BookOpen, BookmarkCheck, DollarSign, Calendar, RefreshCcw, LogIn, AlertCircle } from 'lucide-react';

interface StudentDashboardProps {
  books: Book[];
  students: Student[];
  issuedBooks: IssuedBook[];
  onRegisterStudent: (s: Omit<Student, 'id' | 'registrationDate'>) => void;
  currentStudentId: string | null;
  onSelectStudentId: (id: string | null) => void;
}

export default function StudentDashboard({
  books,
  students,
  issuedBooks,
  onRegisterStudent,
  currentStudentId,
  onSelectStudentId
}: StudentDashboardProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Student portal login input
  const [loginIdInput, setLoginIdInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Extract unique genres for catalog pills
  const genres = ['All', ...Array.from(new Set(books.map(b => b.genre)))];

  // Filtered books
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || b.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const loggedInStudentObj = students.find(s => s.id.toUpperCase() === currentStudentId?.toUpperCase());

  // Personal issue history
  const myIssuedRecords = currentStudentId 
    ? issuedBooks.filter(i => i.studentId.toUpperCase() === currentStudentId.toUpperCase())
    : [];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegSuccess(null);
    if (!regName || !regEmail || !regDept) return;

    onRegisterStudent({
      name: regName,
      email: regEmail,
      department: regDept,
      phoneNumber: regPhone
    });

    const nextId = `STU${101 + students.length}`;
    setRegSuccess(`Registration successful! Generated student ID is: ${nextId}. Use this to login below.`);
    
    // Clear registration
    setRegName('');
    setRegEmail('');
    setRegDept('');
    setRegPhone('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const id = loginIdInput.trim().toUpperCase();
    const stExists = students.find(s => s.id.toUpperCase() === id);
    if (stExists) {
      onSelectStudentId(stExists.id);
      setLoginIdInput('');
    } else {
      setLoginError('Student ID not found. Registered IDs: STU101, STU102, STU103 or create a new student right now!');
    }
  };

  return (
    <div id="student-dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Search and Catalog section */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Explore College Library Catalog
              </h3>
              <p className="text-xs text-slate-500">Live search engine for textbook availability and shelf coordinate logs</p>
            </div>
          </div>

          {/* Search bar inputs */}
          <div id="catalog-search-controls" className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="student-book-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Title, Author, or ISBN..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          {/* Genre Selection Filter Bar */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin">
            {genres.map((genre) => (
              <button
                id={`genre-pill-${genre}`}
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                  selectedGenre === genre
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Book Catalog list Grid representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((b) => (
                <div id={`student-book-card-${b.id}`} key={b.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-200 hover:shadow-sm transition-all bg-white group select-none">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                        {b.genre}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ISBN: {b.isbn}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mt-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">{b.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">by {b.author}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        b.availableQuantity > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'
                      }`} />
                      <span className="text-[11px] text-slate-500">
                        {b.availableQuantity > 0 ? `${b.availableQuantity} of ${b.quantity} copies` : 'Out of stock'}
                      </span>
                    </div>

                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                      Shelf: {b.shelfLocation}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div id="catalog-no-results" className="col-span-2 text-center p-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">No books matching search queries found</p>
                <p className="text-[10px] text-slate-400 mt-1">Verify filters or try typing a generic keyword</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile authentication and registration */}
      <div className="flex flex-col gap-6">
        {/* Student login and registration selector */}
        {loggedInStudentObj ? (
          <div id="student-logged-in-panel" className="bg-gradient-to-br from-indigo-700 to-indigo-900 border border-indigo-200 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 text-indigo-500/20 select-none">
              <BookmarkCheck className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="bg-indigo-600 border border-indigo-500 rounded px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">
                    Logged Student Portal
                  </span>
                  <h3 className="text-lg font-bold mt-2 whitespace-nowrap overflow-hidden text-ellipsis">{loggedInStudentObj.name}</h3>
                  <p className="text-xs text-indigo-200 font-mono mt-0.5">{loggedInStudentObj.id} • {loggedInStudentObj.department}</p>
                </div>
                <button
                  id="student-logout-btn"
                  onClick={() => onSelectStudentId(null)}
                  className="bg-white/10 hover:bg-white/20 select-none text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all active:scale-95 border border-white/10"
                >
                  Change User
                </button>
              </div>

              {/* Personal Active Borrow list */}
              <div className="mt-8 border-t border-indigo-600/50 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-200">My Issued Books</h5>
                  <span className="bg-indigo-600/60 font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                    {myIssuedRecords.filter(i => i.status === 'ISSUED').length} active
                  </span>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {myIssuedRecords.length > 0 ? (
                    myIssuedRecords.map((rec) => {
                      const correlatedBook = books.find(b => b.id === rec.bookId);
                      const isReturned = rec.status === 'RETURNED';
                      return (
                        <div id={`my-issued-row-${rec.id}`} key={rec.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:bg-white/10 transition-colors">
                          <div className="flex tracking-tight items-start justify-between gap-1">
                            <h6 className="text-xs font-bold truncate flex-1">{correlatedBook ? correlatedBook.title : 'External Title'}</h6>
                            <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${
                              isReturned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {rec.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-3 text-[10px] text-indigo-200 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                              Due: {rec.dueDate}
                            </span>
                            
                            {/* Fine details */}
                            {rec.fineAmount > 0 ? (
                              <span className="text-red-300 font-bold bg-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <DollarSign className="w-3 h-3" />
                                Fine: ${rec.fineAmount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-indigo-300">No overdue fines</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div id="student-no-issues" className="text-center py-6 text-indigo-200/50 border border-dashed border-white/20 rounded-xl">
                      <p className="text-xs">No issue transactions record logged.</p>
                      <p className="text-[10px] text-indigo-300/40 mt-1">Submit request to admin to checkout a textbook</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="student-portal-locked" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-1">
              <LogIn className="w-5 h-5 text-indigo-600" />
              Access Student Portal Log
            </h3>
            <p className="text-xs text-slate-500 mb-4">View your personal active borrows, check due dates, and calculate current overdue fines.</p>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Enter Student ID</label>
                <div className="flex gap-2">
                  <input
                    id="student-id-login-field"
                    type="text"
                    value={loginIdInput}
                    onChange={(e) => setLoginIdInput(e.target.value)}
                    placeholder="e.g., STU101"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    id="login-student-submit"
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    Login
                  </button>
                </div>
                {loginError && <p id="login-error-msg" className="text-[11px] text-red-500 mt-2 font-medium">{loginError}</p>}
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-mono">
                💡 <span className="font-bold">Hint:</span> Pre-existing IDs are <span className="text-indigo-600 font-bold">STU101</span>, <span className="text-indigo-600 font-bold">STU102</span>, and <span className="text-indigo-600 font-bold">STU103</span>.
              </div>
            </form>
          </div>
        )}

        {/* Student Registration Form */}
        <div id="student-registration-panel" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Student Registration Portal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Creates a database record corresponding to students table</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Student Name</label>
              <input
                id="reg-stu-name"
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g., Johnathan Smith"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Academic Email</label>
              <input
                id="reg-stu-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="smith@university.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Department</label>
                <select
                  id="reg-stu-dept"
                  required
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-700"
                >
                  <option value="">Department...</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  id="reg-stu-phone"
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              id="register-student-submit"
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm mt-1"
            >
              Submit Registration
            </button>

            {regSuccess && (
              <div id="stu-reg-success-alert" className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] font-semibold leading-relaxed">
                {regSuccess}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
