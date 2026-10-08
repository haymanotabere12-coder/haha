import React from 'react';
import { 
  GraduationCap, 
  Flame, 
  Sparkles,
  Radio,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';
import { ExamLevel, AppUser } from '../types';

interface HeaderProps {
  selectedLevel: ExamLevel;
  onSelectLevel: (level: ExamLevel) => void;
  streakCount: number;
  onOpenAiLab: () => void;
  isLiveActive: boolean;
  onGoToLive: () => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  activeLiveTeacher?: { name: string; subject?: string } | null;
  onToggleRole?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLevel,
  onSelectLevel,
  streakCount,
  onOpenAiLab,
  isLiveActive,
  onGoToLive,
  currentUser,
  onLogout,
  onOpenAdmin,
  activeLiveTeacher,
  onToggleRole,
}) => {
  const levels: Array<{ id: ExamLevel; label: string; short: string }> = [
    { id: 'grade_8', label: 'Grade 8', short: 'Grade 8' },
    { id: 'grade_12_natural', label: 'Grade 12 Natural', short: 'G12 Natural' },
    { id: 'grade_12_social', label: 'Grade 12 Social', short: 'G12 Social' },
    { id: 'university_exit', label: 'Exit Exam', short: 'Exit Exam' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
              Ethio<span className="text-emerald-600">Exam</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              National Exam & Learning Platform
            </div>
          </div>
        </div>

        {/* Grade / Level Quick Switcher Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto no-scrollbar max-w-md">
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => onSelectLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span className="hidden sm:inline">{lvl.label}</span>
                <span className="sm:hidden">{lvl.short}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Live Badge + Streak + User Auth Profile + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {(isLiveActive || activeLiveTeacher) && (
            <button
              onClick={onGoToLive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs animate-pulse cursor-pointer"
              title="በቀጥታ እየተላለፈ ያለውን ትምህርት ተቀላቀል"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <Radio className="w-3.5 h-3.5 text-white" />
              <span>
                {activeLiveTeacher ? `🔴 ${activeLiveTeacher.name} (ቀጥታ ግባ)` : 'Live Class'}
              </span>
            </button>
          )}

          <div 
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
            title="Daily Study Streak"
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{streakCount}d</span>
          </div>

          <button
            onClick={onOpenAiLab}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
            <span>AI Tutor</span>
          </button>

          {/* User Account / Admin Badge */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              {currentUser.role === 'admin' ? (
                <button
                  onClick={onOpenAdmin}
                  title="Open Admin Control Center"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">Admin ({currentUser.username})</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      currentUser.role === 'teacher' ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
                    }`}>
                      {currentUser.role === 'teacher' ? 'መምህር' : 'ተማሪ'}
                    </span>
                  </div>

                  {onToggleRole && (
                    <button
                      type="button"
                      onClick={onToggleRole}
                      className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold transition cursor-pointer"
                      title={currentUser.role === 'teacher' ? 'ወደ ተማሪነት ቀይር (Switch to Student)' : 'ወደ መምህርነት ቀይር (Switch to Teacher)'}
                    >
                      {currentUser.role === 'teacher' ? '👨‍🎓 ተማሪ ሁን' : '👨‍🏫 መምህር ሁን'}
                    </button>
                  )}
                </div>
              )}

              {/* Log Out Button */}
              <button
                onClick={onLogout}
                title="Log Out"
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


