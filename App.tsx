
import React, { useState, useEffect, useRef } from 'react';
import { createChatSession, sendMessageStream } from './services/geminiService';
import { db } from './services/db';
import { Message, Role, User, Theme } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { Auth } from './components/Auth';
import { ThemeToggle } from './components/ThemeToggle';
import { ProfileModal } from './components/ProfileModal';
import { GenerateContentResponse, Chat } from '@google/genai';
import { Activity, LogOut, Calendar, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check for logged in user
  useEffect(() => {
    const savedUser = localStorage.getItem('medi_chat_current_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
  }, []);

  // Initialize chat session & load history when user is logged in
  useEffect(() => {
    const initSession = async () => {
      if (user) {
        chatSessionRef.current = createChatSession(user.name);
        
        // Load history from DB
        const savedMessages = await db.chats.getSession(user.id);
        
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Add an initial receptionist greeting if no history
          const initialMsg: Message = {
            id: 'init-1',
            role: Role.MODEL,
            content: `Hello ${user.name}, welcome back to City Health Specialists. I'm Clara. \n\nI can help you schedule appointments or provide detailed information about your prescriptions and medications. \n\nFeel free to upload a photo of your prescription!`,
            timestamp: Date.now(),
          };
          setMessages([initialMsg]);
          // Save this initial state immediately
          db.chats.saveSession(user.id, [initialMsg]);
        }
      }
    };

    initSession();
  }, [user]);

  // Auto-save chat history whenever messages change (but debounce slightly to avoid spamming writes)
  useEffect(() => {
    if (user && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        db.chats.saveSession(user.id, messages);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, user]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('medi_chat_current_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setMessages([]);
    chatSessionRef.current = null;
    localStorage.removeItem('medi_chat_current_user');
  };

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, image?: { base64: string, mimeType: string, url: string }) => {
    if (!chatSessionRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content,
      timestamp: Date.now(),
      attachment: image ? {
        type: 'image',
        url: image.url,
        mimeType: image.mimeType,
        base64: image.base64
      } : undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseId = (Date.now() + 1).toString();
      const initialBotMessage: Message = {
        id: responseId,
        role: Role.MODEL,
        content: '', 
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, initialBotMessage]);

      const streamResult = await sendMessageStream(
        chatSessionRef.current, 
        content, 
        image ? { base64: image.base64, mimeType: image.mimeType } : undefined
      );
      
      let fullContent = '';

      for await (const chunk of streamResult) {
        const chunkContent = (chunk as GenerateContentResponse).text;
        if (chunkContent) {
          fullContent += chunkContent;
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === responseId 
                ? { ...msg, content: fullContent } 
                : msg
            )
          );
        }
      }

      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === responseId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: "I'm sorry, I encountered a system error processing your request. Please try again.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (user) {
      await db.chats.clearSession(user.id);
      
      // Reset Chat
      chatSessionRef.current = createChatSession(user.name);
      const resetMsg: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: "Chat history cleared. How can I help you today?",
        timestamp: Date.now(),
      };
      setMessages([resetMsg]);
      setIsProfileOpen(false);
    }
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('medi_chat_current_user', JSON.stringify(updatedUser));
  };

  // If no user, show Auth screen
  if (!user) {
    return (
      <>
        <div className="absolute top-4 right-4 z-50">
           <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
        <Auth onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      <ProfileModal 
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdateUser={handleUpdateProfile}
        onClearHistory={handleClearHistory}
        messageCount={messages.length}
      />

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-500/20">
              <Activity className="text-white w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight">City Health</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reception & Pharmacy Desk</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1.5 pr-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="My Profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                 <UserCircle size={20} />
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user.name}</span>
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60">
              <Calendar size={48} className="mb-4" />
              <p>Checking appointment slots...</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
