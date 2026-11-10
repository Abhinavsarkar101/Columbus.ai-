import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const DeleteAccountModal: React.FC = () => {
  const { deleteModalOpen, closeDeleteModal, deleteAccount, user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!deleteModalOpen || !user) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in no-print">
      <div className="bg-[#0E1526] border border-red-500/40 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 relative">
        <button
          onClick={closeDeleteModal}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Delete Profile & Data</h3>
            <p className="text-xs text-slate-400">{user.email || 'Current Account'}</p>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-300 space-y-2 leading-relaxed">
          <p className="font-semibold text-red-200">
            Warning: This action is permanent and cannot be undone.
          </p>
          <p className="text-slate-300">
            Deleting your profile will permanently erase:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
            <li>Your account credentials and profile settings</li>
            <li>All saved resumes in Resume Studio</li>
            <li>All ATS match history and job postings</li>
            <li>All Diagnostic Assessment progress and scores</li>
            <li>All database records from Firebase Cloud Firestore</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-950 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting Everything...' : 'Delete My Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
