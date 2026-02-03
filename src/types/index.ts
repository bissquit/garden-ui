export type Role = 'user' | 'operator' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  created_at: string;
  updated_at: string;
}
