import React, { useState } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  ChevronRight, 
  Zap, 
  Search, 
  Layers, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { ExamLevel, SubjectInfo, Language } from '../types';

interface SubjectsViewProps {
  subjects: SubjectInfo[];
  selectedLevel: ExamLevel;
  onSelectLevel: (lvl: ExamLevel) => void;
  onStartExam: (subjectId: string, mode: 'practice' | 'exam') => void;
  language?: Language;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  selectedLevel,
  onSelectLevel,
  onStartExam,
  language = 'en',
}) => {
  const isAm = language === 'am';
  const [search, setSearch] = useState<string>('');
  const [selectedChapterSubject, setSelectedChapterSubject] = useState<SubjectInfo | null>(null);

  const currentSubjects = subjects.filter((s) => s.level === selectedLevel);
  const filtered = currentSubjects.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.nameAmharic && s.nameAmharic.toLowerCase().includes(q)) ||
      s.description.toLowerCase().includes(q) ||
      s.chapters.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              National Curriculum Syllabus
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {currentSubjects.length} Core Subjects
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Subjects for {selectedLevel.replace(/_/g, ' ').toUpperCase()}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Explore Ethiopian Ministry of Education curriculum guidelines, drill chapter problem sets, and practice verified national examination questions.
          </p>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto no-scrollbar shrink-0">
          {(['grade_12_natural', 'grade_12_social', 'grade_8', 'university_exit'] as ExamLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => onSelectLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {lvl === 'grade_12_natural' ? 'Grade 12 Natural' :
               lvl === 'grade_12_social' ? 'Grade 12 Social' :
               lvl === 'grade_8' ? 'Grade 8' : 'University Exit'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects, chapters, or topics..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900">{sub.questionCount} Questions</div>
                  <div className="text-[10px] text-slate-500">{sub.totalHours} Study Hours</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition">
                  {sub.name}
                </h3>
                {isAm && sub.nameAmharic && (
                  <div className="text-xs font-bold text-emerald-800 font-['Noto_Sans_Ethiopic'] mt-0.5">
                    {sub.nameAmharic}
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              {/* Chapters List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Curriculum Chapters:</span>
                  <span className="text-[10px] font-mono text-slate-500">{sub.chapters.length} Chapters</span>
                </div>
                <div className="space-y-1.5">
                  {sub.chapters.map((ch, idx) => (
                    <div
                      key={ch}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-4 h-4 rounded-md bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{ch}</span>
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
              <button
                onClick={() => onStartExam(sub.id, 'practice')}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer text-center"
              >
                Practice Drill
              </button>
              <button
                onClick={() => onStartExam(sub.id, 'exam')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-200" />
                <span>Timed Exam</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
