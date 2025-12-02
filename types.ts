
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
  attachment?: {
    type: 'image';
    url: string; // Data URL for display
    mimeType?: string; // For API
    base64?: string; // For API (raw base64 without prefix)
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // In a real app, never store plain text passwords!
  createdAt: number;
  lastLogin: number;
}

export interface ChatSession {
  userId: string;
  messages: Message[];
  lastUpdated: number;
}

export type Theme = 'light' | 'dark';
