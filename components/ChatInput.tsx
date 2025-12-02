import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, X, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, image?: { base64: string, mimeType: string, url: string }) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string, mimeType: string, url: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      onSend(input, selectedImage || undefined);
      setInput('');
      setSelectedImage(null);
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 and mime type
        // result is like: data:image/png;base64,iVBORw0KGgo...
        const base64Data = result.split(',')[1];
        const mimeType = result.split(':')[1].split(';')[0];
        
        setSelectedImage({
          url: result,
          base64: base64Data,
          mimeType: mimeType
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 lg:pb-8 sticky bottom-0 z-10 transition-colors duration-200">
      <div className="max-w-4xl mx-auto relative">
        
        {/* Image Preview */}
        {selectedImage && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="relative w-16 h-16 rounded overflow-hidden bg-slate-200">
              <img src={selectedImage.url} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Image attached</span>
              <span className="text-[10px] text-slate-500">Ready to send</span>
            </div>
            <button 
              onClick={() => setSelectedImage(null)}
              className="ml-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all shadow-sm">
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            title="Upload prescription image"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? "Ask about this prescription..." : "Type a message or upload a prescription..."}
            className="w-full bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none py-2 px-2 max-h-[150px] min-h-[44px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
              (!input.trim() && !selectedImage) || isLoading
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
        <div className="text-center mt-2 flex justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
           <span className="flex items-center gap-1"><ImageIcon size={10}/> Image Analysis Supported</span>
           <span>•</span>
           <span>Powered by Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
};