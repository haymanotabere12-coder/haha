import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Trash2, 
  Users, 
  HelpCircle, 
  Radio, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Layers,
  Search,
  Bell,
  Activity,
  Flame,
  ArrowRight,
  Film,
  UploadCloud,
  Youtube,
  FileVideo,
  Play,
  Check,
  AlertCircle
} from 'lucide-react';
import { Question, ExamLevel, SubjectInfo, LiveClass, AppUser, VideoLesson } from '../types';
import { extractYouTubeId } from './VideoLearningView';

interface AdminPanelViewProps {
  currentUser: AppUser;
  questions: Question[];
  subjects: SubjectInfo[];
  liveClasses: LiveClass[];
  videoLessons?: VideoLesson[];
  onAddQuestion: (newQ: Question) => void;
  onDeleteQuestion: (qId: string) => void;
  onAddLiveClass?: (newClass: LiveClass) => void;
  onToggleLiveStatus?: (classId: string) => void;
  onAddVideoLesson?: (newVideo: VideoLesson) => void;
  onDeleteVideoLesson?: (videoId: string) => void;
  onSwitchToStudentView: () => void;
  announcement?: string;
  onUpdateAnnouncement?: (text: string) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUser,
  questions,
  subjects,
  liveClasses,
  videoLessons = [],
  onAddQuestion,
  onDeleteQuestion,
  onAddLiveClass,
  onToggleLiveStatus,
  onAddVideoLesson,
  onDeleteVideoLesson,
  onSwitchToStudentView,
  announcement,
  onUpdateAnnouncement,
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'questions' | 'videos' | 'live' | 'students' | 'announcements'>('questions');

  // Video Lessons Manager State
  const [vidTitle, setVidTitle] = useState('');
  const [vidSubject, setVidSubject] = useState(subjects[0]?.id || 'phy12');
  const [vidLevel, setVidLevel] = useState<ExamLevel>('grade_12_natural');
  const [vidInstructor, setVidInstructor] = useState(currentUser.name || 'Platform Administrator');
  const [vidChapter, setVidChapter] = useState('');
  const [vidDuration, setVidDuration] = useState('15:00');
  const [vidUploadType, setVidUploadType] = useState<'file' | 'youtube'>('file');
  const [vidFile, setVidFile] = useState<File | null>(null);
  const [vidFileUrl, setVidFileUrl] = useState<string | null>(null);
  const [vidYoutubeInput, setVidYoutubeInput] = useState('');
  const [vidSuccessNotice, setVidSuccessNotice] = useState(false);
  const [vidSearchFilter, setVidSearchFilter] = useState('');
  const vidFileInputRef = useRef<HTMLInputElement | null>(null);

  // New Question Form state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [questionSubject, setQuestionSubject] = useState(subjects[0]?.id || 'phy12');
  const [questionLevel, setQuestionLevel] = useState<ExamLevel>('grade_12_natural');
  const [questionTopic, setQuestionTopic] = useState('');
  const [questionExplanation, setQuestionExplanation] = useState('');
  const [questionAmharicExplanation, setQuestionAmharicExplanation] = useState('');
  const [questionDifficulty, setQuestionDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionYear, setQuestionYear] = useState('2016 E.C. (2024 G.C.)');
  const [isPastExam, setIsPastExam] = useState(true);
  const [questionSuccessNotice, setQuestionSuccessNotice] = useState(false);

  // Filter state for question bank table
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('all');

  // Announcement state
  const [announcementInput, setAnnouncementInput] = useState(announcement || '2016 E.C. ESSLCE National Examination registration is active. Practice with verified past papers.');
  const [announcementSaved, setAnnouncementSaved] = useState(false);

  // New Live Class form
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('Ustaz Jemal / Dr. Kebede');
  const [newClassSubject, setNewClassSubject] = useState(subjects[0]?.name || 'Physics');
  const [newClassTopic, setNewClassTopic] = useState('');
  const [liveSuccessNotice, setLiveSuccessNotice] = useState(false);

  // Handlers
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Please fill in question text and all four options.');
      return;
    }

    const created: Question = {
      id: `admin-q-${Date.now()}`,
      question: newQuestionText.trim(),
      options: [
        `A) ${optA.trim()}`,
        `B) ${optB.trim()}`,
        `C) ${optC.trim()}`,
        `D) ${optD.trim()}`,
      ],
      correctAnswer: correctOption,
      explanation: questionExplanation.trim() || 'Verified by Platform Administrator.',
      amharicExplanation: questionAmharicExplanation.trim() || undefined,
      subjectId: questionSubject,
      level: questionLevel,
      topic: questionTopic.trim() || 'General Curriculum',
      difficulty: questionDifficulty,
      year: questionYear,
      isPastExam: isPastExam,
    };

    onAddQuestion(created);
    setQuestionSuccessNotice(true);
    setTimeout(() => setQuestionSuccessNotice(false), 4000);

    // Reset fields
    setNewQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setQuestionTopic('');
    setQuestionExplanation('');
    setQuestionAmharicExplanation('');
  };

  const handleVidFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (vidFileUrl) URL.revokeObjectURL(vidFileUrl);
    const url = URL.createObjectURL(file);
    setVidFile(file);
    setVidFileUrl(url);
    if (!vidTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setVidTitle(cleanName);
    }
  };

  const handleCreateVideoLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle.trim()) {
      alert('Please enter a video lesson title.');
      return;
    }

    const subObj = subjects.find(s => s.id === vidSubject) || subjects[0];
    let finalYoutubeId: string | undefined = undefined;
    let finalVideoUrl: string | undefined = undefined;

    if (vidUploadType === 'file') {
      if (!vidFileUrl) {
        alert('Please choose a video file from your device.');
        return;
      }
      finalVideoUrl = vidFileUrl;
    } else {
      const extracted = extractYouTubeId(vidYoutubeInput);
      if (!extracted) {
        alert('Please enter a valid YouTube video link or 11-digit video ID.');
        return;
      }
      finalYoutubeId = extracted;
    }

    if (onAddVideoLesson) {
      const newVid: VideoLesson = {
        id: `vid-admin-${Date.now()}`,
        title: vidTitle.trim(),
        subject: subObj?.name || 'General Studies',
        subjectId: subObj?.id || 'gen',
        level: vidLevel,
        chapter: vidChapter.trim() || 'Curriculum Topic Review',
        instructor: vidInstructor.trim() || currentUser.name,
        duration: vidDuration || '15:00',
        views: 1,
        youtubeId: finalYoutubeId,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalYoutubeId ? `https://img.youtube.com/vi/${finalYoutubeId}/hqdefault.jpg` : undefined,
        thumbnailGradient: vidUploadType === 'youtube'
          ? 'from-red-950 via-rose-900 to-slate-900'
          : 'from-purple-950 via-indigo-900 to-slate-900',
        timestamps: [
          { time: '00:00', label: 'Lesson Introduction & Key Concepts' },
          { time: '05:00', label: 'Detailed Conceptual Explanations' },
          { time: '10:00', label: 'Sample Ministry Exam Questions' },
        ],
        keyTakeaways: [
          `Official curriculum lesson on ${vidTitle.trim()}`,
          'Key exam tips and formulas for national examinations',
          'Step-by-step problem walkthroughs and answers'
        ],
        summaryNotes: `Official curriculum video lecture uploaded by ${vidInstructor.trim()}.`,
      };

      onAddVideoLesson(newVid);
      setVidSuccessNotice(true);
      setTimeout(() => setVidSuccessNotice(false), 4000);
      setVidTitle('');
      setVidChapter('');
      setVidFile(null);
      setVidFileUrl(null);
      setVidYoutubeInput('');
    }
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateAnnouncement) {
      onUpdateAnnouncement(announcementInput);
      setAnnouncementSaved(true);
      setTimeout(() => setAnnouncementSaved(false), 3000);
    }
  };

  const handleCreateLiveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassTitle.trim()) return;

    if (onAddLiveClass) {
      const createdClass: LiveClass = {
        id: `live-admin-${Date.now()}`,
        title: newClassTitle.trim(),
        subject: newClassSubject,
        subjectId: subjects.find(s => s.name === newClassSubject)?.id || 'gen',
        level: questionLevel,
        teacherName: newClassTeacher,
        teacherTitle: 'National Exam Coach',
        teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        isLiveNow: true,
        scheduledTime: 'Now Streaming',
        durationMinutes: 60,
        currentViewers: 84,
        currentTopic: newClassTopic || 'Revision and Question Solving',
        slides: [
          {
            title: newClassTitle,
            bulletPoints: [
              'Key exam tips & common Ministry traps',
              'Step-by-step problem walkthroughs',
              'Real-time student Q&A'
            ]
          }
        ],
        hasRecording: false,
        materialsAttached: ['Summary Cheatsheet']
      };
      onAddLiveClass(createdClass);
      setLiveSuccessNotice(true);
      setTimeout(() => setLiveSuccessNotice(false), 4000);
      setNewClassTitle('');
      setNewClassTopic('');
    }
  };

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'all' || q.subjectId === selectedSubjectFilter;
    const matchesLevel = selectedLevelFilter === 'all' || q.level === selectedLevelFilter;
    return matchesSearch && matchesSubject && matchesLevel;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner: Admin Authentication Status */}
      <div className="rounded-2xl bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 shadow-lg border border-purple-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/50 border border-purple-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Admin Control Center
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-mono font-bold border border-purple-400/30">
                Logged in as @{currentUser.username}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              Authorized Administrator: <strong>{currentUser.name}</strong> • Ethiopian National Examination Portal
            </p>
          </div>
        </div>

        <button
          onClick={onSwitchToStudentView}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-purple-950 font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
        >
          <span>Student Preview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Admin Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Questions in Bank</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{questions.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Ministry past papers & AI drills</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Enrolled Students</div>
          <div className="text-2xl font-black text-slate-900 mt-1">1,480+</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Across 11 Regions & City Admins</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Live Revision Classes</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{liveClasses.length}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">
            {liveClasses.filter(c => c.isLiveNow).length} Currently Streaming Live
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Platform Security</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">Verified</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Credentials: hayma / hayab2121</div>
        </div>
      </div>

      {/* Sub Tabs for Admin Functions */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminSubTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeAdminSubTab === 'questions'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Question Bank ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('videos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeAdminSubTab === 'videos'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Video Lessons ({videoLessons.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('live')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeAdminSubTab === 'live'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Live Class Manager ({liveClasses.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeAdminSubTab === 'announcements'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Broadcast Announcement</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeAdminSubTab === 'students'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Roster</span>
        </button>
      </div>

      {/* 1. QUESTION BANK MANAGER */}
      {activeAdminSubTab === 'questions' && (
        <div className="space-y-6">
          {/* Add Question Form Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Add New National Exam Question
                </h3>
              </div>
              <span className="text-xs text-slate-500">Live additions immediately available to all students</span>
            </div>

            {questionSuccessNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Question added successfully to the live Exam Bank!</span>
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={questionSubject}
                    onChange={(e) => setQuestionSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Level</label>
                  <select
                    value={questionLevel}
                    onChange={(e) => setQuestionLevel(e.target.value as ExamLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="grade_8">Grade 8 Regional Ministry</option>
                    <option value="grade_12_natural">Grade 12 Natural Science (ESSLCE)</option>
                    <option value="grade_12_social">Grade 12 Social Science (ESSLCE)</option>
                    <option value="university_exit">University Exit Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty & Year</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={questionDifficulty}
                      onChange={(e) => setQuestionDifficulty(e.target.value as any)}
                      className="px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <input
                      type="text"
                      value={questionYear}
                      onChange={(e) => setQuestionYear(e.target.value)}
                      placeholder="e.g. 2016 E.C."
                      className="px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Enter the full exam question here..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    placeholder="Choice A text"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    placeholder="Choice B text"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    placeholder="Choice C text"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    placeholder="Choice D text"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Correct Answer & Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correct Option *
                  </label>
                  <div className="flex gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setCorrectOption(letter)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${
                          correctOption === letter
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Option {letter}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Chapter / Sub-Topic
                  </label>
                  <input
                    type="text"
                    value={questionTopic}
                    onChange={(e) => setQuestionTopic(e.target.value)}
                    placeholder="e.g. Newton's 2nd Law / Cell Division / Integration"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Explanations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pedagogical Explanation (English)
                  </label>
                  <textarea
                    rows={2}
                    value={questionExplanation}
                    onChange={(e) => setQuestionExplanation(e.target.value)}
                    placeholder="Detailed explanation of why this choice is correct..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amharic Explanation (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={questionAmharicExplanation}
                    onChange={(e) => setQuestionAmharicExplanation(e.target.value)}
                    placeholder="Optional Amharic notes for students..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-['Noto_Sans_Ethiopic']"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="btn-admin-add-question"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Save Question to Bank</span>
                </button>
              </div>
            </form>
          </div>

          {/* Manage Existing Question Bank Table */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Question Bank Inventory ({filteredQuestions.length})
                </h4>
                <p className="text-xs text-slate-500">Filter, inspect and manage exam questions</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search question..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Levels</option>
                  <option value="grade_8">Grade 8</option>
                  <option value="grade_12_natural">Grade 12 Natural</option>
                  <option value="grade_12_social">Grade 12 Social</option>
                  <option value="university_exit">Exit Exam</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredQuestions.map((q, idx) => (
                <div key={q.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-1 text-xs flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {q.topic}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        Correct: Option {q.correctAnswer}
                      </span>
                      {q.year && (
                        <span className="text-[10px] text-slate-400">
                          {q.year}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {q.options?.join(' • ')}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteQuestion(q.id)}
                    title="Delete Question"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. VIDEO LESSONS MANAGER */}
      {activeAdminSubTab === 'videos' && (
        <div className="space-y-6">
          {/* Video Upload Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Upload & Publish Video Lesson
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Admin Video Publisher
              </span>
            </div>

            {vidSuccessNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Video lesson published successfully! Students can now watch it in the Video Learning Center.</span>
              </div>
            )}

            {/* Source Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200 max-w-md">
              <button
                type="button"
                onClick={() => setVidUploadType('file')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  vidUploadType === 'file'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload from Device (ከመሳሪያችን)</span>
              </button>

              <button
                type="button"
                onClick={() => setVidUploadType('youtube')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  vidUploadType === 'youtube'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>Import YouTube (ከዩቲዩብ)</span>
              </button>
            </div>

            <form onSubmit={handleCreateVideoLesson} className="space-y-4">
              {/* Option 1: File from Device */}
              {vidUploadType === 'file' && (
                <div className="space-y-2">
                  <input
                    ref={vidFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVidFileChange}
                    className="hidden"
                    id="admin-vid-file-input"
                  />

                  {!vidFileUrl ? (
                    <div
                      onClick={() => vidFileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/70 rounded-2xl p-6 text-center space-y-2 transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        Click to select video file from your computer or phone
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Supports MP4, WebM, MOV files. Plays directly with fast HTML5 player.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileVideo className="w-4 h-4 text-purple-700" />
                          <span className="text-xs font-bold text-slate-900">
                            {vidFile?.name} ({(vidFile ? vidFile.size / (1024 * 1024) : 0).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVidFile(null);
                            setVidFileUrl(null);
                          }}
                          className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                        >
                          Change File
                        </button>
                      </div>
                      <div className="aspect-video max-w-sm rounded-xl overflow-hidden bg-black shadow-inner">
                        <video src={vidFileUrl} controls className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option 2: YouTube Import */}
              {vidUploadType === 'youtube' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    YouTube Video URL or Video ID *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={vidYoutubeInput}
                      onChange={(e) => setVidYoutubeInput(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/watch?v=kKKM8Y-u7ds or kKKM8Y-u7ds"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-2.5" />
                  </div>

                  {extractYouTubeId(vidYoutubeInput) && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(vidYoutubeInput)}/hqdefault.jpg`}
                        alt="YouTube Preview"
                        className="w-20 h-14 rounded-lg object-cover bg-black shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-red-950">Valid YouTube ID:</div>
                        <code className="font-mono text-red-800 bg-red-100 px-1 py-0.5 rounded">
                          {extractYouTubeId(vidYoutubeInput)}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Video Title *</label>
                  <input
                    type="text"
                    required
                    value={vidTitle}
                    onChange={(e) => setVidTitle(e.target.value)}
                    placeholder="e.g. Grade 12 Biology: Cell Structure and Organelles"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={vidSubject}
                    onChange={(e) => setVidSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grade Level</label>
                  <select
                    value={vidLevel}
                    onChange={(e) => setVidLevel(e.target.value as ExamLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="grade_12_natural">Grade 12 Natural</option>
                    <option value="grade_12_social">Grade 12 Social</option>
                    <option value="university_entrance">Freshman / Entrance</option>
                    <option value="university_exit">University Exit Exam</option>
                    <option value="grade_8_ministry">Grade 8 Regional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    value={vidInstructor}
                    onChange={(e) => setVidInstructor(e.target.value)}
                    placeholder="Instructor / Teacher"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={vidDuration}
                    onChange={(e) => setVidDuration(e.target.value)}
                    placeholder="e.g. 18:30"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chapter / Description</label>
                  <input
                    type="text"
                    value={vidChapter}
                    onChange={(e) => setVidChapter(e.target.value)}
                    placeholder="e.g. Unit 2: Cellular Metabolism & Glycolysis"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Video Lesson</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Video Lessons Inventory */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Active Video Lessons ({videoLessons.length})
                </h4>
                <p className="text-xs text-slate-500">Manage, preview, or remove published video lessons</p>
              </div>

              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={vidSearchFilter}
                  onChange={(e) => setVidSearchFilter(e.target.value)}
                  placeholder="Filter lessons..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {videoLessons
                .filter((v) => 
                  v.title.toLowerCase().includes(vidSearchFilter.toLowerCase()) ||
                  v.subject.toLowerCase().includes(vidSearchFilter.toLowerCase()) ||
                  v.instructor.toLowerCase().includes(vidSearchFilter.toLowerCase())
                )
                .map((video) => (
                  <div
                    key={video.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {video.youtubeId ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1">
                            <Youtube className="w-3 h-3" />
                            <span>YouTube</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center gap-1">
                            <FileVideo className="w-3 h-3" />
                            <span>Direct Video</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {video.duration}
                        </span>
                      </div>

                      {onDeleteVideoLesson && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete lesson "${video.title}"?`)) {
                              onDeleteVideoLesson(video.id);
                            }
                          }}
                          className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Lesson"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-2">
                        {video.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {video.subject} • {video.instructor}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[160px]">
                        {video.chapter}
                      </span>
                      <span className="font-semibold text-purple-700">
                        {video.views.toLocaleString()} views
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. LIVE CLASS MANAGER */}
      {activeAdminSubTab === 'live' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Broadcast or Schedule Live Class
                </h3>
              </div>
            </div>

            {liveSuccessNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Class launched successfully! Students will see the live indicator instantly.</span>
              </div>
            )}

            <form onSubmit={handleCreateLiveClass} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class Title *</label>
                  <input
                    type="text"
                    required
                    value={newClassTitle}
                    onChange={(e) => setNewClassTitle(e.target.value)}
                    placeholder="e.g. Grade 12 ESSLCE Calculus Masterclass"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teacher / Instructor Name</label>
                  <input
                    type="text"
                    value={newClassTeacher}
                    onChange={(e) => setNewClassTeacher(e.target.value)}
                    placeholder="Instructor name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic Description</label>
                <input
                  type="text"
                  value={newClassTopic}
                  onChange={(e) => setNewClassTopic(e.target.value)}
                  placeholder="e.g. Solving 2015-2016 National Exam Hardest Problems live with interactive polls"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Start Live Session</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Live Classes List */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Active & Scheduled Sessions ({liveClasses.length})</h4>
            <div className="divide-y divide-slate-100">
              {liveClasses.map((cls) => (
                <div key={cls.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cls.isLiveNow ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {cls.isLiveNow ? '● LIVE BROADCAST' : 'SCHEDULED'}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{cls.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Instructor: {cls.teacherName} • Subject: {cls.subject} • Viewers: {cls.currentViewers}
                    </p>
                  </div>

                  {onToggleLiveStatus && (
                    <button
                      onClick={() => onToggleLiveStatus(cls.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        cls.isLiveNow
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {cls.isLiveNow ? 'Stop Stream' : 'Go Live'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. BROADCAST ANNOUNCEMENTS */}
      {activeAdminSubTab === 'announcements' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bell className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              Site-Wide Announcement Banner
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            This notice displays at the top of every student’s dashboard (Ministry exam registration updates, countdown alerts, or schedule notices).
          </p>

          {announcementSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Announcement updated! All student dashboards will display this notice.</span>
            </div>
          )}

          <form onSubmit={handleSaveAnnouncement} className="space-y-3">
            <textarea
              rows={3}
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              placeholder="e.g. 2016 E.C. Ministry Exam Schedule has been published..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Save & Broadcast Notice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. STUDENT ROSTER */}
      {activeAdminSubTab === 'students' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Enrolled Students & Activity
              </h3>
              <p className="text-xs text-slate-500">Live active sessions and practice metrics</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Grade Level</th>
                  <th className="p-3">Location / School</th>
                  <th className="p-3">Study Streak</th>
                  <th className="p-3">Average Mock Score</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Abebe Kebede', level: 'Grade 12 Natural', city: 'Addis Ababa (Bole)', streak: '14 days', score: '82%', status: 'Active Practicing' },
                  { name: 'Selamawit Desta', level: 'Grade 8 Regional', city: 'Hawassa (Tabor)', streak: '9 days', score: '78%', status: 'Active Practicing' },
                  { name: 'Kidus Tadesse', level: 'University Exit', city: 'AAU Technology', streak: '21 days', score: '88%', status: 'Reviewing Flashcards' },
                  { name: 'Marta Hailu', level: 'Grade 12 Social', city: 'Bahir Dar', streak: '7 days', score: '74%', status: 'Solving Past Papers' },
                  { name: 'Yohannes Girma', level: 'Grade 12 Natural', city: 'Adama', streak: '11 days', score: '85%', status: 'In Live Class' },
                ].map((std, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-bold text-slate-900">{std.name}</td>
                    <td className="p-3 font-semibold text-emerald-800">{std.level}</td>
                    <td className="p-3 text-slate-500">{std.city}</td>
                    <td className="p-3 font-mono font-bold text-amber-700">🔥 {std.streak}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{std.score}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[10px]">
                        {std.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
