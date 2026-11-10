import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CloudUpload, Sparkles, X } from 'lucide-react';

export const MigrationModal: React.FC = () => {
  const { migrationPromptOpen, confirmMigration, dismissMigration } = useAuth();

  if (!migrationPromptOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0E1526] border border-slate-800 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 relative text-center">
        <button
          onClick={dismissMigration}
          className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00DF89]/10 border border-[#00DF89]/30 text-[#00DF89] mx-auto">
          <CloudUpload className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Sync Local Data to Cloud?</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            We found existing resumes and job matches saved on this device. Would you like to sync them securely to your new account across devices?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={dismissMigration}
            className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Keep Local Only
          </button>
          <button
            onClick={confirmMigration}
            className="py-2.5 bg-[#00DF89] hover:bg-[#00c97b] text-slate-950 font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sync to Cloud</span>
          </button>
        </div>
      </div>
    </div>
  );
};
