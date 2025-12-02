
import React, { useState, useRef } from 'react';
import { User, Message } from '../types';
import { X, User as UserIcon, Save, Trash2, Clock, Shield, Download, Upload, FileJson, CheckCircle } from 'lucide-react';
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
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    const data = db.admin.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medichat_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      db.admin.importAllData(text);
      setImportStatus('Data restored successfully! reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Import failed", error);
      setImportStatus('Error: Invalid backup file.');
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
        <div className="p-6 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          
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

          {/* Backup Section */}
          <section>
             <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Data Backup
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <FileJson size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Export / Import</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your data is stored locally. Export your backup if you switch devices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  Export JSON
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  <Upload size={16} />
                  Import
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>
              {importStatus && (
                <div className="mt-3 text-xs flex items-center gap-2 text-green-600 dark:text-green-400 font-medium animate-in fade-in">
                  <CheckCircle size={12} />
                  {importStatus}
                </div>
              )}
            </div>
          </section>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Danger Zone */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 dark:text-red-500 mb-4 flex items-center gap-2">
              Danger Zone
            </h3>
            
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Active Session</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {messageCount} messages stored
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear your entire chat history? This cannot be undone.")) {
                    onClearHistory();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-medium flex items-center justify-center gap-2"
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
