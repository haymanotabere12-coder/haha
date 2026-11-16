import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HomeLandingView } from './components/HomeLandingView';
import { ExamDiscoveryView } from './components/ExamDiscoveryView';
import { SubjectsView } from './components/SubjectsView';
import { DashboardView } from './components/DashboardView';
import { ExamPrepView } from './components/ExamPrepView';
import { LiveClassView } from './components/LiveClassView';
import { DocumentLibraryView } from './components/DocumentLibraryView';
import { VideoLearningView } from './components/VideoLearningView';
import { AiStudyLabView } from './components/AiStudyLabView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminPanelView } from './components/AdminPanelView';
import { AuthModal } from './components/AuthModal';

import { 
  ActiveTab, 
  ExamLevel, 
  ExamMode, 
  Question, 
  ExamResult, 
  Flashcard, 
  DocumentMaterial, 
  TopicMastery,
  SubjectInfo,
  AppUser,
  LiveClass,
  VideoLesson,
  ExamCardInfo,
  Language
} from './types';

import { 
  SUBJECTS_DATA, 
  INITIAL_QUESTIONS, 
  NATIONAL_EXAMS_DATA,
  LIVE_CLASSES_DATA, 
  DOCUMENTS_DATA, 
  VIDEO_LESSONS_DATA, 
  INITIAL_FLASHCARDS, 
  INITIAL_TOPIC_MASTERY 
} from './data/mockData';
import { 
  fetchServerRecordings, 
  deleteServerRecording,
  checkLiveBroadcastStatus,
  listenGlobalLiveBroadcasts,
  ActiveBroadcastInfo
} from './utils/liveStreamService';
import { LiveTeacherNotification } from './components/LiveTeacherNotification';
import { recordRegisteredUser } from './utils/userRegistry';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_current_user');
      const user = saved ? JSON.parse(saved) : null;
      if (user) {
        recordRegisteredUser(user);
      }
      return user;
    } catch {
      return null;
    }
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      return (localStorage.getItem('ethio_exam_language') as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_language', language);
    } catch (e) {
      console.warn('Could not save language to storage', e);
    }
  }, [language]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const [authTargetMessage, setAuthTargetMessage] = useState<string | undefined>(undefined);
  const [pendingTabDestination, setPendingTabDestination] = useState<ActiveTab | null>(null);
  const [pendingExamParams, setPendingExamParams] = useState<{ subjectId?: string; mode: ExamMode } | null>(null);
  const [pendingLiveClassId, setPendingLiveClassId] = useState<string | null>(null);

  // Active navigation tab (unauthenticated users are always restricted to 'home')
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (currentUser?.role === 'admin') return 'admin';
    if (currentUser) return 'dashboard';
    return 'home';
  });

  useEffect(() => {
    if (!currentUser && activeTab !== 'home') {
      setActiveTab('home');
    }
  }, [currentUser, activeTab]);

  const [selectedLevel, setSelectedLevel] = useState<ExamLevel>(() => {
    return currentUser?.gradeLevel || 'grade_12_natural';
  });
  const [examMode, setExamMode] = useState<ExamMode>('practice');
  const [activeSubjectId, setActiveSubjectId] = useState<string>('g12_physics');
  const [examLaunchKey, setExamLaunchKey] = useState<number>(0);

  // Dynamic state persisted across sessions
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_QUESTIONS;
  });
  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_questions', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_flashcards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FLASHCARDS;
  });
  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_flashcards', JSON.stringify(flashcards));
    } catch {}
  }, [flashcards]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_live_classes');
      if (saved) {
        const parsed: LiveClass[] = JSON.parse(saved);
        return parsed.map(c => ({
          ...c,
          teacherName: (!c.teacherName || c.teacherName.includes('Birhanu') || c.teacherName.includes('Aster') || c.teacherName.includes('Selamawit') || c.teacherName.includes('Ahmed Nur') || c.teacherName === 'መምህር አልተመደበም')
            ? ''
            : c.teacherName,
          teacherTitle: (!c.teacherTitle || c.teacherTitle.includes('Examiner') || c.teacherTitle.includes('Curriculum') || c.teacherTitle.includes('Associate') || c.teacherTitle.includes('Top Mentor') || c.teacherTitle.includes('መምህር ይጠበቃል'))
            ? 'Pending Assignment'
            : c.teacherTitle,
          teacherAvatar: '',
        }));
      }
      return LIVE_CLASSES_DATA;
    } catch {
      return LIVE_CLASSES_DATA;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_live_classes', JSON.stringify(liveClasses));
    } catch (e) {
      console.warn('Could not save live classes to storage', e);
    }
  }, [liveClasses]);

  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_video_lessons');
      if (saved) {
        const parsed: VideoLesson[] = JSON.parse(saved);
        const cleaned = parsed.filter((v) => !(v.isLiveRecording && v.videoUrl?.includes('BigBuckBunny')));
        return cleaned.length > 0 ? cleaned : VIDEO_LESSONS_DATA;
      }
      return VIDEO_LESSONS_DATA;
    } catch {
      return VIDEO_LESSONS_DATA;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_video_lessons', JSON.stringify(videoLessons));
    } catch (e) {
      console.warn('Could not save video lessons to storage', e);
    }
  }, [videoLessons]);

  // Sync server recordings only for authenticated users
  useEffect(() => {
    if (!currentUser) return;
    fetchServerRecordings().then((serverRecs) => {
      if (serverRecs && serverRecs.length > 0) {
        setVideoLessons((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = serverRecs.filter(
            (r) => !existingIds.has(r.id) && !existingIds.has(`vid-${r.id}`) && !existingIds.has(r.id.replace(/^vid-/, ''))
          );
          return newItems.length > 0 ? [...newItems, ...prev] : prev;
        });
      }
    });
  }, [currentUser]);

  // Persistent Document Library State
  const [documents, setDocuments] = useState<DocumentMaterial[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : DOCUMENTS_DATA;
      }
      return DOCUMENTS_DATA;
    } catch {
      return DOCUMENTS_DATA;
    }
  });

  useEffect(() => {
    try {
      const serializableDocs = documents.map((d) => {
        if (d.fileUrl && d.fileUrl.startsWith('data:') && d.fileUrl.length > 50000) {
          const { fileUrl: _omitted, ...rest } = d;
          return rest;
        }
        if (d.fileUrl && d.fileUrl.startsWith('blob:')) {
          const { fileUrl: _omitted, ...rest } = d;
          return rest;
        }
        return d;
      });
      localStorage.setItem('ethio_exam_documents', JSON.stringify(serializableDocs));
    } catch (e) {
      console.warn('Could not save documents to storage', e);
    }
  }, [documents]);

  const handleAddDocument = (newDoc: DocumentMaterial) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  // Real-Time Live Teacher Broadcast Notification State
  const [activeLiveNotification, setActiveLiveNotification] = useState<ActiveBroadcastInfo | null>(null);
  const [dismissedLiveNotificationRoomId, setDismissedLiveNotificationRoomId] = useState<string | null>(null);
  const liveClassesRef = useRef<LiveClass[]>(liveClasses);
  liveClassesRef.current = liveClasses;

  useEffect(() => {
    if (!currentUser) {
      setActiveLiveNotification(null);
      return;
    }
    const studentGradeLevel = currentUser.gradeLevel || selectedLevel;

    checkLiveBroadcastStatus().then((broadcasts) => {
      if (broadcasts && broadcasts.length > 0) {
        const live = broadcasts[0];
        const classId = live.roomId.replace(/^room-/, '');
        const matchingClass = liveClassesRef.current.find((c) => c.id === classId);
        const matchesLevel = !matchingClass || matchingClass.level === studentGradeLevel;

        if (currentUser?.role !== 'teacher' && live.teacherId !== currentUser?.id && matchesLevel) {
          setActiveLiveNotification(live);
        }
        setLiveClasses((prev) =>
          prev.map((c) =>
            c.id === classId
              ? { ...c, isLiveNow: true, currentViewers: Math.max(c.currentViewers || 0, live.userCount || 0) }
              : c
          )
        );
      }
    });

    const cleanup = listenGlobalLiveBroadcasts(
      (broadcast) => {
        const classId = broadcast.roomId.replace(/^room-/, '');
        const matchingClass = liveClassesRef.current.find((c) => c.id === classId);
        const matchesLevel = !matchingClass || matchingClass.level === studentGradeLevel;

        if (currentUser?.role !== 'teacher' && broadcast.teacherId !== currentUser?.id && matchesLevel) {
          setActiveLiveNotification(broadcast);
        }
        setLiveClasses((prev) =>
          prev.map((c) =>
            c.id === classId
              ? { ...c, isLiveNow: true, currentViewers: (c.currentViewers || 0) + 1 }
              : c
          )
        );
      },
      (stopInfo) => {
        setActiveLiveNotification(null);
        if (stopInfo?.roomId) {
          const cleanId = stopInfo.roomId.replace(/^room-/, '');
          setLiveClasses((prev) =>
            prev.map((c) => (c.id === cleanId ? { ...c, isLiveNow: false } : c))
          );
        }
      }
    );

    return cleanup;
  }, [currentUser?.id, currentUser?.role, currentUser?.gradeLevel, selectedLevel]);

  const [videoFilterTab, setVideoFilterTab] = useState<'All' | 'My Videos' | 'Saved'>('All');
  const [selectedVideoLessonId, setSelectedVideoLessonId] = useState<string | undefined>(undefined);

  const [announcement, setAnnouncement] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_announcement');
      if (saved !== null) return saved;
    } catch {}
    return '2016/2017 E.C. (2024/2025 G.C.) Ethiopian National Examination Portal is active. All past papers, AI tutor and live classes are verified.';
  });
  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_announcement', announcement);
    } catch {}
  }, [announcement]);

  const [examResults, setExamResults] = useState<ExamResult[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_results');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'res-init-1',
        title: 'Physics ESSLCE Mock 2016',
        level: 'grade_12_natural',
        subjectId: 'g12_physics',
        totalQuestions: 15,
        correctAnswersCount: 12,
        scorePercentage: 80,
        timeSpentSeconds: 780,
        passed: true,
        date: '2026-03-12',
        userAnswers: {},
        weakTopics: ['Electromagnetism & AC Circuits'],
        strongTopics: ['Kinematics & Projectiles', 'Rotational Dynamics'],
      }
    ];
  });
  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_results', JSON.stringify(examResults));
    } catch {}
  }, [examResults]);

  const [topicMasteries, setTopicMasteries] = useState<TopicMastery[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_topic_masteries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TOPIC_MASTERY;
  });
  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_topic_masteries', JSON.stringify(topicMasteries));
    } catch {}
  }, [topicMasteries]);

  const [preloadedDocForAi, setPreloadedDocForAi] = useState<DocumentMaterial | null>(null);
  const [preselectedDocId, setPreselectedDocId] = useState<string | null>(null);
  const [activeLiveClassId, setActiveLiveClassId] = useState<string>(() => {
    if (currentUser?.role === 'student' && currentUser.gradeLevel) {
      const match = LIVE_CLASSES_DATA.find((c) => c.level === currentUser.gradeLevel);
      if (match) return match.id;
    }
    return LIVE_CLASSES_DATA[0]?.id || 'live-1';
  });

  // AI Modal for Instant Explanation
  const [aiExplainQuestion, setAiExplainQuestion] = useState<{ question: Question; studentAnswer?: string } | null>(null);
  const [aiExplainLoading, setAiExplainLoading] = useState<boolean>(false);
  const [aiExplainResult, setAiExplainResult] = useState<any | null>(null);

  const effectiveUserLevel =
    currentUser?.role === 'student' && currentUser.gradeLevel
      ? currentUser.gradeLevel
      : selectedLevel;

  const isLiveActive = liveClasses.some((c) =>
    c.isLiveNow && (currentUser?.role === 'student' ? c.level === effectiveUserLevel : true)
  );

  // Keep student selectedLevel locked to their registered gradeLevel
  useEffect(() => {
    if (currentUser?.role === 'student' && currentUser.gradeLevel && selectedLevel !== currentUser.gradeLevel) {
      setSelectedLevel(currentUser.gradeLevel);
    }
  }, [currentUser?.role, currentUser?.gradeLevel, selectedLevel]);

  // Authentication Handlers
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    if (user.gradeLevel) {
      setSelectedLevel(user.gradeLevel);
      const levelMatch = liveClasses.find((c) => c.level === user.gradeLevel);
      if (levelMatch) {
        setActiveLiveClassId(levelMatch.id);
      }
    }

    // Resume pending intended action if any
    if (pendingExamParams) {
      const { subjectId, mode } = pendingExamParams;
      if (subjectId) setActiveSubjectId(subjectId);
      setExamMode(mode);
      setExamLaunchKey((k) => k + 1);
      setActiveTab('exam_prep');
      setPendingExamParams(null);
      setPendingTabDestination(null);
      setAuthTargetMessage(undefined);
      return;
    }

    if (pendingLiveClassId) {
      setActiveLiveClassId(pendingLiveClassId);
      setActiveTab('live_classes');
      setPendingLiveClassId(null);
      setPendingTabDestination(null);
      setAuthTargetMessage(undefined);
      return;
    }

    if (pendingTabDestination) {
      setActiveTab(pendingTabDestination);
      setPendingTabDestination(null);
      setAuthTargetMessage(undefined);
      return;
    }

    if (user.role === 'admin') {
      setActiveTab('admin');
    } else if (user.role === 'teacher') {
      setActiveTab('live_classes');
    } else {
      setActiveTab('dashboard');
    }
    setAuthTargetMessage(undefined);
  };

  const handleLogout = () => {
    localStorage.removeItem('ethio_exam_current_user');
    setCurrentUser(null);
    setPendingTabDestination(null);
    setPendingExamParams(null);
    setPendingLiveClassId(null);
    setActiveTab('home');
  };

  const handleOpenAuth = (
    role: 'student' | 'teacher' | 'admin' = 'student',
    mode: 'login' | 'register' = 'login',
    customMessage?: string
  ) => {
    setAuthModalInitialRole(role);
    setAuthModalInitialMode(mode);
    setAuthTargetMessage(customMessage);
    setIsAuthModalOpen(true);
  };

  // Tab Navigation: Strictly gated — unauthenticated visitors can only view the homepage
  const handleNavigateTab = (tab: ActiveTab) => {
    if (tab === 'home') {
      setActiveTab('home');
      return;
    }
    if (!currentUser) {
      setPendingTabDestination(tab);
      const msg = language === 'am'
        ? 'መረጃዎችን፣ ፈተናዎችን እና የጥናት ማዕከሉን ለመጠቀም እባክዎ መጀመሪያ ይግቡ ወይም ይመዝገቡ።'
        : 'Please sign in or create an account to access exams, study materials, and classrooms.';
      handleOpenAuth('student', 'login', msg);
      return;
    }
    if (tab === 'admin' && currentUser.role !== 'admin') {
      handleOpenAuth('admin', 'login', 'Admin authentication required.');
      return;
    }
    setActiveTab(tab);
  };

  // Exam launch: Require login before opening exam simulator
  const handleStartExam = (subjectId?: string, mode: ExamMode = 'practice') => {
    if (!currentUser) {
      setPendingExamParams({ subjectId, mode });
      const msg = language === 'am'
        ? 'ፈተናዎችን እና ልምምዶችን ለመጀመር እባክዎ መጀመሪያ ይግቡ።'
        : 'Please sign in or register to start practice drills and timed exams.';
      handleOpenAuth('student', 'login', msg);
      return;
    }
    if (subjectId) {
      setActiveSubjectId(subjectId);
    }
    setExamMode(mode);
    setExamLaunchKey((k) => k + 1);
    setActiveTab('exam_prep');
  };

  // Live Class Join: Require login before entering classroom
  const handleJoinLive = (classId: string) => {
    if (!currentUser) {
      setPendingLiveClassId(classId);
      const msg = language === 'am'
        ? 'የቀጥታ ትምህርቶችን ለመከታተል እባክዎ መጀመሪያ ይግቡ።'
        : 'Please sign in or register to attend live classrooms.';
      handleOpenAuth('student', 'login', msg);
      return;
    }
    setActiveLiveClassId(classId);
    setActiveTab('live_classes');
  };

  const handleSaveExamResult = (result: ExamResult) => {
    setExamResults((prev) => [result, ...prev]);

    // Update topic mastery
    setTopicMasteries((prev: TopicMastery[]) =>
      prev.map((tm: TopicMastery) => {
        if (result.weakTopics.includes(tm.topic)) {
          return {
            ...tm,
            questionsAttempted: tm.questionsAttempted + 2,
            accuracy: Math.max(20, tm.accuracy - 5),
            status: tm.accuracy - 5 < 60 ? 'critical_weak' : 'moderate',
          };
        }
        if (result.strongTopics.includes(tm.topic)) {
          return {
            ...tm,
            questionsAttempted: tm.questionsAttempted + 2,
            accuracy: Math.min(100, tm.accuracy + 5),
            status: tm.accuracy + 5 >= 75 ? 'mastered' : 'moderate',
          };
        }
        return tm;
      })
    );
  };

  // Gemini AI deep explanation modal
  const handleAskAiExplain = async (question: Question, studentAnswer?: string) => {
    setAiExplainQuestion({ question, studentAnswer });
    setAiExplainResult(null);
    setAiExplainLoading(true);

    try {
      const res = await fetch('/api/ai/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          subject: SUBJECTS_DATA.find((s: SubjectInfo) => s.id === question.subjectId)?.name || 'General Science',
          gradeLevel: selectedLevel.replace(/_/g, ' ').toUpperCase(),
          studentAnswer: studentAnswer ? `Student selected: ${studentAnswer}, Correct is: ${question.correctAnswer}` : undefined,
        }),
      });

      const data = await res.json();
      setAiExplainResult(data);
    } catch (err) {
      console.error(err);
      setAiExplainResult({
        explanation: question.explanation,
        amharicSummary: language === 'am' ? (question.amharicExplanation || 'የዚህ ጥያቄ መልስ ከተሰጡት አማራጮች ውስጥ ትክክለኛው ተመርጧል።') : undefined,
        keyTakeaway: `Review ${question.topic} chapter in standard curriculum.`,
      });
    } finally {
      setAiExplainLoading(false);
    }
  };

  const userStreak = currentUser
    ? (examResults.length > 0 ? Math.min(examResults.length, 7) : 1)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white font-sans">
      {/* Universal Top Header */}
      <Header
        selectedLevel={selectedLevel}
        onSelectLevel={(lvl) => setSelectedLevel(lvl)}
        activeTab={activeTab}
        onSelectTab={(tab) => handleNavigateTab(tab)}
        streakCount={userStreak}
        isLiveActive={isLiveActive || !!activeLiveNotification}
        onOpenAiLab={() => handleNavigateTab('ai_lab')}
        onGoToLive={() => {
          if (!currentUser) {
            const classId = activeLiveNotification ? activeLiveNotification.roomId.replace(/^room-/, '') : undefined;
            if (classId) setPendingLiveClassId(classId);
            else setPendingTabDestination('live_classes');
            const msg = language === 'am'
              ? 'የቀጥታ ስርጭት ትምህርቱን ለመከታተል እባክዎ መጀመሪያ ይመዝገቡ ወይም ይግቡ።'
              : 'Please register or sign in to attend live classes. Unregistered visitors can only view the homepage.';
            handleOpenAuth('student', 'register', msg);
            return;
          }
          if (activeLiveNotification) {
            const classId = activeLiveNotification.roomId.replace(/^room-/, '');
            setActiveLiveClassId(classId);
          }
          setActiveTab('live_classes');
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdmin={() => {
          if (!currentUser) {
            handleOpenAuth('admin', 'login');
            return;
          }
          setActiveTab('admin');
        }}
        onOpenAuth={handleOpenAuth}
        language={language}
        onSelectLanguage={setLanguage}
      />

      {/* Site-wide Announcement Notice Banner (Authenticated users only) */}
      {currentUser && announcement && (
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-bold text-[10px] tracking-wide uppercase shrink-0">
                Notice
              </span>
              <p className="truncate font-medium">{announcement}</p>
            </div>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950 shrink-0 cursor-pointer"
              >
                Edit Notice
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* 1. HOMEPAGE VIEW (Rendered for guests or when activeTab is 'home') */}
        {(!currentUser || activeTab === 'home') && (
          <HomeLandingView
            selectedLevel={selectedLevel}
            onSelectLevel={(lvl) => setSelectedLevel(lvl)}
            onNavigate={(tab) => handleNavigateTab(tab)}
            onStartExam={(subId, mode) => handleStartExam(subId, mode)}
            onOpenAuth={handleOpenAuth}
            isLoggedIn={!!currentUser}
            language={language}
          />
        )}

        {/* 2. EXAM DISCOVERY CATALOG (Authenticated only) */}
        {currentUser && activeTab === 'exams' && (
          <div className="py-6">
            <ExamDiscoveryView
              exams={NATIONAL_EXAMS_DATA}
              selectedLevel={selectedLevel}
              onSelectLevel={(lvl) => setSelectedLevel(lvl)}
              subjects={SUBJECTS_DATA}
              onStartExam={(subId, mode) => handleStartExam(subId, mode)}
            />
          </div>
        )}

        {/* 3. SUBJECTS CURRICULUM VIEW */}
        {currentUser && activeTab === 'subjects' && (
          <div className="py-6">
            <SubjectsView
              subjects={SUBJECTS_DATA}
              selectedLevel={selectedLevel}
              onSelectLevel={(lvl) => setSelectedLevel(lvl)}
              onStartExam={(subId, mode) => handleStartExam(subId, mode)}
              language={language}
            />
          </div>
        )}

        {/* 4. STUDENT DASHBOARD */}
        {currentUser && activeTab === 'dashboard' && (
          <div className="py-6">
            <DashboardView
              currentUser={currentUser}
              selectedLevel={selectedLevel}
              subjects={SUBJECTS_DATA}
              examResults={examResults}
              topicMasteries={topicMasteries}
              liveClasses={liveClasses}
              language={language}
              onNavigate={(tab) => setActiveTab(tab)}
              onStartPractice={(subId, mode) => handleStartExam(subId, mode)}
              onJoinLiveClass={handleJoinLive}
              onOpenAuth={() => handleOpenAuth('student')}
            />
          </div>
        )}

        {/* 5. EXAM PREPARATION & SIMULATOR */}
        {currentUser && activeTab === 'exam_prep' && (
          <div className="py-6">
            <ExamPrepView
              selectedLevel={selectedLevel}
              subjects={SUBJECTS_DATA}
              questions={questions}
              initialSubjectId={activeSubjectId}
              initialMode={examMode}
              autoLaunchKey={examLaunchKey}
              language={language}
              onAskAiExplain={handleAskAiExplain}
              onSaveResult={handleSaveExamResult}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          </div>
        )}

        {/* 6. LIVE CLASSROOMS */}
        {currentUser && activeTab === 'live_classes' && (
          <div className="w-full">
            <LiveClassView
              liveClasses={liveClasses}
              selectedLevel={selectedLevel}
              activeClassId={activeLiveClassId}
              currentUser={currentUser}
              language={language}
              onSelectLanguage={setLanguage}
              onSelectClass={(id) => setActiveLiveClassId(id)}
              onAddLiveClass={(newCls) => {
                if (currentUser?.role !== 'teacher' && currentUser?.role !== 'admin') return;
                setLiveClasses((prev) => [newCls, ...prev]);
                setActiveLiveClassId(newCls.id);
              }}
              onUpdateLiveClass={(updatedCls) => {
                setLiveClasses((prev) => prev.map((c) => (c.id === updatedCls.id ? updatedCls : c)));
              }}
              onOpenDocument={(docTitle) => {
                const clean = docTitle.toLowerCase().trim();
                const matched = documents.find((d: DocumentMaterial) => 
                  d.title.toLowerCase().includes(clean) || clean.includes(d.title.toLowerCase())
                );
                if (matched) {
                  setPreselectedDocId(matched.id);
                  if (matched.level) {
                    setSelectedLevel(matched.level);
                  }
                }
                setActiveTab('documents');
              }}
              onSaveRecordedVideoLesson={(newVid) => {
                setVideoLessons((prev) => [newVid, ...prev]);
              }}
              onDeleteVideoLesson={(id) => {
                deleteServerRecording(id);
                deleteServerRecording(id.replace(/^vid-/, ''));
                setVideoLessons((prev) => prev.filter((v) => v.id !== id && v.id !== `vid-${id}` && v.id !== id.replace(/^vid-/, '')));
              }}
              onNavigateToVideos={(filterTab = 'My Videos', videoId) => {
                setVideoFilterTab(filterTab);
                if (videoId) {
                  setSelectedVideoLessonId(videoId);
                }
                setActiveTab('videos');
              }}
              onToggleRole={() => {
                if (currentUser) {
                  const updated: AppUser = {
                    ...currentUser,
                    role: currentUser.role === 'teacher' ? 'student' : 'teacher',
                  };
                  localStorage.setItem('ethio_exam_current_user', JSON.stringify(updated));
                  setCurrentUser(updated);
                }
              }}
            />
          </div>
        )}

        {/* 7. DOCUMENT LIBRARY */}
        {currentUser && activeTab === 'documents' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <DocumentLibraryView
              documents={documents}
              selectedLevel={selectedLevel}
              subjects={SUBJECTS_DATA}
              currentUser={currentUser}
              language={language}
              selectedDocId={preselectedDocId}
              onOpenAiWithDocument={(doc) => {
                setPreloadedDocForAi(doc);
                setActiveTab('ai_lab');
              }}
              onUploadDocument={handleAddDocument}
              onSelectLevel={currentUser.role === 'student' ? undefined : setSelectedLevel}
              onNavigate={(tab) => handleNavigateTab(tab)}
              onOpenAuth={handleOpenAuth}
            />
          </div>
        )}

        {/* 8. VIDEO LEARNING LIBRARY */}
        {currentUser && activeTab === 'videos' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <VideoLearningView
              videoLessons={videoLessons}
              selectedLevel={selectedLevel}
              subjects={SUBJECTS_DATA}
              currentUser={currentUser}
              language={language}
              initialFilterTab={videoFilterTab}
              initialSelectedVideoId={selectedVideoLessonId}
              onAddVideoLesson={(newVid) => setVideoLessons((prev) => [newVid, ...prev])}
              onDeleteVideoLesson={(id) => {
                deleteServerRecording(id);
                deleteServerRecording(id.replace(/^vid-/, ''));
                setVideoLessons((prev) => prev.filter((v) => v.id !== id && v.id !== `vid-${id}` && v.id !== id.replace(/^vid-/, '')));
              }}
              onGenerateQuizFromVideo={(video) => {
                setPreloadedDocForAi({
                  id: `vid-doc-${video.id}`,
                  title: `${video.title} - Video Lecture Notes`,
                  subject: video.subject,
                  subjectId: video.subjectId,
                  chapter: video.chapter,
                  level: video.level,
                  category: 'Teacher Summary',
                  fileType: 'PDF',
                  pages: 2,
                  fileSize: 'Video Notes',
                  uploadedBy: video.instructor,
                  uploadDate: '2026-03-01',
                  downloadsCount: 140,
                  fullExcerpt: `${video.title}\n${video.summaryNotes || ''}\nKey Takeaways:\n${(video.keyTakeaways || []).join('\n')}`,
                });
                setActiveTab('ai_lab');
              }}
            />
          </div>
        )}

        {/* 9. AI STUDY LAB */}
        {currentUser && activeTab === 'ai_lab' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AiStudyLabView
              selectedLevel={selectedLevel}
              subjects={SUBJECTS_DATA}
              preloadedDoc={preloadedDocForAi}
              language={language}
              onClearPreloadedDoc={() => setPreloadedDocForAi(null)}
              onAddGeneratedQuestionsToBank={(newQs) => {
                setQuestions((prev) => [...newQs, ...prev]);
              }}
              onAddGeneratedFlashcards={(newCards) => {
                setFlashcards((prev) => [...newCards, ...prev]);
              }}
            />
          </div>
        )}

        {/* 10. ANALYTICS VIEW */}
        {currentUser && activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnalyticsView
              selectedLevel={selectedLevel}
              examResults={examResults}
              topicMasteries={topicMasteries}
              subjects={SUBJECTS_DATA}
              onPracticeWeakTopic={(topic, subjectName) => {
                const matchedSubject = SUBJECTS_DATA.find(s => s.name === subjectName);
                if (matchedSubject) {
                  setActiveSubjectId(matchedSubject.id);
                }
                setExamMode('practice');
                setExamLaunchKey((k) => k + 1);
                setActiveTab('exam_prep');
              }}
            />
          </div>
        )}

        {/* 11. ADMIN PANEL VIEW */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdminPanelView
              currentUser={currentUser}
              questions={questions}
              subjects={SUBJECTS_DATA}
              liveClasses={liveClasses}
              videoLessons={videoLessons}
              language={language}
              onAddQuestion={(newQ) => setQuestions((prev) => [newQ, ...prev])}
              onDeleteQuestion={(qId) => setQuestions((prev) => prev.filter((q) => q.id !== qId))}
              onAddLiveClass={(newClass) => setLiveClasses((prev) => [newClass, ...prev])}
              onToggleLiveStatus={(classId) =>
                setLiveClasses((prev) =>
                  prev.map((c) => (c.id === classId ? { ...c, isLiveNow: !c.isLiveNow } : c))
                )
              }
              onAddVideoLesson={(newVid) => setVideoLessons((prev) => [newVid, ...prev])}
              onDeleteVideoLesson={(id) => setVideoLessons((prev) => prev.filter((v) => v.id !== id))}
              onSwitchToStudentView={() => setActiveTab('dashboard')}
              announcement={announcement}
              onUpdateAnnouncement={(text) => setAnnouncement(text)}
            />
          </div>
        )}
      </main>

      {/* Universal Modal: Authentication */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthTargetMessage(undefined);
        }}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authModalInitialRole}
        initialMode={authModalInitialMode}
        targetActionMessage={authTargetMessage}
        language={language}
      />

      {/* Universal Modal: Gemini AI Deep Question Explanation */}
      {aiExplainQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  AI Deep Step-by-Step Explanation
                </span>
              </div>
              <button
                onClick={() => setAiExplainQuestion(null)}
                className="text-slate-500 hover:text-slate-800 text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold transition"
              >
                Close
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium">
              {aiExplainQuestion.question.question}
            </div>

            {aiExplainLoading ? (
              <div className="py-8 text-center space-y-2 text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Generating step-by-step curriculum breakdown...</p>
              </div>
            ) : aiExplainResult ? (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-2">
                  <div className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider">
                    Detailed Solution
                  </div>
                  <p className="whitespace-pre-line">{aiExplainResult.explanation}</p>
                </div>

                {Array.isArray(aiExplainResult.stepByStep) && aiExplainResult.stepByStep.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                      Step-by-Step Calculation / Method:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700">
                      {aiExplainResult.stepByStep.map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {aiExplainResult.commonPitfalls && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                    ⚠️ <strong>Common Pitfall:</strong> {aiExplainResult.commonPitfalls}
                  </div>
                )}

                {aiExplainResult.amharicSummary && language === 'am' && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-emerald-900 font-['Noto_Sans_Ethiopic']">
                      የአማርኛ ማብራሪያ
                    </div>
                    <p className="text-slate-700 font-['Noto_Sans_Ethiopic'] leading-relaxed">
                      {aiExplainResult.amharicSummary}
                    </p>
                  </div>
                )}

                {aiExplainResult.keyTakeaway && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
                    💡 Exam Tip: {aiExplainResult.keyTakeaway}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Real-time Floating Notification Popup when Teacher is Live (Authenticated only) */}
      {currentUser &&
       activeLiveNotification && 
       activeTab !== 'live_classes' && 
       dismissedLiveNotificationRoomId !== activeLiveNotification.roomId && (
        <LiveTeacherNotification
          broadcast={activeLiveNotification}
          language={language}
          onJoin={() => {
            const classId = activeLiveNotification.roomId.replace(/^room-/, '');
            setActiveLiveClassId(classId);
            setActiveTab('live_classes');
            setActiveLiveNotification(null);
          }}
          onDismiss={() => {
            setDismissedLiveNotificationRoomId(activeLiveNotification.roomId);
          }}
        />
      )}

      {/* Global Compact Footer for inner pages (Homepage has its own clean footer) */}
      {currentUser && activeTab !== 'home' && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-medium text-slate-700">
              &copy; 2026 EthioExam Prep — National Examination & Learning Platform
            </span>
            <span className="text-slate-500 font-medium">
              MoE Curriculum • Grade 8 Ministry • Grade 12 ESSLCE • University Exit Exam
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}
