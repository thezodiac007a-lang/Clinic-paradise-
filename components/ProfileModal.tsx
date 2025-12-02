
import React, { useState } from 'react';
import { User, Message } from '../types';
import { X, User as UserIcon, Save, Trash2, Clock, Shield } from 'lucide-react';
import { db } from '../services/db';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onClearHistory: () => void;
  messageCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onUpdateUser, 
  onClearHistory,
  messageCount 
}) => {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await db.users.updateProfile(user.id, { name });
      onUpdateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <UserIcon className="text-primary-600" size={24} />
            Patient Profile
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Personal Info Section */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Personal Information
            </h3>
            
            <div className="space-y-4">
              <div className="group">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 border border-transparent">
                  <Shield size={16} />
                  <span className="flex-1 truncate">{user.email}</span>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Read-only</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className={`flex-1 p-3 rounded-xl border transition-all ${
                      isEditing 
                        ? 'bg-white dark:bg-slate-800 border-primary-500 ring-2 ring-primary-500/20 text-slate-900 dark:text-white' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  />
                  {isEditing ? (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-primary-600 text-white px-4 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? 'Saving...' : <Save size={18} />}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Data Management Section */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Data & History
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Active Session</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {messageCount} messages stored securely
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear your entire chat history? This cannot be undone.")) {
                    onClearHistory();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Clear Chat History
              </button>
            </div>
          </section>

        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-xs text-slate-400">
             Patient ID: {user.id.slice(0, 8)}...
           </p>
        </div>

      </div>
    </div>
  );
};
