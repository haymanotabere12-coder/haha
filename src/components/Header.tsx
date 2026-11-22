import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Flame, 
  Sparkles,
  Radio,
  LogOut,
  ShieldCheck,
  User,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  FileText,
  Video,
  BarChart3,
  Layers,
  Zap,
  HelpCircle,
  Award,
  Globe,
  UserCheck
} from 'lucide-react';
import { ExamLevel, AppUser, ActiveTab, Language } from '../types';

interface HeaderProps {
  selectedLevel: ExamLevel;
  onSelectLevel: (level: ExamLevel) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  streakCount: number;
  onOpenAiLab: () => void;
  isLiveActive: boolean;
  onGoToLive: () => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onOpenAuth: (role?: 'student' | 'teacher' | 'admin', mode?: 'login' | 'register') => void;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLevel,
  onSelectLevel,
  activeTab,
  onSelectTab,
  streakCount,
  onOpenAiLab,
  isLiveActive,
  onGoToLive,
  currentUser,
  onLogout,
  onOpenAdmin,
  onOpenAuth,
  language = 'en',
  onSelectLanguage,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isLearningDropdownOpen, setIsLearningDropdownOpen] = useState<boolean>(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState<boolean>(false);

  const learningDropdownRef = useRef<HTMLDivElement | null>(null);
  const moreDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        learningDropdownRef.current &&
        !learningDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLearningDropdownOpen(false);
      }
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(e.target as Node)
      ) {
        setIsMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const levels: Array<{ id: ExamLevel; label: string; short: string }> = [
    { id: 'grade_12_natural', label: 'Grade 12 Natural', short: 'G12 Natural' },
    { id: 'grade_12_social', label: 'Grade 12 Social', short: 'G12 Social' },
    { id: 'grade_8', label: 'Grade 8 Ministry', short: 'Grade 8' },
    { id: 'university_exit', label: 'Exit Exam', short: 'Exit Exam' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div 
          onClick={() => onSelectTab(currentUser ? 'dashboard' : 'home')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 tracking-tight">
            Ethio<span className="text-emerald-700">Exam</span> Prep
          </span>
        </div>

        {/* Desktop Primary Navigation Links (Authenticated users only) */}
        {currentUser && (
        <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-700">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'home' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Home
          </button>

          {currentUser && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'dashboard' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
          )}

          <button
            onClick={() => onSelectTab('exams')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'exams' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Exams</span>
          </button>

          <button
            onClick={() => onSelectTab('subjects')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'subjects' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Subjects</span>
          </button>

          {/* Learning Tools Dropdown */}
          <div className="relative" ref={learningDropdownRef}>
            <button
              onClick={() => {
                setIsLearningDropdownOpen(!isLearningDropdownOpen);
                setIsMoreDropdownOpen(false);
              }}
              className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                ['live_classes', 'exam_prep', 'videos', 'ai_lab', 'tutors'].includes(activeTab)
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-expanded={isLearningDropdownOpen}
            >
              <span>Learning</span>
              {isLiveActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLearningDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLearningDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 z-50 animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={() => {
                    onSelectTab('live_classes');
                    setIsLearningDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'live_classes' ? 'bg-red-50 text-red-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <Radio className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <div className="leading-tight flex items-center justify-between">
                      <span>Live Classes</span>
                      {isLiveActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 font-bold uppercase">Live</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Real-time lectures & Q&A</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('exam_prep');
                    setIsLearningDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'exam_prep' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <div className="leading-tight flex items-center justify-between">
                      <span>Practice Drill</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Timed simulation & past questions</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('videos');
                    setIsLearningDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'videos' ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <Video className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="flex-1">
                    <div className="leading-tight flex items-center justify-between">
                      <span>Video Learning</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Recorded MoE video modules</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('ai_lab');
                    setIsLearningDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'ai_lab' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="flex-1">
                    <div className="leading-tight flex items-center justify-between">
                      <span>AI Tutor</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Instant problem explanations</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('tutors');
                    setIsLearningDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'tutors' ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <div className="leading-tight flex items-center justify-between">
                      <span>{language === 'am' ? 'የግል አስጠኚ' : 'Personal Tutor'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {language === 'am' ? '1-ለ-1 የግል መምህር ምደባ' : '1-on-1 teacher assignment'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* More Dropdown (Notes & PDFs, Scores, Admin) */}
          <div className="relative" ref={moreDropdownRef}>
            <button
              onClick={() => {
                setIsMoreDropdownOpen(!isMoreDropdownOpen);
                setIsLearningDropdownOpen(false);
              }}
              className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                ['documents', 'analytics', 'admin'].includes(activeTab)
                  ? 'text-emerald-800 bg-emerald-50'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-expanded={isMoreDropdownOpen}
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMoreDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 z-50 animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={() => {
                    onSelectTab('documents');
                    setIsMoreDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'documents' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <div className="leading-tight flex items-center justify-between">
                      <span>Notes & PDFs</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Syllabus summaries & papers</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('analytics');
                    setIsMoreDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'analytics' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <div className="leading-tight flex items-center justify-between">
                      <span>My Scores</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Diagnostic analytics & trends</div>
                  </div>
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      if (onOpenAdmin) onOpenAdmin();
                      setIsMoreDropdownOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 flex items-center gap-2.5 text-xs font-semibold text-purple-900 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                    <div className="flex-1">
                      <div className="leading-tight">Admin Management</div>
                      <div className="text-[10px] text-purple-600 font-normal">Platform moderation</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
        )}

        {/* Grade Level Quick Switcher (Interactive for Teachers/Admins; Read-only badge for registered Students) */}
        {currentUser && (
          currentUser.role === 'student' && currentUser.gradeLevel ? (
            <div className="hidden xl:flex items-center px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold whitespace-nowrap">
              {levels.find((l) => l.id === currentUser.gradeLevel)?.label || 'My Grade'}
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {levels.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => onSelectLevel(lvl.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {lvl.short}
                  </button>
                );
              })}
            </div>
          )
        )}

        {/* Right Section: Streak, Live Alert, User / Login */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live broadcast button (Authenticated users only) */}
          {currentUser && isLiveActive && (
            <button
              onClick={onGoToLive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Join live classroom broadcast"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Now</span>
            </button>
          )}

          {/* Study streak pill */}
          {currentUser && (
            <div 
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
              title="Daily study streak"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{streakCount}d</span>
            </div>
          )}

          {/* Global Language Switcher: EN | አማ */}
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => onSelectLanguage?.('en')}
              className={`px-2 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                language === 'en'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onSelectLanguage?.('am')}
              className={`px-2 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                language === 'am'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="አማርኛ"
            >
              አማ
            </button>
          </div>

          {/* User Profile or Login/Register */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              {currentUser.role === 'admin' ? (
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold transition"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              ) : (
                <div 
                  onClick={() => onSelectTab('dashboard')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-100 transition"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    currentUser.role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-emerald-700 text-white'
                  }`}>
                    {currentUser.role === 'teacher' 
                      ? (language === 'am' ? 'መምህር' : 'Teacher') 
                      : (language === 'am' ? 'ተማሪ' : 'Student')}
                  </span>
                </div>
              )}

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('student', 'login')}
                className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => onOpenAuth('student', 'register')}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger (Authenticated users only) */}
          {currentUser && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE NAVIGATION DRAWER (Authenticated users only)           */}
      {/* ------------------------------------------------------------- */}
      {currentUser && isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Main Links */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              General
            </div>
            <button
              onClick={() => {
                onSelectTab('home');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'home' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>Home</span>
              {activeTab === 'home' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  onSelectTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>Student Dashboard</span>
                {activeTab === 'dashboard' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
              </button>
            )}

            <button
              onClick={() => {
                onSelectTab('exams');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'exams' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>National Exams</span>
              {activeTab === 'exams' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>

            <button
              onClick={() => {
                onSelectTab('subjects');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'subjects' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>Subjects & Chapters</span>
              {activeTab === 'subjects' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>
          </div>

          {/* Learning Features */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Learning Tools
            </div>
            <button
              onClick={() => {
                onSelectTab('live_classes');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'live_classes' ? 'bg-red-50 text-red-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500" />
                <span>Live Classes</span>
              </div>
              {isLiveActive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">LIVE</span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectTab('exam_prep');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'exam_prep' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Practice Drill</span>
              </div>
              {activeTab === 'exam_prep' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>

            <button
              onClick={() => {
                onSelectTab('videos');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'videos' ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                <span>Video Learning</span>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectTab('ai_lab');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'ai_lab' ? 'bg-purple-50 text-purple-900' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Tutor</span>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectTab('tutors');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'tutors' ? 'bg-amber-50 text-amber-900' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>{language === 'am' ? 'የግል አስጠኚ' : 'Personal Tutor'}</span>
              </div>
              {activeTab === 'tutors' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
            </button>
          </div>

          {/* More Resources */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Resources & Scores
            </div>
            <button
              onClick={() => {
                onSelectTab('documents');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'documents' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Notes & PDFs</span>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectTab('analytics');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeTab === 'analytics' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>My Scores</span>
              </div>
              {activeTab === 'analytics' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  if (onOpenAdmin) onOpenAdmin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-purple-50 text-purple-900 flex items-center gap-2 text-xs font-bold cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Admin Management</span>
              </button>
            )}
          </div>

          {/* Grade level picker for mobile (Teachers/Admins only; read-only for registered Students) */}
          {currentUser.role === 'student' && currentUser.gradeLevel ? (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Registered Grade:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                {levels.find((l) => l.id === currentUser.gradeLevel)?.label}
              </span>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500">Target Grade Level:</div>
              <div className="grid grid-cols-2 gap-2">
                {levels.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      onSelectLevel(lvl.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-center ${
                      selectedLevel === lvl.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!currentUser && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenAuth('student', 'login');
                  setIsMobileMenuOpen(false);
                }}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold text-center cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onOpenAuth('student', 'register');
                  setIsMobileMenuOpen(false);
                }}
                className="py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold text-center cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
