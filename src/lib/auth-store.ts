import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  last_login?: string | null;
}

const SESSION_KEY = 'printstock_session';
interface Session {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

async function secureHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + '_printstock_salt_v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Legacy hash for backward compatibility during migration
function legacyHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
}

async function seedDefaultUsers() {
  const { count } = await supabase.from('app_users').select('*', { count: 'exact', head: true });
  if (count === 0 || count === null) {
    const adminHash = await secureHash('admin123');
    const staffHash = await secureHash('staff123');
    await supabase.from('app_users').insert([
      { username: 'admin', name: 'Admin', role: 'admin', password_hash: adminHash },
      { username: 'staff', name: 'Staff', role: 'staff', password_hash: staffHash },
    ]);
  }
}

export async function login(username: string, password: string): Promise<User | null> {
  if (!username || !password || username.length > 50 || password.length > 100) return null;

  await seedDefaultUsers();

  const hash = await secureHash(password);
  const legHash = legacyHash(password);
  
  // Try secure hash first, then fallback to legacy
  let { data, error } = await supabase
    .from('app_users')
    .select('id, username, name, role')
    .eq('username', username)
    .eq('password_hash', hash)
    .single();

  if (error || !data) {
    // Try legacy hash for migration
    const legResult = await supabase
      .from('app_users')
      .select('id, username, name, role')
      .eq('username', username)
      .eq('password_hash', legHash)
      .single();
    
    if (legResult.error || !legResult.data) return null;
    data = legResult.data;
    
    // Migrate to secure hash
    await supabase.from('app_users').update({ password_hash: hash }).eq('id', data.id);
  }

  if (error || !data) return null;

  // Update last_login
  await supabase.from('app_users').update({ last_login: new Date().toISOString() }).eq('id', data.id);

  const user: User = { id: data.id, username: data.username, name: data.name, role: data.role as UserRole };
  const session: Session = { ...user };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return user;
}

export async function addUser(username: string, name: string, password: string, role: UserRole): Promise<boolean> {
  if (!username || !name || !password) return false;
  const hash = await secureHash(password);
  const { error } = await supabase.from('app_users').insert({
    username,
    name,
    role,
    password_hash: hash,
  });
  return !error;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  const session: Session = JSON.parse(data);
  return { id: session.id, username: session.username, name: session.name, role: session.role };
}

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, name, role, last_login')
    .order('name');
  if (error || !data) return [];
  return data.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role as UserRole, last_login: u.last_login }));
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  return !error;
}

export async function updatePassword(id: string, newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 6) return false;
  const hash = await secureHash(newPassword);
  const { error } = await supabase.from('app_users').update({ password_hash: hash }).eq('id', id);
  return !error;
}

export async function updateRole(id: string, newRole: UserRole): Promise<boolean> {
  const { error } = await supabase.from('app_users').update({ role: newRole }).eq('id', id);
  return !error;
}
