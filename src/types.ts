export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  quantity: number;
  availableQuantity: number;
  shelfLocation: string;
}

export interface Student {
  id: string; // e.g., "STU101"
  name: string;
  email: string;
  department: string;
  phoneNumber: string;
  registrationDate: string;
}

export interface IssuedBook {
  id: number;
  bookId: number;
  studentId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fineAmount: number;
  status: 'ISSUED' | 'RETURNED';
}

export interface Admin {
  username: string;
  name: string;
  email: string;
}

export type UserRole = 'ADMIN' | 'STUDENT' | 'GUEST';
