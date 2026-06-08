import { Book, Student, IssuedBook, Admin } from '../types';

export const INITIAL_BOOKS: Book[] = [
  {
    id: 1,
    isbn: '978-0132350884',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    genre: 'Computer Science',
    quantity: 5,
    availableQuantity: 4,
    shelfLocation: 'A-12'
  },
  {
    id: 2,
    isbn: '978-0201633610',
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    genre: 'Software Engineering',
    quantity: 3,
    availableQuantity: 2,
    shelfLocation: 'A-15'
  },
  {
    id: 3,
    isbn: '978-0134685991',
    title: 'Effective Java',
    author: 'Joshua Bloch',
    genre: 'Computer Science',
    quantity: 8,
    availableQuantity: 8,
    shelfLocation: 'B-04'
  },
  {
    id: 4,
    isbn: '978-0596009205',
    title: 'Head First Design Patterns',
    author: 'Eric Freeman, Elisabeth Robson',
    genre: 'Computer Science',
    quantity: 4,
    availableQuantity: 3,
    shelfLocation: 'B-05'
  },
  {
    id: 5,
    isbn: '978-1491950296',
    title: 'Building Microservices',
    author: 'Sam Newman',
    genre: 'System Design',
    quantity: 3,
    availableQuantity: 3,
    shelfLocation: 'C-01'
  },
  {
    id: 6,
    isbn: '978-0544003415',
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    genre: 'Fiction / Fantasy',
    quantity: 6,
    availableQuantity: 6,
    shelfLocation: 'F-10'
  },
  {
    id: 7,
    isbn: '978-0061120084',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction / Classics',
    quantity: 2,
    availableQuantity: 2,
    shelfLocation: 'F-12'
  },
  {
    id: 8,
    isbn: '978-1501171895',
    title: 'The Seven Habits of Highly Effective People',
    author: 'Stephen R. Covey',
    genre: 'Self-Help',
    quantity: 5,
    availableQuantity: 5,
    shelfLocation: 'S-02'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'STU101',
    name: 'Emily Watson',
    email: 'emily.watson@university.edu',
    department: 'Computer Science',
    phoneNumber: '+1 (555) 019-2834',
    registrationDate: '2025-09-10'
  },
  {
    id: 'STU102',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    department: 'Information Technology',
    phoneNumber: '+1 (555) 014-9988',
    registrationDate: '2025-10-02'
  },
  {
    id: 'STU103',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    department: 'Electrical Engineering',
    phoneNumber: '+1 (555) 017-4411',
    registrationDate: '2025-08-15'
  }
];

export const INITIAL_ISSUED_BOOKS: IssuedBook[] = [
  {
    id: 1,
    bookId: 1, // Clean Code
    studentId: 'STU101',
    issueDate: '2026-06-01',
    dueDate: '2026-06-15', // Active, not overdue (Current is 2026-06-08)
    returnDate: null,
    fineAmount: 0,
    status: 'ISSUED'
  },
  {
    id: 2,
    bookId: 2, // Design Patterns
    studentId: 'STU102',
    issueDate: '2026-05-10',
    dueDate: '2026-05-24', // Active and seriously overdue (Current is 2026-06-08)
    returnDate: null,
    fineAmount: 30, // 15 days overdue (Current date is June 8) -> 15 * 2 = 30
    status: 'ISSUED'
  },
  {
    id: 3,
    bookId: 4, // Head First Design Patterns
    studentId: 'STU103',
    issueDate: '2026-05-01',
    dueDate: '2026-05-15',
    returnDate: '2026-05-12', // Returned early!
    fineAmount: 0,
    status: 'RETURNED'
  }
];

export const INITIAL_ADMINS: Admin[] = [
  {
    username: 'admin',
    name: 'Administrator Chief',
    email: 'admin@library.edu'
  }
];
