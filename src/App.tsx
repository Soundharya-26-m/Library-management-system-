import React, { useState, useEffect } from 'react';
import { Book, Student, IssuedBook, Admin } from './types';
import { 
  INITIAL_BOOKS, 
  INITIAL_STUDENTS, 
  INITIAL_ISSUED_BOOKS, 
  INITIAL_ADMINS 
} from './data/initialData';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import DatabaseViewer from './components/DatabaseViewer';
import RestApiSandbox from './components/RestApiSandbox';
import { BookOpen, GraduationCap, ShieldAlert, Database, Network, Library, Info, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppTab = 'STUDENT' | 'ADMIN' | 'DATABASE' | 'API_SANDBOX';

const STORAGE_KEYS = {
  BOOKS: 'lms_books_v1',
  STUDENTS: 'lms_students_v1',
  ISSUED: 'lms_issued_v1',
  ADMINS: 'lms_admins_v1'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('STUDENT');
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  // Initialize and load persistent store
  useEffect(() => {
    const savedBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
    const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const savedIssued = localStorage.getItem(STORAGE_KEYS.ISSUED);
    const savedAdmins = localStorage.getItem(STORAGE_KEYS.ADMINS);

    let finalBooks = savedBooks ? JSON.parse(savedBooks) : INITIAL_BOOKS;
    let finalStudents = savedStudents ? JSON.parse(savedStudents) : INITIAL_STUDENTS;
    let finalIssued = savedIssued ? JSON.parse(savedIssued) : INITIAL_ISSUED_BOOKS;
    let finalAdmins = savedAdmins ? JSON.parse(savedAdmins) : INITIAL_ADMINS;

    // Daily Fine calculation update on load (relative to June 8, 2026)
    const todayStr = '2026-06-08';
    const currTime = new Date(todayStr).getTime();

    finalIssued = finalIssued.map((issue: IssuedBook) => {
      if (issue.status === 'ISSUED') {
        const dueTime = new Date(issue.dueDate).getTime();
        const diffDays = Math.max(0, Math.floor((currTime - dueTime) / (1000 * 60 * 60 * 24)));
        return {
          ...issue,
          fineAmount: diffDays * 2.0 // $2.00 per day fine
        };
      }
      return issue;
    });

    setBooks(finalBooks);
    setStudents(finalStudents);
    setIssuedBooks(finalIssued);
    setAdmins(finalAdmins);

    // Save initial fine updates
    localStorage.setItem(STORAGE_KEYS.ISSUED, JSON.stringify(finalIssued));
  }, []);

  // Helper utility to update state and sync to local storage
  const updateBooksState = (newBooks: Book[]) => {
    setBooks(newBooks);
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(newBooks));
  };

  const updateStudentsState = (newStu: Student[]) => {
    setStudents(newStu);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStu));
  };

  const updateIssuedState = (newIssued: IssuedBook[]) => {
    setIssuedBooks(newIssued);
    localStorage.setItem(STORAGE_KEYS.ISSUED, JSON.stringify(newIssued));
  };

  // 1. Add Book
  const handleAddBook = (newBook: Book) => {
    const amended = [...books, newBook];
    updateBooksState(amended);
  };

  // 2. Update Book
  const handleUpdateBook = (updatedBook: Book) => {
    const amended = books.map(b => b.id === updatedBook.id ? updatedBook : b);
    updateBooksState(amended);
  };

  // 3. Delete Book
  const handleDeleteBook = (id: number) => {
    const amended = books.filter(b => b.id !== id);
    updateBooksState(amended);
  };

  // 4. Student Registration
  const handleRegisterStudent = (newStuData: Omit<Student, 'id' | 'registrationDate'>) => {
    const nextSeq = 101 + students.length;
    const nextId = `STU${nextSeq}`;
    
    const newStudent: Student = {
      ...newStuData,
      id: nextId,
      registrationDate: '2026-06-08' // Pinning to system date
    };

    const amended = [...students, newStudent];
    updateStudentsState(amended);
    setCurrentStudentId(nextId); // Automatic portal session login
  };

  // 5. Issue Book Logic
  const handleIssueBook = (req: { bookId: number; studentId: string }) => {
    const targetBook = books.find(b => b.id === req.bookId);
    const targetStudent = students.find(s => s.id.toUpperCase() === req.studentId.toUpperCase());

    if (!targetStudent) {
      return { success: false, message: `Issue Failed: Student ID "${req.studentId}" is not registered in the system.` };
    }

    if (!targetBook) {
      return { success: false, message: `Issue Failed: Book with Catalog ID #${req.bookId} not found.` };
    }

    if (targetBook.availableQuantity <= 0) {
      return { success: false, message: `Issue Failed: "${targetBook.title}" is currently out of stock on academic shelves.` };
    }

    // Check if student already has this book issued
    const alreadyIssued = issuedBooks.some(i => i.studentId.toUpperCase() === req.studentId.toUpperCase() && i.bookId === req.bookId && i.status === 'ISSUED');
    if (alreadyIssued) {
      return { success: false, message: `Issue Failed: Student "${targetStudent.name}" already has an active copy of this textbook.` };
    }

    // Generate Issue object
    const nextId = issuedBooks.length > 0 ? Math.max(...issuedBooks.map(i => i.id)) + 1 : 1;
    const issueDateStr = '2026-06-08';
    const dueDateStr = '2026-06-22'; // Exactly 14 days later

    const newIssue: IssuedBook = {
      id: nextId,
      bookId: req.bookId,
      studentId: req.studentId.toUpperCase(),
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      returnDate: null,
      fineAmount: 0,
      status: 'ISSUED'
    };

    // Decrement available copies
    const updatedBooks = books.map(b => b.id === req.bookId ? { ...b, availableQuantity: b.availableQuantity - 1 } : b);
    updateBooksState(updatedBooks);

    const updatedIssued = [...issuedBooks, newIssue];
    updateIssuedState(updatedIssued);

    return { 
      success: true, 
      message: `SUCCESS: "${targetBook.title}" issued to ${targetStudent.name} (Due: ${dueDateStr}).`,
      data: newIssue
    };
  };

  // 6. Return Book Logic
  const handleReturnBook = (issueId: number) => {
    const targetIssue = issuedBooks.find(i => i.id === issueId);
    if (!targetIssue) {
      return { success: false, message: 'Return Failed: Transaction log index code not found.', fineCalculated: 0 };
    }

    const todayStr = '2026-06-08';
    const dueTime = new Date(targetIssue.dueDate).getTime();
    const currTime = new Date(todayStr).getTime();
    
    // Auto fine is calculated relative to system date
    const diffDays = Math.max(0, Math.floor((currTime - dueTime) / (1000 * 60 * 60 * 24)));
    const fineCalculated = diffDays * 2.0;

    // Restore available book volume
    const updatedBooks = books.map(b => b.id === targetIssue.bookId ? { ...b, availableQuantity: Math.min(b.quantity, b.availableQuantity + 1) } : b);
    updateBooksState(updatedBooks);

    // Update issue state columns
    const updatedIssued = issuedBooks.map(i => i.id === issueId ? {
      ...i,
      status: 'RETURNED' as const,
      returnDate: todayStr,
      fineAmount: fineCalculated
    } : i);
    updateIssuedState(updatedIssued);

    return { success: true, message: 'Returned successfully', fineCalculated };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 box-border">
      {/* Top Banner Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">Academic Library Portal</h1>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Spring Boot &amp; PostgreSQL Reference Architectures</p>
            </div>
          </div>

          {/* Quick Stats Header Bar */}
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>DBMS: <strong className="text-slate-800 font-mono">PostgreSQL 15</strong></span>
            </div>
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-5">
              <span>Time: <strong className="text-slate-800 font-mono">2026-06-08 UTC</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">REST API:</span>
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold font-mono text-[10px]">v1_active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner with instructions */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 py-10 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
          <motion.span 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-widest block mb-3"
          >
            Academic Full-Stack Blueprint System
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-black tracking-tight"
          >
            Online Library Management System
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-xs mt-2 max-w-2xl leading-relaxed"
          >
            A high-fidelity learning website displaying real-time JPA relationship integrations, PostgreSQL DDL schemas, and a full DTO api sandbox! Use dashboards below as real students or admins.
          </motion.p>
        </div>
      </section>

      {/* Interactive Tabs Header Controls */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-8 gap-4">
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="tab-btn-student"
              onClick={() => setActiveTab('STUDENT')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'STUDENT'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student Portal View
            </button>
            <button
              id="tab-btn-admin"
              onClick={() => setActiveTab('ADMIN')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ADMIN'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Admin Management View
            </button>
            <button
              id="tab-btn-db"
              onClick={() => setActiveTab('DATABASE')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'DATABASE'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4" />
              PostgreSQL Tables Console
            </button>
            <button
              id="tab-btn-api"
              onClick={() => setActiveTab('API_SANDBOX')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'API_SANDBOX'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Network className="w-4 h-4" />
              REST API Sandbox
            </button>
          </div>

          {/* Quick Info Box */}
          <div className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2 text-[11px] text-indigo-900 font-mono">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Mock Database Row Volume: <strong>{books.length} books, {students.length} students</strong></span>
          </div>
        </div>

        {/* Dynamic Tab Panel Animation Wrapper */}
        <div id="active-tab-panel" className="relative min-h-[450px]">
          <AnimatePresence mode="wait">
            {activeTab === 'STUDENT' && (
              <motion.div
                key="student"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.15 }}
              >
                <StudentDashboard
                  books={books}
                  students={students}
                  issuedBooks={issuedBooks}
                  onRegisterStudent={handleRegisterStudent}
                  currentStudentId={currentStudentId}
                  onSelectStudentId={setCurrentStudentId}
                />
              </motion.div>
            )}

            {activeTab === 'ADMIN' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.15 }}
              >
                <AdminDashboard
                  books={books}
                  students={students}
                  issuedBooks={issuedBooks}
                  onAddBook={handleAddBook}
                  onUpdateBook={handleUpdateBook}
                  onDeleteBook={handleDeleteBook}
                  onIssueBook={handleIssueBook}
                  onReturnBook={handleReturnBook}
                />
              </motion.div>
            )}

            {activeTab === 'DATABASE' && (
              <motion.div
                key="database"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.15 }}
              >
                <DatabaseViewer
                  books={books}
                  students={students}
                  issuedBooks={issuedBooks}
                  admins={admins}
                />
              </motion.div>
            )}

            {activeTab === 'API_SANDBOX' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.15 }}
              >
                <RestApiSandbox
                  books={books}
                  students={students}
                  issuedBooks={issuedBooks}
                  onAddBookSimulated={handleAddBook}
                  onIssueBookSimulated={handleIssueBook}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer reference specifications */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-16 text-xs text-slate-400 font-mono text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Academic Systems. Designed for Spring Boot, PostgreSQL &amp; React stack training reference.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600">Spring Boot 3.2</span>
            <span>•</span>
            <span className="hover:text-slate-600">Hibernate 6</span>
            <span>•</span>
            <span className="hover:text-slate-600">React 19 &amp; Tailwind v4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
