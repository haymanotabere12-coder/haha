import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ExamPrepView } from './components/ExamPrepView';
import { LiveClassView } from './components/LiveClassView';
import { DocumentLibraryView } from './components/DocumentLibraryView';
import { VideoLearningView } from './components/VideoLearningView';
import { AiStudyLabView } from './components/AiStudyLabView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthGateView } from './components/AuthGateView';
import { AdminPanelView } from './components/AdminPanelView';

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
  VideoLesson
} from './types';

import { 
  SUBJECTS_DATA, 
  INITIAL_QUESTIONS, 
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

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return currentUser?.role === 'admin' ? 'admin' : 'dashboard';
  });
  const [selectedLevel, setSelectedLevel] = useState<ExamLevel>(() => {
    return currentUser?.gradeLevel || 'grade_12_natural';
  });
  const [examMode, setExamMode] = useState<ExamMode>('practice');
  const [activeSubjectId, setActiveSubjectId] = useState<string>('phy12');

  // Dynamic state that persists within session
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(INITIAL_FLASHCARDS);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_live_classes');
      return saved ? JSON.parse(saved) : LIVE_CLASSES_DATA;
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
        // Purge any corrupted live recording entries from previous sessions that pointed to BigBuckBunny
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

  // Sync server-archived recorded classes so all users see past sessions across devices
  useEffect(() => {
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
  }, []);

  // Real-Time Live Teacher Broadcast Notification State for Students
  const [activeLiveNotification, setActiveLiveNotification] = useState<ActiveBroadcastInfo | null>(null);
  const [dismissedLiveNotificationRoomId, setDismissedLiveNotificationRoomId] = useState<string | null>(null);

  // When student enters or logs into the app, check if a teacher is live, and listen in real time!
  useEffect(() => {
    // 1. Inquire initial status on mount / login
    checkLiveBroadcastStatus().then((broadcasts) => {
      if (broadcasts && broadcasts.length > 0) {
        const live = broadcasts[0];
        if (currentUser?.role !== 'teacher' && live.teacherId !== currentUser?.id) {
          setActiveLiveNotification(live);
          setLiveClasses((prev) =>
            prev.map((c) =>
              c.id === live.roomId.replace(/^room-/, '')
                ? { ...c, isLiveNow: true, currentViewers: Math.max(c.currentViewers || 1, live.userCount || 1) }
                : c
            )
          );
        }
      }
    });

    // 2. Real-time WebSocket event listener
    const cleanup = listenGlobalLiveBroadcasts(
      (broadcast) => {
        if (currentUser?.role !== 'teacher' && broadcast.teacherId !== currentUser?.id) {
          setActiveLiveNotification(broadcast);
          setLiveClasses((prev) =>
            prev.map((c) =>
              c.id === broadcast.roomId.replace(/^room-/, '')
                ? { ...c, isLiveNow: true, currentViewers: (c.currentViewers || 1) + 1 }
                : c
            )
          );
        }
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
  }, [currentUser?.id, currentUser?.role]);

  const [videoFilterTab, setVideoFilterTab] = useState<'All' | 'My Videos' | 'Saved'>('All');
  const [selectedVideoLessonId, setSelectedVideoLessonId] = useState<string | undefined>(undefined);

  const [announcement, setAnnouncement] = useState<string>(
    '2016 E.C. (2024/25 G.C.) Ethiopian National Examination Portal is active. All past papers, AI tutor and live classes are verified.'
  );

  const [examResults, setExamResults] = useState<ExamResult[]>([
    {
      id: 'res-init-1',
      title: 'Physics ESSLCE Mock 2016',
      level: 'grade_12_natural',
      subjectId: 'phy12',
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
  ]);
  const [topicMasteries, setTopicMasteries] = useState<TopicMastery[]>(INITIAL_TOPIC_MASTERY);
  const [preloadedDocForAi, setPreloadedDocForAi] = useState<DocumentMaterial | null>(null);
  const [activeLiveClassId, setActiveLiveClassId] = useState<string>(LIVE_CLASSES_DATA[0]?.id || 'live-1');

  // AI Modal for Instant Explanation
  const [aiExplainQuestion, setAiExplainQuestion] = useState<{ question: Question; studentAnswer?: string } | null>(null);
  const [aiExplainLoading, setAiExplainLoading] = useState<boolean>(false);
  const [aiExplainResult, setAiExplainResult] = useState<any | null>(null);

  const isLiveActive = liveClasses.some((c) => c.isLiveNow);

  // Authentication Handlers
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    if (user.gradeLevel) {
      setSelectedLevel(user.gradeLevel);
    }
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else if (user.role === 'teacher') {
      setActiveTab('live_classes');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ethio_exam_current_user');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleToggleUserRole = () => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const newRole: 'student' | 'teacher' = prev.role === 'teacher' ? 'student' : 'teacher';
      const updated: AppUser = {
        ...prev,
        role: newRole,
      };
      try {
        localStorage.setItem('ethio_exam_current_user', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // If user is not logged in, gate access with the Auth Portal!
  if (!currentUser) {
    return <AuthGateView onLoginSuccess={handleLoginSuccess} />;
  }

  // Handlers
  const handleStartExam = (subjectId?: string, mode: ExamMode = 'practice') => {
    if (subjectId) {
      setActiveSubjectId(subjectId);
    }
    setExamMode(mode);
    setActiveTab('exam_prep');
  };

  const handleJoinLive = (classId: string) => {
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


  // Trigger Gemini AI deep explanation modal
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
        amharicSummary: question.amharicExplanation || 'የዚህ ጥያቄ መልስ ከተሰጡት አማራጮች ውስጥ ትክክለኛው ተመርጧል።',
        keyTakeaway: `Review ${question.topic} chapter in standard curriculum.`,
      });
    } finally {
      setAiExplainLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white font-sans">
      {/* Universal Top Header with User Session & Logout */}
      <Header
        selectedLevel={selectedLevel}
        onSelectLevel={(lvl) => setSelectedLevel(lvl)}
        streakCount={14}
        isLiveActive={isLiveActive || !!activeLiveNotification}
        onOpenAiLab={() => setActiveTab('ai_lab')}
        onGoToLive={() => {
          if (activeLiveNotification) {
            const classId = activeLiveNotification.roomId.replace(/^room-/, '');
            setLiveClasses((prev) => {
              if (prev.some((c) => c.id === classId)) {
                return prev.map((c) => (c.id === classId ? { ...c, isLiveNow: true } : c));
              }
              const newCls: LiveClass = {
                id: classId,
                title: activeLiveNotification.topic || 'Live Teacher Broadcast',
                subject: activeLiveNotification.subject || 'Physics',
                subjectId: (activeLiveNotification.subject || 'physics').toLowerCase(),
                teacherName: activeLiveNotification.teacherName,
                teacherTitle: 'National Examination Lecturer',
                teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                level: selectedLevel,
                isLiveNow: true,
                scheduledTime: 'Live Right Now',
                durationMinutes: 75,
                currentViewers: 1,
                currentTopic: activeLiveNotification.topic || 'Live Teacher Lecture',
                slides: [],
                hasRecording: false,
                materialsAttached: [],
              };
              return [newCls, ...prev];
            });
            setActiveLiveClassId(classId);
          }
          setActiveTab('live_classes');
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdmin={() => setActiveTab('admin')}
        activeLiveTeacher={activeLiveNotification ? { name: activeLiveNotification.teacherName, subject: activeLiveNotification.subject } : null}
        onToggleRole={handleToggleUserRole}
      />

      {/* Primary Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'live_classes' && activeLiveNotification) {
            const classId = activeLiveNotification.roomId.replace(/^room-/, '');
            setActiveLiveClassId(classId);
          }
          setActiveTab(tab);
        }}
        isLiveActive={isLiveActive || !!activeLiveNotification}
        currentUser={currentUser}
      />

      {/* Site-wide Announcement Notice Banner (Controlled by Admin hayma) */}
      {announcement && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-950 font-bold text-[10px] tracking-wide uppercase shrink-0">
                Notice
              </span>
              <p className="truncate font-medium">{announcement}</p>
            </div>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 shrink-0"
              >
                Edit Notice
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Admin Control Center View */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanelView
            currentUser={currentUser}
            questions={questions}
            subjects={SUBJECTS_DATA}
            liveClasses={liveClasses}
            videoLessons={videoLessons}
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
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            selectedLevel={selectedLevel}
            subjects={SUBJECTS_DATA}
            liveClasses={liveClasses}
            weakTopics={topicMasteries}
            onNavigate={(tab) => setActiveTab(tab)}
            onStartPractice={(subId, mode) => handleStartExam(subId, mode)}
            onJoinLiveClass={handleJoinLive}
            onSelectSubjectForStudy={(subId) => handleStartExam(subId, 'practice')}
          />
        )}

        {activeTab === 'exam_prep' && (
          <ExamPrepView
            selectedLevel={selectedLevel}
            subjects={SUBJECTS_DATA}
            questions={questions}
            initialSubjectId={activeSubjectId}
            initialMode={examMode}
            onAskAiExplain={handleAskAiExplain}
            onSaveResult={handleSaveExamResult}
          />
        )}

        {activeTab === 'live_classes' && (
          <LiveClassView
            liveClasses={liveClasses}
            selectedLevel={selectedLevel}
            activeClassId={activeLiveClassId}
            currentUser={currentUser}
            onSelectClass={(id) => setActiveLiveClassId(id)}
            onAddLiveClass={(newCls) => {
              setLiveClasses((prev) => [newCls, ...prev]);
              setActiveLiveClassId(newCls.id);
            }}
            onUpdateLiveClass={(updatedCls) => {
              setLiveClasses((prev) => prev.map((c) => (c.id === updatedCls.id ? updatedCls : c)));
            }}
            onOpenDocument={(docTitle) => {
              const matched = DOCUMENTS_DATA.find((d: DocumentMaterial) => d.title.toLowerCase().includes(docTitle.toLowerCase()));
              if (matched) {
                setActiveTab('documents');
              }
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
            onToggleRole={handleToggleUserRole}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentLibraryView
            documents={DOCUMENTS_DATA}
            selectedLevel={selectedLevel}
            subjects={SUBJECTS_DATA}
            onOpenAiWithDocument={(doc) => {
              setPreloadedDocForAi(doc);
              setActiveTab('ai_lab');
            }}
          />
        )}

        {activeTab === 'videos' && (
          <VideoLearningView
            videoLessons={videoLessons}
            selectedLevel={selectedLevel}
            subjects={SUBJECTS_DATA}
            currentUser={currentUser}
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
        )}

        {activeTab === 'ai_lab' && (
          <AiStudyLabView
            selectedLevel={selectedLevel}
            subjects={SUBJECTS_DATA}
            preloadedDoc={preloadedDocForAi}
            onClearPreloadedDoc={() => setPreloadedDocForAi(null)}
            onAddGeneratedQuestionsToBank={(newQs) => {
              setQuestions((prev) => [...newQs, ...prev]);
            }}
            onAddGeneratedFlashcards={(newCards) => {
              setFlashcards((prev) => [...newCards, ...prev]);
            }}
          />
        )}

        {activeTab === 'analytics' && (
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
              setActiveTab('exam_prep');
            }}
          />
        )}
      </main>

      {/* Gemini AI Deep Question Explanation Modal */}
      {aiExplainQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
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

                {aiExplainResult.amharicSummary && (
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-600">
            © 2026 Tenesh Ethiopia — National Exam Preparation & Learning Platform
          </span>
          <span className="text-slate-400 font-medium">
            Ministry of Education • Grade 8 Regional • Grade 12 ESSLCE • Higher Education Exit Exam
          </span>
        </div>
      </footer>

      {/* Real-time Floating Notification Popup when Teacher is Live */}
      {activeLiveNotification && 
       activeTab !== 'live_classes' && 
       dismissedLiveNotificationRoomId !== activeLiveNotification.roomId && (
        <LiveTeacherNotification
          broadcast={activeLiveNotification}
          onJoin={() => {
            const classId = activeLiveNotification.roomId.replace(/^room-/, '');
            setLiveClasses((prev) => {
              if (prev.some((c) => c.id === classId)) {
                return prev.map((c) => (c.id === classId ? { ...c, isLiveNow: true } : c));
              }
              const newCls: LiveClass = {
                id: classId,
                title: activeLiveNotification.topic || 'Live Teacher Broadcast',
                subject: activeLiveNotification.subject || 'Physics',
                subjectId: (activeLiveNotification.subject || 'physics').toLowerCase(),
                teacherName: activeLiveNotification.teacherName,
                teacherTitle: 'National Examination Lecturer',
                teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                level: selectedLevel,
                isLiveNow: true,
                scheduledTime: 'Live Right Now',
                durationMinutes: 75,
                currentViewers: 1,
                currentTopic: activeLiveNotification.topic || 'Live Teacher Lecture',
                slides: [],
                hasRecording: false,
                materialsAttached: [],
              };
              return [newCls, ...prev];
            });
            setActiveLiveClassId(classId);
            setActiveTab('live_classes');
            setActiveLiveNotification(null);
          }}
          onDismiss={() => {
            setDismissedLiveNotificationRoomId(activeLiveNotification.roomId);
          }}
        />
      )}
    </div>
  );
}

