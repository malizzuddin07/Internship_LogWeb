export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  created_at: string;
}

export interface Log {
  id: string;
  student_id: string;
  student_name?: string;
  date: string;
  department: string;
  tasks_performed: string;
  skills_learned: string;
  problems_faced: string;
  solutions: string;
  hours_worked: number;
  remarks: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
