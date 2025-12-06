
import React, { useState, useEffect, useRef } from 'react';
import { db } from './services/db';
import { auth } from './services/firebase'; // Import auth for listener
import { onAuthStateChanged } from 'firebase/auth';
import { chatScript } from './data/script';
import { Message, Role, User, Theme, Option } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { Auth } from './components/Auth';
import { ThemeToggle } from './components/ThemeToggle';
import { ProfileModal } from './components/ProfileModal';
import { Activity, LogOut, Calendar, UserCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // New state for auth check
  const [theme, setTheme] = useState<Theme>('light');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Track current position in the script
  const [currentScriptId, setCurrentScriptId] = useState<string>('start');
  
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

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch full user profile from Firestore
          const userData = await db.users.getUser(firebaseUser.uid);
          if (userData) {
            setUser(userData);
          } else {
            // Should verify this case, but for now just set minimal user
             setUser({
               id: firebaseUser.uid,
               email: firebaseUser.email || '',
               name: firebaseUser.displayName || 'User',
               createdAt: Date.now(),
               lastLogin: Date.now()
             });
          }
        } catch (e) {
          console.error("Failed to fetch user data", e);
        }
      } else {
        setUser(null);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Initialize chat session & load history when user is logged in
  useEffect(() => {
    const initSession = async () => {
      if (user) {
        
        // Load history from DB
        const savedMessages = await db.chats.getSession(user.id);
        
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
          // Try to restore script state based on last message options
          const lastMsg = savedMessages[savedMessages.length - 1];
          // This is a heuristic: if we stored the script ID we'd be better off, 
          // but for now we assume 'start' if we can't determine.
          // In a real app we'd save currentScriptId to DB too.
        } else {
          // Initialize with start node
          const startNode = chatScript['start'];
          const initialMsg: Message = {
            id: 'init-1',
            role: Role.MODEL,
            content: startNode.text,
            options: startNode.options,
            timestamp: Date.now(),
          };
          setMessages([initialMsg]);
          setCurrentScriptId('start');
          db.chats.saveSession(user.id, [initialMsg]);
        }
      }
    };

    initSession();
  }, [user]);

  // Auto-save chat history
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
    // State update handled by onAuthStateChanged
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await db.users.logout();
    setUser(null);
    setMessages([]);
  };

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle choice selection or text input (if we matched it)
  const processInput = async (inputText: string, nextId?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: inputText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate "thinking" delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Determine response
    let nextNode = nextId ? chatScript[nextId] : chatScript['unknown'];
    
    // If we didn't get an explicit nextId, try to find a match in the current node's options by text
    if (!nextId && currentScriptId) {
      const currentNode = chatScript[currentScriptId];
      if (currentNode && currentNode.options) {
        const match = currentNode.options.find(opt => opt.label.toLowerCase() === inputText.toLowerCase());
        if (match) {
          nextNode = chatScript[match.nextId];
        }
      }
    }

    // Default fallbacks if node missing
    if (!nextNode) nextNode = chatScript['start'];

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: Role.MODEL,
      content: nextNode.text,
      options: nextNode.options,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, botMessage]);
    setCurrentScriptId(nextNode.id);
    setIsLoading(false);
  };

  const handleOptionClick = (option: Option) => {
    if (isLoading) return;
    processInput(option.label, option.nextId);
  };

  const handleSendMessage = (content: string, image?: any) => {
    // If user types manually, we try to process it, but usually this chat relies on clicks.
    // We treat manual input as text.
    if (image) {
      alert("Image upload is disabled in this version.");
      return;
    }
    processInput(content);
  };

  const handleClearHistory = async () => {
    if (user) {
      await db.chats.clearSession(user.id);
      
      const startNode = chatScript['start'];
      const resetMsg: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: startNode.text,
        options: startNode.options,
        timestamp: Date.now(),
      };
      setMessages([resetMsg]);
      setCurrentScriptId('start');
      setIsProfileOpen(false);
    }
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Connecting to secure server...</p>
      </div>
    );
  }

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
              <p className="text-xs text-slate-500 dark:text-slate-400">Reception Desk (Automated)</p>
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
              <p>Loading assistant...</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onOptionClick={handleOptionClick} 
            />
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
