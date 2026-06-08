import React, { useState } from 'react';
import { Book, Student, IssuedBook, Admin } from '../types';
import { Database, FileText, Code2, Play, Terminal, HelpCircle, CheckCircle } from 'lucide-react';

interface DatabaseViewerProps {
  books: Book[];
  students: Student[];
  issuedBooks: IssuedBook[];
  admins: Admin[];
}

type ActiveTab = 'TABLES' | 'DDL' | 'JPA' | 'CONSOLE';
type DBTable = 'books' | 'students' | 'issued_books' | 'admin';

export default function DatabaseViewer({ books, students, issuedBooks, admins }: DatabaseViewerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('TABLES');
  const [selectedTable, setSelectedTable] = useState<DBTable>('books');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM books WHERE available_quantity > 2;');
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [consoleSuccess, setConsoleSuccess] = useState<string | null>(null);

  // SQL parser simulator
  const executeSimulatedQuery = (queryText: string) => {
    setSqlError(null);
    setSqlResult(null);
    setConsoleSuccess(null);

    const clean = queryText.trim().replace(/;$/, '').toLowerCase();

    if (!clean.startsWith('select')) {
      setSqlError('Query Error: Only SELECT queries are supported in this safe read-only SQL simulator simulator.');
      return;
    }

    try {
      // Very basic Mock SQL parsing
      if (clean.includes('from books')) {
        let result = [...books];
        if (clean.includes("where genre = 'computer science'")) {
          result = result.filter(b => b.genre.toLowerCase() === 'computer science');
        } else if (clean.includes('available_quantity > 2') || clean.includes('available_quantity > 2')) {
          result = result.filter(b => b.availableQuantity > 2);
        } else if (clean.includes("author = 'robert c. martin'")) {
          result = result.filter(b => b.author.toLowerCase().includes('martin'));
        }
        setSqlResult(result);
        setConsoleSuccess(`SUCCESS: Query returned ${result.length} row(s) from 'books' table.`);
      } else if (clean.includes('from students')) {
        let result = [...students];
        if (clean.includes("id = 'stu101'")) {
          result = result.filter(s => s.id.toLowerCase() === 'stu101');
        } else if (clean.includes("department = 'computer science'")) {
          result = result.filter(s => s.department.toLowerCase() === 'computer science');
        }
        setSqlResult(result);
        setConsoleSuccess(`SUCCESS: Query returned ${result.length} row(s) from 'students' table.`);
      } else if (clean.includes('from issued_books')) {
        let result = [...issuedBooks];
        if (clean.includes("status = 'issued'")) {
          result = result.filter(i => i.status === 'ISSUED');
        } else if (clean.includes("status = 'returned'")) {
          result = result.filter(i => i.status === 'RETURNED');
        } else if (clean.includes('fine_amount > 0')) {
          result = result.filter(i => i.fineAmount > 0);
        }
        setSqlResult(result);
        setConsoleSuccess(`SUCCESS: Query returned ${result.length} row(s) from 'issued_books' table.`);
      } else if (clean.includes('from admin')) {
        let result = [...admins];
        setSqlResult(result);
        setConsoleSuccess(`SUCCESS: Query returned ${result.length} row(s) from 'admin' table.`);
      } else {
        setSqlError("Table not found or syntax unrecognized. Try 'SELECT * FROM books;', 'SELECT * FROM students;', or use the clickable sample templates below!");
      }
    } catch (e: any) {
      setSqlError(`Syntax Error: Failed simulating database retrieval. Msg: ${e.message}`);
    }
  };

  const sqlTemplates = [
    { label: 'All Books Ordered', query: 'SELECT * FROM books;' },
    { label: 'Available Computers Books', query: "SELECT * FROM books WHERE genre = 'Computer Science';" },
    { label: 'Active Unpaid Fines', query: 'SELECT * FROM issued_books WHERE fine_amount > 0;' },
    { label: 'Computer Science Students', query: "SELECT * FROM students WHERE department = 'Computer Science';" }
  ];

  const handleTemplateClick = (q: string) => {
    setSqlQuery(q);
    executeSimulatedQuery(q);
  };

  const getDdlCode = () => {
    return `-- ==========================================
-- ONLINE LIBRARY DATABASE DDL CONFIGURATION
-- TARGET DATABASE: PostgreSQL 15+
-- ==========================================

-- 1. Table: admin
CREATE TABLE admin (
    username VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- 2. Table: students
CREATE TABLE students (
    id VARCHAR(20) PRIMARY KEY, -- Custom ID: e.g. STU101
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    registration_date DATE DEFAULT CURRENT_DATE
);

-- 3. Table: books
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    quantity INT NOT NULL CHECK (quantity >= 0),
    available_quantity INT NOT NULL CHECK (available_quantity >= 0),
    shelf_location VARCHAR(50)
);

-- 4. Table: issued_books (JPA Mappings Table)
CREATE TABLE issued_books (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ISSUED', 'RETURNED')),
    CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

-- Indices for faster querying
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_issued_books_student ON issued_books(student_id);
CREATE INDEX idx_issued_books_status ON issued_books(status);
`;
  };

  const getJpaCode = () => {
    if (selectedTable === 'books') {
      return `package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    private String genre;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity;

    @Column(name = "shelf_location")
    private String shelfLocation;

    // Bi-directional mapping with JPA
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<IssuedBook> issueRecords;
}`;
    } else if (selectedTable === 'students') {
      return `package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    private String id; // Managed string ID e.g., "STU101"

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String department;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "registration_date")
    private LocalDate registrationDate = LocalDate.now();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<IssuedBook> issuedBooks;
}`;
    } else if (selectedTable === 'issued_books') {
      return `package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "issued_books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssuedBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "fine_amount", precision = 10, scale = 2)
    private Double fineAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueStatus status = IssueStatus.ISSUED;

    public enum IssueStatus {
        ISSUED, RETURNED
    }
}`;
    } else {
      return `package com.library.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "admin")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Admin {

    @Id
    @Column(length = 50)
    private String username;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;
}`;
    }
  };

  return (
    <div id="db-viewer-root" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8 transition-all hover:shadow-md">
      {/* Header and navigation */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">PostgreSQL Database Simulator Console</h2>
            <p className="text-xs text-slate-300">Inspect relational schemas, live catalog tables, and JPA object relations</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            id="tab-btn-tables"
            onClick={() => setActiveTab('TABLES')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'TABLES'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Live Tables
          </button>
          <button
            id="tab-btn-ddl"
            onClick={() => setActiveTab('DDL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'DDL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            PostgreSQL SQL DDL
          </button>
          <button
            id="tab-btn-jpa"
            onClick={() => setActiveTab('JPA')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'JPA'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            JPA Model Entity
          </button>
          <button
            id="tab-btn-console"
            onClick={() => setActiveTab('CONSOLE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'CONSOLE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            SQL Terminal Query
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="p-6">
        {activeTab === 'TABLES' && (
          <div>
            {/* Table pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-slate-100">
              {(['books', 'students', 'issued_books', 'admin'] as DBTable[]).map((t) => (
                <button
                  id={`table-select-${t}`}
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-all truncate ${
                    selectedTable === t
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'books' && '📚 books'}
                  {t === 'students' && '🎓 students'}
                  {t === 'issued_books' && '🏷️ issued_books'}
                  {t === 'admin' && '🔑 admin'}
                </button>
              ))}
            </div>

            {/* Displaying Current select table rows */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              {selectedTable === 'books' && (
                <table id="tbl-books" className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">id (PK)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">isbn</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">author</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">genre</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono text-center">quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono text-center">available</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">shelf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-xs">
                    {books.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-slate-400 font-medium">{b.id}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-600 font-medium">{b.isbn}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium max-w-[200px] truncate">{b.title}</td>
                        <td className="px-4 py-2.5 text-slate-600">{b.author}</td>
                        <td className="px-4 py-2.5 text-slate-500">{b.genre}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-slate-700">{b.quantity}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            b.availableQuantity === 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                          }`}>
                            {b.availableQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{b.shelfLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedTable === 'students' && (
                <table id="tbl-students" className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">id (PK)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">phone_number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">registration_date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-xs whitespace-nowrap">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-indigo-600 font-semibold">{s.id}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium">{s.name}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono">{s.email}</td>
                        <td className="px-4 py-2.5 text-slate-600">{s.department}</td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono">{s.phoneNumber}</td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono">{s.registrationDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedTable === 'issued_books' && (
                <table id="tbl-issued-books" className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">id (PK)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">book_id (FK)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">student_id (FK)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">issue_date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">due_date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">return_date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono text-right">fine_amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono text-center">status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-xs whitespace-nowrap">
                    {issuedBooks.map((i) => {
                      const associatedBook = books.find(b => b.id === i.bookId);
                      const associatedStudent = students.find(s => s.id === i.studentId);
                      return (
                        <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-400 font-medium">{i.id}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">
                            #{i.bookId} <span className="text-[10px] text-slate-400">({associatedBook ? associatedBook.title.substring(0, 15) + '...' : 'Unknown'})</span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-indigo-600 font-medium">
                            {i.studentId} <span className="text-[10px] text-slate-400">({associatedStudent ? associatedStudent.name : 'Unknown'})</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 font-mono">{i.issueDate}</td>
                          <td className="px-4 py-2.5 text-slate-500 font-mono">{i.dueDate}</td>
                          <td className="px-4 py-2.5 text-slate-500 font-mono">{i.returnDate || <span className="text-slate-300">-</span>}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600">
                            {i.fineAmount > 0 ? `$${i.fineAmount.toFixed(2)}` : '$0.00'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              i.status === 'ISSUED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {i.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {selectedTable === 'admin' && (
                <table id="tbl-admin" className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">username (PK)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-mono">role_mapping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-xs">
                    {admins.map((admin) => (
                      <tr key={admin.username} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-800 font-semibold">{admin.username}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{admin.name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{admin.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">ROLE_ADMIN</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              This simulator updates instantly when you add/delete/update books or issue/return physical copies above! Relational key integrations persist locally.
            </p>
          </div>
        )}

        {activeTab === 'DDL' && (
          <div className="relative">
            <div className="absolute right-4 top-4 bg-slate-900 ring-1 ring-slate-800 rounded px-2.5 py-1 text-[10px] font-mono text-slate-400 select-none uppercase">
              Postgres SQL
            </div>
            <pre className="bg-slate-950 text-slate-200 p-5 rounded-xl font-mono text-xs overflow-x-auto max-h-[420px] leading-relaxed shadow-inner">
              {getDdlCode()}
            </pre>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-4 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800 block mb-1">PostgreSQL Database Schema Integrity Points:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li><code className="text-slate-700 font-semibold">books.id</code> and <code className="text-slate-700 font-semibold">issued_books.id</code> use auto-increment sequences (<code className="text-slate-700 font-mono">SERIAL</code> in PostgreSQL).</li>
                <li>Foreign Key rules constraints verify referencing integrity: Only registered students can capture books.</li>
                <li>Quantity checks prevent negative numbers, preserving correct library levels.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'JPA' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/4 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Entity Classes</span>
              {(['books', 'students', 'issued_books', 'admin'] as DBTable[]).map((t) => (
                <button
                  id={`jpa-selector-${t}`}
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`px-4 py-2.5 text-left text-xs font-medium rounded-lg transition-all border ${
                    selectedTable === t
                      ? 'bg-indigo-600 text-white border-transparent'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'books' && 'Book.java (Entity)'}
                  {t === 'students' && 'Student.java (Entity)'}
                  {t === 'issued_books' && 'IssuedBook.java (Entity)'}
                  {t === 'admin' && 'Admin.java (Entity)'}
                </button>
              ))}
            </div>

            <div className="flex-1 relative">
              <div className="absolute right-4 top-4 bg-indigo-950 text-indigo-400 text-[10px] font-mono px-2.5 py-1 rounded select-none uppercase">
                SPRING DATA JPA
              </div>
              <pre className="bg-slate-950 text-indigo-300 p-5 rounded-xl font-mono text-xs overflow-x-auto max-h-[420px] leading-relaxed shadow-inner">
                {getJpaCode()}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'CONSOLE' && (
          <div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <p className="text-xs text-slate-600 leading-relaxed">
                🚀 This dynamic SQL prompt enables real-time querying directly over the mock memory storage.
                Try clicking one of the presets to run the simulated statement, or type your own!
              </p>
              
              {/* Clickable Templates */}
              <div className="flex flex-wrap gap-2 mt-3">
                {sqlTemplates.map((template, idx) => (
                  <button
                    id={`sql-tmpl-btn-${idx}`}
                    key={idx}
                    onClick={() => handleTemplateClick(template.query)}
                    className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Query Console Input Form */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold font-mono">$ postgres_db =&gt;</span>
                <input
                  id="sql-console-input"
                  type="text"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs pl-36 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="SELECT * FROM books;"
                />
              </div>
              <button
                id="execute-query-btn"
                onClick={() => executeSimulatedQuery(sqlQuery)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs shrink-0 shadow-sm hover:shadow active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run SQL
              </button>
            </div>

            {/* Error or Success result window */}
            {sqlError && (
              <div id="sql-error-alert" className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-mono mt-4 leading-relaxed">
                {sqlError}
              </div>
            )}

            {consoleSuccess && (
              <div id="sql-success-alert" className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-2 mt-4">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                {consoleSuccess}
              </div>
            )}

            {sqlResult && (
              <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-mono text-slate-600 font-bold uppercase tracking-wider">
                  Result Grid Console View
                </div>
                <div className="bg-slate-950 p-4 font-mono text-xs text-white max-h-[300px] overflow-auto leading-relaxed">
                  <pre>{JSON.stringify(sqlResult, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
