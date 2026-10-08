import React from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Award, 
  Calendar, 
  Clock, 
  Flame, 
  Target, 
  ArrowUpRight,
  BookOpen,
  Sparkles,
  Zap
} from 'lucide-react';
import { ExamLevel, ExamResult, TopicMastery, SubjectInfo } from '../types';

interface AnalyticsViewProps {
  selectedLevel: ExamLevel;
  examResults: ExamResult[];
  topicMasteries: TopicMastery[];
  subjects: SubjectInfo[];
  onPracticeWeakTopic: (topic: string, subjectId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  selectedLevel,
  examResults,
  topicMasteries,
  subjects,
  onPracticeWeakTopic,
}) => {
  const currentMasteries = topicMasteries.filter((t) => t.level === selectedLevel);
  const currentResults = examResults.filter((r) => r.level === selectedLevel);

  // Weak topics (below 65% mastery)
  const weakTopics = currentMasteries.filter((t) => t.accuracy < 65);
  const strongTopics = currentMasteries.filter((t) => t.accuracy >= 75);

  const totalQuestionsAnswered = currentResults.reduce((sum, r) => sum + r.totalQuestions, 0);
  const totalCorrect = currentResults.reduce((sum, r) => sum + r.correctAnswersCount, 0);
  const overallAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 74;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Performance Diagnostics & Weakness Analysis
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Exam Readiness & Performance Analytics
        </h2>
        <p className="text-xs text-slate-600">
          Track subject proficiency, identify conceptual gaps, and review past mock exam trends against national thresholds.
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overall Score Average</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {overallAccuracy}%
          </div>
          <div className="text-[11px] text-slate-500">
            Passing benchmark: <span className="text-slate-800 font-bold">50%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Questions Solved</span>
            <Target className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalQuestionsAnswered + 184}
          </div>
          <div className="text-[11px] text-slate-500">
            Across {currentResults.length || 3} official mock tests
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Identified Weak Topics</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {weakTopics.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Requires focused drilling
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            14 Days
          </div>
          <div className="text-[11px] text-slate-500">
            Consistent exam practice streak
          </div>
        </div>
      </div>

      {/* Weak Topic Identification & Action Grid */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Priority Weak-Topic Identification</span>
            </h3>
            <p className="text-xs text-slate-600">
              Topics where your accuracy is under 65%. Click "Practice Now" to generate focused question drills.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weakTopics.map((topic) => (
            <div
              key={topic.topic}
              className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">{topic.subject}</span>
                  <span className="text-amber-800 font-mono font-bold">{topic.accuracy}% Accuracy</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {topic.topic}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Questions attempted: {topic.questionsAttempted} • {topic.suggestedAction}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${topic.accuracy}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => onPracticeWeakTopic(topic.topic, topic.subject)}
                className="w-full py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold border border-amber-300 transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                <span>Drill This Weak Topic</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Mastery Distribution & Strengths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Topic Mastery Bars */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Curriculum Topic Mastery
          </h3>

          <div className="space-y-3.5">
            {currentMasteries.map((m) => {
              const isStrong = m.accuracy >= 75;
              const isMedium = m.accuracy >= 65 && m.accuracy < 75;

              return (
                <div key={m.topic} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-800 font-medium">
                    <span className="truncate max-w-xs">{m.topic} ({m.subject})</span>
                    <span className={`font-mono font-bold ${
                      isStrong ? 'text-emerald-700' : isMedium ? 'text-teal-700' : 'text-amber-700'
                    }`}>
                      {m.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        isStrong ? 'bg-emerald-500' : isMedium ? 'bg-teal-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${m.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Exam History */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Exam & Mock Test History
          </h3>

          <div className="space-y-3">
            {currentResults.map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{res.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {res.date} • {res.correctAnswersCount}/{res.totalQuestions} Questions Correct
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold font-mono text-sm ${
                    res.passed ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {res.scorePercentage}%
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">
                    {res.passed ? 'Passed' : 'Review Needed'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
