import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  Zap, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  X, 
  ArrowRight,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { ExamCardInfo, ExamLevel, SubjectInfo } from '../types';

interface ExamDiscoveryViewProps {
  exams: ExamCardInfo[];
  selectedLevel: ExamLevel;
  onSelectLevel: (level: ExamLevel) => void;
  subjects: SubjectInfo[];
  onStartExam: (subjectId: string, mode: 'practice' | 'exam') => void;
}

export const ExamDiscoveryView: React.FC<ExamDiscoveryViewProps> = ({
  exams,
  selectedLevel,
  onSelectLevel,
  subjects,
  onStartExam,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<ExamLevel | 'all'>(selectedLevel);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'National Past Paper' | 'Full Mock Exam'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'questions' | 'duration'>('popular');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Keep local filter synced if selectedLevel changes from header
  React.useEffect(() => {
    setLevelFilter(selectedLevel);
  }, [selectedLevel]);

  // Filtered & sorted exams list
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exam.title.toLowerCase().includes(q);
        const matchesSubject = exam.subjectName.toLowerCase().includes(q);
        const matchesYear = exam.year.toLowerCase().includes(q);
        const matchesDesc = exam.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesYear && !matchesDesc) return false;
      }

      // Grade Level filter
      if (levelFilter !== 'all' && exam.level !== levelFilter) {
        return false;
      }

      // Subject filter
      if (subjectFilter !== 'all' && exam.subjectId !== subjectFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && exam.difficulty !== difficultyFilter) {
        return false;
      }

      // Exam Type filter
      if (typeFilter !== 'all' && exam.examType !== typeFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.totalAttempts - a.totalAttempts;
      if (sortBy === 'questions') return b.questionCount - a.questionCount;
      if (sortBy === 'duration') return b.durationMinutes - a.durationMinutes;
      return 0;
    });
  }, [exams, searchQuery, levelFilter, subjectFilter, difficultyFilter, typeFilter, sortBy]);

  const activeFilterCount = (levelFilter !== 'all' ? 1 : 0) +
    (subjectFilter !== 'all' ? 1 : 0) +
    (difficultyFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setLevelFilter('all');
    setSubjectFilter('all');
    setDifficultyFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & HERO TITLE                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              National Examination Catalog
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold font-mono">
              {filteredExams.length} Available Exams
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Explore Ethiopian Past Papers & Mock Exams
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Filter authentic Ministry past papers by grade, subject, and difficulty. Practice at your own pace or start a realistic timed exam simulation.
          </p>
        </div>

        {/* Quick full mock button */}
        <button
          onClick={() => onStartExam('all_mock', 'exam')}
          className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 self-start md:self-auto cursor-pointer active:scale-95 shrink-0"
        >
          <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
          <span>Take Grand National Mock</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH AND FILTER BAR                                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam title, subject, year (e.g. 2016 E.C., Physics, Calculus)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="sm:hidden px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>

          {/* Desktop Sort Dropdown */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="popular">Most Popular</option>
              <option value="questions">Question Count</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>

        {/* Desktop Quick Category & Level Pills */}
        <div className="hidden sm:flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1">Level:</span>
            {[
              { id: 'all', label: 'All Levels' },
              { id: 'grade_12_natural', label: 'Grade 12 Natural' },
              { id: 'grade_12_social', label: 'Grade 12 Social' },
              { id: 'grade_8', label: 'Grade 8' },
              { id: 'university_exit', label: 'University Exit' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  setLevelFilter(lvl.id as any);
                  if (lvl.id !== 'all') onSelectLevel(lvl.id as ExamLevel);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  levelFilter === lvl.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Difficulty Quick Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Difficulty:</span>
            {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  difficultyFilter === diff
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {diff === 'all' ? 'All' : diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EXAM CARDS GRID                                               */}
      {/* ------------------------------------------------------------- */}
      {filteredExams.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No exams match your search criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your grade level or clearing filters to see all available Ethiopian national examination papers.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const isFeatured = exam.isFeatured;
            const diffColor =
              exam.difficulty === 'Easy'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : exam.difficulty === 'Medium'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-red-100 text-red-800 border-red-200';

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {exam.examType}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${diffColor}`}>
                        {exam.difficulty}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {exam.year}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{exam.subjectName}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition mt-1 leading-snug">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                      {exam.description}
                    </p>
                  </div>

                  {/* Metrics bar */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{exam.questionCount}</div>
                      <div className="text-[10px] text-slate-500">Questions</div>
                    </div>
                    <div className="border-x border-slate-200">
                      <div className="text-xs font-extrabold text-slate-900">{exam.durationMinutes}m</div>
                      <div className="text-[10px] text-slate-500">Duration</div>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-emerald-700">{exam.passRate}%</div>
                      <div className="text-[10px] text-slate-500">Pass Rate</div>
                    </div>
                  </div>

                  {/* Learners info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.totalAttempts.toLocaleString()} Students Practiced</span>
                    </span>
                    <span className="text-emerald-700 font-semibold">MoE Standard</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onStartExam(exam.subjectId, 'practice')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition text-center cursor-pointer"
                  >
                    Practice Mode
                  </button>
                  <button
                    onClick={() => onStartExam(exam.subjectId, 'exam')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition text-center shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Timed Exam</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MOBILE FILTER DRAWER                                          */}
      {/* ------------------------------------------------------------- */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div 
            onClick={() => setIsMobileFilterOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                  <span className="font-extrabold text-slate-900 text-sm">Filter Exams</span>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grade Level */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Grade Level</div>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Levels' },
                    { id: 'grade_12_natural', label: 'Grade 12 Natural' },
                    { id: 'grade_12_social', label: 'Grade 12 Social' },
                    { id: 'grade_8', label: 'Grade 8 Ministry' },
                    { id: 'university_exit', label: 'University Exit' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setLevelFilter(lvl.id as any)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                        levelFilter === lvl.id
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Difficulty</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`py-2 rounded-xl text-xs font-semibold text-center ${
                        difficultyFilter === diff
                          ? 'bg-slate-800 text-white font-bold'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {diff === 'all' ? 'All' : diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Type */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Exam Type</div>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Exam Types' },
                    { id: 'National Past Paper', label: 'National Past Papers' },
                    { id: 'Full Mock Exam', label: 'Full Mock Exams' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setTypeFilter(type.id as any)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                        typeFilter === type.id
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-2">
              <button
                onClick={() => {
                  resetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                Apply & View ({filteredExams.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
