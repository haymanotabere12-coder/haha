import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  Lock,
  Radio,
  Sparkles,
} from 'lucide-react';
import { ActiveTab, ExamLevel, Language } from '../types';

interface HomeLandingViewProps {
  selectedLevel: ExamLevel;
  onSelectLevel: (lvl: ExamLevel) => void;
  onNavigate: (tab: ActiveTab) => void;
  onStartExam: (subjectId?: string, mode?: 'practice' | 'exam') => void;
  onOpenAuth: (
    role?: 'student' | 'teacher' | 'admin',
    mode?: 'login' | 'register',
    customMessage?: string
  ) => void;
  isLoggedIn: boolean;
  language?: Language;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  selectedLevel,
  onSelectLevel,
  onNavigate,
  onOpenAuth,
  isLoggedIn,
  language = 'en',
}) => {
  const isAm = language === 'am';

  const tracks: Array<{
    id: ExamLevel;
    label: string;
    subtitle: string;
  }> = [
    {
      id: 'grade_8',
      label: isAm ? 'የ8ኛ ክፍል ክልላዊ ፈተና' : 'Grade 8 Ministry Exam',
      subtitle: isAm ? 'ዋና የትምህርት ዓይነቶች እና ያለፉ ፈተናዎች' : 'Regional primary school leaving papers',
    },
    {
      id: 'grade_12_natural',
      label: isAm ? 'የ12ኛ ክፍል የተፈጥሮ ሳይንስ (ESSLCE)' : 'Grade 12 Natural Science',
      subtitle: isAm ? 'ፊዚክስ፣ ሂሳብ፣ ኬሚስትሪ፣ ባዮሎጂ እና SAT' : 'Physics, Math, Chemistry, Biology & SAT',
    },
    {
      id: 'grade_12_social',
      label: isAm ? 'የ12ኛ ክፍል ማህበራዊ ሳይንስ (ESSLCE)' : 'Grade 12 Social Science',
      subtitle: isAm ? 'ኢኮኖሚክስ፣ ታሪክ፣ ጂኦግራፊ እና እንግሊዝኛ' : 'Economics, History, Geography & English',
    },
    {
      id: 'university_exit',
      label: isAm ? 'የዩኒቨርሲቲ መውጫ ፈተና' : 'University Exit Exam',
      subtitle: isAm ? 'በኮምፒውተር የተደገፈ የመውጫ ፈተና ልምምድ' : 'Centralized graduation exit exam drills',
    },
  ];

  const capabilities: Array<{
    num: string;
    tab: ActiveTab;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      num: '01',
      tab: 'exam_prep',
      title: isAm ? 'የሰዓት ገደብ ያላቸው ፈተናዎች' : 'Timed Mock Exams',
      desc: isAm
        ? 'ያለፉ ብሔራዊ ፈተናዎችን በእውነተኛ የፈተና ሰዓት እና ማብራሪያ ይለማመዱ።'
        : 'Practice authentic national past papers with realistic timers and instant answer review.',
      icon: <Clock className="w-4 h-4 text-emerald-700" />,
    },
    {
      num: '02',
      tab: 'live_classes',
      title: isAm ? 'የቀጥታ ትምህርቶች' : 'Live Classrooms',
      desc: isAm
        ? 'ከመምህራን ጋር በቀጥታ ስርጭት፣ በስላይድ እና በጥያቄና መልስ ይማሩ።'
        : 'Attend real-time teacher sessions with synchronized slides and student Q&A.',
      icon: <Radio className="w-4 h-4 text-emerald-700" />,
    },
    {
      num: '03',
      tab: 'documents',
      title: isAm ? 'ማስታወሻዎች እና PDF ፈተናዎች' : 'Notes & Past Papers',
      desc: isAm
        ? 'የተደራጁ የመማሪያ ማስታወሻዎችን እና ያለፉ ፈተናዎችን በPDF ያግኙ።'
        : 'Read curriculum formula sheets, teacher notes, and past exam booklets in one library.',
      icon: <FileText className="w-4 h-4 text-emerald-700" />,
    },
    {
      num: '04',
      tab: 'ai_lab',
      title: isAm ? 'AI የጥናት ረዳት' : 'Bilingual AI Tutor',
      desc: isAm
        ? 'ከባድ ጥያቄዎችን በአማርኛ እና በእንግሊዝኛ ደረጃ በደረጃ ያስረዳዎታል።'
        : 'Get clear step-by-step explanations and study flashcards in English or Amharic.',
      icon: <Sparkles className="w-4 h-4 text-emerald-700" />,
    },
  ];

  const handleTrackClick = (levelId: ExamLevel) => {
    onSelectLevel(levelId);
    onNavigate('exams');
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* ------------------------------------------------------------------ */}
      {/* HERO SECTION                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Crisp Editorial Messaging & Primary CTA */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              {isAm
                ? 'የኢትዮጵያ ትምህርት ሚኒስቴር ስርዓተ ትምህርት'
                : 'Ethiopian Ministry of Education Curriculum'}
            </p>

            <h1
              className={`font-['Outfit',sans-serif] font-extrabold text-slate-900 tracking-tight leading-[1.1] ${
                isAm ? "font-['Noto_Sans_Ethiopic']" : ''
              }`}
              style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.5rem)' }}
            >
              {isAm ? (
                <>
                  ለኢትዮጵያ ብሔራዊ ፈተናዎች{' '}
                  <span className="text-emerald-700">የተደራጀ ዝግጅት።</span>
                </>
              ) : (
                <>
                  Focused preparation for{' '}
                  <span className="text-emerald-700">Ethiopia&apos;s national exams.</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              {isAm
                ? 'ለ8ኛ ክፍል ክልላዊ፣ ለ12ኛ ክፍል ብሔራዊ እና ለዩኒቨርሲቲ መውጫ ፈተናዎች ያለፉ ጥያቄዎች፣ የቀጥታ ትምህርቶች እና የጥናት ማስታወሻዎች በአንድ ቦታ።'
                : 'Past papers, timed mock exams, live classrooms, and bilingual study tools for Grade 8 Ministry, Grade 12 ESSLCE, and University Exit Exams.'}
            </p>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isAm ? 'ወደ ዳሽቦርድ ግባ' : 'Open My Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('exam_prep')}
                    className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-600" />
                    <span>{isAm ? 'ልምምድ ጀምር' : 'Start Exam Practice'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuth('student', 'login')}
                    className="px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isAm ? 'ለመጀመር ይግቡ' : 'Sign In to Start'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenAuth('student', 'register')}
                    className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isAm ? 'አዲስ መለያ ይፍጠሩ' : 'Create Free Account'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Clean Examination Tracks Directory */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isAm ? 'የፈተና ደረጃዎች' : 'Examination Tracks'}
                  </span>
                </div>
                {!isLoggedIn && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Lock className="w-3 h-3" />
                    {isAm ? 'መግባት ይጠይቃል' : 'Sign in required'}
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {tracks.map((track) => {
                  const isActive = isLoggedIn && selectedLevel === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => handleTrackClick(track.id)}
                      className={`w-full text-left py-3.5 px-2 -mx-2 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer group ${
                        isActive ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                          {track.label}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {track.subtitle}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PLATFORM CAPABILITIES                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="border-t border-slate-200 pt-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isAm ? 'በመድረኩ ውስጥ የሚያገኙት' : 'Inside Your Study Workspace'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isAm
                  ? 'ሁሉም የጥናት መሳሪያዎች ከገቡ በኋላ በአንድ ቦታ ይገኛሉ።'
                  : 'Every study tool unlocks immediately once you sign in to your student or teacher account.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((item) => (
              <button
                key={item.num}
                onClick={() => onNavigate(item.tab)}
                className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {item.num}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <span>{isLoggedIn ? (isAm ? 'ክፈት' : 'Open') : (isAm ? 'ለመክፈት ይግቡ' : 'Sign in to access')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* QUIET FOOTER                                                       */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>EthioExam Prep</span>
          </div>
          <div>
            {isAm
              ? '© 2026 EthioExam Prep • የ8ኛ ክፍል፣ የ12ኛ ክፍል እና የዩኒቨርሲቲ መውጫ ፈተና መዘጋጃ'
              : '© 2026 EthioExam Prep • Grade 8 Ministry • Grade 12 ESSLCE • University Exit Exam'}
          </div>
        </div>
      </footer>
    </div>
  );
};
