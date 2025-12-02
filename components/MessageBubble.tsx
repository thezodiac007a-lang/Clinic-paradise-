import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { User, Stethoscope, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const isError = message.isError;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser 
            ? 'bg-primary-600 text-white' 
            : isError 
              ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' 
              : 'bg-teal-600 text-white'
        }`}>
          {isUser ? <User size={16} /> : isError ? <AlertCircle size={16} /> : <Stethoscope size={16} />}
        </div>

        {/* Bubble Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed overflow-hidden ${
            isUser 
              ? 'bg-primary-600 text-white rounded-tr-sm' 
              : isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-100 dark:border-red-800/30 rounded-tl-sm'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
          }`}>
            {message.attachment && message.attachment.type === 'image' && (
              <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                <img 
                  src={message.attachment.url} 
                  alt="Attachment" 
                  className="max-w-full h-auto max-h-[300px] object-cover"
                />
              </div>
            )}
            
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};