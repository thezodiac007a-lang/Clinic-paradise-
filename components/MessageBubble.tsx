import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role, Option } from '../types';
import { User, Stethoscope, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onOptionClick?: (option: Option) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onOptionClick }) => {
  const isUser = message.role === Role.USER;
  const isError = message.isError;

  return (
    <div className={`flex w-full mb-6 flex-col ${isUser ? 'items-end' : 'items-start'}`}>
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

      {/* Options / Quick Replies */}
      {!isUser && message.options && message.options.length > 0 && (
         <div className="flex flex-wrap gap-2 mt-3 ml-11 max-w-[85%]">
            {message.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onOptionClick && onOptionClick(opt)}
                className="bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-900/50 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors shadow-sm"
              >
                {opt.label}
              </button>
            ))}
         </div>
      )}
    </div>
  );
};