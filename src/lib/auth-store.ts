export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password: string;
}

const USERS_KEY = 'printstock_users';
const SESSION_KEY = 'printstock_session';

function getDefaultUsers(): User[] {
  return [
    { id: '1', username: 'admin', name: 'Admin', role: 'admin', password: 'admin123' },
    { id: '2', username: 'staff', name: 'Staff', role: 'staff', password: 'staff123' },
  ];
}

export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify(getDefaultUsers()));
    return getDefaultUsers();
  }
  return JSON.parse(data);
}

export function login(username: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const session = { id: user.id, username: user.username, name: user.name, role: user.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return user;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Omit<User, 'password'> | null {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}
