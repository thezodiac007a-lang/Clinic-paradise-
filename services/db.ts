
import { User, Message, ChatSession } from '../types';

/**
 * Mock Database Service
 * Simulates a secure backend using LocalStorage with data normalization and error handling.
 */

const STORAGE_KEYS = {
  USERS: 'medi_chat_db_users',
  SESSIONS: 'medi_chat_db_sessions',
  CURRENT_USER: 'medi_chat_curr_session'
};

// Helper to simulate network delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  users: {
    async create(email: string, password: string, name: string): Promise<User> {
      await delay(500); // Simulate server latency
      
      const normalizedEmail = email.toLowerCase().trim();
      const users = this._getUsers();
      
      if (users.find(u => u.email === normalizedEmail)) {
        throw new Error("Email already registered.");
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        password, // Note: In production, hash this!
        name: name.trim(),
        createdAt: Date.now(),
        lastLogin: Date.now()
      };

      users.push(newUser);
      this._saveUsers(users);
      
      return newUser;
    },

    async authenticate(email: string, password: string): Promise<User> {
      await delay(600);
      
      const normalizedEmail = email.toLowerCase().trim();
      const users = this._getUsers();
      const user = users.find(u => u.email === normalizedEmail);

      if (!user || user.password !== password) {
        throw new Error("Invalid credentials.");
      }

      // Update last login
      user.lastLogin = Date.now();
      this._saveUsers(users);

      return user;
    },

    async updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email' | 'password'>>): Promise<User> {
      await delay(300);
      const users = this._getUsers();
      const index = users.findIndex(u => u.id === userId);
      
      if (index === -1) throw new Error("User not found");

      users[index] = { ...users[index], ...updates };
      this._saveUsers(users);
      
      return users[index];
    },

    _getUsers(): User[] {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error("DB Read Error", e);
        return [];
      }
    },

    _saveUsers(users: User[]) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  chats: {
    async saveSession(userId: string, messages: Message[]): Promise<void> {
      // Don't wait for delay on saves to keep UI snappy
      const allSessions = this._getSessions();
      allSessions[userId] = {
        userId,
        messages,
        lastUpdated: Date.now()
      };
      this._saveSessions(allSessions);
    },

    async getSession(userId: string): Promise<Message[]> {
      const allSessions = this._getSessions();
      return allSessions[userId]?.messages || [];
    },

    async clearSession(userId: string): Promise<void> {
      const allSessions = this._getSessions();
      delete allSessions[userId];
      this._saveSessions(allSessions);
    },

    _getSessions(): Record<string, ChatSession> {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    },

    _saveSessions(sessions: Record<string, ChatSession>) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }
  }
};
