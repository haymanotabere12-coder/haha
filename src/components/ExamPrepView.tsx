import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  Sparkles, 
  Flag, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Check, 
  Zap, 
  HelpCircle,
  X,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { Question, SubjectInfo, ExamLevel, ExamMode, ExamResult, Language } from '../types';

interface ExamPrepViewProps {
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  questions: Question[];
  initialSubjectId?: string;
  initialMode?: ExamMode;
  autoLaunchKey?: number;
  language?: Language;
  onAskAiExplain: (question: Question, studentAnswer?: string) => void;
  onSaveResult: (result: ExamResult) => void;
  onBackToDashboard?: () => void;
}

export const ExamPrepView: React.FC<ExamPrepViewProps> = ({
  selectedLevel,
  subjects,
  questions,
  initialSubjectId,
  initialMode = 'practice',
  autoLaunchKey = 0,
  language: propLang,
  onAskAiExplain,
  onSaveResult,
  onBackToDashboard,
}) => {
  const [internalLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem('ethio_exam_language') as Language) || 'en';
    } catch {
      return 'en';
    }
  });
  const language = propLang || internalLang;
  const currentSubjects = subjects.filter((s) => s.level === selectedLevel);
  const defaultSubjectId = initialSubjectId || currentSubjects[0]?.id || 'g12_physics';

  // Setup state
  const [activeSubjectId, setActiveSubjectId] = useState<string>(defaultSubjectId);
  const [examMode, setExamMode] = useState<ExamMode>(initialMode);
  const [filterPastExamsOnly, setFilterPastExamsOnly] = useState<boolean>(false);
  const [sessionLength, setSessionLength] = useState<number>(15);

  // Active Session state
  const [isInSession, setIsInSession] = useState<boolean>(false);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(600);
  const [initialTimeTotal, setInitialTimeTotal] = useState<number>(600);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [completedResult, setCompletedResult] = useState<ExamResult | null>(null);

  // Modals & UI states
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const [showMobileNavigator, setShowMobileNavigator] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [timeExpiredAlert, setTimeExpiredAlert] = useState<boolean>(false);
  const prevLaunchKeyRef = useRef<number>(0);
  const sessionStartedAtRef = useRef<number>(Date.now());

  // Sync subject when level changes
  useEffect(() => {
    if (!currentSubjects.some((s) => s.id === activeSubjectId) && currentSubjects.length > 0) {
      setActiveSubjectId(currentSubjects[0].id);
    }
  }, [selectedLevel, currentSubjects, activeSubjectId]);

  // Handle explicit external exam launch (not bare tab navigation)
  useEffect(() => {
    if (autoLaunchKey > 0 && autoLaunchKey !== prevLaunchKeyRef.current) {
      prevLaunchKeyRef.current = autoLaunchKey;
      const targetSubj = initialSubjectId || currentSubjects[0]?.id || 'all_mock';
      handleStartSession(targetSubj, initialMode);
    }
  }, [autoLaunchKey, initialSubjectId, initialMode]);

  // Timer countdown for exam mode
  useEffect(() => {
    if (!isInSession || sessionCompleted || examMode !== 'exam') return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeExpiredAlert(true);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInSession, sessionCompleted, examMode]);

  // Start an Exam or Practice Session
  const handleStartSession = (subjectId: string, mode: ExamMode) => {
    let pool = questions.filter((q) => q.level === selectedLevel);
    if (subjectId !== 'all_mock') {
      pool = pool.filter((q) => q.subjectId === subjectId);
    }
    if (filterPastExamsOnly) {
      const pastPool = pool.filter((q) => q.isPastExam);
      if (pastPool.length > 0) pool = pastPool;
    }

    if (pool.length === 0) {
      pool = questions; // Fallback to all questions
    }

    let finalQuestions = [...pool].sort(() => Math.random() - 0.5);
    const batchLimit = sessionLength === -1 ? finalQuestions.length : Math.min(finalQuestions.length, sessionLength);
    const selectedBatch = finalQuestions.slice(0, batchLimit > 0 ? batchLimit : 15);

    const allocatedTime = mode === 'exam' ? selectedBatch.length * 90 : 3600;

    setSessionQuestions(selectedBatch);
    setActiveSubjectId(subjectId);
    setExamMode(mode);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setTimeRemainingSeconds(allocatedTime);
    setInitialTimeTotal(allocatedTime);
    setSessionCompleted(false);
    setCompletedResult(null);
    setShowSubmitModal(false);
    setShowMobileNavigator(false);
    setIsReviewMode(false);
    setTimeExpiredAlert(false);
    sessionStartedAtRef.current = Date.now();
    setIsInSession(true);
  };

  // Select an option for current question
  const handleSelectOption = (questionId: string, optionLetter: string) => {
    if (sessionCompleted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  // Toggle flag on question
  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Finish exam & compile results
  const handleFinishExam = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let correctCount = 0;
    const weakTopicsMap: Record<string, number> = {};
    const strongTopicsMap: Record<string, number> = {};

    sessionQuestions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans === q.correctAnswer) {
        correctCount++;
        strongTopicsMap[q.topic] = (strongTopicsMap[q.topic] || 0) + 1;
      } else {
        weakTopicsMap[q.topic] = (weakTopicsMap[q.topic] || 0) + 1;
      }
    });

    const scorePct = Math.round((correctCount / sessionQuestions.length) * 100);
    const passed = scorePct >= 50;

    const result: ExamResult = {
      id: `res-${Date.now()}`,
      title: activeSubjectId === 'all_mock' 
        ? 'Grand National Mock Exam' 
        : (currentSubjects.find(s => s.id === activeSubjectId)?.name || 'Subject Examination Drill'),
      level: selectedLevel,
      subjectId: activeSubjectId,
      totalQuestions: sessionQuestions.length,
      correctAnswersCount: correctCount,
      scorePercentage: scorePct,
      timeSpentSeconds:
        examMode === 'exam'
          ? Math.max(1, initialTimeTotal - timeRemainingSeconds)
          : Math.max(1, Math.round((Date.now() - sessionStartedAtRef.current) / 1000)),
      passed,
      date: new Date().toLocaleDateString(),
      userAnswers,
      weakTopics: Object.keys(weakTopicsMap),
      strongTopics: Object.keys(strongTopicsMap),
    };

    setCompletedResult(result);
    setSessionCompleted(true);
    setShowSubmitModal(false);
    setIsSubmitting(false);
    onSaveResult(result);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Count answered vs unanswered
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = sessionQuestions.length - answeredCount;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  // -------------------------------------------------------------
  // VIEW: RESULTS PAGE (When exam is finished)
  // -------------------------------------------------------------
  if (sessionCompleted && completedResult) {
    const pct = completedResult.scorePercentage;
    const isAm = language === 'am';
    const performanceBadge =
      pct >= 80 ? { label: isAm ? 'ከፍተኛ ውጤት' : 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' } :
      pct >= 60 ? { label: isAm ? 'ጥሩ ውጤት' : 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200' } :
      pct >= 50 ? { label: isAm ? 'ያለፈ' : 'Passed Benchmark', color: 'text-amber-700 bg-amber-50 border-amber-200' } :
      { label: isAm ? 'ተጨማሪ ዝግጅት ያስፈልጋል' : 'Needs Practice', color: 'text-red-700 bg-red-50 border-red-200' };

    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16 px-4">
        {/* Results Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              completedResult.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {completedResult.passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <div>
              <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${performanceBadge.color}`}>
                {performanceBadge.label}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {completedResult.passed ? 'Congratulations! Exam Passed 🎉' : 'Keep Practicing to Reach 50%+ Cutoff'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {completedResult.title} • {completedResult.passed ? 'You cleared the national passing threshold (50%).' : 'Below the 50% threshold. Review detailed rationales below.'}
              </p>
            </div>
          </div>

          {/* Primary Score Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono">
                {completedResult.scorePercentage}%
              </div>
              <div className="text-xs text-emerald-900 font-semibold mt-1">Overall Score</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {completedResult.correctAnswersCount} / {completedResult.totalQuestions}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">Correct Answers</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {formatTime(completedResult.timeSpentSeconds)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">Time Used</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
                {completedResult.weakTopics.length}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">Weak Topics</div>
            </div>
          </div>

          {/* Weak Topics vs Strong Topics Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {completedResult.strongTopics.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-2">
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Strong Topics Identified</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completedResult.strongTopics.map((top) => (
                    <span key={top} className="text-[11px] px-2.5 py-1 rounded-md bg-white text-emerald-900 border border-emerald-200 font-medium">
                      {top}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {completedResult.weakTopics.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100 space-y-2">
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Topics Requiring Review</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completedResult.weakTopics.map((top) => (
                    <span key={top} className="text-[11px] px-2.5 py-1 rounded-md bg-white text-amber-900 border border-amber-200 font-medium">
                      {top}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsReviewMode(!isReviewMode)}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isReviewMode ? 'Hide Answer Review' : 'Review Answers with Rationales'}</span>
            </button>

            <button
              onClick={() => handleStartSession(activeSubjectId, examMode)}
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => {
                setIsInSession(false);
                if (onBackToDashboard) onBackToDashboard();
              }}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        {isReviewMode && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Detailed Question-by-Question Review
              </h3>
              <span className="text-xs text-slate-500">
                {completedResult.totalQuestions} Questions Analyzed
              </span>
            </div>

            {sessionQuestions.map((q, idx) => {
              const studentChoice = completedResult.userAnswers[q.id];
              const isCorrect = studentChoice === q.correctAnswer;
              const isUnanswered = !studentChoice;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-6 space-y-4 shadow-xs ${
                    isCorrect ? 'border-emerald-200' : isUnanswered ? 'border-amber-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center text-white ${
                        isCorrect ? 'bg-emerald-600' : isUnanswered ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{q.topic}</span>
                      {q.year && (
                        <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {q.year}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Correct</span>
                        </span>
                      ) : isUnanswered ? (
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                          <span>Unanswered</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>Wrong</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                    {q.question}
                  </div>

                  {/* Choices list */}
                  <div className="space-y-2 text-xs">
                    {q.options.map((opt) => {
                      const letter = opt.trim().charAt(0);
                      const isChosen = studentChoice === letter;
                      const isRightAns = letter === q.correctAnswer;

                      let style = "bg-slate-50 border-slate-200 text-slate-700";
                      if (isRightAns) {
                        style = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs";
                      } else if (isChosen && !isRightAns) {
                        style = "bg-red-50 border-red-500 text-red-950 font-semibold";
                      }

                      return (
                        <div key={opt} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${style}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isRightAns ? 'bg-emerald-600 text-white' : isChosen ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {letter}
                            </span>
                            <span>{opt.replace(/^[A-D][\.\)]\s*/i, '')}</span>
                          </div>

                          {isRightAns && (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Correct Answer</span>
                            </span>
                          )}
                          {isChosen && !isRightAns && (
                            <span className="text-[11px] text-red-600 font-bold">
                              Your Selection
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation & Amharic Breakout */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span className="text-emerald-800">Ministry Official Explanation:</span>
                      <button
                        onClick={() => onAskAiExplain(q, studentChoice)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 text-[11px] font-semibold"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ask AI for Breakdown</span>
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                    {q.amharicExplanation && language === 'am' && (
                      <div className="pt-2 border-t border-slate-200 text-emerald-900 font-['Noto_Sans_Ethiopic'] font-medium">
                        <span className="font-bold text-emerald-800">የአማርኛ ማብራሪያ፡ </span>{q.amharicExplanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: IN ACTIVE SESSION (PRACTICE OR EXAM)
  // -------------------------------------------------------------
  if (isInSession && sessionQuestions.length > 0) {
    const currentQ = sessionQuestions[currentIndex];
    const isAnswered = !!userAnswers[currentQ.id];
    const selectedAns = userAnswers[currentQ.id];
    const isFlagged = !!flaggedQuestions[currentQ.id];
    const progressPct = ((currentIndex + 1) / sessionQuestions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
        {/* Time expired notification */}
        {timeExpiredAlert && (
          <div className="p-4 rounded-2xl bg-red-600 text-white text-xs font-bold shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 animate-pulse" />
              <span>Time expired! Your exam answers were automatically submitted.</span>
            </div>
            <button onClick={() => setTimeExpiredAlert(false)} className="p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Distraction-Free Exam Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExitConfirmModal(true)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Exit Session"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  {examMode === 'practice'
                    ? (language === 'am' ? 'የልምምድ ሁኔታ' : 'Practice Mode')
                    : (language === 'am' ? 'የፈተና ሁኔታ' : 'Official Timed Exam')}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-700 font-bold">
                  {currentSubjects.find(s => s.id === activeSubjectId)?.name || 'Full Mock'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">
                Question <span className="text-slate-900 font-black">{currentIndex + 1}</span> of {sessionQuestions.length}
              </div>
            </div>
          </div>

          {/* Right Toolbar: Timer, Flag, Navigator, Submit */}
          <div className="flex items-center gap-2.5">
            {/* Exam Timer */}
            {examMode === 'exam' && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs border ${
                timeRemainingSeconds < 60
                  ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                  : timeRemainingSeconds < 300
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}>
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            )}

            {/* Flag Button */}
            <button
              onClick={() => handleToggleFlag(currentQ.id)}
              className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-bold cursor-pointer ${
                isFlagged 
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={isFlagged ? 'Marked for review' : 'Mark for review'}
            >
              <Flag className={`w-4 h-4 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span className="hidden sm:inline">{isFlagged ? 'Flagged' : 'Review'}</span>
            </button>

            {/* Mobile Navigator Drawer Toggle */}
            <button
              onClick={() => setShowMobileNavigator(true)}
              className="sm:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              title="Open Question Navigator"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {/* Submit Exam Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-emerald-700 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Metadata bar */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {currentQ.topic}
              </span>
              {currentQ.year && (
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {currentQ.year}
                </span>
              )}
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {currentQ.difficulty}
              </span>
            </div>

            {isFlagged && (
              <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Marked for Review
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentQ.question}
          </div>

          {/* Answer Choices List */}
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const letter = opt.trim().charAt(0);
              const isSelected = selectedAns === letter;
              const showResult = examMode === 'practice' && isAnswered;
              const isOptionCorrect = letter === currentQ.correctAnswer;

              let optionStyle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs hover:border-slate-300";

              if (showResult) {
                if (isOptionCorrect) {
                  optionStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500";
                } else if (isSelected && !isOptionCorrect) {
                  optionStyle = "bg-red-50 border-red-400 text-red-950 font-semibold ring-1 ring-red-400";
                }
              } else if (isSelected) {
                optionStyle = "bg-emerald-50/90 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-600/30 shadow-xs";
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(currentQ.id, letter)}
                  className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-start justify-between gap-3.5 text-sm sm:text-base leading-relaxed cursor-pointer active:scale-[0.99] ${optionStyle}`}
                >
                  <div className="flex items-start gap-3 sm:gap-3.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 transition ${
                      isSelected ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {letter}
                    </div>
                    <span className="pt-0.5">{opt.replace(/^[A-D][\.\)]\s*/i, '')}</span>
                  </div>

                  {showResult && (
                    <div className="shrink-0 mt-1">
                      {isOptionCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {isSelected && !isOptionCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Immediate Rationale in Practice Mode */}
          {examMode === 'practice' && isAnswered && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ministry Official Rationale</span>
                </div>

                <button
                  onClick={() => onAskAiExplain(currentQ, selectedAns)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ask AI for Deep Breakdown</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <p>{currentQ.explanation}</p>
                {currentQ.amharicExplanation && language === 'am' && (
                  <div className="pt-2 border-t border-slate-200 text-emerald-950 font-['Noto_Sans_Ethiopic'] text-xs font-medium">
                    <span className="font-bold text-emerald-800">የአማርኛ ማብራሪያ፡ </span>{currentQ.amharicExplanation}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Question Navigator & Quick Jump Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pb-2 border-b border-slate-100">
            <span>Question Navigator</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Answered: {answeredCount}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> Left: {unansweredCount}
              </span>
              {flaggedCount > 0 && (
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Flagged: {flaggedCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Matrix Numbers */}
            <div className="hidden sm:flex items-center justify-center flex-wrap gap-1.5 max-w-xl">
              {sessionQuestions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const hasAns = !!userAnswers[q.id];
                const flagged = !!flaggedQuestions[q.id];

                let pillStyle = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100";
                if (isCurrent) {
                  pillStyle = "bg-emerald-700 text-white font-black border-emerald-700 ring-2 ring-emerald-300";
                } else if (hasAns) {
                  pillStyle = "bg-emerald-50 text-emerald-800 font-bold border-emerald-300";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center border transition relative cursor-pointer ${pillStyle}`}
                  >
                    {hasAns && !isCurrent ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      idx + 1
                    )}
                    {flagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentIndex === sessionQuestions.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(sessionQuestions.length - 1, prev + 1))}
              className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUBMIT CONFIRMATION MODAL                                     */}
        {/* ------------------------------------------------------------- */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
              <div className="text-center space-y-3">
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                  unansweredCount > 0 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  {unansweredCount > 0 ? <AlertCircle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                </div>

                <h3 className="text-xl font-black text-slate-900">
                  {unansweredCount > 0 ? 'Submit Exam with Unanswered Questions?' : 'Ready to Finalize Your Exam?'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {unansweredCount > 0 
                    ? `You still have ${unansweredCount} unanswered questions out of ${sessionQuestions.length}. Are you sure you want to finalize and calculate your score?`
                    : `You have answered all ${sessionQuestions.length} questions. Your score and performance diagnostics will be generated immediately.`}
                </p>
              </div>

              {/* Status summary pills */}
              <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                <div>
                  <div className="font-black text-emerald-700">{answeredCount}</div>
                  <div className="text-[10px] text-slate-500">Answered</div>
                </div>
                <div className="border-x border-slate-200">
                  <div className="font-black text-slate-900">{unansweredCount}</div>
                  <div className="text-[10px] text-slate-500">Unanswered</div>
                </div>
                <div>
                  <div className="font-black text-amber-600">{flaggedCount}</div>
                  <div className="text-[10px] text-slate-500">Flagged</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Return to Exam
                </button>
                <button
                  onClick={handleFinishExam}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Calculating...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* EXIT SESSION CONFIRMATION MODAL                               */}
        {/* ------------------------------------------------------------- */}
        {showExitConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Leave Exam Session?</h3>
                  <p className="text-xs text-slate-500">Unsubmitted answers will be discarded.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setShowExitConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Continue Session
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    setIsInSession(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Leave Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MOBILE QUESTION NAVIGATOR DRAWER                              */}
        {/* ------------------------------------------------------------- */}
        {showMobileNavigator && (
          <div className="fixed inset-0 z-50 flex sm:hidden">
            <div 
              onClick={() => setShowMobileNavigator(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <div className="relative mt-auto w-full bg-white rounded-t-3xl shadow-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-black text-slate-900 text-sm">Question Navigator</span>
                <button onClick={() => setShowMobileNavigator(false)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {sessionQuestions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const hasAns = !!userAnswers[q.id];
                  const flagged = !!flaggedQuestions[q.id];

                  let pillStyle = "bg-slate-50 border-slate-200 text-slate-600";
                  if (isCurrent) {
                    pillStyle = "bg-emerald-700 text-white font-black border-emerald-700";
                  } else if (hasAns) {
                    pillStyle = "bg-emerald-50 text-emerald-800 font-bold border-emerald-300";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowMobileNavigator(false);
                      }}
                      className={`h-10 rounded-xl text-xs flex items-center justify-center border font-bold relative ${pillStyle}`}
                    >
                      {hasAns && !isCurrent ? <Check className="w-4 h-4" /> : idx + 1}
                      {flagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowMobileNavigator(false)}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close Navigator
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: SUBJECT SELECTION & DRILL CONFIGURATION
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Exam Practice Simulator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Practice & Drill National Exam Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Choose a subject, configure test length, and practice with immediate bilingual rationales or take a timed mock test.
          </p>
        </div>

        {/* Global Full Mock Test Launch */}
        <button
          onClick={() => handleStartSession('all_mock', 'exam')}
          className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start md:self-auto cursor-pointer active:scale-95 shrink-0"
        >
          <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
          <span>Start Full Grand Mock Exam</span>
        </button>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentSubjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {sub.questionCount} Questions
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">{sub.name}</h3>
                {language === 'am' && sub.nameAmharic && (
                  <div className="text-xs font-semibold text-emerald-800 font-['Noto_Sans_Ethiopic']">
                    {sub.nameAmharic}
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                  {sub.description}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chapters:</div>
                <div className="flex flex-wrap gap-1">
                  {sub.chapters.slice(0, 3).map((ch) => (
                    <span key={ch} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 truncate max-w-[190px]">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleStartSession(sub.id, 'practice')}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition text-center cursor-pointer"
              >
                Practice Drill
              </button>
              <button
                onClick={() => handleStartSession(sub.id, 'exam')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition text-center shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
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
