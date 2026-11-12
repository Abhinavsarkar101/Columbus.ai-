import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ShieldCheck, Mail, ChevronDown, LayoutDashboard, Trash2 } from 'lucide-react';

interface AccountMenuProps {
  onNavigateTab?: (tab: string) => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({ onNavigateTab }) => {
  const { user, isVerified, openAuthModal, logout, openDeleteModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openAuthModal('signin')}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <User className="w-3.5 h-3.5 text-[#00DF89]" />
          <span>Start free</span>
        </button>
        <button
          onClick={() => openAuthModal('signup')}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-[#00DF89] hover:bg-[#00c97b] rounded-xl transition-all shadow-sm cursor-pointer"
        >
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer text-xs text-slate-200 font-medium"
      >
        <div className="w-6 h-6 rounded-lg bg-[#00DF89]/20 text-[#00DF89] flex items-center justify-center font-bold text-xs uppercase">
          {user.email ? user.email[0] : 'U'}
        </div>
        <span className="hidden sm:inline max-w-[130px] truncate">{user.displayName || user.email}</span>
        {isVerified && <span title="Verified Account"><ShieldCheck className="w-3.5 h-3.5 text-[#00DF89]" /></span>}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#0E1526] border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-slate-800/80 space-y-1">
            <p className="text-xs font-bold text-white truncate">{user.displayName || 'Account'}</p>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <Mail className="w-3 h-3 shrink-0" />
              <span>{user.email}</span>
            </p>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${isVerified ? 'bg-[#00DF89]' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isVerified ? 'Cloud Sync Active (Verified)' : 'Unverified (Local Storage Mode)'}
              </span>
            </div>
          </div>

          {onNavigateTab && (
            <div className="p-1 border-b border-slate-800/80 space-y-0.5">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigateTab('home');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#00DF89]" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          )}

          <div className="p-1 space-y-0.5">
            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                openDeleteModal();
              }}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-800/60 pt-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
