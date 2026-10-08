import React, { useState, useEffect } from 'react';
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
  Shuffle, 
  Filter, 
  BookOpen, 
  Award,
  ChevronRight,
  Eye,
  Check,
  Zap,
  Bookmark
} from 'lucide-react';
import { Question, SubjectInfo, ExamLevel, ExamMode, ExamResult } from '../types';

interface ExamPrepViewProps {
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  questions: Question[];
  initialSubjectId?: string;
  initialMode?: ExamMode;
  onAskAiExplain: (question: Question, studentAnswer?: string) => void;
  onSaveResult: (result: ExamResult) => void;
}

export const ExamPrepView: React.FC<ExamPrepViewProps> = ({
  selectedLevel,
  subjects,
  questions,
  initialSubjectId,
  initialMode = 'practice',
  onAskAiExplain,
  onSaveResult,
}) => {
  const currentSubjects = subjects.filter((s) => s.level === selectedLevel);
  const defaultSubjectId = initialSubjectId || currentSubjects[0]?.id || '';

  // Setup state
  const [activeSubjectId, setActiveSubjectId] = useState<string>(defaultSubjectId);
  const [examMode, setExamMode] = useState<ExamMode>(initialMode);
  const [filterPastExamsOnly, setFilterPastExamsOnly] = useState<boolean>(false);
  const [isRandomized, setIsRandomized] = useState<boolean>(true);
  const [sessionLength, setSessionLength] = useState<number>(15);

  // Active Session state
  const [isInSession, setIsInSession] = useState<boolean>(false);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(600);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [completedResult, setCompletedResult] = useState<ExamResult | null>(null);

  // Auto-switch subject when grade level changes
  useEffect(() => {
    if (!currentSubjects.some((s) => s.id === activeSubjectId)) {
      if (currentSubjects.length > 0) {
        setActiveSubjectId(currentSubjects[0].id);
      }
    }
  }, [selectedLevel, currentSubjects]);

  // If initialSubjectId changes from outside, auto-launch
  useEffect(() => {
    if (initialSubjectId && currentSubjects.some(s => s.id === initialSubjectId)) {
      handleStartSession(initialSubjectId, initialMode);
    }
  }, [initialSubjectId, initialMode]);

  // Timer countdown for exam mode
  useEffect(() => {
    if (!isInSession || sessionCompleted || examMode !== 'exam') return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
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
      pool = questions; // Fallback to all questions if specific filter has none
    }

    let finalQuestions = [...pool];
    if (isRandomized) {
      finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);
    }

    const batchLimit = sessionLength === -1 ? finalQuestions.length : Math.min(finalQuestions.length, sessionLength);
    const selectedBatch = finalQuestions.slice(0, batchLimit > 0 ? batchLimit : 15);

    setSessionQuestions(selectedBatch);
    setActiveSubjectId(subjectId);
    setExamMode(mode);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setTimeRemainingSeconds(mode === 'exam' ? selectedBatch.length * 90 : 3600);
    setSessionCompleted(false);
    setCompletedResult(null);
    setIsInSession(true);
  };

  // Select an option for current question
  const handleSelectOption = (questionId: string, optionLetter: string) => {
    if (sessionCompleted && examMode === 'exam') return;
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
      title: activeSubjectId === 'all_mock' ? 'Full National Mock Exam' : (currentSubjects.find(s => s.id === activeSubjectId)?.name || 'Subject Drill'),
      level: selectedLevel,
      subjectId: activeSubjectId,
      totalQuestions: sessionQuestions.length,
      correctAnswersCount: correctCount,
      scorePercentage: scorePct,
      timeSpentSeconds: examMode === 'exam' ? (sessionQuestions.length * 90) - timeRemainingSeconds : 300,
      passed,
      date: new Date().toLocaleDateString(),
      userAnswers,
      weakTopics: Object.keys(weakTopicsMap),
      strongTopics: Object.keys(strongTopicsMap),
    };

    setCompletedResult(result);
    setSessionCompleted(true);
    onSaveResult(result);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // -------------------------------------------------------------
  // VIEW: IN ACTIVE SESSION (PRACTICE OR EXAM)
  // -------------------------------------------------------------
  if (isInSession && sessionQuestions.length > 0) {
    const currentQ = sessionQuestions[currentIndex];
    const isAnswered = !!userAnswers[currentQ.id];
    const selectedAns = userAnswers[currentQ.id];
    const isCorrect = selectedAns === currentQ.correctAnswer;
    const isFlagged = !!flaggedQuestions[currentQ.id];

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Top Session Status Bar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInSession(false)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
              title="Exit Session"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  {examMode === 'practice' ? 'Practice Mode (ልምምድ)' : 'Timed Exam (ፈተና)'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-700 font-semibold">
                  {currentSubjects.find(s => s.id === activeSubjectId)?.name || 'Full Mock'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Question {currentIndex + 1} of {sessionQuestions.length}
              </div>
            </div>
          </div>

          {/* Center/Right widgets: Timer and Flag */}
          <div className="flex items-center gap-3">
            {examMode === 'exam' && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs ${
                timeRemainingSeconds < 120 
                  ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            )}

            <button
              onClick={() => handleToggleFlag(currentQ.id)}
              className={`p-2 rounded-xl border transition ${
                isFlagged 
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title={isFlagged ? 'Flagged for review' : 'Flag question'}
            >
              <Flag className={`w-4 h-4 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            {!sessionCompleted && (
              <button
                onClick={handleFinishExam}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
          ></div>
        </div>

        {/* Results Screen (if submitted) */}
        {sessionCompleted && completedResult && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="text-center space-y-2">
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                completedResult.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {completedResult.passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {completedResult.passed ? 'Congratulations! Exam Passed 🎉' : 'Review Required — Keep Practicing!'}
              </h3>
              <p className="text-sm text-slate-600">
                {completedResult.title} • {completedResult.passed ? 'You achieved the national passing threshold (50%+).' : 'Below the 50% passing threshold.'}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-2xl font-black text-emerald-700">{completedResult.scorePercentage}%</div>
                <div className="text-xs text-slate-500 font-medium">Final Score</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-2xl font-black text-slate-900">
                  {completedResult.correctAnswersCount} / {completedResult.totalQuestions}
                </div>
                <div className="text-xs text-slate-500 font-medium">Correct Answers</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatTime(completedResult.timeSpentSeconds)}
                </div>
                <div className="text-xs text-slate-500 font-medium">Time Taken</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-2xl font-black text-amber-700">
                  {completedResult.weakTopics.length}
                </div>
                <div className="text-xs text-slate-500 font-medium">Weak Topics</div>
              </div>
            </div>

            {/* Action buttons after completion */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleStartSession(activeSubjectId, examMode)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Exam</span>
              </button>
              <button
                onClick={() => setIsInSession(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition"
              >
                Back to Subjects
              </button>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Question Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {currentQ.topic}
              </span>
              {currentQ.year && (
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {currentQ.year}
                </span>
              )}
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                currentQ.difficulty === 'Easy' 
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentQ.difficulty === 'Medium'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentQ.difficulty}
              </span>
            </div>

            {isFlagged && (
              <span className="text-xs text-amber-700 flex items-center gap-1 font-semibold">
                <Flag className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Flagged for Review
              </span>
            )}
          </div>

          {/* Question Body */}
          <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
            {currentQ.question}
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const letter = opt.trim().charAt(0);
              const isSelected = selectedAns === letter;
              const showResult = (examMode === 'practice' && isAnswered) || sessionCompleted;
              const isOptionCorrect = letter === currentQ.correctAnswer;

              let optionStyle = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800";

              if (showResult) {
                if (isOptionCorrect) {
                  optionStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold";
                } else if (isSelected && !isOptionCorrect) {
                  optionStyle = "bg-red-50 border-red-500 text-red-900 font-semibold";
                }
              } else if (isSelected) {
                optionStyle = "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold";
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(currentQ.id, letter)}
                  className={`w-full text-left p-4 rounded-xl border transition flex items-start justify-between gap-3 text-sm leading-relaxed ${optionStyle}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {letter}
                    </span>
                    <span>{opt.replace(/^[A-D]\)\s*/, '')}</span>
                  </div>

                  {showResult && (
                    <div className="shrink-0">
                      {isOptionCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {isSelected && !isOptionCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Section (Practice Mode or post-submit) */}
          {((examMode === 'practice' && isAnswered) || sessionCompleted) && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ethiopian Ministry Official Rationale</span>
                </div>

                <button
                  onClick={() => onAskAiExplain(currentQ, selectedAns)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ask AI for Deep Breakdown</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <p>{currentQ.explanation}</p>
                {currentQ.amharicExplanation && (
                  <div className="pt-2 border-t border-slate-200 text-emerald-900 font-['Noto_Sans_Ethiopic'] text-xs font-medium">
                    <span className="font-bold text-emerald-800">የአማርኛ ማብራሪያ፡ </span>{currentQ.amharicExplanation}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation & Question Jump Grid */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Quick Jump Buttons */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 max-w-md">
            {sessionQuestions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const hasAns = !!userAnswers[q.id];
              const flagged = !!flaggedQuestions[q.id];

              let pillStyle = "bg-white border-slate-200 text-slate-600";
              if (isCurrent) {
                pillStyle = "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs";
              } else if (hasAns) {
                pillStyle = "bg-emerald-50 text-emerald-800 font-semibold border-emerald-200";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center border transition relative ${pillStyle}`}
                >
                  {idx + 1}
                  {flagged && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            disabled={currentIndex === sessionQuestions.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(sessionQuestions.length - 1, prev + 1))}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: SUBJECT SELECTION & EXAM MODE CONFIGURATION
  // -------------------------------------------------------------
  const examTypes = ['School Exams', 'National Exams', 'University Entrance', 'University Exit', 'Certification'];
  const [selectedExamType, setSelectedExamType] = useState<string>('National Exams');

  const recentActivities = [
    { title: 'Mathematics Practice Test', time: 'Completed 2 hours ago', score: '85%', passed: true },
    { title: 'Physics Mock Exam', time: 'Completed 4 hours ago', score: '72%', passed: true },
    { title: 'Chemistry Quiz', time: 'Completed 5 hours ago', score: '90%', passed: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header matching Learnova screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Exam Preparation
            </h2>
            <p className="text-xs text-slate-500">
              Practice with real questions and track your progress.
            </p>
          </div>
        </div>

        {/* Global Full Mock Test Launch */}
        <button
          onClick={() => handleStartSession('all_mock', 'exam')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
          id="btn-full-mock-exam"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>Start Full Mock Exam</span>
        </button>
      </div>

      {/* Select Exam Type (From Learnova screenshot) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Select Exam Type
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {examTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedExamType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedExamType === type
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Choose Subject Grid & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subjects (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Choose Subject ({currentSubjects.length})
            </h3>
            
            {/* Mode toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                onClick={() => setExamMode('practice')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  examMode === 'practice' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Practice
              </button>
              <button
                onClick={() => setExamMode('exam')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  examMode === 'exam' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Timed Exam
              </button>
            </div>
          </div>

          {/* Exam Question Count Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Exam Length:</span>
              <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-extrabold text-[11px]">
                {sessionLength === -1 ? 'All Available' : `${sessionLength} Questions`}
              </span>
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {[10, 15, 20, 30, 40, -1].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSessionLength(cnt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    sessionLength === cnt
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cnt === -1 ? 'All' : `${cnt} Qs`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentSubjects.map((subject) => {
              const subjectQuestions = questions.filter(
                (q) => q.level === selectedLevel && q.subjectId === subject.id
              );

              return (
                <div
                  key={subject.id}
                  onClick={() => handleStartSession(subject.id, examMode)}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition truncate">
                        {subject.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {subjectQuestions.length || subject.questionCount} Questions available
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition shrink-0 ml-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity (4 cols) - From Learnova screenshot */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Recent Activity
            </h3>

            <div className="space-y-3">
              {recentActivities.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500">{item.time}</div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-black text-xs shrink-0">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleStartSession(currentSubjects[0]?.id || '', 'practice')}
              className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition cursor-pointer text-center"
            >
              Continue Practice Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
