import React from 'react';
import { 
  Users, 
  Video, 
  Upload, 
  FileText, 
  BarChart3, 
  Calendar, 
  Play, 
  CheckCircle2, 
  Plus, 
  ChevronRight,
  Sparkles,
  Award,
  Radio
} from 'lucide-react';
import { ActiveTab, LiveClass } from '../types';

interface TeacherDashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onStartLive: () => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onNavigate,
  onStartLive,
}) => {
  const upcomingClasses = [
    { id: 'c1', subject: 'Mathematics - Grade 12', time: 'Today • 10:00 AM', enrolled: 214, isNow: true },
    { id: 'c2', subject: 'Physics - University Prep', time: 'Today • 2:00 PM', enrolled: 180, isNow: false },
    { id: 'c3', subject: 'Chemistry - Grade 12', time: 'Tomorrow • 11:00 AM', enrolled: 165, isNow: false },
  ];

  const recentStudents = [
    { name: 'Abebe', progress: 85, score: '48/50', status: 'Excellent' },
    { name: 'Mekdes', progress: 72, score: '42/50', status: 'Good' },
    { name: 'Dawit', progress: 68, score: '38/50', status: 'Needs Review' },
    { name: 'Sara', progress: 90, score: '50/50', status: 'Top Performer' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header matching Teacher Dashboard in screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Teacher Dashboard
            </h2>
            <p className="text-xs text-slate-500">
              Create, manage and inspire.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Welcome, <strong>Ms. Sarah (Teacher)</strong>
          </span>
          <button
            onClick={onStartLive}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Go Live</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Action Buttons matching the screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onStartLive}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-400 hover:shadow-xs transition text-left cursor-pointer group space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition">
            <Radio className="w-4 h-4" />
          </div>
          <div className="font-extrabold text-xs text-slate-900">Start Live Class</div>
          <p className="text-[11px] text-slate-500">Host interactive video session</p>
        </button>

        <button
          onClick={() => onNavigate('documents')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition text-left cursor-pointer group space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
            <Upload className="w-4 h-4" />
          </div>
          <div className="font-extrabold text-xs text-slate-900">Upload Material</div>
          <p className="text-[11px] text-slate-500">Share slides, PDFs & notes</p>
        </button>

        <button
          onClick={() => onNavigate('exam_prep')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-xs transition text-left cursor-pointer group space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
            <FileText className="w-4 h-4" />
          </div>
          <div className="font-extrabold text-xs text-slate-900">Create Exam</div>
          <p className="text-[11px] text-slate-500">Build national mock questions</p>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-xs transition text-left cursor-pointer group space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="font-extrabold text-xs text-slate-900">View Analytics</div>
          <p className="text-[11px] text-slate-500">Class retention & mastery</p>
        </button>
      </div>

      {/* Upcoming Classes & Recent Students - Exact layout from Learnova screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Classes (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Upcoming Classes</span>
            </h3>
            <span className="text-xs text-slate-500">3 Scheduled Today</span>
          </div>

          <div className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{cls.subject}</span>
                    {cls.isNow && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 font-medium">
                    {cls.time} • <strong className="text-slate-700">{cls.enrolled} students enrolled</strong>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('live_classes')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                    cls.isNow
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Students (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Recent Students</span>
            </h3>
            <span className="text-xs text-slate-500">Exam Results</span>
          </div>

          <div className="space-y-3">
            {recentStudents.map((st, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{st.name}</div>
                    <div className="text-[11px] text-slate-500">Recent score: {st.score}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-emerald-700 text-xs">
                    {st.progress}%
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium">{st.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
