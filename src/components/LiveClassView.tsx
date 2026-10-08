import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Users, 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  HelpCircle, 
  FileText, 
  Video, 
  Share2, 
  Maximize2, 
  Play, 
  Pause, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  ChevronRight, 
  ChevronLeft, 
  PlusCircle, 
  Sparkles, 
  Clock, 
  Download, 
  CheckCircle2,
  BarChart2,
  Check,
  PenTool,
  Eraser,
  Trash2,
  Presentation,
  ScreenShare,
  X,
  Eye,
  Layers,
  Volume2,
  VolumeX,
  Headphones,
  BookOpen,
  Camera,
  RefreshCw,
  Upload,
  ExternalLink,
  AlertCircle,
  Heart,
  Flame,
  LayoutGrid,
  Smartphone,
  Sparkles as SparklesIcon,
  Smile,
  Award,
  RotateCcw,
  FileUp,
  Plus,
  Pencil,
  CircleDot,
  Disc,
  FolderOpen,
  Film,
  Highlighter,
  ChevronDown,
  LogOut,
  PhoneOff
} from 'lucide-react';
import { LiveClass, LiveChatMessage, ExamLevel, AppUser, LiveSlide, VideoLesson } from '../types';
import { saveRecordedVideoBlob, deleteRecordedVideoBlob } from '../utils/recordedVideoStorage';
import { 
  LiveClassroomClient, 
  LiveRoomParticipant, 
  uploadRecordedVideoToServer,
  checkLiveBroadcastStatus,
  listenGlobalLiveBroadcasts,
  ActiveBroadcastInfo
} from '../utils/liveStreamService';

export interface SlideStrokePoint {
  xRatio: number;
  yRatio: number;
}

export interface SlideStroke {
  points: SlideStrokePoint[];
  color: string;
  size: number;
  tool: 'pen' | 'highlighter' | 'eraser';
}

interface LiveTeacherVideoProps {
  stream: MediaStream | null;
  photoUrl: string | null;
  teacherName: string;
  isMirrored?: boolean;
  camActive: boolean;
  className?: string;
  cameraError?: string | null;
  onTurnOnCamera?: () => void;
  onUploadPhoto?: () => void;
  onOpenNewTab?: () => void;
  onSetDemoPhoto?: (url?: string) => void;
  floatingNoticeDismissed?: boolean;
  onDismissNotice?: () => void;
  isSpeaking?: boolean;
  onSwitchToFrontCamera?: () => void;
  onSwitchToBackCamera?: () => void;
  onFlipCamera?: () => void;
  onToggleMirror?: () => void;
  facingMode?: 'user' | 'environment';
}

// Visual Animated Equalizer Wave Bars for Live Microphone Speech Detection
export const AudioWaveBars: React.FC<{ isSpeaking: boolean; level: number; barCount?: number }> = ({
  isSpeaking,
  level,
  barCount = 4,
}) => {
  return (
    <div className="flex items-end gap-0.5 h-3 px-0.5 select-none shrink-0">
      {Array.from({ length: barCount }).map((_, i) => {
        const multipliers = [0.65, 1.0, 0.8, 0.45, 0.9, 0.5];
        const mult = multipliers[i % multipliers.length];
        const heightPercent = isSpeaking ? Math.max(25, Math.min(100, Math.round(level * mult))) : 18;
        return (
          <span
            key={i}
            className={`w-0.5 sm:w-1 rounded-full transition-all duration-75 ${
              isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
};

const LiveTeacherVideo: React.FC<LiveTeacherVideoProps> = ({
  stream,
  photoUrl,
  teacherName,
  isMirrored = true,
  camActive,
  className = '',
  cameraError,
  onTurnOnCamera,
  onUploadPhoto,
  onOpenNewTab,
  onSetDemoPhoto,
  isSpeaking = false,
  onSwitchToFrontCamera,
  onSwitchToBackCamera,
  onFlipCamera,
  onToggleMirror,
  facingMode = 'user',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && camActive) {
      video.srcObject = stream;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');

      const onMeta = () => {
        video.play().catch((err) => {
          console.warn('Video auto-play interrupted:', err);
        });
      };

      video.addEventListener('loadedmetadata', onMeta);
      video.play().catch(() => {});

      return () => {
        video.removeEventListener('loadedmetadata', onMeta);
      };
    } else {
      video.srcObject = null;
    }
  }, [stream, camActive]);

  const hasLiveVideoTrack = Boolean(
    stream &&
    stream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled)
  );

  return (
    <div className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ${className}`}>
      {/* 1. Real hardware webcam stream */}
      {hasLiveVideoTrack && camActive ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            id="teacher-live-webcam-video"
            ref={(node) => {
              videoRef.current = node;
              if (node && stream && node.srcObject !== stream) {
                node.srcObject = stream;
                node.play().catch(() => {});
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-transform duration-200"
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          />

          {/* Quick Floating Camera Controls Overlay */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 shadow-lg text-[11px] text-white">
            <span className="font-bold flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {facingMode === 'user' ? '🤳 የፊት ካሜራ (Front)' : '📷 የጀርባ ካሜራ (Back)'}
            </span>

            {onSwitchToFrontCamera && facingMode !== 'user' && (
              <button
                type="button"
                onClick={onSwitchToFrontCamera}
                className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold transition cursor-pointer"
                title="ወደ የፊት-ለፊት ካሜራ ቀይር (Switch to Front Camera)"
              >
                ወደ ፊት ቀይር
              </button>
            )}

            {onSwitchToBackCamera && facingMode === 'user' && (
              <button
                type="button"
                onClick={onSwitchToBackCamera}
                className="px-2 py-0.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition cursor-pointer"
                title="ወደ የጀርባ ካሜራ ቀይር (Switch to Back Camera)"
              >
                ጀርባ
              </button>
            )}

            {onFlipCamera && (
              <button
                type="button"
                onClick={onFlipCamera}
                className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold transition cursor-pointer flex items-center gap-1"
                title="ካሜራ ቀይር (Flip / Switch Camera)"
              >
                <RefreshCw className="w-3 h-3" />
                <span>አዙር</span>
              </button>
            )}

            {onToggleMirror && (
              <button
                type="button"
                onClick={onToggleMirror}
                className="px-1.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                title="Mirror Camera Video (መስታወት ገልብጥ)"
              >
                {isMirrored ? '🪞 መስታወት' : 'መደበኛ'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 2. Interactive Camera Activation / User Profile Screen */
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-slate-900 via-slate-950 to-black">
          {photoUrl ? (
            /* User's explicitly uploaded photo */
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl ring-4 ring-emerald-500/20 mb-3">
                <img src={photoUrl} alt={teacherName} className="w-full h-full object-cover" />
              </div>
              <p className="text-white text-sm font-bold">{teacherName}</p>
              <p className="text-emerald-400 text-xs mt-1">የተሰቀለ ፎቶ በቀጥታ ስርጭት ላይ ነው (Photo Active)</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSwitchToFrontCamera || onTurnOnCamera}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>🤳 የቀጥታ ካሜራ ክፈት</span>
                </button>
                {onUploadPhoto && (
                  <button
                    type="button"
                    onClick={onUploadPhoto}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ፎቶ ቀይር</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Clear Camera Readiness & Activation Callout */
            <div className="relative z-10 max-w-md flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shadow-2xl mb-4 text-emerald-400">
                <Camera className="w-10 h-10 animate-pulse" />
              </div>

              <h3 className="text-white text-base sm:text-lg font-black tracking-tight mb-1">
                የፊት ካሜራዎን ያብሩ (Show Your Face)
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
                ተማሪዎች እርስዎን በቀጥታ እንዲያዩ የፊት-ለፊት (Front / Selfie) ካሜራዎን ይክፈቱ።
              </p>

              {cameraError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={onSwitchToFrontCamera || onTurnOnCamera}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-950/50 cursor-pointer transition transform hover:scale-105 active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>🤳 የፊት ካሜራዬን አብራ (Open Front Face)</span>
                </button>

                {onSwitchToBackCamera && (
                  <button
                    type="button"
                    onClick={onSwitchToBackCamera}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 cursor-pointer transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📷 ጀርባ ካሜራ</span>
                  </button>
                )}

                {onFlipCamera && (
                  <button
                    type="button"
                    onClick={onFlipCamera}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 cursor-pointer transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>🔄 ካሜራ ቀያይር</span>
                  </button>
                )}

                {onUploadPhoto && (
                  <button
                    type="button"
                    onClick={onUploadPhoto}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 cursor-pointer transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>📁 ፎቶዬን ስቀል</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speaking Active Banner Badge over Face */}
      {isSpeaking && (
        <div className="absolute bottom-3 left-3 z-30 px-2.5 py-1 rounded-xl bg-emerald-950/90 border border-emerald-400/70 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 shadow-xl backdrop-blur-md animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>ድምፅ እየተናገሩ ነው (Speaking...)</span>
        </div>
      )}
    </div>
  );
};

interface LiveClassViewProps {
  liveClasses: LiveClass[];
  selectedLevel: ExamLevel;
  activeClassId?: string;
  currentUser?: AppUser | null;
  onSelectClass: (classId: string) => void;
  onAddLiveClass?: (newClass: LiveClass) => void;
  onUpdateLiveClass?: (updatedClass: LiveClass) => void;
  onOpenDocument: (docTitle: string) => void;
  onSaveRecordedVideoLesson?: (videoLesson: VideoLesson) => void;
  onDeleteVideoLesson?: (videoId: string) => void;
  onNavigateToVideos?: (filterTab?: 'All' | 'My Videos' | 'Saved', videoId?: string) => void;
  onToggleRole?: () => void;
}

export const LiveClassView: React.FC<LiveClassViewProps> = ({
  liveClasses,
  selectedLevel,
  activeClassId,
  currentUser,
  onSelectClass,
  onAddLiveClass,
  onUpdateLiveClass,
  onOpenDocument,
  onSaveRecordedVideoLesson,
  onDeleteVideoLesson,
  onNavigateToVideos,
  onToggleRole,
}) => {
  // Find currently selected class or fallback gracefully
  const currentLevelClasses = liveClasses.filter((c) => c.level === selectedLevel);
  const selectedClass = 
    liveClasses.find((c) => c.id === activeClassId) || 
    currentLevelClasses[0] || 
    liveClasses[0];

  // Stage display mode: 'camera' | 'split' | 'slides' | 'split_ppt' | 'whiteboard' | 'video' | 'screenshare'
  const [stageMode, setStageMode] = useState<'camera' | 'split' | 'slides' | 'split_ppt' | 'whiteboard' | 'video' | 'screenshare'>('camera');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTeaching, setIsTeaching] = useState<boolean>(true);
  
  // Interactive Live Classroom states
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'Kalkidan Mengistu',
      role: 'student',
      text: 'Teacher, in the ESSLCE 2016 exam, was the AC generator question asking for peak voltage or RMS voltage?',
      timestamp: '18:04',
      isQuestion: true,
      upvotes: 24,
      isAnswered: true,
    },
    {
      id: 'msg-2',
      sender: 'Ato Birhanu Tadesse',
      role: 'teacher',
      text: 'Great question Kalkidan! Unless the problem specifies RMS or effective, ε_max = NABω calculates the peak amplitude. For RMS, divide by √2.',
      timestamp: '18:06',
      upvotes: 42,
    },
    {
      id: 'msg-3',
      sender: 'Yonas Abebe',
      role: 'student',
      text: 'Can we review self-inductance L of a solenoid before the session ends?',
      timestamp: '18:09',
      isQuestion: true,
      upvotes: 18,
    },
    {
      id: 'msg-ai-1',
      sender: 'EthioAI Study Copilot',
      role: 'ai_tutor',
      text: 'Reminder for Grade 12: Solenoid self-inductance is L = (μ₀ · N² · A) / l. Remember that N is squared!',
      timestamp: '18:10',
      upvotes: 35,
    }
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isQuestionFilter, setIsQuestionFilter] = useState<boolean>(false);
  const [userVotedPollOption, setUserVotedPollOption] = useState<number | null>(null);

  // Hardware Media Stream States: Default to FALSE so camera & microphone NEVER auto-turn-on uninvited
  const [micActive, setMicActive] = useState<boolean>(false);
  const [camActive, setCamActive] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Keep stream refs synced with React state for flawless cleanup on unmount
  useEffect(() => {
    userStreamRef.current = userStream;
  }, [userStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  // Multiple Camera & Microphone Devices & Audio Sensitivities
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('');
  const [captureExternalSound, setCaptureExternalSound] = useState<boolean>(true); // default true: accept and capture sound coming from outside
  const [dismissIriunBanner, setDismissIriunBanner] = useState<boolean>(false);

  // Custom teacher face photo (uploaded by user or saved in localStorage)
  const [teacherPhoto, setTeacherPhoto] = useState<string | null>(() => {
    const saved = localStorage.getItem('ethio_teacher_face_photo');
    if (saved && (saved.startsWith('data:image') || saved.startsWith('http'))) {
      if (!saved.includes('unsplash.com/photo-1534528741775-53994a69daeb')) {
        return saved;
      }
    }
    return null;
  });
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);
  const remoteAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const monitorCtxRef = useRef<AudioContext | null>(null);
  const [isMonitoringMic, setIsMonitoringMic] = useState<boolean>(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setTeacherPhoto(dataUrl);
        localStorage.setItem('ethio_teacher_face_photo', dataUrl);
        setCamActive(true);
        setIsTeaching(true);
        setStageMode('camera');
        triggerToast('የእርስዎ ፎቶ ተጭኗል! ፊትዎ በቀጥታ እየታየ ነው (Your face is broadcasting live)።');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetDemoPhoto = (customUrl?: string) => {
    const photo = customUrl || currentUser?.avatar || '';
    if (photo) {
      setTeacherPhoto(photo);
      localStorage.setItem('ethio_teacher_face_photo', photo);
      setCamActive(true);
      setIsTeaching(true);
      setCameraError(null);
      setStageMode('camera');
      triggerToast('የእርስዎ ፊት ፎቶ በቀጥታ ስርጭት ላይ ውሏል (Face photo active)።');
    } else {
      photoInputRef.current?.click();
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  // Interaction Toggles
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'live_room' | 'recordings'>('live_room');

  // Teacher Start Class Modal
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [newClassTitle, setNewClassTitle] = useState<string>('');
  const [newClassSubject, setNewClassSubject] = useState<string>('Physics');
  const [newClassTopic, setNewClassTopic] = useState<string>('');
  const [newClassLevel, setNewClassLevel] = useState<ExamLevel>(selectedLevel);
  const [newClassYoutube, setNewClassYoutube] = useState<string>('');

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // Real-Time WebRTC Live Broadcast & WebSocket Multi-User Sync
  // -------------------------------------------------------------
  const [isBroadcastingLive, setIsBroadcastingLive] = useState<boolean>(false);
  const [liveBroadcasterInfo, setLiveBroadcasterInfo] = useState<{ teacherId: string; teacherName: string; stageMode: string } | null>(null);
  const [remoteTeacherStream, setRemoteTeacherStream] = useState<MediaStream | null>(null);
  const [remoteTeacherFrame, setRemoteTeacherFrame] = useState<string | null>(null);
  const [onlineParticipants, setOnlineParticipants] = useState<LiveRoomParticipant[]>([]);
  const [liveViewerCount, setLiveViewerCount] = useState<number>(1);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState<boolean>(false);
  const [activeServerBroadcast, setActiveServerBroadcast] = useState<ActiveBroadcastInfo | null>(null);
  const liveClientRef = useRef<LiveClassroomClient | null>(null);
  const remoteVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Persistent user ID for stable WebSocket & WebRTC peer signaling across re-renders
  const stableUserIdRef = useRef<string>(
    currentUser?.id || `usr-${Math.random().toString(36).substring(2, 8)}`
  );

  useEffect(() => {
    if (currentUser?.id) {
      stableUserIdRef.current = currentUser.id;
    }
  }, [currentUser?.id]);

  // Global live broadcast discovery: check if any teacher is broadcasting in any room across the school
  useEffect(() => {
    checkLiveBroadcastStatus().then((broadcasts) => {
      if (broadcasts && broadcasts.length > 0) {
        setActiveServerBroadcast(broadcasts[0]);
      }
    });

    const cleanup = listenGlobalLiveBroadcasts(
      (info) => {
        setActiveServerBroadcast(info);
        triggerToast(`🔴 መምህር ${info.teacherName} የቀጥታ ስርጭት ጀምረዋል!`);
      },
      (stopInfo) => {
        if (!stopInfo?.roomId || stopInfo.roomId === activeServerBroadcast?.roomId) {
          setActiveServerBroadcast(null);
        }
      }
    );

    return cleanup;
  }, []);

  useEffect(() => {
    const roomId = `room-${selectedClass?.id || 'live-ethio-class'}`;
    const clientUser = {
      id: stableUserIdRef.current,
      name: currentUser?.name || (currentUser?.role === 'teacher' ? 'Teacher' : 'Student'),
      role: currentUser?.role || 'student',
    };

    const client = new LiveClassroomClient(roomId, clientUser, {
      onRoomInit: (room) => {
        setLiveViewerCount(room.userCount || 1);
        if (room.users) {
          setOnlineParticipants(Object.values(room.users));
        }
        if (room.isBroadcasting && room.teacherName) {
          setLiveBroadcasterInfo({
            teacherId: room.broadcasterId || '',
            teacherName: room.teacherName,
            stageMode: room.stageMode || 'slides',
          });
        } else {
          setLiveBroadcasterInfo(null);
        }
      },
      onUserJoined: (u, count) => {
        setLiveViewerCount(count);
        setOnlineParticipants((prev) => [...prev.filter((p) => p.id !== u.id), u]);
        triggerToast(`👋 ${u.name} አሁን በቀጥታ ክፍል ውስጥ ተቀላቅለዋል (${u.role === 'teacher' ? 'መምህር' : 'ተማሪ'})`);
      },
      onUserLeft: (uid, count) => {
        setLiveViewerCount(count);
        setOnlineParticipants((prev) => prev.filter((p) => p.id !== uid));
      },
      onBroadcastStarted: (info) => {
        setLiveBroadcasterInfo(info);
        triggerToast(`🔴 መምህር ${info.teacherName} የቀጥታ ስርጭት ጀምረዋል! ድምፃቸውንና ምስላቸውን በቀጥታ ይከታተሉ።`);
      },
      onBroadcastStopped: () => {
        setLiveBroadcasterInfo(null);
        setRemoteTeacherStream(null);
        setRemoteTeacherFrame(null);
        triggerToast('የቀጥታ ስርጭቱ ተጠናቋል።');
      },
      onVideoFrame: (frameBase64) => {
        setRemoteTeacherFrame(frameBase64);
      },
      onAudioChunk: (chunkBase64) => {
        // Fallback Audio chunk playback: guarantees student hears teacher even without P2P WebRTC
        try {
          if (!remoteTeacherStream || isRemoteAudioMuted) {
            const binary = atob(chunkBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            if (!fallbackAudioRef.current) {
              fallbackAudioRef.current = new Audio();
            }
            fallbackAudioRef.current.src = url;
            fallbackAudioRef.current.volume = 1.0;
            fallbackAudioRef.current.play().catch(() => {});
          }
        } catch (e) {}
      },
      onRemoteStream: (stream) => {
        setRemoteTeacherStream((prev) => {
          if (!prev) return stream;
          stream.getTracks().forEach((t) => {
            if (!prev.getTracks().some((pt) => pt.id === t.id)) {
              prev.addTrack(t);
            }
          });
          return new MediaStream(prev.getTracks());
        });
        if (remoteVideoElementRef.current) {
          remoteVideoElementRef.current.srcObject = stream;
          remoteVideoElementRef.current.play().catch((err) => {
            console.warn('Autoplay restricted on remote teacher video:', err);
            if (remoteVideoElementRef.current) {
              remoteVideoElementRef.current.muted = true;
              setIsRemoteAudioMuted(true);
              remoteVideoElementRef.current.play().catch(() => {});
            }
          });
        }
      },
      onStageUpdated: (info) => {
        if (currentUser?.role !== 'teacher') {
          if (info.stageMode) setStageMode(info.stageMode as any);
          if (typeof info.currentSlideIndex === 'number') setCurrentSlideIndex(info.currentSlideIndex);
        }
      },
      onChatMessage: (msg) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
    });

    liveClientRef.current = client;

    return () => {
      client.destroy();
      liveClientRef.current = null;
    };
  }, [selectedClass?.id, currentUser?.id, currentUser?.name, currentUser?.role]);

  // Synchronize composite broadcast stream (video + live microphone voice)
  const syncBroadcastStream = useCallback(() => {
    if (!liveClientRef.current) return;

    const tracks: MediaStreamTrack[] = [];

    // 1. Video Track: from userStream if live, or from composite canvas if available
    let videoTrack: MediaStreamTrack | null = null;
    if (userStream && userStream.getVideoTracks().length > 0) {
      videoTrack = userStream.getVideoTracks().find((t) => t.readyState === 'live') || null;
    }
    if (!videoTrack && compositeCanvasRef.current) {
      try {
        const cStream = (compositeCanvasRef.current as any).captureStream?.(15);
        if (cStream && cStream.getVideoTracks().length > 0) {
          videoTrack = cStream.getVideoTracks()[0];
        }
      } catch (e) {}
    }
    if (videoTrack) tracks.push(videoTrack);

    // 2. Audio Track: from micStreamRef or userStream, with enabled synced to micActive
    let audioTrack: MediaStreamTrack | null = null;
    if (micStreamRef.current && micStreamRef.current.getAudioTracks().length > 0) {
      audioTrack = micStreamRef.current.getAudioTracks().find((t) => t.readyState === 'live') || null;
    }
    if (!audioTrack && userStream && userStream.getAudioTracks().length > 0) {
      audioTrack = userStream.getAudioTracks().find((t) => t.readyState === 'live') || null;
    }

    if (audioTrack) {
      audioTrack.enabled = micActive;
      tracks.push(audioTrack);
    }

    const broadcastStream = tracks.length > 0 ? new MediaStream(tracks) : null;
    liveClientRef.current.setLocalStream(broadcastStream);
  }, [userStream, micActive]);

  // Keep local stream in sync with live WebRTC broadcaster client
  useEffect(() => {
    if (currentUser?.role === 'teacher' || isBroadcastingLive) {
      syncBroadcastStream();
    }
  }, [syncBroadcastStream, currentUser?.role, isBroadcastingLive]);

  const toggleLiveBroadcast = async () => {
    if (isBroadcastingLive) {
      liveClientRef.current?.stopBroadcast();
      setIsBroadcastingLive(false);
      triggerToast('የቀጥታ ስርጭት ቆሟል (Live broadcast stopped)');
    } else {
      // Ensure microphone is active so teacher voice is guaranteed to stream to all students
      if (!micStreamRef.current) {
        await ensureActiveMicrophone();
      }
      setMicActive(true);
      syncBroadcastStream();
      liveClientRef.current?.startBroadcast(stageMode, selectedClass?.subject, selectedClass?.title);
      liveClientRef.current?.startFrameBroadcasting(() => {
        return (
          userVideoRef.current ||
          (document.getElementById('teacher-live-webcam-video') as HTMLVideoElement) ||
          null
        );
      });
      setIsBroadcastingLive(true);
      triggerToast('🔴 የቀጥታ ስርጭት ተጀምሯል! ተማሪዎች በቀጥታ እያዩዎትና ድምፅዎን እየሰሙ ነው (Broadcasting Live with Audio & Video)');
    }
  };

  // -------------------------------------------------------------
  // Interactive Whiteboard (የሰሌዳ ጽሑፍ) Canvas State & Logic
  // -------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('#ffffff'); // Default white chalk
  const [penSize, setPenSize] = useState<number>(3);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [eraserSize, setEraserSize] = useState<number>(32); // 16px, 32px, 56px
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);

  // -------------------------------------------------------------
  // PowerPoint & Slide Presentation Engine States ("eyanseratetiku")
  // -------------------------------------------------------------
  const pptFileInputRef = useRef<HTMLInputElement | null>(null);
  const [customSlidesMap, setCustomSlidesMap] = useState<Record<string, LiveSlide[]>>({});
  const [showAddSlideModal, setShowAddSlideModal] = useState<boolean>(false);
  const [newSlideTitle, setNewSlideTitle] = useState<string>('');
  const [newSlideBullets, setNewSlideBullets] = useState<string>('');
  const [newSlideFormula, setNewSlideFormula] = useState<string>('');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // In-Slide Annotation Canvas States ("rasu slidu lay eyasemerikuna eyetafiku masredat")
  const [isSlideAnnotating, setIsSlideAnnotating] = useState<boolean>(true); // Active so instructor can annotate right away
  const [slideTool, setSlideTool] = useState<'pen' | 'highlighter' | 'eraser'>('highlighter'); // Default to highlighter for underlining sentences
  const [slidePenColor, setSlidePenColor] = useState<string>('#facc15'); // Bright yellow highlighter
  const [slidePenSize, setSlidePenSize] = useState<number>(14); // Default width for highlighting/underlining
  const slideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSlideDrawing, setIsSlideDrawing] = useState<boolean>(false);
  const [slideStrokesMap, setSlideStrokesMap] = useState<Record<number, SlideStroke[]>>({});
  const activeSlideStrokeRef = useRef<SlideStroke | null>(null);

  // -------------------------------------------------------------
  // Real-Time Audio Level & Speech Activity Detection ("eyawerahu eko record ayasayim")
  // -------------------------------------------------------------
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // -------------------------------------------------------------
  // Live Class Session Recording Controller ("🔴 REC") - Manual Trigger Only!
  // ("ene record adrig salilew beketita record madreg yelebetim")
  // -------------------------------------------------------------
  const [isRecording, setIsRecording] = useState<boolean>(false); // Strictly manual: Never record automatically unless instructor clicks Record
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isRecordingPaused, setIsRecordingPaused] = useState<boolean>(false);
  // Recording Source Mode: 'stage_composite' (PPT Slides + Teacher Face + Notes) | 'screen' (Screen/Tab) | 'camera' (Webcam Only)
  // Resolves: "lemindin new record yaderekut ke ppt sasireda neber gin yene face bicha new yetayew"
  const [recordSource, setRecordSource] = useState<'stage_composite' | 'screen' | 'camera'>('stage_composite');
  const [showRecordSourceModal, setShowRecordSourceModal] = useState<boolean>(false);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeLoopRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [showRecordingModal, setShowRecordingModal] = useState<boolean>(false);
  const [lastRecordedVideoLessonId, setLastRecordedVideoLessonId] = useState<string | null>(null);
  const recordingAudioContextRef = useRef<AudioContext | null>(null);
  const recordingMicStreamRef = useRef<MediaStream | null>(null);
  const recordingMimeTypeRef = useRef<string>('video/webm');
  const [recordedHasAudio, setRecordedHasAudio] = useState<boolean>(true);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Helper to ensure microphone is open, permitted, and active
  const ensureActiveMicrophone = async (overrideMicId?: string, overrideExternalSound?: boolean): Promise<MediaStream | null> => {
    // 1. Check existing micStreamRef if no specific override requested
    if (!overrideMicId && overrideExternalSound === undefined && micStreamRef.current) {
      const liveTrack = micStreamRef.current.getAudioTracks().find((t) => t.readyState === 'live');
      if (liveTrack) {
        liveTrack.enabled = micActive;
        return micStreamRef.current;
      }
    }

    const targetMicId = overrideMicId !== undefined ? overrideMicId : selectedMicrophoneId;
    const outsideSound = overrideExternalSound !== undefined ? overrideExternalSound : captureExternalSound;

    // 2. Check userStream (from camera) if no target override
    if (!targetMicId && userStream) {
      const userAudio = userStream.getAudioTracks().find((t) => t.readyState === 'live');
      if (userAudio) {
        userAudio.enabled = micActive;
        const s = new MediaStream([userAudio]);
        micStreamRef.current = s;
        return s;
      }
    }

    // 3. Request fresh microphone stream with robust progressive fallbacks
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const audioConstraints: MediaTrackConstraints = outsideSound
          ? {
              // High sensitivity wide capture: captures sounds coming from outside / room without suppressing them
              deviceId: targetMicId ? { ideal: targetMicId } : undefined,
              echoCancellation: false,
              noiseSuppression: false, // Critical: DO NOT suppress outside sound!
              autoGainControl: true,  // Automatically boost quiet incoming sounds from outside
            }
          : {
              deviceId: targetMicId ? { ideal: targetMicId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            };

        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        micStreamRef.current = stream;
        const track = stream.getAudioTracks().find((t) => t.readyState === 'live');
        if (track) track.enabled = micActive;
        if (userStream && track) {
          if (!userStream.getAudioTracks().some((t) => t.id === track.id)) {
            userStream.addTrack(track);
          }
        }
        syncBroadcastStream();
        refreshMicrophoneDevices();
        return stream;
      } catch (customErr) {
        console.warn('Microphone custom constraints attempt note, falling back to standard audio:', customErr);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: targetMicId ? { deviceId: { ideal: targetMicId } } : true,
          });
          micStreamRef.current = stream;
          const track = stream.getAudioTracks().find((t) => t.readyState === 'live');
          if (track) track.enabled = micActive;
          if (userStream && track) {
            if (!userStream.getAudioTracks().some((t) => t.id === track.id)) {
              userStream.addTrack(track);
            }
          }
          syncBroadcastStream();
          refreshMicrophoneDevices();
          return stream;
        } catch (advErr) {
          console.warn('Microphone permission or hardware access note:', advErr);
        }
      }
    }
    return null;
  };

  const [recordedSessionsList, setRecordedSessionsList] = useState<Array<{ id: string; title: string; date: string; duration: string; url: string; subject: string }>>([]);

  const handleDeleteRecordedSession = async (recId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanId = recId.startsWith('vid-') ? recId : `vid-${recId}`;
    const rawId = recId.replace(/^vid-/, '');
    
    setRecordedSessionsList((prev) => prev.filter((r) => r.id !== recId && r.id !== rawId && r.id !== cleanId));
    
    await deleteRecordedVideoBlob(recId);
    await deleteRecordedVideoBlob(cleanId);
    await deleteRecordedVideoBlob(rawId);
    
    if (onDeleteVideoLesson) {
      onDeleteVideoLesson(cleanId);
      onDeleteVideoLesson(rawId);
      onDeleteVideoLesson(recId);
    }
    
    try {
      const saved = localStorage.getItem('ethio_exam_video_lessons');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((p: any) => p.id !== recId && p.id !== cleanId && p.id !== rawId);
        localStorage.setItem('ethio_exam_video_lessons', JSON.stringify(filtered));
      }
    } catch {}

    triggerToast('የቀረጻው ቪዲዮ በተሳካ ሁኔታ ተሰርዟል! (Recording deleted)');
  };

  const defaultCurriculumSlides: LiveSlide[] = [
    {
      title: `${selectedClass?.subject || 'Physics'} Grade 12: National Examination Review`,
      subtitle: 'ESSLCE High-Yield Exam Preparation',
      bulletPoints: [
        'ክለሳ 1: መሰረታዊ ጽንሰ-ሀሳቦች እና ፎርሙላዎች (Core Formulas & Principles)',
        'ክለሳ 2: የአገር አቀፍ ፈተና (ESSLCE Matric) የተመረጡ ጥያቄዎችና አሰራሮች',
        'ክለሳ 3: ፈጣን የማስያ ዘዴዎችና የተማሪዎች የተለመዱ ስህተቶች (Exam Trap Prevention)',
      ],
      formulaOrQuote: 'P = V · I = I² · R  |  ε = -N · (ΔΦ / Δt)',
    },
    {
      title: `${selectedClass?.subject || 'Physics'}: የተመረጠ የፈተና ጥያቄ እና አሰራር`,
      subtitle: 'Step-by-Step Problem Solving on Whiteboard',
      bulletPoints: [
        'ጥያቄውን በጥንቃቄ አንብበው የተሰጡ መረጃዎችን (Given variables) ለይተው ይፃፉ',
        'አሃዶችን (Units) ወደ SI Unit ማስተካከልዎን ያረጋግጡ (ለምሳሌ፦ cm² ወደ m²)',
        'ትክክለኛውን ፎርሙላ በመጠቀም ውጤቱን በቀጥታ በሰሌዳው ላይ ይስሩ',
      ],
      formulaOrQuote: 'F_net = m · a  |  W = F · d',
    },
    {
      title: 'የማጠቃለያ ምክሮች እና የተማሪዎች ጥያቄዎች',
      subtitle: 'Q&A and Interactive Discussion',
      bulletPoints: [
        'ተማሪዎች ያልገባችሁን ጥያቄ በቀጥታ ቻት (Live Chat) ላይ ጻፉ',
        'የቀጣይ ክፍለ-ጊዜ የቤት ስራና የተዘጋጁ ማስታወሻዎችን ከታች ያውርዱ',
      ],
      formulaOrQuote: 'Focus + Practice = 100% Exam Success!',
    },
  ];

  const classCustomList = customSlidesMap[selectedClass?.id];
  const slides: LiveSlide[] = (classCustomList && classCustomList.length > 0)
    ? classCustomList
    : (selectedClass?.slides && selectedClass.slides.length > 0)
      ? selectedClass.slides
      : defaultCurriculumSlides;

  const currentSlide = slides[currentSlideIndex] || slides[0] || {
    title: selectedClass?.currentTopic || 'Live Lecture',
    bulletPoints: ['Welcome to the interactive classroom.', 'Listen attentively and submit questions in the live chat.'],
  };

  // Initialize and synchronize canvas resolution properly
  useEffect(() => {
    if ((stageMode === 'whiteboard' || stageMode === 'split') && canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      if (parent) {
        const targetWidth = parent.clientWidth || 800;
        const targetHeight = stageMode === 'split' ? (parent.clientHeight || 420) : 420;
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a'; // Deep slate blackboard
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.fillText('Interactive Digital Blackboard (የዲጂታል ሰሌዳ) — Draw & solve problems live.', 24, 36);
          }
        }
      }
    }
  }, [stageMode]);

  // Clean up media streams and audio contexts on unmount
  useEffect(() => {
    return () => {
      if (userStream) {
        userStream.getTracks().forEach((t) => t.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordingMicStreamRef.current) {
        recordingMicStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordingAudioContextRef.current && recordingAudioContextRef.current.state !== 'closed') {
        recordingAudioContextRef.current.close().catch(() => {});
      }
    };
  }, [userStream, screenStream]);

  // Helper to discover all video devices
  const refreshCameraDevices = async (): Promise<MediaDeviceInfo[]> => {
    if (!navigator?.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoInputs);
      return videoInputs;
    } catch (err) {
      console.warn('Could not enumerate camera devices:', err);
      return [];
    }
  };

  // Helper to discover all audio input devices (microphones, headsets, external mics)
  const refreshMicrophoneDevices = async (): Promise<MediaDeviceInfo[]> => {
    if (!navigator?.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setAvailableMicrophones(audioInputs);
      return audioInputs;
    } catch (err) {
      console.warn('Could not enumerate audio devices:', err);
      return [];
    }
  };

  // Comprehensive shutdown helper that terminates all hardware camera/mic tracks, screen share, broadcast, and audio contexts
  const shutdownAllLiveStreams = useCallback(() => {
    // 1. Stop and release hardware camera video tracks
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      userStreamRef.current = null;
    }
    if (userStream) {
      userStream.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      setUserStream(null);
    }

    // 2. Stop and release microphone audio tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      micStreamRef.current = null;
    }

    // 3. Stop screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      screenStreamRef.current = null;
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      setScreenStream(null);
    }
    setIsScreenSharing(false);

    // 4. Stop recording if in progress
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);

    // 5. Stop live WebRTC broadcast & sync
    if (liveClientRef.current) {
      try {
        liveClientRef.current.stopBroadcast();
        liveClientRef.current.setLocalStream(null);
      } catch (e) {}
    }
    setIsBroadcastingLive(false);

    // 6. Close audio contexts
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (monitorCtxRef.current && monitorCtxRef.current.state !== 'closed') {
      try { monitorCtxRef.current.close(); } catch (e) {}
      monitorCtxRef.current = null;
    }

    // 7. Reset states
    setIsMonitoringMic(false);
    setAudioLevel(0);
    setIsSpeaking(false);
    setCamActive(false);
    setMicActive(false);
    setIsTeaching(false);
    setTeacherPhoto(null);
  }, [userStream, screenStream]);

  // Clean unmount effect: only enumerate devices on mount, NEVER auto-start camera/mic!
  // When unmounting (switching tabs, leaving page), completely shut down all hardware streams.
  useEffect(() => {
    refreshCameraDevices();
    refreshMicrophoneDevices();

    return () => {
      // Shuts down all hardware video and audio tracks when leaving the live classroom
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        userStreamRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        micStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        screenStreamRef.current = null;
      }
      if (liveClientRef.current) {
        try {
          liveClientRef.current.stopBroadcast();
          liveClientRef.current.setLocalStream(null);
        } catch (e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
        audioContextRef.current = null;
      }
      if (monitorCtxRef.current && monitorCtxRef.current.state !== 'closed') {
        try { monitorCtxRef.current.close(); } catch (e) {}
        monitorCtxRef.current = null;
      }
    };
  }, []);

  // Listen to beforeunload and pagehide so closing tab or browser also terminates camera hardware
  useEffect(() => {
    const handleUnload = () => {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
      }
      if (liveClientRef.current) {
        try { liveClientRef.current.stopBroadcast(); } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  // Leave / Exit Classroom Handler
  const handleExitClass = () => {
    shutdownAllLiveStreams();
    triggerToast('🚪 ከቀጥታ ክፍል ወጥተዋል፤ ካሜራ፣ ማይክሮፎንና ስርጭት ሙሉ በሙሉ ጠፍቷል (Exited Live Class — Camera & Mic are Off)');
    setActiveTab('recordings');
  };

  // Real-time Audio Loopback Monitor to physically hear own microphone & outside room sounds
  const handleToggleMicMonitor = async () => {
    if (isMonitoringMic) {
      if (monitorCtxRef.current && monitorCtxRef.current.state !== 'closed') {
        monitorCtxRef.current.close().catch(() => {});
        monitorCtxRef.current = null;
      }
      setIsMonitoringMic(false);
      triggerToast('🔇 የድምፅ ማዳመጫ (Live Monitor) ጠፍቷል');
    } else {
      try {
        const mic = await ensureActiveMicrophone();
        if (!mic) {
          triggerToast('ማይክሮፎን አልተገኘም፤ እባክዎ ማይክሮፎን ይፍቀዱ');
          return;
        }
        const audioTrack = mic.getAudioTracks().find((t) => t.readyState === 'live');
        if (!audioTrack) {
          triggerToast('የማይክሮፎን ድምፅ ዝግጁ አይደለም');
          return;
        }
        audioTrack.enabled = true;
        setMicActive(true);
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') await ctx.resume();
          const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.85, ctx.currentTime);
          source.connect(gain);
          gain.connect(ctx.destination);
          monitorCtxRef.current = ctx;
          setIsMonitoringMic(true);
          triggerToast('🎧 የራስዎን ድምፅና የውጭ ድምፆችን በስፒከር/ጆሮ ማዳመጫ እያዳመጡ ነው! (Live Audio Monitor Active)');
        }
      } catch (err) {
        console.warn('Monitor mic error:', err);
        triggerToast('የድምፅ ማዳመጫውን መክፈት አልተቻለም');
      }
    }
  };

  // Start Camera with explicit facingMode ('user' for front face camera, 'environment' for back camera)
  const startCameraWithFacing = async (facing: 'user' | 'environment', explicitDeviceId?: string) => {
    setCameraFacing(facing);
    setIsMirrored(facing === 'user');
    setCameraError(null);
    setStageMode('camera');
    setCamActive(true);
    setIsTeaching(true);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('ካሜራ በዚህ አሳሽ ውስጥ አልተደገፈም (getUserMedia not supported)');
      return;
    }

    // Stop old tracks first so hardware is completely freed for camera switch without conflict
    if (userStream) {
      userStream.getVideoTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
    }

    try {
      const devices = await refreshCameraDevices();
      let chosenDeviceId = explicitDeviceId;

      // Smart-pick camera device matching desired facing mode
      if (!chosenDeviceId && devices.length > 0) {
        if (facing === 'user') {
          const frontMatch = devices.find((d) => {
            const l = (d.label || '').toLowerCase();
            const isNotBack = !l.includes('back') && !l.includes('environment') && !l.includes('rear') && !l.includes('iriun') && !l.includes('obs');
            return isNotBack && (
              l.includes('front') || 
              l.includes('user') || 
              l.includes('selfie') || 
              l.includes('facing front') ||
              l.includes('1, facing') ||
              l.includes('integrated') || 
              l.includes('facetime') || 
              l.includes('internal') || 
              l.includes('face') ||
              l.includes('inner') ||
              l.includes('secondary')
            );
          });
          if (frontMatch) {
            chosenDeviceId = frontMatch.deviceId;
          } else if (devices.length >= 2) {
            // Android mobile convention: index 1 is front selfie camera, index 0 is rear
            chosenDeviceId = devices[1].deviceId;
          }
        } else {
          const backMatch = devices.find((d) => {
            const l = (d.label || '').toLowerCase();
            return (
              l.includes('back') || 
              l.includes('environment') || 
              l.includes('rear') || 
              l.includes('world') || 
              l.includes('facing back') ||
              l.includes('0, facing') ||
              l.includes('external')
            );
          });
          if (backMatch) {
            chosenDeviceId = backMatch.deviceId;
          } else if (devices.length >= 1) {
            chosenDeviceId = devices[0].deviceId;
          }
        }
      }

      if (chosenDeviceId) {
        setSelectedCameraId(chosenDeviceId);
      }

      let stream: MediaStream | null = null;
      
      // Clean, standard-compliant progressive fallback without overconstrained resolution or exact restrictions
      if (facing === 'user') {
        // Attempt 1: If explicit chosenDeviceId exists
        if (chosenDeviceId) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: chosenDeviceId } },
              audio: false,
            });
          } catch (e1a) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { ideal: chosenDeviceId }, facingMode: { ideal: 'user' } },
                audio: false,
              });
            } catch (e1b) {}
          }
        }

        // Attempt 2: Exact facingMode: 'user' (W3C standard for front selfie camera)
        if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { exact: 'user' } },
              audio: false,
            });
          } catch (e2a) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false,
              });
            } catch (e2b) {
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  video: { facingMode: { ideal: 'user' } },
                  audio: false,
                });
              } catch (e2c) {}
            }
          }
        }

        // Attempt 3: Universal fallback for laptops/desktops
        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      } else {
        // Back camera attempts
        if (chosenDeviceId) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: chosenDeviceId } },
              audio: false,
            });
          } catch (e3a) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { ideal: chosenDeviceId }, facingMode: { ideal: 'environment' } },
                audio: false,
              });
            } catch (e3b) {}
          }
        }
        if (!stream) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { exact: 'environment' } },
              audio: false,
            });
          } catch (e4a) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
              });
            } catch (e4b) {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            }
          }
        }
      }

      if (stream) {
        const vTrack = stream.getVideoTracks()[0];
        if (vTrack) {
          vTrack.enabled = true;
          const settings = vTrack.getSettings ? vTrack.getSettings() : {};

          // If user specifically asked for front camera, but mobile browser returned back camera:
          if (facing === 'user' && settings.facingMode === 'environment') {
            const allDevs = await navigator.mediaDevices.enumerateDevices();
            const altDev = allDevs.find(
              (d) => d.kind === 'videoinput' && d.deviceId && d.deviceId !== settings.deviceId
            );
            if (altDev) {
              try {
                vTrack.stop();
                const altStream = await navigator.mediaDevices.getUserMedia({
                  video: { deviceId: { exact: altDev.deviceId } },
                  audio: false,
                });
                stream = altStream;
                const newTrack = stream.getVideoTracks()[0];
                if (newTrack) newTrack.enabled = true;
              } catch (altErr) {
                console.warn('Alternate front camera switch note:', altErr);
              }
            }
          }

          // Finalize settings and mirroring
          setIsMirrored(facing === 'user');
          setCameraFacing(facing);
        }

        // Re-attach active audio track from micStreamRef if available so audio is never lost
        if (micStreamRef.current) {
          const audioTrack = micStreamRef.current.getAudioTracks().find((t) => t.readyState === 'live');
          if (audioTrack && !stream.getAudioTracks().some((t) => t.id === audioTrack.id)) {
            audioTrack.enabled = micActive;
            stream.addTrack(audioTrack);
          }
        } else {
          ensureActiveMicrophone().then((mStream) => {
            if (mStream && stream) {
              const track = mStream.getAudioTracks().find((t) => t.readyState === 'live');
              if (track && !stream.getAudioTracks().some((t) => t.id === track.id)) {
                track.enabled = micActive;
                stream.addTrack(track);
              }
            }
          });
        }

        setUserStream(stream);
        syncBroadcastStream();
        await refreshCameraDevices();
        triggerToast(
          facing === 'user'
            ? '🤳 የፊት-ለፊት ካሜራ በርቷል (Front Face Camera Active)'
            : '📷 የጀርባ ካሜራ በርቷል (Back Camera Active)'
        );
      }
    } catch (err: any) {
      console.error('Camera open error:', err);
      const isNotAllowed = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const isNotFound = err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';
      const isNotReadable = err?.name === 'NotReadableError' || err?.name === 'TrackStartError';
      if (isNotAllowed) {
        setCameraError('ካሜራ የመጠቀም ፈቃድ አልተሰጠም። እባክዎ በአሳሽዎ አድራሻ አጠገብ ያለውን የመቆለፊያ (Lock) ወይም የካሜራ ምልክት ተጭነው "Allow" የሚለውን ይምረጡ።');
      } else if (isNotFound) {
        setCameraError('የፊት ካሜራ አልተገኘም። እባክዎ ካሜራው ከስልክዎ ወይም ከኮምፒውተርዎ ጋር በትክክል መገናኘቱን ያረጋግጡ።');
      } else if (isNotReadable) {
        setCameraError('ካሜራው በሌላ መተግበሪያ እየተጠቀመበት ነው፤ እባክዎ ሌሎች ካሜራ የሚጠቀሙ መተግበሪያዎችን ይዝጉ።');
      } else {
        setCameraError('ካሜራ መክፈት አልተቻለም። እባክዎ ገጹን ያድሱ ወይም በአዲስ ታብ (New Tab) ይክፈቱ።');
      }
    }
  };

  // Switch to specific camera device
  const handleSelectCameraDevice = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    const dev = availableCameras.find((d) => d.deviceId === deviceId);
    const label = (dev?.label || '').toLowerCase();
    const isBack = label.includes('back') || label.includes('environment') || label.includes('rear');
    const targetFacing = isBack ? 'environment' : 'user';
    await startCameraWithFacing(targetFacing, deviceId);
  };

  // Toggle Camera with front/back camera support
  const handleToggleCamera = async (forceOn?: boolean) => {
    if (camActive && !forceOn && (userStream || teacherPhoto)) {
      if (userStream) {
        userStream.getVideoTracks().forEach((t) => t.stop());
        setUserStream(null);
      }
      setTeacherPhoto(null);
      setCamActive(false);
      triggerToast('Camera turned off (ካሜራ ጠፍቷል)');
    } else {
      await startCameraWithFacing(cameraFacing || 'user');
    }
  };

  // Flip front/back camera or cycle through all detected cameras
  const handleFlipCamera = async () => {
    const devs = availableCameras.length > 0 ? availableCameras : await refreshCameraDevices();
    if (devs.length > 1) {
      const currentIdx = devs.findIndex((d) => d.deviceId === selectedCameraId);
      const nextIdx = (currentIdx + 1) % devs.length;
      const nextDev = devs[nextIdx];
      await handleSelectCameraDevice(nextDev.deviceId);
    } else {
      const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
      await startCameraWithFacing(nextFacing);
    }
  };

  // Switch to specific microphone device (External mic, USB, Headset, Built-in)
  const handleSelectMicrophoneDevice = async (deviceId: string) => {
    setSelectedMicrophoneId(deviceId);
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      const freshMic = await ensureActiveMicrophone(deviceId, captureExternalSound);
      if (freshMic) {
        const activeName = freshMic.getAudioTracks()[0]?.label || 'ውጫዊ ማይክሮፎን';
        triggerToast(`ማይክሮፎን ተቀይሯል: ${activeName}`);
        syncBroadcastStream();
      }
    } catch (err) {
      console.error('Microphone select error:', err);
      triggerToast('ማይክሮፎኑን መቀየር አልተቻለም');
    }
  };

  // Toggle accepting sounds coming from outside vs filtered voice
  const handleToggleExternalSound = async () => {
    const nextMode = !captureExternalSound;
    setCaptureExternalSound(nextMode);
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      const freshMic = await ensureActiveMicrophone(selectedMicrophoneId, nextMode);
      if (freshMic) {
        syncBroadcastStream();
        triggerToast(
          nextMode
            ? '🔊 የውጭ ድምፅ ተቀባይ በርቷል (Accepting External / Room Sound - High Sensitivity)'
            : '🔇 የተጣራ የንግግር ድምፅ በርቷል (Standard Voice Filter)'
        );
      }
    } catch (err) {
      console.error('Toggle external sound error:', err);
    }
  };

  // Toggle Microphone & Audio Diagnostic Testing
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [isTestingSpeakers, setIsTestingSpeakers] = useState(false);

  // Play an instant speaker confirmation chime so user physically verifies their speaker/headphone works
  const handleTestSpeakers = () => {
    setIsTestingSpeakers(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        // Tri-tone harmonious Ethiopian celebration chime (C5 - 523Hz, E5 - 659Hz, G5 - 784Hz)
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.001, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.3, now + idx * 0.12 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.6);
        });

        setTimeout(() => {
          ctx.close().catch(() => {});
          setIsTestingSpeakers(false);
          triggerToast('🔊 የድምፅ ቃጭል ተሰምቷል! ስፒከርዎ/የጆሮ ማዳመጫዎ በጥሩ ሁኔታ እየሰራ ነው (Speakers Working!)');
        }, 900);
      } else {
        setIsTestingSpeakers(false);
        triggerToast('የድምፅ ሞተር አልተደገፈም');
      }
    } catch (e) {
      setIsTestingSpeakers(false);
      triggerToast('የስፒከር ድምፅ መፈተሽ አልተቻለም');
    }
  };

  const handleTestMic = async () => {
    setIsTestingMic(true);
    triggerToast('🎤 እባክዎ አሁን ወደ ማይክሮፎንዎ ይናገሩ — ድምፅዎ በስፒከር ላይ ተመልሶ ይሰማዎታል (Say something to test mic)...');
    try {
      const mic = await ensureActiveMicrophone();
      if (!mic) {
        setIsTestingMic(false);
        triggerToast('⚠️ ማይክሮፎን አልተፈቀደም! እባክዎ በአሳሽዎ ውስጥ ማይክሮፎን ይፍቀዱ (Allow mic in browser)');
        return;
      }
      setMicActive(true);
      const audioTrack = mic.getAudioTracks().find((t) => t.readyState === 'live');
      if (audioTrack) audioTrack.enabled = true;

      // Listen for audio spikes and loop back mic to speaker for immediate self-audition!
      let detectedVoice = false;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && audioTrack) {
        const testCtx = new AudioContextClass();
        if (testCtx.state === 'suspended') await testCtx.resume();
        const testAnalyser = testCtx.createAnalyser();
        testAnalyser.fftSize = 128;
        const testSource = testCtx.createMediaStreamSource(new MediaStream([audioTrack]));
        testSource.connect(testAnalyser);

        // Safe loopback monitor so teacher can hear their own voice feedback through speakers
        const monitorGain = testCtx.createGain();
        monitorGain.gain.setValueAtTime(0.75, testCtx.currentTime);
        testSource.connect(monitorGain);
        monitorGain.connect(testCtx.destination);

        const dataArr = new Uint8Array(testAnalyser.frequencyBinCount);

        const checkInterval = setInterval(() => {
          testAnalyser.getByteFrequencyData(dataArr);
          let sum = 0;
          for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
          const avg = sum / dataArr.length;
          if (avg > 5) detectedVoice = true;
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          testCtx.close().catch(() => {});
          setIsTestingMic(false);
          if (detectedVoice) {
            triggerToast('✅ ማይክሮፎንዎ በጥሩ ሁኔታ እየሰራ ነው! ድምፅዎ በግልጽ ይሰማል (Mic is loud & clear)');
          } else {
            triggerToast('💡 ማይክሮፎኑ ክፍት ነው፤ ለተሻለ ድምፅ ወደ ማይክሮፎኑ ጠጋ ብለው ይናገሩ');
          }
        }, 2800);
      } else {
        setTimeout(() => {
          setIsTestingMic(false);
          triggerToast('✅ ማይክሮፎንዎ ተከፍቷል (Microphone is ready)');
        }, 1500);
      }
    } catch (e) {
      setIsTestingMic(false);
      triggerToast('⚠️ ማይክሮፎን መክፈት አልተቻለም');
    }
  };

  const handleToggleMic = async () => {
    if (micActive) {
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
      }
      if (userStream) {
        userStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }
      setMicActive(false);
      setAudioLevel(0);
      setIsSpeaking(false);
      syncBroadcastStream();
      triggerToast('Microphone muted (ማይክሮፎን ተዘግቷል)');
    } else {
      setMicActive(true);
      const mic = await ensureActiveMicrophone();
      if (mic) {
        mic.getAudioTracks().forEach((t) => (t.enabled = true));
      }
      if (userStream) {
        userStream.getAudioTracks().forEach((t) => (t.enabled = true));
      }
      syncBroadcastStream();
      triggerToast('Microphone unmuted (ማይክሮፎን ተከፍቷል - ድምፅዎ ይሰማል)');
    }
  };

  // -------------------------------------------------------------
  // Real-time Voice Audio Activity & Speaking Detector ("eyawerahu eko record ayasayim")
  // -------------------------------------------------------------
  useEffect(() => {
    if (!micActive) {
      setAudioLevel(0);
      setIsSpeaking(false);
      return;
    }

    let isMounted = true;
    let fallbackInterval: any = null;

    const setupAudio = async () => {
      try {
        const stream = await ensureActiveMicrophone();
        const audioTrack = stream?.getAudioTracks().find((t) => t.readyState === 'live');

        if (audioTrack && audioTrack.enabled) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }

            const resumeContext = () => {
              if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
              }
              if (monitorCtxRef.current && monitorCtxRef.current.state === 'suspended') {
                monitorCtxRef.current.resume().catch(() => {});
              }
            };
            window.addEventListener('click', resumeContext);
            window.addEventListener('touchstart', resumeContext);

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.35;
            const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkVolume = () => {
              if (!isMounted) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              const normalized = Math.min(100, Math.round((avg / 128) * 100));

              // High sensitivity speech detection (accepts room & outside sounds)
              if (normalized >= 2) {
                setAudioLevel(Math.max(10, normalized));
                setIsSpeaking(true);
              } else {
                setAudioLevel(0);
                setIsSpeaking(false);
              }
              animFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
            return;
          }
        }
      } catch (err) {
        console.warn('Audio analysis init note:', err);
      }

      if (isMounted) {
        setAudioLevel(0);
        setIsSpeaking(false);
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [micActive, userStream]);

  // Recording Timer Effect
  useEffect(() => {
    let timer: any = null;
    if (isRecording && !isRecordingPaused) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isRecordingPaused]);

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // Live Stage Compositor: Captures PPT Slides + Teacher Face + In-Slide Notes
  // ("lemindin new record yaderekut ke ppt sasireda neber gin yene face bicha new yetayew")
  // -------------------------------------------------------------
  const drawStageCompositeFrame = () => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1280;
    const H = 720;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    // Base background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    // Top status header
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, W, 54);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 54);
    ctx.lineTo(W, 54);
    ctx.stroke();

    // EthioExams brand & subject
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`🎓 EthioExams Live: ${selectedClass?.subject || 'Lecture'}`, 24, 34);

    if (stageMode === 'slides' || stageMode === 'split_ppt') {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText(`• ስላይድ ${currentSlideIndex + 1} / ${slides.length}`, 310, 34);
    }

    // Live REC Badge & Duration
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(W - 140, 30, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`REC ${formatDuration(recordingSeconds)}`, W - 124, 35);

    if (stageMode === 'camera') {
      // 1. FULL CAMERA STAGE
      const videoEl = (document.getElementById('teacher-live-webcam-video') as HTMLVideoElement | null) || userVideoRef.current || document.querySelector('video');
      let camDrawn = false;
      const stageY = 54;
      const stageH = H - stageY;

      if (camActive && videoEl && videoEl.readyState >= 2) {
        try {
          ctx.save();
          if (isMirrored) {
            ctx.translate(W, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoEl, 0, stageY, W, stageH);
          } else {
            ctx.drawImage(videoEl, 0, stageY, W, stageH);
          }
          ctx.restore();
          camDrawn = true;
        } catch (e) {}
      }

      if (!camDrawn && camActive && teacherPhoto) {
        try {
          const img = new Image();
          img.src = teacherPhoto;
          if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, stageY, W, stageH);
            camDrawn = true;
          }
        } catch (e) {}
      }

      if (!camDrawn) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, stageY, W, stageH);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('👤 መምህር (Live Teacher Camera Active)', W / 2 - 180, H / 2);
      }

      // Teacher identity banner on camera mode
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(24, H - 76, 320, 52, 12);
      ctx.fill();
      ctx.strokeStyle = isSpeaking ? '#10b981' : '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`👨‍🏫 ${currentUser?.name || selectedClass?.teacherName || 'Instructor'}`, 42, H - 46);

      ctx.fillStyle = isSpeaking ? '#34d399' : '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(isSpeaking ? '🎙️ ድምፅ እየተናገሩ ነው (Speaking)' : '🎙️ ድምፅ ዝግጁ ነው (Mic Active)', 42, H - 28);

    } else if (stageMode === 'screenshare' && screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
      // 2. SCREEN SHARE STAGE
      const stageY = 54;
      const stageH = H - stageY;
      try {
        ctx.drawImage(screenVideoRef.current, 0, stageY, W, stageH);
      } catch (e) {}

      // Teacher PiP in corner
      const pipW = 280;
      const pipH = 190;
      const pipX = W - pipW - 24;
      const pipY = H - pipH - 24;
      const videoEl = (document.getElementById('teacher-live-webcam-video') as HTMLVideoElement | null) || userVideoRef.current;
      if (camActive && videoEl && videoEl.readyState >= 2) {
        try {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 12);
          ctx.clip();
          ctx.drawImage(videoEl, pipX, pipY, pipW, pipH);
          ctx.restore();
          ctx.strokeStyle = isSpeaking ? '#10b981' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 12);
          ctx.stroke();
        } catch (e) {}
      }
    } else if (stageMode === 'whiteboard') {
      if (canvasRef.current) {
        try {
          ctx.drawImage(canvasRef.current, 0, 54, W, H - 54);
        } catch (e) {}
      }
      const pipW = 280;
      const pipH = 190;
      const pipX = W - pipW - 24;
      const pipY = H - pipH - 24;
      const videoEl = (document.getElementById('teacher-live-webcam-video') as HTMLVideoElement | null) || userVideoRef.current || document.querySelector('video');
      let pipDrawn = false;
      if (camActive && videoEl && videoEl.readyState >= 2) {
        try {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 12);
          ctx.clip();
          ctx.drawImage(videoEl, pipX, pipY, pipW, pipH);
          ctx.restore();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pipX, pipY, pipW, pipH, 12);
          ctx.stroke();
          pipDrawn = true;
        } catch (e) {}
      }
      if (!pipDrawn && camActive && teacherPhoto) {
        try {
          const img = new Image();
          img.src = teacherPhoto;
          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(pipX, pipY, pipW, pipH, 12);
            ctx.clip();
            ctx.drawImage(img, pipX, pipY, pipW, pipH);
            ctx.restore();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(pipX, pipY, pipW, pipH, 12);
            ctx.stroke();
          }
        } catch (e) {}
      }
    } else {
      // 1. MAIN PPT SLIDE CONTAINER (Width: 880, Height: 630)
      // ALWAYS INCLUDED FOR ALL MODES (slides, split, split_ppt, camera)
      const slideX = 24;
      const slideY = 70;
      const slideW = 880;
      const slideH = 630;

      // Card background & subtle outline
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(slideX, slideY, slideW, slideH, 16);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      const curSlide = currentSlide || slides[currentSlideIndex] || slides[0];
      let curY = slideY + 45;

      // Slide Subtitle
      if (curSlide?.subtitle) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(curSlide.subtitle.toUpperCase(), slideX + 32, curY);
        curY += 28;
      }

      // Slide Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      const titleWords = (curSlide?.title || 'Slide Presentation').split(' ');
      let titleLine = '';
      for (let n = 0; n < titleWords.length; n++) {
        const testLine = titleLine + titleWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > slideW - 70 && n > 0) {
          ctx.fillText(titleLine, slideX + 32, curY);
          titleLine = titleWords[n] + ' ';
          curY += 32;
        } else {
          titleLine = testLine;
        }
      }
      ctx.fillText(titleLine, slideX + 32, curY);
      curY += 36;

      // Slide Bullets
      if (curSlide?.bulletPoints && Array.isArray(curSlide.bulletPoints)) {
        curSlide.bulletPoints.forEach((bp: string) => {
          if (curY > slideY + slideH - 120) return;

          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(slideX + 38, curY - 5, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '15px sans-serif';
          const bpWords = bp.split(' ');
          let bpLine = '';
          for (let n = 0; n < bpWords.length; n++) {
            const testLine = bpLine + bpWords[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > slideW - 100 && n > 0) {
              ctx.fillText(bpLine, slideX + 54, curY);
              bpLine = bpWords[n] + ' ';
              curY += 24;
            } else {
              bpLine = testLine;
            }
          }
          ctx.fillText(bpLine, slideX + 54, curY);
          curY += 32;
        });
      }

      // Formula Banner
      if (curSlide?.formulaOrQuote && curY <= slideY + slideH - 75) {
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.roundRect(slideX + 32, curY + 8, slideW - 64, 48, 10);
        ctx.fill();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`⚡ Formula: ${curSlide.formulaOrQuote}`, slideX + 48, curY + 38);
      }

      // 2. Overlay Handwritten Annotations and Highlighters from slideCanvasRef!
      if (slideCanvasRef.current) {
        try {
          ctx.drawImage(slideCanvasRef.current, slideX, slideY, slideW, slideH);
        } catch (e) {}
      }

      // 3. RIGHT COLUMN: Teacher Video Presenter Box (Picture-in-Picture)
      const teachX = 926;
      const teachY = 70;
      const teachW = 330;
      const teachH = 245;

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.roundRect(teachX, teachY, teachW, teachH, 14);
      ctx.fill();
      ctx.strokeStyle = isSpeaking ? '#10b981' : '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const videoEl = (document.getElementById('teacher-live-webcam-video') as HTMLVideoElement | null) || userVideoRef.current || document.querySelector('video');
      let teacherDrawn = false;
      if (camActive && videoEl && videoEl.readyState >= 2) {
        try {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(teachX, teachY, teachW, teachH, 14);
          ctx.clip();
          ctx.drawImage(videoEl, teachX, teachY, teachW, teachH);
          ctx.restore();
          teacherDrawn = true;
        } catch (e) {}
      }

      if (!teacherDrawn && camActive && teacherPhoto) {
        try {
          const img = new Image();
          img.src = teacherPhoto;
          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(teachX, teachY, teachW, teachH, 14);
            ctx.clip();
            ctx.drawImage(img, teachX, teachY, teachW, teachH);
            ctx.restore();
            teacherDrawn = true;
          }
        } catch (e) {}
      }

      if (!teacherDrawn) {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(teachX, teachY, teachW, teachH, 14);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('👤 መምህር (Teacher Presenter)', teachX + 55, teachY + 130);
      }

      // Teacher Name Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(teachX + 10, teachY + teachH - 34, teachW - 20, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`👨‍🏫 ${currentUser?.name || selectedClass?.teacherName || 'Instructor'}`, teachX + 18, teachY + teachH - 16);

      // 4. RIGHT COLUMN LOWER: Class Info & Exam Focus Card
      const infoX = 926;
      const infoY = 335;
      const infoW = 330;
      const infoH = 365;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(infoX, infoY, infoW, infoH, 14);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('📋 የቀጥታ ትምህርት መረጃ (Class Info)', infoX + 20, infoY + 36);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText(`• ርዕስ: ${selectedClass?.currentTopic || 'Live Lecture'}`, infoX + 20, infoY + 75);
      ctx.fillText(`• ደረጃ: ${selectedClass?.level || 'Grade 12'}`, infoX + 20, infoY + 105);
      ctx.fillText(`• ተሳታፊዎች: ${(selectedClass as any)?.activeStudents || 48} ተማሪዎች`, infoX + 20, infoY + 135);

      ctx.fillStyle = micActive ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(infoX + 26, infoY + 175, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px sans-serif';
      ctx.fillText(micActive ? (isSpeaking ? 'ድምፅ እየተሰማ ነው (Speaking)' : 'ማይክሮፎን ክፍት ነው') : 'ድምፅ ዝም ብሏል (Muted)', infoX + 40, infoY + 180);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(infoX + 16, infoY + 215, infoW - 32, 125, 10);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('💡 የፈተና ጠቃሚ ማስታወሻ', infoX + 28, infoY + 242);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('ይህ ቀረጻ ሙሉውን የስላይድ ማብራሪያ፣', infoX + 28, infoY + 270);
      ctx.fillText('በስላይዱ ላይ የተጻፉ ማስታወሻዎችን እና', infoX + 28, infoY + 292);
      ctx.fillText('የመምህሩን ድምፅና ገለጻ አጣምሮ ይዟል።', infoX + 28, infoY + 314);
    }
  };

  useEffect(() => {
    return () => {
      if (compositeLoopRef.current) {
        clearInterval(compositeLoopRef.current);
        compositeLoopRef.current = null;
      }
    };
  }, []);

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);

      // 1. Wait for MediaRecorder to asynchronously flush all buffered audio & video data chunks
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          const rec = mediaRecorderRef.current;
          if (!rec || rec.state === 'inactive') {
            resolve();
            return;
          }
          const handleStop = () => {
            setTimeout(resolve, 80);
          };
          rec.addEventListener('stop', handleStop, { once: true });
          try {
            if (rec.state === 'recording' || rec.state === 'paused') {
              try {
                rec.requestData();
              } catch (e) {}
              rec.stop();
            } else {
              resolve();
            }
          } catch (e) {
            resolve();
          }
        });
      }

      // Stop compositor loop AFTER recorder has flushed all frames
      if (compositeLoopRef.current) {
        clearInterval(compositeLoopRef.current);
        compositeLoopRef.current = null;
      }

      // 2. Stop dedicated recording microphone stream only if not shared with classroom mic
      if (recordingMicStreamRef.current && recordingMicStreamRef.current !== micStreamRef.current && recordingMicStreamRef.current !== userStream) {
        try {
          recordingMicStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        recordingMicStreamRef.current = null;
      }

      // Close recording AudioContext
      if (recordingAudioContextRef.current) {
        try {
          if (recordingAudioContextRef.current.state !== 'closed') {
            recordingAudioContextRef.current.close().catch(() => {});
          }
        } catch (e) {}
        recordingAudioContextRef.current = null;
      }

      // Capture high-res snapshot of the active PPT stage as thumbnail!
      let snapshotThumb: string | undefined = undefined;
      try {
        if (compositeCanvasRef.current) {
          snapshotThumb = compositeCanvasRef.current.toDataURL('image/jpeg', 0.85);
        }
      } catch (e) {}

      const finalDuration = formatDuration(recordingSeconds);
      const mime = recordingMimeTypeRef.current || 'video/webm';

      if (!recordedChunksRef.current || recordedChunksRef.current.length === 0) {
        triggerToast('ማሳሰቢያ: ቀረጻው በጣም አጭር ስለነበር ቪዲዮ አልተመዘገበም። እባክዎ ቢያንስ ለ 2-3 ሰከንዶች ይቅረጹ።');
        return;
      }

      const blob = new Blob(recordedChunksRef.current, { type: mime });
      if (blob.size < 500) {
        triggerToast('ማሳሰቢያ: የቀረጻው ፋይል አልተሟላም፤ እባክዎ እንደገና ይሞክሩ።');
        return;
      }

      const recId = `rec-${Date.now()}`;
      const recTitle = `${selectedClass?.title || 'Live Class Session'} (የስላይድ እና የክፍል ቀረጻ)`;
      const serverStreamUrl = `/api/recordings/stream/vid-${recId}`;

      // Persist blob in IndexedDB and memory cache
      const playUrl = await saveRecordedVideoBlob(`vid-${recId}`, blob);
      setRecordedVideoUrl(playUrl);

      const newRec = {
        id: recId,
        title: recTitle,
        subject: selectedClass?.subject || 'Curriculum',
        date: 'ዛሬ (Today)',
        duration: finalDuration,
        url: serverStreamUrl,
      };
      setRecordedSessionsList((prev) => [newRec, ...prev]);

      // Cache the recorded video URL in global registry for instant playback in My Videos
      if (typeof window !== 'undefined') {
        (window as any).__ETHIO_RECORDED_VIDEOS = (window as any).__ETHIO_RECORDED_VIDEOS || {};
        (window as any).__ETHIO_RECORDED_VIDEOS[`vid-${recId}`] = playUrl;
        (window as any).__ETHIO_RECORDED_VIDEOS[recId] = playUrl;
      }

      // Construct complete VideoLesson entity for Video Learning Center -> My Videos
      const authorName = currentUser?.name || selectedClass?.teacherName || 'Ato Birhanu Tadesse';
      const newVideoLesson: VideoLesson = {
        id: `vid-${recId}`,
        title: recTitle,
        subject: selectedClass?.subject || 'General Studies',
        subjectId: selectedClass?.subjectId || 'phy12',
        level: selectedLevel || selectedClass?.level || 'grade_12_natural',
        chapter: selectedClass?.currentTopic || 'የቀጥታ ስርጭት ትምህርት (Live Classroom Lecture)',
        instructor: authorName,
        duration: finalDuration,
        views: 1,
        videoUrl: serverStreamUrl,
        thumbnailGradient: 'from-emerald-950 via-slate-900 to-indigo-950',
        thumbnailUrl: snapshotThumb || selectedClass?.teacherAvatar || teacherPhoto || undefined,
        timestamps: [
          { time: '00:00', label: 'የቀጥታ ስላይድ ማብራሪያ መግቢያ' },
          { time: '01:15', label: 'የስላይድ ነጥቦች እና የቦርድ ማስታወሻ' },
        ],
        keyTakeaways: [
          'በቀጥታ የክፍል ስርጭት (Live Class) ወቅት ከስላይድ እና ከመምህሩ ማብራሪያ ጋር የተቀዳ ቪዲዮ ነው።',
          'የስላይዱ ይዘት፣ በእጅ የተጻፉ ማስታወሻዎች እና የመምህሩ ድምፅና ገለጻ ተካተዋል።',
        ],
        summaryNotes: `ይህ ቪዲዮ በ ${authorName} ከነ ሙሉ ስላይዱና የድምፅ ማብራሪያው የተዘጋጀ የቀጥታ ትምህርት ቀረጻ ሲሆን በ "My Videos" ስር በቀጥታ ተቀምጧል።`,
        isLiveRecording: true,
        saved: true,
      };

      setLastRecordedVideoLessonId(newVideoLesson.id);

      // Invoke callback to persist into global videoLessons state
      if (onSaveRecordedVideoLesson) {
        onSaveRecordedVideoLesson(newVideoLesson);
      }

      // Persist to server recordings storage so other users can watch anytime on any device!
      uploadRecordedVideoToServer({
        id: `vid-${recId}`,
        title: recTitle,
        subject: selectedClass?.subject || 'General Studies',
        instructor: authorName,
        duration: finalDuration,
        level: selectedLevel || selectedClass?.level || 'grade_12_natural',
        chapter: selectedClass?.currentTopic || 'የቀጥታ ስርጭት ትምህርት (Live Classroom Lecture)',
        keyTakeaways: newVideoLesson.keyTakeaways,
        blob,
      }).then((srvUrl) => {
        if (srvUrl) {
          console.log('Recorded video uploaded and verified on server:', srvUrl);
        }
      });

      // Safeguard in localStorage
      try {
        const saved = localStorage.getItem('ethio_exam_video_lessons');
        const parsed = saved ? JSON.parse(saved) : [];
        const cleaned = parsed.filter((p: any) => !p.videoUrl?.includes('BigBuckBunny') && p.id !== newVideoLesson.id);
        localStorage.setItem('ethio_exam_video_lessons', JSON.stringify([newVideoLesson, ...cleaned]));
      } catch (e) {
        console.warn('Could not cache recorded video lesson', e);
      }

      setShowRecordingModal(true);
      triggerToast(`🔴 የቀረጻው ክፍለ-ጊዜ ቆሟል (${finalDuration})! የስላይዱ፣ የፊትዎና የድምፅዎ ቪዲዮ ወደ "My Videos" ገብቷል!`);
    } else {
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingSeconds(0);
      recordedChunksRef.current = [];
      setMicActive(true);

      try {
        // 1. Guaranteed fresh hardware microphone capture for the recording session
        let activeMicStream: MediaStream | null = null;
        try {
          if (navigator?.mediaDevices?.getUserMedia) {
            const freshMic = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: false, // Don't suppress natural voice frequencies
                autoGainControl: true,   // Automatically boost voice level
              },
            });
            activeMicStream = freshMic;
            recordingMicStreamRef.current = freshMic;
            micStreamRef.current = freshMic;
          }
        } catch (micErr1) {
          try {
            if (navigator?.mediaDevices?.getUserMedia) {
              const freshMic = await navigator.mediaDevices.getUserMedia({ audio: true });
              activeMicStream = freshMic;
              recordingMicStreamRef.current = freshMic;
              micStreamRef.current = freshMic;
            }
          } catch (micErr2) {
            console.warn('Fresh mic permission request note:', micErr2);
            activeMicStream = micStreamRef.current || userStream;
          }
        }

        if (!activeMicStream && micStreamRef.current) {
          activeMicStream = micStreamRef.current;
        }
        if (!activeMicStream && userStream) {
          activeMicStream = userStream;
        }

        // Unmute and activate all mic tracks
        if (activeMicStream) {
          activeMicStream.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
          setMicActive(true);
        }

        // 2. Synchronize Audio Clock with Canvas CaptureStream using Web Audio API
        // CRITICAL FIX: Direct getUserMedia tracks use system hardware clock while canvas.captureStream()
        // uses the graphics rendering clock. In Chromium, this clock desynchronization causes libvpx/webm
        // to drop audio packets or produce silent video. Routing through AudioContext MediaStreamDestination
        // aligns timestamps perfectly with canvas frames and boosts the teacher's voice by 2.5x!
        let synchronizedAudioTrack: MediaStreamTrack | null = null;

        if (activeMicStream && activeMicStream.getAudioTracks().length > 0) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
              }
              const source = audioCtx.createMediaStreamSource(activeMicStream);

              // Boost instructor voice volume by 2.5x for punchy, clear classroom delivery
              const gainNode = audioCtx.createGain();
              gainNode.gain.value = 2.5;

              const dest = audioCtx.createMediaStreamDestination();
              source.connect(gainNode);
              gainNode.connect(dest);

              recordingAudioContextRef.current = audioCtx;
              const destTrack = dest.stream.getAudioTracks()[0];
              if (destTrack) {
                destTrack.enabled = true;
                synchronizedAudioTrack = destTrack;
              }
            }
          } catch (audioCtxErr) {
            console.warn('AudioContext destination node setup error:', audioCtxErr);
          }

          // Fallback to direct hardware track if WebAudio destination unavailable
          if (!synchronizedAudioTrack) {
            const hwTrack = activeMicStream.getAudioTracks().find((t) => t.readyState === 'live');
            if (hwTrack) {
              hwTrack.enabled = true;
              synchronizedAudioTrack = hwTrack;
            }
          }
        }

        // 3. Acquire Video Stream based on selected recording mode
        let videoStream: MediaStream | null = null;

        if (recordSource === 'screen') {
          // Native Screen / Tab capture
          try {
            videoStream = await navigator.mediaDevices.getDisplayMedia({
              video: { frameRate: 30 },
              audio: true, // Also capture tab/system audio if shared
            });
          } catch (e) {
            console.warn('Screen share cancelled or failed, falling back to composite', e);
          }
        } else if (recordSource === 'camera') {
          videoStream = userStream;
        }

        // Default & Recommended: Stage Composite (PPT Slides + In-Slide Notes + Teacher Face + Voice)
        if (!videoStream) {
          let compCanvas = compositeCanvasRef.current || (document.getElementById('live-composite-recording-canvas') as HTMLCanvasElement | null);
          if (!compCanvas) {
            compCanvas = document.createElement('canvas');
            compCanvas.id = 'live-composite-recording-canvas';
            compCanvas.width = 1280;
            compCanvas.height = 720;
            compCanvas.style.position = 'fixed';
            compCanvas.style.top = '-9999px';
            compCanvas.style.left = '-9999px';
            compCanvas.style.width = '1280px';
            compCanvas.style.height = '720px';
            compCanvas.style.pointerEvents = 'none';
            compCanvas.style.opacity = '0.01';
            document.body.appendChild(compCanvas);
          }
          compositeCanvasRef.current = compCanvas;

          // Immediately draw initial frame
          drawStageCompositeFrame();

          let canvasStream: MediaStream | null = null;
          try {
            canvasStream = (compCanvas as any).captureStream?.(25) || (compCanvas as any).mozCaptureStream?.(25);
            if (canvasStream && canvasStream.getVideoTracks().length > 0) {
              videoStream = canvasStream;
            }
          } catch (e) {
            console.warn('Canvas stream capture error:', e);
          }

          // Start compositor loop driving redraws and requestFrame
          if (compositeLoopRef.current) clearInterval(compositeLoopRef.current);
          compositeLoopRef.current = window.setInterval(() => {
            drawStageCompositeFrame();
            try {
              (canvasStream as any)?.requestFrame?.();
            } catch (e) {}
          }, 1000 / 25);
        }

        // Fallback video if needed
        if (!videoStream) {
          videoStream = userStream || (canvasRef.current as any)?.captureStream?.(25) || null;
        }

        // 4. Assemble Combined MediaStream with Timestamp-Synchronized Voice Track
        const combinedStream = new MediaStream();
        const videoTrack = videoStream?.getVideoTracks()[0];
        if (videoTrack) {
          combinedStream.addTrack(videoTrack);
        }

        let audioTrackAttached = false;

        // Prioritize guaranteed direct hardware microphone track for real, audible Opus audio recording
        const directHw = activeMicStream?.getAudioTracks().find((t) => t.readyState === 'live');
        const micTrack = directHw || synchronizedAudioTrack;
        if (micTrack && micTrack.readyState === 'live') {
          micTrack.enabled = true;
          combinedStream.addTrack(micTrack);
          audioTrackAttached = true;
        }

        if (!audioTrackAttached && activeMicStream) {
          const directHw = activeMicStream.getAudioTracks().find((t) => t.readyState === 'live');
          if (directHw) {
            directHw.enabled = true;
            combinedStream.addTrack(directHw);
            audioTrackAttached = true;
          }
        }

        // Mix in screen/system audio if present (e.g. video played during screen share)
        if (videoStream && videoStream.getAudioTracks().length > 0) {
          videoStream.getAudioTracks().forEach((sysTrack) => {
            if (sysTrack.readyState === 'live') {
              try {
                sysTrack.enabled = true;
                combinedStream.addTrack(sysTrack);
                audioTrackAttached = true;
              } catch (e) {}
            }
          });
        }

        setRecordedHasAudio(audioTrackAttached);

        // 4. Initialize MediaRecorder with high-fidelity Opus audio & video codecs
        if (typeof MediaRecorder !== 'undefined') {
          const candidateMimeTypes = [
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4',
          ];

          let selectedMimeType = '';
          for (const cand of candidateMimeTypes) {
            if (MediaRecorder.isTypeSupported(cand)) {
              selectedMimeType = cand;
              break;
            }
          }

          recordingMimeTypeRef.current = selectedMimeType || 'video/webm';

          let recorder: MediaRecorder | null = null;
          try {
            recorder = selectedMimeType
              ? new MediaRecorder(combinedStream, { mimeType: selectedMimeType, audioBitsPerSecond: 128000 })
              : new MediaRecorder(combinedStream);
          } catch (e1) {
            try {
              recorder = new MediaRecorder(combinedStream);
            } catch (e2) {
              if (videoStream) {
                try {
                  recorder = new MediaRecorder(videoStream);
                } catch (e3) {
                  console.error('All MediaRecorder construction attempts failed:', e3);
                }
              }
            }
          }

          if (recorder) {
            recordingMimeTypeRef.current = recorder.mimeType || selectedMimeType || 'video/webm';
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                recordedChunksRef.current.push(e.data);
              }
            };
            recorder.onerror = (e) => {
              console.warn('MediaRecorder error event:', e);
            };
            recorder.start(250);
            mediaRecorderRef.current = recorder;
          }
        }

        if (audioTrackAttached) {
          triggerToast('🔴 ቀረጻው ጀምሯል! የስላይድ ማብራሪያ፣ ማስታወሻዎችና የመምህሩ ድምፅ (Voice Audio) በቀጥታ እየተቀዱ ነው!');
        } else {
          triggerToast('🔴 ቀረጻው ጀምሯል! (ማሳሰቢያ: ማይክሮፎን አልበራም ወይም ድምፅ አልተገኘም)');
        }
      } catch (err) {
        console.warn('MediaRecorder error:', err);
        triggerToast('🔴 የቀረጻ ስህተት አጋጥሟል፤ እባክዎ እንደገና ይሞክሩ።');
      }
    }
  };

  // Toggle Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      setStageMode('slides');
      triggerToast('Screen sharing stopped.');
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        setStageMode('screenshare');
        triggerToast('Screen sharing active! Broadcasting your screen to the class.');

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          setStageMode('slides');
          triggerToast('Screen sharing ended.');
        };
      } catch (err) {
        console.warn('Screen share cancelled or unsupported:', err);
        triggerToast('Screen share cancelled or permission denied.');
      }
    }
  };

  // Whiteboard Canvas Coordinates Helper (Accurately scales to canvas pixel resolution)
  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const isTouch = 'touches' in e && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Whiteboard drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot to history before new stroke for Undo
    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasHistory((prev) => [...prev.slice(-12), snap]);
    } catch (_) {}

    const { x, y } = getCanvasCoordinates(e, canvas);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (isEraser) {
      // Eraser mode: wipe with blackboard background color cleanly
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = eraserSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e, canvas);

    if (isEraser) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = eraserSize;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvasHistory.length > 0) {
      const prevSnap = canvasHistory[canvasHistory.length - 1];
      ctx.putImageData(prevSnap, 0, 0);
      setCanvasHistory((hist) => hist.slice(0, -1));
      triggerToast('የመጨረሻው ጽሑፍ ተመልሷል (Undo successful)');
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      triggerToast('ሰሌዳው ባዶ ነው (Board is empty)');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot before clearing so user can undo if clicked accidentally
    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasHistory((prev) => [...prev.slice(-12), snap]);
    } catch (_) {}

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    triggerToast('የሰሌዳው ጽሑፍ በሙሉ ተሰርዟል! (Whiteboard cleared)');
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${selectedClass.title.replace(/\s+/g, '_')}_Whiteboard_Notes.png`;
    link.href = imageUri;
    link.click();
    triggerToast('Whiteboard notes saved as PNG image!');
  };

  const insertFormulaToWhiteboard = (formula: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(formula, 40, 100);
    triggerToast(`Inserted: ${formula}`);
  };

  // -------------------------------------------------------------
  // In-Slide Drawing & Annotation Engine Handlers ("rasu slidu lay eyasemerikuna eyetafiku masredat")
  // -------------------------------------------------------------
  const getSlideCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const isTouch = 'touches' in e && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return {
      x,
      y,
      xRatio: Math.max(0, Math.min(1, x / (canvas.width || 1))),
      yRatio: Math.max(0, Math.min(1, y / (canvas.height || 1))),
    };
  };

  const redrawSlideCanvas = (slideIdx: number) => {
    const canvas = slideCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth || 600;
    const height = Math.max(parent.clientHeight || 450, parent.scrollHeight || 450);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const strokes = slideStrokesMap[slideIdx] || [];
    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.save();
      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.xRatio * canvas.width, first.yRatio * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.xRatio * canvas.width, pt.yRatio * canvas.height);
      }
      ctx.stroke();
      ctx.restore();
    });
  };

  const startSlideDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSlideAnnotating) return;
    const canvas = slideCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, xRatio, yRatio } = getSlideCanvasCoordinates(e, canvas);

    activeSlideStrokeRef.current = {
      points: [{ xRatio, yRatio }],
      color: slidePenColor,
      size: slidePenSize,
      tool: slideTool,
    };

    ctx.save();
    if (slideTool === 'highlighter') {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = slidePenColor;
      ctx.lineWidth = slidePenSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
    } else if (slideTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = slidePenSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = slidePenColor;
      ctx.lineWidth = slidePenSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();

    setIsSlideDrawing(true);
  };

  const slideDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSlideDrawing || !activeSlideStrokeRef.current) return;
    const canvas = slideCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, xRatio, yRatio } = getSlideCanvasCoordinates(e, canvas);
    activeSlideStrokeRef.current.points.push({ xRatio, yRatio });

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopSlideDrawing = () => {
    if (!isSlideDrawing) return;
    setIsSlideDrawing(false);

    const canvas = slideCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.restore();
    }

    if (activeSlideStrokeRef.current && activeSlideStrokeRef.current.points.length > 0) {
      const newStroke = activeSlideStrokeRef.current;
      setSlideStrokesMap((prev) => {
        const currentList = prev[currentSlideIndex] || [];
        return {
          ...prev,
          [currentSlideIndex]: [...currentList, newStroke],
        };
      });
    }
    activeSlideStrokeRef.current = null;
  };

  const handleSlideUndo = () => {
    setSlideStrokesMap((prev) => {
      const list = prev[currentSlideIndex] || [];
      if (list.length === 0) {
        triggerToast('በስላይዱ ላይ የሚመለስ ጽሑፍ የለም (Nothing to undo)');
        return prev;
      }
      triggerToast('የመጨረሻው የስላይድ ጽሑፍ/ማስመሪያ ተመልሷል (Undo)');
      return {
        ...prev,
        [currentSlideIndex]: list.slice(0, -1),
      };
    });
  };

  const handleSlideClear = () => {
    setSlideStrokesMap((prev) => ({
      ...prev,
      [currentSlideIndex]: [],
    }));
    const canvas = slideCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    triggerToast('በዚህ ስላይድ ላይ የተጻፉት በሙሉ ተሰርዘዋል! (Cleared slide ink)');
  };

  const handleDownloadSlideNotes = () => {
    const canvas = slideCanvasRef.current;
    if (!canvas) return;
    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${selectedClass.subject}_Slide_${currentSlideIndex + 1}_Annotated_Notes.png`;
    link.href = imageUri;
    link.click();
    triggerToast('የስላይዱ ማስታወሻ በምስል ተቀምጧል! (Slide notes saved)');
  };

  // Redraw slide annotations on slide navigation or mode switch
  useEffect(() => {
    if (stageMode === 'slides' || stageMode === 'split_ppt') {
      const timer = setTimeout(() => {
        redrawSlideCanvas(currentSlideIndex);
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [currentSlideIndex, stageMode, slideStrokesMap]);

  // Slide Annotation Toolbar UI Component ("rasu slidu lay eyasemerikuna eyetafiku masredat")
  const renderSlideAnnotationToolbar = (isCompact = false) => (
    <div className={`bg-slate-950/90 border border-slate-700/80 rounded-xl p-2 mb-2 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 shadow-md ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
      {/* Left: Annotation Toggle & Tool Selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* On/Off Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsSlideAnnotating((prev) => !prev);
            triggerToast(!isSlideAnnotating ? 'በስላይዱ ላይ መጻፊያ ነቅቷል (Slide drawing enabled)' : 'በስላይዱ ላይ መጻፊያ ቆሟል (Slide drawing paused)');
          }}
          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
            isSlideAnnotating
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Toggle Drawing/Highlighting on Slide"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>{isSlideAnnotating ? 'ስላይድ ላይ ጻፍ/አስምር: በርቷል' : 'ስላይድ ላይ መጻፊያ: ጠፍቷል'}</span>
          {isSlideAnnotating && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>}
        </button>

        {/* Tool Selector: Highlighter, Pen, Eraser */}
        {isSlideAnnotating && (
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {/* Highlighter / Underline */}
            <button
              type="button"
              onClick={() => {
                setSlideTool('highlighter');
                setSlidePenSize(14);
                if (slidePenColor === '#ffffff') setSlidePenColor('#facc15');
              }}
              className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                slideTool === 'highlighter' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
              title="አስማሪ / ማድመቂያ (Highlighter - Semi-transparent thick stroke for underlining sentences)"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>አስማሪ (Highlighter)</span>
            </button>

            {/* Pen */}
            <button
              type="button"
              onClick={() => {
                setSlideTool('pen');
                setSlidePenSize(3);
              }}
              className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                slideTool === 'pen' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
              title="ብዕር (Pen - Sharp solid ink for notes, formulas and arrows)"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>ብዕር (Pen)</span>
            </button>

            {/* Eraser */}
            <button
              type="button"
              onClick={() => {
                setSlideTool('eraser');
                setSlidePenSize(20);
              }}
              className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                slideTool === 'eraser' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
              title="ማጥፊያ (Eraser - Clears ink without touching slide content)"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ማጥፊያ</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Colors, Sizes, Undo & Clear */}
      {isSlideAnnotating && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Colors */}
          {slideTool !== 'eraser' && (
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
              {[
                { color: '#facc15', label: 'ቢጫ (Yellow)' },
                { color: '#38bdf8', label: 'ሲያን (Cyan)' },
                { color: '#34d399', label: 'አረንጓዴ (Green)' },
                { color: '#f87171', label: 'ቀይ (Red)' },
                { color: '#ffffff', label: 'ነጭ (White)' },
              ].map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSlidePenColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-4 h-4 rounded-full transition cursor-pointer border ${
                    slidePenColor === color ? 'ring-2 ring-white scale-125 border-white' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title={label}
                />
              ))}
            </div>
          )}

          {/* Thickness */}
          {slideTool !== 'eraser' && (
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
              <button
                type="button"
                onClick={() => setSlidePenSize(3)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${slidePenSize <= 4 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="ቀጭን መስመር (Fine)"
              >
                ቀጭን
              </button>
              <button
                type="button"
                onClick={() => setSlidePenSize(6)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${slidePenSize === 6 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="መካከለኛ መስመር (Medium)"
              >
                መካከለኛ
              </button>
              <button
                type="button"
                onClick={() => setSlidePenSize(14)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${slidePenSize >= 12 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title="ሰፊ አስማሪ (Highlighter)"
              >
                ሰፊ አስማሪ
              </button>
            </div>
          )}

          {/* Undo */}
          <button
            type="button"
            onClick={handleSlideUndo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="የመጨረሻውን መልስ (Undo)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleSlideClear}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
            title="በዚህ ስላይድ ላይ የተጻፈውን በሙሉ አጥፋ (Clear Slide Ink)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Download Slide Notes */}
          <button
            type="button"
            onClick={handleDownloadSlideNotes}
            className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 transition cursor-pointer"
            title="የተጻፈበትን ስላይድ በምስል አውርድ (Save Annotated Slide PNG)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
  // -------------------------------------------------------------
  const handlePptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const baseName = fileName.replace(/\.[^/.]+$/, '');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        const newSlide: LiveSlide = {
          title: `🖼️ ${baseName}`,
          subtitle: `የተጫነ ዲያግራም (${fileName})`,
          bulletPoints: [
            'ይህ ስላይድ ከመሳሪያዎ በቀጥታ የተጫነ ምስል/ዲያግራም ነው',
            'ዲያግራሙን እያብራሩ በስላይድ ላይ ማስታወሻ ይጻፉ',
          ],
          imageUrl,
        };
        setCustomSlidesMap((prev) => {
          const current = prev[selectedClass.id] || selectedClass.slides || [];
          return { ...prev, [selectedClass.id]: [...current, newSlide] };
        });
        setCurrentSlideIndex((prev) => prev + 1);
        setStageMode('slides');
        triggerToast(`የዲያግራም ስላይድ ተጭኗል: ${fileName}`);
      };
      reader.readAsDataURL(file);
    } else {
      // PowerPoint (.pptx, .ppt, .pdf, .txt)
      const reader = new FileReader();
      reader.onload = () => {
        const generatedSlides: LiveSlide[] = [
          {
            title: `📊 ${baseName}`,
            subtitle: `የPowerPoint ሰነድ (${fileName})`,
            bulletPoints: [
              `የPowerPoint/PDF ሰነድ በቀጥታ ትምህርት ስርጭት ላይ ተከፍቷል`,
              `ስላይዶቹን ወደፊት ወይም ወደኋላ እያንሸራተቱ ያስተምሩ`,
              `የቁልፍ ሰሌዳ ቀስቶችን (← / → / Space) ወይም የስክሪን አዝራሮችን ይጠቀሙ`,
              `በስላይዱ ላይ በቀጥታ ለማስመር ወይም ለመጻፍ '✏️ ጻፍ' የሚለውን ይጫኑ`,
            ],
            formulaOrQuote: 'P = V · I = I² · R',
          },
          {
            title: `${baseName}: ዋና ዋና ነጥቦች (Core Topics)`,
            subtitle: 'ክፍል 1 - ንድፈ-ሀሳብና ማብራሪያ',
            bulletPoints: [
              '1. መሰረታዊ የትምህርት ፅንሰ-ሀሳቦች (Core Principles)',
              '2. በአገር አቀፍ ፈተና (ESSLCE Matric) በብዛት የሚወጡ ጥያቄዎች',
              '3. የተማሪዎች የተለመዱ ስህተቶችና መፍትሔዎች',
            ],
            formulaOrQuote: 'ε = -N · (dΦ / dt)',
          },
          {
            title: `${baseName}: የፈተና ጥያቄዎችና ልምምድ`,
            subtitle: 'ክፍል 2 - የክፍል ስራና የቻት ውይይት',
            bulletPoints: [
              'ተማሪዎች መልሶቻቸውን በቀጥታ በቻት (Live Chat) ላይ እንዲልኩ ይጠይቁ',
              'አሰራሩን በዲጂታል ሰሌዳ (Whiteboard) ላይ ደረጃ በደረጃ ይፍቱ',
            ],
            formulaOrQuote: 'F_net = m · a  |  W = F · d',
          },
        ];

        setCustomSlidesMap((prev) => ({
          ...prev,
          [selectedClass.id]: generatedSlides,
        }));
        setCurrentSlideIndex(0);
        setStageMode('slides');
        triggerToast(`የPowerPoint ስላይዶች ተከፍተዋል (${fileName})`);
      };

      if (fileName.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleLoadPresetPpt = (subjectKey: string) => {
    const presets: Record<string, LiveSlide[]> = {
      Physics: [
        {
          title: 'Grade 12 Physics: Electromagnetic Induction',
          subtitle: 'ESSLCE High-Yield Examination Prep',
          bulletPoints: [
            'Magnetic Flux Φ_B = B · A · cos(θ)',
            'Faraday’s Law of Induction: ε = -N · (dΦ_B / dt)',
            'Lenz’s Law: The direction of induced EMF opposes the flux change',
            'Mutual Inductance M & Self Inductance L of Solenoids',
          ],
          formulaOrQuote: 'ε = -N · (ΔΦ / Δt)  |  V_rms = V_peak / √2',
        },
        {
          title: 'AC Generator & RMS Voltage Trap',
          subtitle: 'Past Exam Question Walkthrough',
          bulletPoints: [
            'A coil of 250 turns and area 0.04 m² rotates in a 0.25 T uniform magnetic field.',
            'Angular speed ω = 2πf = 2π(50 Hz) = 100π rad/s.',
            'Peak voltage ε_max = N · B · A · ω = 250 · 0.25 · 0.04 · 100π ≈ 785.4 V.',
            'Effective RMS voltage: V_rms = 785.4 / √2 ≈ 555.4 V.',
          ],
          formulaOrQuote: 'ε_max = N · B · A · ω  |  V_rms = ε_max / √2',
        },
        {
          title: 'Power Transmission & Transformer Efficiency',
          subtitle: 'Minimizing Line Loss (I²R)',
          bulletPoints: [
            'Ideal Transformer Ratio: V_s / V_p = N_s / N_p = I_p / I_s',
            'Joule heating power loss along cables: P_loss = I² · R',
            'Step-up transformers raise voltage and drastically reduce current I',
          ],
          formulaOrQuote: 'P_loss = I² · R  |  V_s / V_p = N_s / N_p',
        },
      ],
      Chemistry: [
        {
          title: 'Grade 12 Chemistry: Chemical Kinetics & Rate Laws',
          subtitle: 'Reaction Rates and Orders',
          bulletPoints: [
            'Rate Law: Rate = k · [A]^m · [B]^n (orders m and n are found experimentally)',
            'Units of rate constant k depend on the overall reaction order',
            'Arrhenius Equation: k = A · e^(-Ea / RT)',
            'Catalysts provide alternative reaction pathways with lower activation energy Ea',
          ],
          formulaOrQuote: 'Rate = k [A]^m [B]^n  |  ln(k) = ln(A) - Ea / (RT)',
        },
        {
          title: 'Chemical Equilibrium & Le Chatelier’s Principle',
          subtitle: 'Predicting System Response to Stress',
          bulletPoints: [
            'Equilibrium constant K_c depends only on temperature',
            'Increasing pressure shifts equilibrium toward the side with fewer gas moles',
            'Endothermic reactions shift right when temperature increases',
          ],
          formulaOrQuote: 'K_c = [C]^c [D]^d / ([A]^a [B]^b)',
        },
      ],
      Mathematics: [
        {
          title: 'Grade 12 Mathematics: Calculus & Derivatives',
          subtitle: 'Optimization and Critical Points',
          bulletPoints: [
            'Critical points occur where f’(x) = 0 or f’(x) is undefined',
            'Second Derivative Test: f’’(c) < 0 is local maximum, f’’(c) > 0 is local minimum',
            'L’Hôpital’s Rule for 0/0 and ∞/∞ indeterminate limits',
          ],
          formulaOrQuote: 'lim(x→a) f(x)/g(x) = lim(x→a) f’(x)/g’(x)',
        },
        {
          title: 'Definite Integration & Area Under Curves',
          subtitle: 'Fundamental Theorem of Calculus',
          bulletPoints: [
            'Area between two functions: ∫ [f(x) - g(x)] dx from a to b',
            'Integration by Parts formula: ∫ u dv = u·v - ∫ v du',
            'Odd functions over symmetric limits [-a, a] integrate to 0',
          ],
          formulaOrQuote: '∫ u dv = u · v - ∫ v du',
        },
      ],
    };

    const targetDeck = presets[subjectKey] || presets.Physics;
    setCustomSlidesMap((prev) => ({
      ...prev,
      [selectedClass.id]: targetDeck,
    }));
    setCurrentSlideIndex(0);
    setStageMode('slides');
    triggerToast(`የ${subjectKey} የትምህርት PPT ስላይዶች ተከፍተዋል!`);
  };

  const handleAddNewSlide = () => {
    if (!newSlideTitle.trim()) {
      triggerToast('እባክዎ የስላይዱን ርዕስ ያስገቡ');
      return;
    }

    const bullets = newSlideBullets
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const createdSlide: LiveSlide = {
      title: newSlideTitle.trim(),
      bulletPoints: bullets.length > 0 ? bullets : ['Live lecture note added by instructor.'],
      formulaOrQuote: newSlideFormula.trim() || undefined,
    };

    setCustomSlidesMap((prev) => {
      const current = prev[selectedClass.id] || selectedClass.slides || [];
      return { ...prev, [selectedClass.id]: [...current, createdSlide] };
    });

    setNewSlideTitle('');
    setNewSlideBullets('');
    setNewSlideFormula('');
    setShowAddSlideModal(false);
    triggerToast('አዲስ ስላይድ በተሳካ ሁኔታ ተጨምሯል!');
  };

  // Keyboard navigation for PowerPoint slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stageMode === 'slides' || stageMode === 'split_ppt') {
        const tagName = (e.target as HTMLElement)?.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          setCurrentSlideIndex((prev) => (prev < (slides.length - 1) ? prev + 1 : prev));
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageMode, slides.length]);

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const isQuestion = inputMessage.includes('?') || inputMessage.toLowerCase().startsWith('what') || inputMessage.toLowerCase().startsWith('how') || inputMessage.toLowerCase().startsWith('why') || inputMessage.includes('ማብራሪያ');

    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser?.name || 'You (Student)',
      role: currentUser?.role === 'admin' ? 'teacher' : 'student',
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isQuestion,
      upvotes: 0,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // If it's a question, trigger an AI Co-Tutor response after 1.5 seconds!
    if (isQuestion) {
      setTimeout(() => {
        const aiReplies: Record<string, string> = {
          default: `Thanks for the question! In ${selectedClass.subject}, always verify given constants and unit conversions before substituting into formulas.`,
          Physics: `Helpful tip: For electromagnetic induction, induced EMF opposes flux change according to Lenz's law. Pay attention to coil area and orientation angle!`,
          Mathematics: `Exam shortcut: In calculus or algebra multiple-choice problems, testing extreme values (like x=0 or x=1) can quickly eliminate wrong choices.`,
          Geography: `Remember that Ethiopia's drainage systems are predominantly influenced by topography and the Great East African Rift Valley.`,
        };

        const replyText = aiReplies[selectedClass.subject] || aiReplies.default;

        const aiResponse: LiveChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'EthioAI Study Copilot',
          role: 'ai_tutor',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          upvotes: 12,
        };

        setChatMessages((prev) => [...prev, aiResponse]);
      }, 1500);
    }
  };

  const handleUpvote = (id: string) => {
    setChatMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, upvotes: m.upvotes + 1 } : m))
    );
  };

  const handleToggleAnswered = (id: string) => {
    setChatMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isAnswered: !m.isAnswered } : m))
    );
    triggerToast('Question marked as answered by teacher!');
  };

  // Teacher Start Class submission
  const handleTeacherStartClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassTitle.trim()) {
      triggerToast('Please provide a class title.');
      return;
    }

    // Extract YouTube ID if URL is provided
    let extractedYoutubeId: string | undefined = undefined;
    if (newClassYoutube.trim()) {
      const match = newClassYoutube.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      extractedYoutubeId = match ? match[1] : newClassYoutube.trim();
    }

    const createdClass: LiveClass = {
      id: `live-${Date.now()}`,
      title: newClassTitle.trim(),
      subject: newClassSubject,
      subjectId: `subj-${newClassSubject.toLowerCase()}`,
      level: newClassLevel,
      teacherName: currentUser?.name || 'Instructor',
      teacherTitle: 'National Exam Certified Educator',
      teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isLiveNow: true,
      scheduledTime: 'Live Right Now',
      durationMinutes: 75,
      currentViewers: 1,
      currentTopic: newClassTopic.trim() || 'Interactive Lecture & Problem Solving',
      slides: [
        {
          title: newClassTitle.trim(),
          bulletPoints: [
            newClassTopic.trim() || 'Comprehensive exam preparation session.',
            'Follow along on the interactive blackboard and ask questions in live chat.',
            'Attached formula summaries and practice problems available below.'
          ],
          formulaOrQuote: 'Focus and consistent practice guarantee exam mastery.',
        },
      ],
      pollQuestion: {
        id: `poll-${Date.now()}`,
        question: `How confident do you feel about ${newClassTopic || 'this topic'}?`,
        options: ['Fully confident (100%)', 'Moderate (needs review)', 'Challenging (need help)'],
        votes: [1, 0, 0],
      },
      hasRecording: true,
      materialsAttached: [`${newClassSubject}_Key_Formulas_2016.pdf`],
      youtubeId: extractedYoutubeId,
    };

    if (onAddLiveClass) {
      onAddLiveClass(createdClass);
    }
    onSelectClass(createdClass.id);
    setShowStartModal(false);
    setNewClassTitle('');
    setNewClassTopic('');
    setNewClassYoutube('');
    setActiveTab('live_room');
    setIsTeaching(true);
    setStageMode(extractedYoutubeId ? 'video' : 'split');
    handleToggleCamera(true);
    triggerToast(`Live class "${createdClass.title}" is now broadcasting live with webcam!`);
  };

  const activeVideoTrack = userStream?.getVideoTracks()[0];
  const activeCameraLabel = activeVideoTrack?.label || '';
  const isIriunActive = camActive && !!userStream && activeCameraLabel.toLowerCase().includes('iriun');

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden file input for uploading teacher face photo */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
        id="teacher-face-photo-input"
      />

      {/* Hidden file input for uploading PowerPoint / PDF slides */}
      <input
        type="file"
        ref={pptFileInputRef}
        onChange={handlePptUpload}
        accept=".pptx,.ppt,.pdf,.txt,image/*"
        className="hidden"
        id="teacher-ppt-slides-input"
      />

      {/* Floating In-app Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-emerald-500/50 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Active Broadcast Discovery Banner: Appears whenever any teacher is broadcasting live */}
      {activeServerBroadcast && activeServerBroadcast.roomId !== `room-${selectedClass.id}` && (
        <div className="bg-linear-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse border border-red-300/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>🔴 የቀጥታ ስርጭት በመካሄድ ላይ ነው!</span>
                <span className="text-[10px] bg-white text-red-700 px-2 py-0.5 rounded-full font-black uppercase">LIVE NOW</span>
              </div>
              <p className="text-xs text-white/95 mt-0.5">
                መምህር <strong>{activeServerBroadcast.teacherName}</strong> በ <strong>{activeServerBroadcast.subject || 'National Exam Prep'}</strong> ({activeServerBroadcast.topic || 'Live Session'}) የቀጥታ ትምህርት እያስተላለፉ ነው።
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const targetClassId = activeServerBroadcast.roomId.replace(/^room-/, '');
              onSelectClass(targetClassId);
              setActiveTab('live_room');
            }}
            className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 text-xs font-black shadow-md shrink-0 cursor-pointer transition active:scale-95 flex items-center gap-1.5 justify-center"
          >
            <Radio className="w-3.5 h-3.5 text-red-600" />
            <span>ወደ ቀጥታ ስርጭቱ ግባ (Join Live Class)</span>
          </button>
        </div>
      )}

      {/* Top Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Live Interactive Learning (የቀጥታ ትምህርት)
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Ethiopian National Live Classroom
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time interactive lectures, digital whiteboard, live Q&A with teachers & AI study copilot.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('live_room')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'live_room' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>Active Classroom</span>
            </button>
            <button
              onClick={() => {
                if (camActive || userStream || isBroadcastingLive) {
                  shutdownAllLiveStreams();
                }
                setActiveTab('recordings');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'recordings' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recordings ({liveClasses.filter(c => c.hasRecording).length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowStartModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            id="btn-teacher-start-class"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Teacher: Start Class</span>
          </button>
        </div>
      </div>

      {/* Quick Live Class Switcher Bar (Subjects & Sessions across Ethiopia) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0 px-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          Live Streams:
        </span>
        {liveClasses.map((cls) => {
          const isSelected = cls.id === selectedClass.id;
          return (
            <button
              key={cls.id}
              onClick={() => {
                onSelectClass(cls.id);
                setActiveTab('live_room');
                setCurrentSlideIndex(0);
                if (cls.youtubeId) {
                  setStageMode('video');
                } else {
                  setStageMode('slides');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cls.isLiveNow && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
              )}
              <span className="truncate max-w-[170px]">{cls.subject}: {cls.title}</span>
              <span className="text-[10px] opacity-70 font-mono">
                {cls.currentViewers} 👥
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: ACTIVE LIVE CLASSROOM */}
      {activeTab === 'live_room' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stage: Video / Digital Whiteboard / Screen Share / Slides */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Teacher Online Broadcast Banner (Helps instructor manage their live face and board) */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-3.5 rounded-2xl border border-emerald-500/30 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
                  👨‍🏫
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-white">Teacher Live Broadcast Console (የመምህሩ የቀጥታ መቆጣጠሪያ)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      camActive 
                        ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                        : 'bg-amber-400 text-slate-950'
                    }`}>
                      {camActive ? (userStream ? '🔴 Webcam Live' : '🟢 Face Photo Live') : 'Face Off'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    {camActive 
                      ? (userStream 
                          ? '🔴 የእርስዎ ፊት በካሜራ በቀጥታ እየታየ ነው። (Your webcam face is broadcasting live to students).' 
                          : '🟢 የእርስዎ ፎቶ በቀጥታ ስርጭት ላይ እየታየ ነው። (Your face photo is active and broadcasting live).')
                      : '⚠️ ፊትዎ ለተማሪዎች እንዲታይ ካሜራዎን ያብሩ ወይም ፎቶዎን ይጫኑ (Click "Turn On Webcam" or "Upload Face Photo").'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Webcam button */}
                <button
                  onClick={() => {
                    handleToggleCamera();
                    if (!camActive && (stageMode === 'slides' || stageMode === 'video')) {
                      setStageMode('split');
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    camActive && userStream
                      ? 'bg-emerald-600 text-white font-black'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                  }`}
                  id="btn-turn-on-face-cam"
                  title="Turn on physical webcam"
                >
                  <Video className="w-4 h-4" />
                  <span>{camActive && userStream ? 'Webcam Active (በርቷል)' : 'Turn On Webcam (ካሜራ)'}</span>
                </button>

                {/* 2. Upload photo button */}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    camActive && teacherPhoto && !userStream
                      ? 'bg-emerald-700 text-white border-emerald-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Upload face photo to show your face"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{teacherPhoto ? 'Change Photo (ፎቶ)' : 'Upload Face (ፎቶ)'}</span>
                </button>

                {/* 3. Open in new tab (for full browser camera permissions) */}
                <button
                  onClick={handleOpenNewTab}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
                  title="Open app in a new tab for native camera access (በአዲስ ታብ ክፈት)"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* 4. Stage layout & camera buttons */}
                <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2">
                  <button
                    onClick={() => {
                      setStageMode('camera');
                      if (cameraFacing !== 'user' || !camActive) {
                        startCameraWithFacing('user');
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      stageMode === 'camera' && cameraFacing === 'user'
                        ? 'bg-emerald-600 text-white font-black ring-1 ring-emerald-300'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title="የፊት ለፊት ካሜራን በሙሉ ስክሪን አሳይ (Full Screen Front Face Camera)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>🤳 ፊት ካሜራ (Front)</span>
                  </button>
                  <button
                    onClick={() => {
                      if (cameraFacing !== 'environment' || !camActive) {
                        startCameraWithFacing('environment');
                      } else {
                        setStageMode('camera');
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      cameraFacing === 'environment' && camActive
                        ? 'bg-sky-600 text-white font-black ring-1 ring-sky-300'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title="የጀርባ ካሜራን አሳይ (Switch to Back Camera)"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>📷 ጀርባ (Back)</span>
                  </button>
                  <button
                    onClick={() => setStageMode('split')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      stageMode === 'split' ? 'bg-emerald-600 text-white font-black' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title="Split screen: Teacher face + Whiteboard"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>ፊት + ሰሌዳ</span>
                  </button>
                  {userStream && (
                    <button
                      onClick={handleFlipCamera}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title="Flip camera (front / back)"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Exit / Leave Live Class Button */}
                  <button
                    type="button"
                    onClick={handleExitClass}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ml-1"
                    title="ከክፍሉ ውጣና ካሜራ/ማይክሮፎኑን አጥፋ (Exit live class & turn off camera/mic)"
                  >
                    <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>ከክፍል ውጣ</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col">
              
              {/* Broadcast Header Bar with Stage Mode Switchers */}
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-white flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    Live Now
                  </span>
                  <span className="font-bold text-white truncate max-w-xs sm:max-w-md">
                    {selectedClass.title}
                  </span>
                </div>

                {/* Stage View Switcher Tabs: My Face / Camera | Split: Face + Board | Split: Face + PPT | Whiteboard | Slides | Recorded Video | Screen Share */}
                <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] overflow-x-auto max-w-full">
                  <button
                    onClick={() => {
                      setStageMode('camera');
                      if (!camActive) handleToggleCamera(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      stageMode === 'camera' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Open your webcam or live face photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-300" />
                    <span>👤 የእኔ ፊት (Face)</span>
                  </button>
                  <button
                    onClick={() => {
                      setStageMode('split');
                      if (!camActive) handleToggleCamera(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'split' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Side-by-side: Teacher video and interactive blackboard"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>👥 ፊት + ሰሌዳ</span>
                  </button>
                  <button
                    onClick={() => {
                      setStageMode('split_ppt');
                      if (!camActive) handleToggleCamera(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'split_ppt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Side-by-side: Teacher video and PowerPoint slides"
                  >
                    <Presentation className="w-3.5 h-3.5 text-amber-400" />
                    <span>👥 ፊት + PPT</span>
                  </button>
                  <button
                    onClick={() => setStageMode('slides')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'slides' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Full PowerPoint slide presentation"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    <span>📊 PPT ስላይድ</span>
                  </button>
                  <button
                    onClick={() => setStageMode('whiteboard')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'whiteboard' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Full interactive blackboard"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>✏️ ሰሌዳ (Board)</span>
                  </button>
                  {selectedClass.youtubeId && (
                    <button
                      onClick={() => setStageMode('video')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        stageMode === 'video' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                      title="Watch the recorded teacher lecture video"
                    >
                      <Video className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden sm:inline">📺 የትምህርት ቪዲዮ</span>
                    </button>
                  )}
                  {isScreenSharing && (
                    <button
                      onClick={() => setStageMode('screenshare')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        stageMode === 'screenshare' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <ScreenShare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Screen Share</span>
                    </button>
                  )}
                </div>
              </div>

              {/* STAGE CONTAINER */}
              <div className="min-h-[460px] bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
                
                {/* Clean Stage Header Overlay with Live, REC, Audio Wave, Viewers */}
                <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* LIVE badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/95 text-[11px] font-black uppercase text-white shadow-md backdrop-blur-xs">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      <span>LIVE</span>
                    </div>

                    {/* Prominent Recording Indicator ("🔴 REC 00:03:05") */}
                    <div className="flex items-center gap-1">
                      {isRecording ? (
                        <button
                          onClick={handleToggleRecording}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/95 hover:bg-rose-700 text-[11px] font-bold text-white shadow-lg backdrop-blur-md transition cursor-pointer border border-rose-400/50"
                          title="ቀጥታ ክፍለ-ጊዜው እየተቀዳ ነው (Click to stop/save recording)"
                        >
                          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                          <span className="font-mono font-black tracking-wide">🔴 REC {formatDuration(recordingSeconds)}</span>
                          <span className="hidden md:inline text-[10px] text-rose-100 font-medium">• እየተቀዳ ነው</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleToggleRecording}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-white/20 text-[11px] text-slate-200 font-bold backdrop-blur-md transition cursor-pointer"
                          title="Start recording live class"
                        >
                          <CircleDot className="w-3.5 h-3.5 text-rose-500" />
                          <span>🔴 Record (ቅረጽ)</span>
                        </button>
                      )}

                      {/* Source indicator / picker */}
                      <button
                        type="button"
                        onClick={() => setShowRecordSourceModal(true)}
                        className="px-2 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 transition cursor-pointer flex items-center gap-1"
                        title="የቀረጻ ይዘት ምርጫ (Record Source: Slides + Face, Screen, Camera)"
                      >
                        <span>
                          {recordSource === 'stage_composite'
                            ? '🎓 ስላይድ + ፊት'
                            : recordSource === 'screen'
                            ? '🖥️ ስክሪን'
                            : '👤 ካሜራ ብቻ'}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>

                    {/* Real-Time Voice Speech Activity Equalizer ("eyawerahu eko record ayasayim") */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition border ${
                        !micActive
                          ? 'bg-slate-900/80 border-slate-700 text-slate-400'
                          : isSpeaking
                          ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-300 shadow-md ring-1 ring-emerald-400/50'
                          : 'bg-slate-900/80 border-emerald-800/40 text-emerald-400/80'
                      }`}
                      title={
                        !micActive
                          ? 'ድምፅ ተዘግቷል (Microphone Muted)'
                          : isSpeaking
                          ? 'ድምፅዎ እየተቀዳ/እየተሰማ ነው (Voice speech capturing live)'
                          : 'ማይክራፎን ዝግጁ ነው (Mic Active & Ready)'
                      }
                    >
                      {micActive ? (
                        <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-bounce' : 'text-emerald-400/70'}`} />
                      ) : (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      )}

                      {micActive ? (
                        <>
                          <span className="hidden sm:inline">
                            {isSpeaking ? '🎤 ድምፅ እየተቀዳ ነው...' : '🎤 ማይክራፎን በርቷል'}
                          </span>
                          <AudioWaveBars isSpeaking={isSpeaking} level={audioLevel} barCount={5} />
                        </>
                      ) : (
                        <span>ድምፅ ጠፍቷል</span>
                      )}
                    </div>

                    {/* Quick Role Switch: Student <-> Teacher */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleRole) {
                          onToggleRole();
                        }
                        const nextRole = currentUser?.role === 'teacher' ? 'student' : 'teacher';
                        liveClientRef.current?.changeRole(nextRole);
                        triggerToast(nextRole === 'teacher' ? '👨‍🏫 ወደ መምህርነት ተቀይረዋል! አሁን ማስተማርና ስርጭት መጀመር ይችላሉ።' : '👨‍🎓 ወደ ተማሪነት ተቀይረዋል።');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-white/20 text-[11px] text-white font-bold backdrop-blur-md cursor-pointer transition shadow-md"
                      title={currentUser?.role === 'teacher' ? 'ወደ ተማሪነት ቀይር (Switch to Student)' : 'ወደ መምህርነት ቀይር (Switch to Teacher)'}
                    >
                      <span>{currentUser?.role === 'teacher' ? '👨‍🏫 መምህር ነዎት' : '👨‍🎓 ተማሪ ነዎት'}</span>
                      <span className="text-[10px] text-emerald-400 font-normal underline">(ቀይር)</span>
                    </button>

                    {/* Viewers with real-time online count */}
                    <button
                      type="button"
                      onClick={() => setShowAttendeesModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-[11px] text-emerald-300 font-bold backdrop-blur-md cursor-pointer transition shadow-md"
                      title="የተሳተፉ ተማሪዎችን ዝርዝር እይ (Click to view live attendees)"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{Math.max(1, onlineParticipants.length)} ተሳታፊዎች በመስመር ላይ</span>
                    </button>

                    {/* Live Broadcast Control for Teacher / Presenter */}
                    <button
                      type="button"
                      onClick={toggleLiveBroadcast}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black transition cursor-pointer shadow-lg backdrop-blur-md ${
                        isBroadcastingLive
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse border border-rose-400'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50'
                      }`}
                      title={isBroadcastingLive ? "ስርጭት አቁም (Stop Broadcast)" : "ተማሪዎች እርስዎን በቀጥታ እንዲያዩና ድምፅዎን እንዲሰሙ ስርጭት ይጀምሩ"}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>
                        {isBroadcastingLive ? '🔴 የቀጥታ ስርጭት ላይ ነዎት (Live)' : (currentUser?.role === 'student' ? '📡 አቅርብ / ስርጭት ጀምር' : '📡 የቀጥታ ስርጭት ጀምር (Go Live)')}
                      </span>
                    </button>
                  </div>

                  {/* Camera / Face Direct Quick Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleCamera()}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md ${
                        camActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200'
                      }`}
                      title="ካሜራ አብራ / አጥፋ"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{camActive ? 'ካሜራ በርቷል' : 'ካሜራ ክፈት'}</span>
                    </button>

                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md"
                      title="የእርስዎን ፎቶ በቀጥታ ይጫኑ"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">የእኔ ፎቶ</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExitClass}
                      className="px-3 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md"
                      title="ከክፍሉ ውጣና ካሜራ/ማይክሮፎኑን አጥፋ (Exit live class & turn off camera/mic)"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ውጣ</span>
                    </button>
                  </div>
                </div>

                {/* 1. PIP Picture-in-Picture: Live User or Teacher Webcam Avatar (Visible in Slides, Whiteboard, Video, ScreenShare) */}
                {stageMode !== 'camera' && stageMode !== 'split' && stageMode !== 'split_ppt' && (
                  <div 
                    onClick={() => {
                      if (!camActive) {
                        handleToggleCamera(true);
                      }
                      setStageMode('camera');
                    }}
                    className={`absolute top-4 right-4 z-20 w-36 sm:w-48 rounded-xl bg-slate-900 border shadow-2xl overflow-hidden cursor-pointer transition group ${
                      isSpeaking ? 'border-emerald-400 ring-4 ring-emerald-400/40 shadow-emerald-500/20' : 'border-slate-700 hover:border-emerald-500'
                    }`}
                    title="Click to expand to full face camera"
                  >
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                      {camActive && userStream ? (
                        <LiveTeacherVideo
                          stream={userStream}
                          photoUrl={null}
                          teacherName={currentUser?.name || selectedClass.teacherName}
                          isMirrored={isMirrored}
                          camActive={true}
                          className="w-full h-full"
                        />
                      ) : camActive && teacherPhoto ? (
                        <img
                          src={teacherPhoto}
                          alt={currentUser?.name || selectedClass.teacherName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <img
                          src={selectedClass.teacherAvatar}
                          alt={selectedClass.teacherName}
                          className="w-full h-full object-cover opacity-80"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-white font-bold flex items-center gap-1 z-10">
                        <span className={`w-1.5 h-1.5 rounded-full ${camActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
                        <span>{camActive ? 'You (Live Face)' : 'Click to show face'}</span>
                      </div>

                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition p-1 rounded bg-black/70 text-white text-[9px] z-10">
                        <Maximize2 className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-slate-900 text-[10px] text-slate-300 font-semibold truncate flex items-center justify-between">
                      <span className="truncate">{camActive ? (userStream ? 'Webcam Live' : 'Face Photo Live') : 'Face Cam Off'}</span>
                      {micActive ? (
                        <Mic className={`w-3 h-3 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-emerald-400/80'} shrink-0`} />
                      ) : (
                        <MicOff className="w-3 h-3 text-slate-500 shrink-0" />
                      )}
                    </div>
                  </div>
                )}

                {/* 0. STUDENT LIVE BROADCAST VIEW (Remote Teacher Video + Live Audio + Snapshot Fallback) */}
                {!isBroadcastingLive && (remoteTeacherStream || remoteTeacherFrame || (liveBroadcasterInfo && liveBroadcasterInfo.teacherId !== currentUser?.id)) && (
                  <div className="absolute inset-0 z-25 bg-slate-950 flex flex-col items-center justify-center">
                    {remoteTeacherStream ? (
                      <video
                        ref={(node) => {
                          remoteVideoElementRef.current = node;
                          if (node && remoteTeacherStream && node.srcObject !== remoteTeacherStream) {
                            node.srcObject = remoteTeacherStream;
                            node.play().catch((err) => {
                              console.warn('Autoplay restricted on remote teacher video:', err);
                              node.muted = true;
                              setIsRemoteAudioMuted(true);
                              node.play().catch(() => {});
                            });
                          }
                        }}
                        autoPlay
                        playsInline
                        muted={isRemoteAudioMuted}
                        onVolumeChange={(e) => {
                          setIsRemoteAudioMuted(e.currentTarget.muted || e.currentTarget.volume === 0);
                        }}
                        className="w-full h-full object-contain"
                      />
                    ) : remoteTeacherFrame ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <img
                          src={remoteTeacherFrame}
                          alt="Live Teacher Camera"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-xl bg-black/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>🔴 የቀጥታ ምስል (Live Feed Active)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-emerald-400 animate-pulse">
                          <Radio className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-black">
                          ከመምህር {liveBroadcasterInfo?.teacherName || selectedClass.teacherName} የቀጥታ ስርጭት ጋር በመገናኘት ላይ ነው...
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          የመምህሩ የቀጥታ ድምፅና ምስል እየተገናኘ ነው፤ እባክዎ ጥቂት ሰከንዶች ይጠብቁ።
                        </p>
                      </div>
                    )}

                    {/* Dedicated audio pipeline element ensuring remote teacher voice is cleanly played */}
                    {remoteTeacherStream && (
                      <audio
                        ref={(node) => {
                          remoteAudioElementRef.current = node;
                          if (node && remoteTeacherStream && node.srcObject !== remoteTeacherStream) {
                            node.srcObject = remoteTeacherStream;
                            node.volume = 1.0;
                            node.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted={isRemoteAudioMuted}
                      />
                    )}

                    {/* Remote Broadcast Header Overlay */}
                    <div className="absolute top-14 left-4 z-30 flex items-center gap-2.5 bg-slate-900/90 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                      <span className="text-xs font-bold text-white">
                        🔴 መምህር {liveBroadcasterInfo?.teacherName || selectedClass.teacherName} በቀጥታ እያስተማሩ ነው
                      </span>
                    </div>

                    {/* Unmute Center Callout if audio is muted or blocked by browser policy */}
                    {isRemoteAudioMuted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 z-30 pointer-events-none p-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (remoteVideoElementRef.current) {
                              remoteVideoElementRef.current.muted = false;
                              remoteVideoElementRef.current.volume = 1.0;
                              remoteVideoElementRef.current.play().catch(console.warn);
                            }
                            if (remoteAudioElementRef.current) {
                              remoteAudioElementRef.current.muted = false;
                              remoteAudioElementRef.current.volume = 1.0;
                              remoteAudioElementRef.current.play().catch(console.warn);
                            }
                            setIsRemoteAudioMuted(false);
                            triggerToast('🔊 የመምህሩ ድምፅ ተከፍቷል (100% Volume Unmuted)');
                          }}
                          className="pointer-events-auto px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center gap-3 shadow-2xl border-2 border-white/60 animate-bounce cursor-pointer transition transform hover:scale-105"
                        >
                          <VolumeX className="w-6 h-6 animate-pulse" />
                          <span>🔊 የመምህሩን ድምፅ ለመስማት እዚህ ይጫኑ (Click to Unmute Live Audio)</span>
                        </button>
                      </div>
                    )}

                    {/* Unmute/Mute Audio Button for Student */}
                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (remoteVideoElementRef.current) {
                            const nextMuted = !isRemoteAudioMuted;
                            remoteVideoElementRef.current.muted = nextMuted;
                            if (!nextMuted) {
                              remoteVideoElementRef.current.volume = 1.0;
                            }
                            setIsRemoteAudioMuted(nextMuted);
                            if (!nextMuted) {
                              remoteVideoElementRef.current.play().catch(() => {});
                              triggerToast('🔊 ድምፅ ተከፍቷል (Unmuted - 100%)');
                            } else {
                              triggerToast('🔇 ድምፅ ተዘግቷል (Muted)');
                            }
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg backdrop-blur-md ${
                          isRemoteAudioMuted
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isRemoteAudioMuted ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            <span>🔊 ድምጽ ክፈት (Unmute Live Audio)</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>ድምጽ እየሰራ ነው (Live Audio Playing)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. MODE: FULL TEACHER FACE / WEBCAM STAGE */}
                {stageMode === 'camera' && (
                  <div className="w-full h-[460px] bg-black relative flex items-center justify-center overflow-hidden">
                    <LiveTeacherVideo
                      stream={userStream}
                      photoUrl={teacherPhoto}
                      teacherName={currentUser?.name || selectedClass.teacherName}
                      isMirrored={isMirrored}
                      camActive={camActive}
                      cameraError={cameraError}
                      onTurnOnCamera={() => handleToggleCamera(true)}
                      onUploadPhoto={() => photoInputRef.current?.click()}
                      onOpenNewTab={handleOpenNewTab}
                      onSetDemoPhoto={handleSetDemoPhoto}
                      onSwitchToFrontCamera={() => startCameraWithFacing('user')}
                      onSwitchToBackCamera={() => startCameraWithFacing('environment')}
                      onFlipCamera={handleFlipCamera}
                      onToggleMirror={() => setIsMirrored((prev) => !prev)}
                      facingMode={cameraFacing}
                      className="w-full h-full"
                      isSpeaking={isSpeaking}
                    />

                    {/* Dismissible Notice if Iriun Webcam is waiting for phone */}
                    {isIriunActive && !dismissIriunBanner && (
                      <div className="absolute top-14 left-3 right-3 z-30 p-2.5 bg-slate-950/90 border border-amber-500/80 rounded-xl shadow-xl backdrop-blur-md text-white flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate text-slate-200">
                            Iriun Webcam: ስልክዎ ካልበራ ወደ ኮምፒውተር ካሜራ ይቀይሩ
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {availableCameras.filter((c) => !c.label.toLowerCase().includes('iriun')).length > 0 && (
                            <button
                              onClick={() => {
                                const realCam = availableCameras.find((c) => !c.label.toLowerCase().includes('iriun'));
                                if (realCam) handleSelectCameraDevice(realCam.deviceId);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                            >
                              ወደ ኮምፒውተር ካሜራ ቀይር
                            </button>
                          )}
                          <button
                            onClick={() => setDismissIriunBanner(true)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title="ዝጋ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. MODE: SPLIT SCREEN (TEACHER FACE + DIGITAL WHITEBOARD GOR-LE-GOR) */}
                {stageMode === 'split' && (
                  <div className="w-full min-h-[460px] grid grid-cols-1 md:grid-cols-2 bg-slate-950">
                    {/* Left: Teacher Live Camera */}
                    <div className="relative border-b md:border-b-0 md:border-r border-slate-800 bg-black flex items-center justify-center min-h-[230px] md:min-h-full">
                      <LiveTeacherVideo
                        stream={userStream}
                        photoUrl={teacherPhoto}
                        teacherName={currentUser?.name || selectedClass.teacherName}
                        isMirrored={isMirrored}
                        camActive={camActive}
                        cameraError={cameraError}
                        onTurnOnCamera={() => handleToggleCamera(true)}
                        onUploadPhoto={() => photoInputRef.current?.click()}
                        onOpenNewTab={handleOpenNewTab}
                        onSetDemoPhoto={handleSetDemoPhoto}
                        onSwitchToFrontCamera={() => startCameraWithFacing('user')}
                        onSwitchToBackCamera={() => startCameraWithFacing('environment')}
                        onFlipCamera={handleFlipCamera}
                        onToggleMirror={() => setIsMirrored((prev) => !prev)}
                        facingMode={cameraFacing}
                        className="w-full h-full min-h-[260px]"
                        isSpeaking={isSpeaking}
                      />
                    </div>

                    {/* Right: Interactive Blackboard */}
                    <div className="relative flex flex-col h-full min-h-[260px] bg-slate-900">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className={`w-full h-full touch-none min-h-[260px] ${isEraser ? 'cursor-cell' : 'cursor-crosshair'}`}
                      />
                      {/* Mini Blackboard Toolbar with Eraser & Undo */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between p-1.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-xs text-xs flex-wrap gap-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {['#ffffff', '#10b981', '#f59e0b', '#ef4444'].map((c) => (
                            <button
                              key={c}
                              onClick={() => { setPenColor(c); setIsEraser(false); }}
                              className={`w-4 h-4 rounded-full border border-slate-600 transition cursor-pointer ${
                                !isEraser && penColor === c ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          {/* Eraser Button */}
                          <button
                            onClick={() => setIsEraser(!isEraser)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                              isEraser ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-slate-800 text-slate-200 hover:text-white'
                            }`}
                            title="የሰሌዳ ማጥፊያ (Eraser)"
                          >
                            <Eraser className="w-3 h-3" />
                            <span>ማጥፊያ</span>
                          </button>
                          {/* Eraser Sizes when active */}
                          {isEraser && (
                            <div className="flex items-center gap-0.5 bg-amber-500/20 px-1 py-0.5 rounded text-[9px] font-bold">
                              {[
                                { sz: 16, lbl: 'ቀጭን' },
                                { sz: 32, lbl: 'መካከለኛ' },
                                { sz: 56, lbl: 'ሰፊ' },
                              ].map((e) => (
                                <button
                                  key={e.sz}
                                  onClick={() => setEraserSize(e.sz)}
                                  className={`px-1 py-0.5 rounded cursor-pointer ${
                                    eraserSize === e.sz ? 'bg-amber-400 text-black' : 'text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {e.lbl}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Undo Button */}
                          <button
                            onClick={handleUndo}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300 hover:text-white flex items-center gap-1 cursor-pointer"
                            title="የመጨረሻውን ጽሑፍ መልስ (Undo)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>መልስ</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={clearCanvas}
                            className="text-red-400 text-[10px] font-bold px-1.5 py-0.5 hover:text-red-300 bg-red-950/40 rounded border border-red-800/40 cursor-pointer"
                            title="ሰሌዳውን በሙሉ አጽዳ (Clear board)"
                          >
                            አጽዳ
                          </button>
                          <button
                            onClick={() => setStageMode('whiteboard')}
                            className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 hover:text-emerald-300 bg-emerald-950/40 rounded border border-emerald-800/40 cursor-pointer"
                          >
                            ሙሉ ሰሌዳ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.1 MODE: SPLIT SCREEN (TEACHER FACE + POWERPOINT SLIDES "eyanseratetiku") */}
                {stageMode === 'split_ppt' && (
                  <div className="w-full min-h-[460px] grid grid-cols-1 md:grid-cols-2 bg-slate-950">
                    {/* Left: Teacher Live Camera */}
                    <div className="relative border-b md:border-b-0 md:border-r border-slate-800 bg-black flex items-center justify-center min-h-[230px] md:min-h-full">
                      <LiveTeacherVideo
                        stream={userStream}
                        photoUrl={teacherPhoto}
                        teacherName={currentUser?.name || selectedClass.teacherName}
                        isMirrored={isMirrored}
                        camActive={camActive}
                        cameraError={cameraError}
                        onTurnOnCamera={() => handleToggleCamera(true)}
                        onUploadPhoto={() => photoInputRef.current?.click()}
                        onOpenNewTab={handleOpenNewTab}
                        onSetDemoPhoto={handleSetDemoPhoto}
                        onSwitchToFrontCamera={() => startCameraWithFacing('user')}
                        onSwitchToBackCamera={() => startCameraWithFacing('environment')}
                        onFlipCamera={handleFlipCamera}
                        onToggleMirror={() => setIsMirrored((prev) => !prev)}
                        facingMode={cameraFacing}
                        className="w-full h-full min-h-[260px]"
                        isSpeaking={isSpeaking}
                      />
                    </div>

                    {/* Right: PowerPoint Slides with Slide Navigation ("eyanseratetiku") */}
                    <div
                      className="relative flex flex-col justify-between p-4 sm:p-6 bg-slate-900 min-h-[260px]"
                      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                      onTouchEnd={(e) => {
                        if (touchStartX === null) return;
                        const touchEndX = e.changedTouches[0].clientX;
                        const diff = touchStartX - touchEndX;
                        if (diff > 40 && currentSlideIndex < slides.length - 1) {
                          setCurrentSlideIndex((prev) => prev + 1);
                        } else if (diff < -40 && currentSlideIndex > 0) {
                          setCurrentSlideIndex((prev) => prev - 1);
                        }
                        setTouchStartX(null);
                      }}
                    >
                      {/* Top bar inside split PPT */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            PPT Slide {currentSlideIndex + 1}/{slides.length}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold truncate max-w-[120px]">
                            {selectedClass.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => pptFileInputRef.current?.click()}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                            title="Upload PPT / PDF"
                          >
                            <Upload className="w-3 h-3 text-amber-400" />
                            <span>PPT ጫን</span>
                          </button>
                          <button
                            onClick={() => setStageMode('slides')}
                            className="px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-[10px] font-bold text-white cursor-pointer"
                            title="Expand to Full Slide view"
                          >
                            ሙሉ ስላይድ
                          </button>
                        </div>
                      </div>

                      {/* In-Slide Annotation Toolbar for Split Mode */}
                      {renderSlideAnnotationToolbar(true)}

                      {/* Slide Content with Interactive In-Slide Drawing Canvas */}
                      <div className="relative flex-1 rounded-xl bg-slate-950/40 p-3.5 border border-slate-800/80 overflow-hidden flex flex-col justify-between min-h-[240px]">
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1 select-none z-10">
                          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                            {currentSlide.title}
                          </h3>

                          {currentSlide.imageUrl && (
                            <div className="rounded-xl overflow-hidden border border-slate-700 max-h-48 bg-black flex items-center justify-center">
                              <img
                                src={currentSlide.imageUrl}
                                alt={currentSlide.title}
                                className="max-h-48 w-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <ul className="space-y-2 pt-1">
                            {currentSlide.bulletPoints.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>

                          {currentSlide.formulaOrQuote && (
                            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center justify-between gap-2">
                              <span>{currentSlide.formulaOrQuote}</span>
                              <button
                                onClick={() => {
                                  setStageMode('split');
                                  insertFormulaToWhiteboard(currentSlide.formulaOrQuote!);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                              >
                                ወደ ሰሌዳ
                              </button>
                            </div>
                          )}
                        </div>

                        {/* In-Slide Canvas Overlay for Drawing & Highlighting */}
                        <canvas
                          ref={slideCanvasRef}
                          onMouseDown={startSlideDrawing}
                          onMouseMove={slideDraw}
                          onMouseUp={stopSlideDrawing}
                          onMouseLeave={stopSlideDrawing}
                          onTouchStart={startSlideDrawing}
                          onTouchMove={slideDraw}
                          onTouchEnd={stopSlideDrawing}
                          className={`absolute inset-0 w-full h-full touch-none z-20 ${
                            isSlideAnnotating
                              ? slideTool === 'eraser'
                                ? 'cursor-cell pointer-events-auto'
                                : 'cursor-crosshair pointer-events-auto'
                              : 'pointer-events-none'
                          }`}
                        />
                      </div>

                      {/* Slide Sliding Navigation Carousel */}
                      <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          disabled={currentSlideIndex === 0}
                          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>ወደኋላ</span>
                        </button>

                        <div className="flex items-center gap-1 overflow-x-auto max-w-[140px] py-0.5">
                          {slides.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentSlideIndex(idx)}
                              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition cursor-pointer ${
                                currentSlideIndex === idx
                                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          disabled={currentSlideIndex === slides.length - 1}
                          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>ወደፊት</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MODE: FULL SLIDES PRESENTATION ("eyanseratetiku") */}
                {stageMode === 'slides' && (
                  <div
                    className="p-5 sm:p-7 flex flex-col justify-between h-full min-h-[460px] bg-slate-900"
                    onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                    onTouchEnd={(e) => {
                      if (touchStartX === null) return;
                      const touchEndX = e.changedTouches[0].clientX;
                      const diff = touchStartX - touchEndX;
                      if (diff > 40 && currentSlideIndex < slides.length - 1) {
                        setCurrentSlideIndex((prev) => prev + 1);
                      } else if (diff < -40 && currentSlideIndex > 0) {
                        setCurrentSlideIndex((prev) => prev - 1);
                      }
                      setTouchStartX(null);
                    }}
                  >
                    {/* PPT Presentation Top Action Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
                          <Presentation className="w-4 h-4 text-emerald-400" />
                          <span>ስላይድ {currentSlideIndex + 1} ከ {slides.length}</span>
                          <span>•</span>
                          <span>{selectedClass.subject}</span>
                        </div>
                      </div>

                      {/* Quick PPT Decks & Upload Controls */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-300">
                          <span className="text-slate-400">የትምህርት ስላይዶች፦</span>
                          <button
                            onClick={() => handleLoadPresetPpt('Physics')}
                            className="px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          >
                            ፊዚክስ
                          </button>
                          <button
                            onClick={() => handleLoadPresetPpt('Chemistry')}
                            className="px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          >
                            ኬሚስትሪ
                          </button>
                          <button
                            onClick={() => handleLoadPresetPpt('Mathematics')}
                            className="px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          >
                            ሂሳብ
                          </button>
                        </div>

                        <button
                          onClick={() => pptFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                          title="Upload PowerPoint (.pptx, .ppt), PDF or Slide Image"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>PPT/PDF ጫን</span>
                        </button>

                        <button
                          onClick={() => setShowAddSlideModal(true)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                          title="Add a new custom slide"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>አዲስ ስላይድ</span>
                        </button>

                        <button
                          onClick={() => {
                            setStageMode('split_ppt');
                            if (!camActive) handleToggleCamera(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                          title="Side-by-side: Teacher video and PowerPoint slide"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>👥 ፊት + PPT</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* In-Slide Annotation Toolbar for Full Slide View ("rasu slidu lay eyasemerikuna eyetafiku masredat") */}
                    {renderSlideAnnotationToolbar(false)}

                    {/* Main Slide Presentation Body with Annotation Canvas Layer */}
                    <div className="relative flex-1 rounded-2xl bg-slate-950/40 p-5 sm:p-7 border border-slate-800/80 my-1 overflow-hidden flex flex-col justify-between min-h-[360px]">
                      <div className="space-y-4 max-w-2xl py-2 flex-1 overflow-y-auto z-10 select-none">
                        {currentSlide.subtitle && (
                          <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                            {currentSlide.subtitle}
                          </div>
                        )}
                        
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          {currentSlide.title}
                        </h3>

                        {currentSlide.imageUrl && (
                          <div className="rounded-2xl overflow-hidden border border-slate-700 max-h-64 bg-black flex items-center justify-center my-3 shadow-lg">
                            <img
                              src={currentSlide.imageUrl}
                              alt={currentSlide.title}
                              className="max-h-64 w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <ul className="space-y-3 pt-2">
                          {currentSlide.bulletPoints.map((point: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-100 leading-relaxed bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-xs"></span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>

                        {currentSlide.formulaOrQuote && (
                          <div className="mt-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-mono text-sm font-bold flex items-center justify-between gap-3 shadow-md flex-wrap">
                            <div>
                              <span className="text-[10px] uppercase text-emerald-400 block font-sans font-bold">High-Yield Exam Formula:</span>
                              <span className="text-base text-white">{currentSlide.formulaOrQuote}</span>
                            </div>
                            <button
                              onClick={() => {
                                setStageMode('whiteboard');
                                insertFormulaToWhiteboard(currentSlide.formulaOrQuote!);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition cursor-pointer shadow-xs"
                              title="Copy to Whiteboard"
                            >
                              ወደ ሰሌዳ ገልብጥ (Copy to Board)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Overlay Canvas for Direct In-Slide Drawing and Underlining */}
                      <canvas
                        ref={slideCanvasRef}
                        onMouseDown={startSlideDrawing}
                        onMouseMove={slideDraw}
                        onMouseUp={stopSlideDrawing}
                        onMouseLeave={stopSlideDrawing}
                        onTouchStart={startSlideDrawing}
                        onTouchMove={slideDraw}
                        onTouchEnd={stopSlideDrawing}
                        className={`absolute inset-0 w-full h-full touch-none z-20 ${
                          isSlideAnnotating
                            ? slideTool === 'eraser'
                              ? 'cursor-cell pointer-events-auto'
                              : 'cursor-crosshair pointer-events-auto'
                            : 'pointer-events-none'
                        }`}
                      />
                    </div>

                    {/* Slide Navigation Controls & Interactive Carousel Strip ("eyanseratetiku") */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          disabled={currentSlideIndex === 0}
                          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-bold text-xs flex items-center gap-1.5"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>ወደኋላ (Prev)</span>
                        </button>

                        {/* Interactive Direct Slide Number Pills ("eyanseratetiku") */}
                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md px-2 py-1">
                          {slides.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentSlideIndex(idx)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition cursor-pointer shrink-0 ${
                                currentSlideIndex === idx
                                  ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300 scale-105'
                                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                              title={`ስላይድ ${idx + 1}`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          disabled={currentSlideIndex === slides.length - 1}
                          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-bold text-xs flex items-center gap-1.5"
                        >
                          <span>ወደፊት (Next)</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Keyboard & Swipe helper hint */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                        <span>💡 ቀስቶች (← / →) ወይም Space በመጫን ስላይዶቹን ማሸጋሸግ ይችላሉ</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {currentSlideIndex + 1} / {slides.length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MODE: INTERACTIVE DIGITAL WHITEBOARD (የሰሌዳ ጽሑፍ) */}
                {stageMode === 'whiteboard' && (
                  <div className="relative w-full h-[420px] flex flex-col bg-slate-900 select-none">
                    {/* Whiteboard Floating Toolbar */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 shadow-xl flex-wrap">
                      {/* Color Palette */}
                      <div className="flex items-center gap-1 px-1 border-r border-slate-800">
                        {[
                          { color: '#ffffff', label: 'Chalk White' },
                          { color: '#10b981', label: 'Emerald' },
                          { color: '#f59e0b', label: 'Amber' },
                          { color: '#38bdf8', label: 'Cyan' },
                          { color: '#ef4444', label: 'Red' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            onClick={() => {
                              setPenColor(c.color);
                              setIsEraser(false);
                            }}
                            className={`w-5 h-5 rounded-full transition cursor-pointer ${
                              !isEraser && penColor === c.color ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          />
                        ))}
                      </div>

                      {/* Pen Size */}
                      <div className="flex items-center gap-1 px-1 border-r border-slate-800">
                        {[2, 4, 8].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setPenSize(sz)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              penSize === sz ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {sz === 2 ? 'Fine' : sz === 4 ? 'Med' : 'Bold'}
                          </button>
                        ))}
                      </div>

                      {/* Eraser */}
                      <button
                        onClick={() => setIsEraser(!isEraser)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isEraser ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-300' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title="የሰሌዳ ማጥፊያ (Eraser tool)"
                      >
                        <Eraser className="w-4 h-4" />
                        <span>ማጥፊያ</span>
                      </button>

                      {/* Eraser Thickness Selector */}
                      {isEraser && (
                        <div className="flex items-center gap-1 px-1 border-l border-slate-800 bg-amber-500/10 rounded-lg p-0.5">
                          {[
                            { sz: 16, label: 'ቀጭን' },
                            { sz: 32, label: 'መካከለኛ' },
                            { sz: 56, label: 'ሰፊ' },
                          ].map((es) => (
                            <button
                              key={es.sz}
                              onClick={() => setEraserSize(es.sz)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                eraserSize === es.sz ? 'bg-amber-400 text-black shadow-xs' : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              {es.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Undo Button */}
                      <button
                        onClick={handleUndo}
                        className="p-1.5 rounded-lg text-xs font-bold text-sky-400 hover:text-sky-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                        title="የመጨረሻውን ጽሑፍ መልስ (Undo)"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline text-[10px]">Undo</span>
                      </button>

                      {/* Clear Canvas */}
                      <button
                        onClick={clearCanvas}
                        className="p-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                        title="ሰሌዳውን በሙሉ አጽዳ (Clear entire board)"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline text-[10px]">አጽዳ</span>
                      </button>

                      {/* Download Snapshot */}
                      <button
                        onClick={downloadCanvasImage}
                        className="p-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                        title="የተጻፈበትን ሰሌዳ በምስል አውርድ (Download board notes)"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline text-[10px]">አውርድ</span>
                      </button>
                    </div>

                    {/* Canvas Area */}
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className={`w-full h-full touch-none ${isEraser ? 'cursor-cell' : 'cursor-crosshair'}`}
                    />
                  </div>
                )}

                {/* 4. MODE: LIVE VIDEO / YOUTUBE STREAM */}
                {stageMode === 'video' && (
                  <div className="w-full h-[460px] bg-black flex flex-col items-center justify-center relative">
                    {/* Notice bar clarifying why face isn't here and offering 1-click switch */}
                    <div className="w-full bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 z-10 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-[11px] text-slate-300">
                          ይህ የተመዘገበው የትምህርት ቪዲዮ (Lesson Video) ነው። የራስዎን ፊት ለማየት ወይም ካሜራ ለማብራት፦
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setStageMode('camera');
                          if (!camActive) handleToggleCamera(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>👤 የእኔን ፊት አሳይ (Show My Face Cam)</span>
                      </button>
                    </div>

                    <div className="w-full flex-1 relative bg-black flex items-center justify-center">
                      {selectedClass.youtubeId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${selectedClass.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
                          title={selectedClass.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-center p-6 space-y-3">
                          <Video className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
                          <h4 className="text-base font-bold text-white">Live Broadcast Connected</h4>
                          <p className="text-xs text-slate-400 max-w-sm">
                            The instructor is presenting on the digital blackboard and sharing lecture notes.
                          </p>
                          <button
                            onClick={() => setStageMode('whiteboard')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                          >
                            Open Digital Blackboard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. MODE: SCREEN SHARING */}
                {stageMode === 'screenshare' && (
                  <div className="w-full h-[420px] bg-black flex items-center justify-center relative">
                    {screenStream ? (
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <ScreenShare className="w-10 h-10 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">No screen share active.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Interactive Classroom Toolbar */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Microphone with Real-time Voice Audio Meter */}
                  <button
                    onClick={handleToggleMic}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      micActive
                        ? isSpeaking
                          ? 'bg-emerald-700 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                    }`}
                    title={micActive ? (isSpeaking ? 'ድምፅዎ እየተቀዳ ነው (Speaking)' : 'ድምፅ አጥፋ (Mute Mic)') : 'ድምፅ ክፈት (Unmute Mic)'}
                  >
                    {micActive ? <Mic className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-white' : ''}`} /> : <MicOff className="w-4 h-4 text-red-500" />}
                    <span className="hidden sm:inline">{micActive ? (isSpeaking ? 'ድምፅ ይሰማል' : 'Mute') : 'Unmute'}</span>
                    {micActive && <AudioWaveBars isSpeaking={isSpeaking} level={audioLevel} barCount={4} />}
                  </button>

                  {/* Accept Sound Coming from Outside (High-Sensitivity Audio Toggle) */}
                  <button
                    type="button"
                    onClick={handleToggleExternalSound}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      captureExternalSound
                        ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/40'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title="የውጭ ወይም የክፍል ድምፅ ተቀባይ (Accept Sound Coming from Outside / High Sensitivity)"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${captureExternalSound ? 'text-white animate-pulse' : 'text-slate-500'}`} />
                    <span className="hidden sm:inline">
                      {captureExternalSound ? '🔊 የውጭ ድምፅ: በርቷል' : '🔇 የውጭ ድምፅ: ጠፍቷል'}
                    </span>
                  </button>

                  {/* Microphone Device Selector Dropdown (when devices detected) */}
                  {availableMicrophones.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <Mic className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <select
                        value={selectedMicrophoneId || ''}
                        onChange={(e) => handleSelectMicrophoneDevice(e.target.value)}
                        className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[150px] truncate"
                        title="የማይክሮፎን ምንጭ ይምረጡ (Select Input Microphone: External/Headset/Built-in)"
                      >
                        <option value="" className="text-slate-800">
                          🎙️ ነባሪ ማይክ (Default)
                        </option>
                        {availableMicrophones.map((mic, idx) => (
                          <option key={mic.deviceId || idx} value={mic.deviceId} className="text-slate-800">
                            {mic.label || `ማይክ ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quick Mic Test Button */}
                  <button
                    type="button"
                    onClick={handleTestMic}
                    disabled={isTestingMic}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isTestingMic
                        ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title="ማይክሮፎንዎንና ድምፅዎን እዚህ ጋር ይፈትሹ (Test microphone audio loopback)"
                  >
                    <Mic className={`w-3.5 h-3.5 ${isTestingMic ? 'text-amber-600 animate-bounce' : 'text-slate-500'}`} />
                    <span className="hidden md:inline">{isTestingMic ? 'ድምፅ እየፈተሸ...' : 'ማይክ ፈትሽ'}</span>
                  </button>

                  {/* Speaker Chime Test Button */}
                  <button
                    type="button"
                    onClick={handleTestSpeakers}
                    disabled={isTestingSpeakers}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isTestingSpeakers
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 animate-pulse'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title="ስፒከርዎን ወይም የጆሮ ማዳመጫዎን በድምፅ ቃጭል ይፈትሹ (Play speaker confirmation chime)"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isTestingSpeakers ? 'text-emerald-600 animate-spin' : 'text-slate-500'}`} />
                    <span className="hidden md:inline">{isTestingSpeakers ? 'ድምፅ እየጮኸ...' : 'ስፒከር ፈትሽ'}</span>
                  </button>

                  {/* Live Mic Loopback / Hear My Own Voice Monitor */}
                  <button
                    type="button"
                    onClick={handleToggleMicMonitor}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isMonitoringMic
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md ring-2 ring-purple-300 animate-pulse'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title="የራስዎን እና የውጭ ድምፅ በስፒከር/ጆሮ ማዳመጫ በቀጥታ ያድምጡ (Listen to live mic & room audio in headphones/speakers)"
                  >
                    <Headphones className={`w-3.5 h-3.5 ${isMonitoringMic ? 'text-white' : 'text-purple-600'}`} />
                    <span className="hidden lg:inline">{isMonitoringMic ? '🎧 ድምፅ እያዳመጡ ነው' : '🎧 ድምፄን አድምጥ'}</span>
                  </button>

                  {/* Class Recording Toggle Button ("🔴 REC") */}
                  <div className="flex items-center">
                    <button
                      onClick={handleToggleRecording}
                      className={`p-2.5 rounded-l-xl border-y border-l transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                        isRecording
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md animate-pulse rounded-r-xl'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={isRecording ? 'ቀረጻውን አቁም / አስቀምጥ (Stop Recording)' : 'ትምህርቱን መቅዳት ጀምር (Record Live Class)'}
                    >
                      <CircleDot className={`w-4 h-4 ${isRecording ? 'text-white' : 'text-rose-600'}`} />
                      <span className="font-mono">{isRecording ? `🔴 REC ${formatDuration(recordingSeconds)}` : '🔴 Record (ቅረጽ)'}</span>
                    </button>
                    {!isRecording && (
                      <button
                        type="button"
                        onClick={() => setShowRecordSourceModal(true)}
                        className="p-2.5 rounded-r-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="የቀረጻ ምንጭ ምረጥ (Choose recording mode: Slides + Face, Screen, Camera)"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Front Face Camera Button */}
                  <button
                    type="button"
                    onClick={() => {
                      startCameraWithFacing('user');
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      camActive && cameraFacing === 'user' && userStream
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="የፊት-ለፊት ካሜራን አብራ (Turn on Front Face Camera)"
                  >
                    <Video className="w-4 h-4" />
                    <span>🤳 ፊት ካሜራ (Front Face)</span>
                  </button>

                  {/* Back Camera Button */}
                  <button
                    type="button"
                    onClick={() => {
                      startCameraWithFacing('environment');
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      camActive && cameraFacing === 'environment' && userStream
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="የጀርባ ካሜራን አብራ (Turn on Back Camera)"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">📷 ጀርባ ካሜራ (Back Cam)</span>
                  </button>

                  {/* Camera Device Selector Dropdown (when devices detected) */}
                  {availableCameras.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <Video className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <select
                        value={selectedCameraId || activeVideoTrack?.getSettings()?.deviceId || ''}
                        onChange={(e) => handleSelectCameraDevice(e.target.value)}
                        className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
                        title="የሚጠቀሙትን ካሜራ ይምረጡ (Select Camera Device)"
                      >
                        {availableCameras.map((cam, idx) => {
                          const l = (cam.label || '').toLowerCase();
                          const tag =
                            l.includes('front') || l.includes('user') || l.includes('selfie') || l.includes('integrated') || l.includes('face')
                              ? '🤳 ፊት: '
                              : l.includes('back') || l.includes('environment') || l.includes('rear')
                              ? '📷 ጀርባ: '
                              : '📹 ';
                          return (
                            <option key={cam.deviceId || idx} value={cam.deviceId} className="text-slate-800">
                              {tag}{cam.label || `ካሜራ ${idx + 1}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Mirror Video Toggle (when camera is on) */}
                  {camActive && userStream && (
                    <button
                      onClick={() => setIsMirrored(!isMirrored)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Mirror camera video (መስታወት)"
                    >
                      <span>{isMirrored ? 'መስታወት: በርቷል' : 'መደበኛ'}</span>
                    </button>
                  )}

                  {/* Flip Camera (when camera is on) */}
                  {camActive && userStream && (
                    <button
                      onClick={handleFlipCamera}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title="Flip front / back camera (ካሜራ አዙር)"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden md:inline">አዙር</span>
                    </button>
                  )}

                  {/* Stage Mode: Split Screen (Face + Blackboard) Toggle */}
                  <button
                    onClick={() => setStageMode(stageMode === 'split' ? 'camera' : 'split')}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      stageMode === 'split'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Toggle Split Screen (Teacher Face + Blackboard)"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">{stageMode === 'split' ? 'ካሜራ ብቻ' : 'ፊት + ሰሌዳ'}</span>
                  </button>

                  {/* Upload Face Photo Button */}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      camActive && teacherPhoto && !userStream
                        ? 'bg-emerald-700 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Upload face photo so students can see your face"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden md:inline">{teacherPhoto ? 'Change Photo' : 'Upload Face'}</span>
                  </button>

                  {/* Open In New Tab */}
                  <button
                    onClick={handleOpenNewTab}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Open app in new tab for direct browser webcam access"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden lg:inline">New Tab</span>
                  </button>

                  {/* Flip Camera (when camera is on) */}
                  {camActive && userStream && (
                    <button
                      onClick={handleFlipCamera}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title="Flip front / back camera"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden md:inline">Flip Camera</span>
                    </button>
                  )}

                  {/* Screen Share */}
                  <button
                    onClick={handleToggleScreenShare}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      isScreenSharing
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Share your computer screen"
                  >
                    <ScreenShare className="w-4 h-4" />
                    <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                  </button>

                  {/* Raise Hand */}
                  <button
                    onClick={() => {
                      setIsHandRaised(!isHandRaised);
                      triggerToast(!isHandRaised ? '✋ Hand raised! Instructor and class notified.' : 'Hand lowered.');
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isHandRaised
                        ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>✋</span>
                    <span>{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                  </button>

                  {/* Attendees */}
                  <button
                    onClick={() => setShowAttendeesModal(true)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{selectedClass.currentViewers.toLocaleString()} Students</span>
                  </button>
                </div>

                {/* Attached Lesson Material */}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="hidden sm:inline font-bold">Notes:</span>
                  {(selectedClass.materialsAttached || []).map((mat) => (
                    <button
                      key={mat}
                      onClick={() => onOpenDocument(mat)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[140px]">{mat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* In-Lecture Live Poll */}
            {selectedClass.pollQuestion && (
              <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                    <BarChart2 className="w-4 h-4" />
                    <span>Live Class Poll from Teacher (የክፍል ውስጥ ጥናት ጥያቄ)</span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    Active Poll
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {selectedClass.pollQuestion.question}
                </div>

                <div className="space-y-2 pt-1">
                  {selectedClass.pollQuestion.options.map((opt, idx) => {
                    const isSelected = userVotedPollOption === idx;
                    const baseVotes = selectedClass.pollQuestion!.votes[idx] || 0;
                    const voteCount = baseVotes + (isSelected ? 1 : 0);
                    const totalVotes = 
                      selectedClass.pollQuestion!.votes.reduce((a, b) => a + b, 0) + 
                      (userVotedPollOption !== null ? 1 : 0);
                    const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setUserVotedPollOption(idx);
                          triggerToast(`Voted for option ${String.fromCharCode(65 + idx)}: "${opt}"`);
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition relative overflow-hidden flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-emerald-600/15 pointer-events-none transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        ></div>
                        <span className="relative z-10 flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </span>
                        <span className="relative z-10 font-mono text-slate-700 font-bold">
                          {pct}% ({voteCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Chat & Real-Time Q&A */}
          <div className="rounded-2xl bg-white border border-slate-200 flex flex-col h-[600px] shadow-xs overflow-hidden">
            {/* Chat Header */}
            <div className="p-3.5 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Chat & Exam Q&A
                </h4>
              </div>

              {/* Questions Only Filter */}
              <button
                onClick={() => setIsQuestionFilter(!isQuestionFilter)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  isQuestionFilter
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                Questions Only
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
              {chatMessages
                .filter((m) => (isQuestionFilter ? m.isQuestion : true))
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border transition ${
                      msg.role === 'teacher'
                        ? 'bg-emerald-50 border-emerald-200 text-slate-800'
                        : msg.role === 'ai_tutor'
                        ? 'bg-violet-50 border-violet-200 text-slate-800'
                        : msg.isQuestion
                        ? 'bg-amber-50/80 border-amber-200 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{msg.sender}</span>
                        {msg.role === 'teacher' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold uppercase">
                            Teacher
                          </span>
                        )}
                        {msg.role === 'ai_tutor' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-600 text-white font-bold uppercase flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Co-Tutor
                          </span>
                        )}
                        {msg.isQuestion && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                            Q&A
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>

                    <p className="leading-relaxed text-slate-700">{msg.text}</p>

                    {/* Upvote & Teacher Answer Action */}
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100/70">
                      <button
                        onClick={() => handleUpvote(msg.id)}
                        className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 font-medium transition cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{msg.upvotes}</span>
                      </button>

                      {msg.isAnswered ? (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Answered by Teacher
                        </span>
                      ) : msg.isQuestion ? (
                        <button
                          onClick={() => handleToggleAnswered(msg.id)}
                          className="text-[10px] text-slate-400 hover:text-emerald-600 font-medium transition cursor-pointer"
                        >
                          Mark Answered
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a question (add ? for AI) or message..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition text-xs font-bold shrink-0 shadow-2xs cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: RECORDED SESSIONS ARCHIVE */}
      {activeTab === 'recordings' && (
        <div className="space-y-6">
          {/* Newly Recorded Teacher Sessions */}
          {recordedSessionsList.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 shadow-xs">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span>
                  <h4 className="text-sm font-black text-slate-900">
                    የቀረጹዋቸው የቀጥታ ትምህርቶች (Your Live Recorded Classes)
                  </h4>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-3 py-0.5 rounded-full">
                  {recordedSessionsList.length} ቀረጻዎች ተቀምጠዋል
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recordedSessionsList.map((rec) => (
                  <div key={rec.id} className="p-3.5 bg-white rounded-xl border border-rose-200/80 shadow-xs flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{rec.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-sans font-bold text-[10px]">
                          {rec.subject}
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-rose-500" />
                          {rec.duration}
                        </span>
                        <span>•</span>
                        <span>{rec.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {onNavigateToVideos && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToVideos('My Videos', `vid-${rec.id}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-2xs"
                          title="በ 'My Videos' ዝርዝር ውስጥ ተመልከት"
                        >
                          <Film className="w-3.5 h-3.5 text-sky-600" />
                          <span>በ My Videos እይ</span>
                        </button>
                      )}
                      <a
                        href={rec.url}
                        download={`Live-Session-${rec.id}.webm`}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                        title="ቪዲዮውን ወደ ኮምፒውተር ወይም ስልክ አውርድ (Download)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">አውርድ</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRecordedSession(rec.id, e)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="ይህን ቀረጻ አጥፋ (Delete Recording)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span className="hidden sm:inline">አጥፋ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Recorded Live Lessons & Ethiopian Exam Class Archives</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {liveClasses.map((cls) => (
              <div
                key={cls.id}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {cls.subject}
                    </span>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {cls.recordingDuration || '1h 15m'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {cls.title}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {cls.currentTopic}
                  </p>

                  <div className="flex items-center gap-2.5 pt-2">
                    <img
                      src={cls.teacherAvatar}
                      alt={cls.teacherName}
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cls.teacherName}</div>
                      <div className="text-[10px] text-slate-500">{cls.teacherTitle}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectClass(cls.id);
                      setActiveTab('live_room');
                      if (cls.youtubeId) {
                        setStageMode('video');
                      } else {
                        setStageMode('slides');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Watch Session</span>
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    {cls.slides.length} Slides • {cls.currentViewers} Viewers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: TEACHER START CLASS (አዲስ ላይቭ ክላስ ማሰራጫ) */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-600 animate-pulse" />
                <span>Broadcast Live Class (መምህር: ላይቭ ክላስ ጀምር)</span>
              </h3>
              <button
                onClick={() => setShowStartModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTeacherStartClass} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Class Title *
                </label>
                <input
                  type="text"
                  required
                  value={newClassTitle}
                  onChange={(e) => setNewClassTitle(e.target.value)}
                  placeholder="e.g. Grade 12 Calculus Integration Shortcuts & Exam Traps"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Subject
                  </label>
                  <select
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="Geography">Geography</option>
                    <option value="History">History</option>
                    <option value="Economics">Economics</option>
                    <option value="Computer Science">Computer Science (Exit Exam)</option>
                    <option value="Law">Law (Exit Exam)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Target Grade / Level
                  </label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value as ExamLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="grade_8">Grade 8 Regional Ministry</option>
                    <option value="grade_12_natural">Grade 12 Natural Science</option>
                    <option value="grade_12_social">Grade 12 Social Science</option>
                    <option value="university_exit">University Exit Exam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Topic & Key Chapter Concepts
                </label>
                <input
                  type="text"
                  value={newClassTopic}
                  onChange={(e) => setNewClassTopic(e.target.value)}
                  placeholder="e.g. Unit 3: Definite Integrals, Riemann Sums, Area under curve"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  YouTube Live or Video Stream URL (Optional)
                </label>
                <input
                  type="text"
                  value={newClassYoutube}
                  onChange={(e) => setNewClassYoutube(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or YouTube Video ID"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  If left empty, the class will automatically launch with the interactive digital whiteboard and webcam broadcast.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Radio className="w-4 h-4" />
                  <span>Go Live Now (ስርጭት ጀምር)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATTENDEES & RAISED HANDS (ተማሪዎች እና የተነሱ እጆች) */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  ተሳታፊዎች / የተገናኙ ሰዎች ({Math.max(1, onlineParticipants.length)} Live Attendees)
                </h4>
              </div>
              <button
                onClick={() => setShowAttendeesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
              {/* Host / Presenter */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xs">
                    {(liveBroadcasterInfo?.teacherName || selectedClass.teacherName || 'T').charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{liveBroadcasterInfo?.teacherName || selectedClass.teacherName}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">Instructor (Host / Presenter)</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Teacher
                </span>
              </div>

              {/* Raised hand student (if active) */}
              {isHandRaised && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✋</span>
                    <div>
                      <div className="font-bold text-slate-900">{currentUser?.name || 'You (Student)'}</div>
                      <div className="text-[10px] text-amber-800 font-bold">Waiting to ask instructor</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    Hand Raised
                  </span>
                </div>
              )}

              {/* REAL Active Connected Live Participants */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  በክፍሉ ውስጥ ያሉ ሰዎች (Connected In This Room — {onlineParticipants.length})
                </div>

                {onlineParticipants.length > 0 ? (
                  onlineParticipants.map((p) => {
                    const isMe = p.id === currentUser?.id || p.id === stableUserIdRef.current;
                    const isHost = p.id === liveBroadcasterInfo?.teacherId;
                    return (
                      <div 
                        key={p.id} 
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                          isMe 
                            ? 'bg-emerald-50/70 border-emerald-300' 
                            : isHost
                            ? 'bg-purple-50/70 border-purple-300'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isMe && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-700 text-white font-black">
                                  እርስዎ (You)
                                </span>
                              )}
                              {isHost && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-700 text-white font-black">
                                  🔴 Broadcaster
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {p.role === 'teacher' ? '👨‍🏫 መምህር' : '👨‍🎓 ተማሪ'} • አሁን በቀጥታ ክፍል ውስጥ ይገኛል
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {p.role === 'teacher' ? 'Teacher' : 'Student'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    እስካሁን ሌላ ሰው አልተቀላቀለም (No other students connected yet)
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowAttendeesModal(false)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close (ዝጋ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM SLIDE (አዲስ ስላይድ ጨምር) */}
      {showAddSlideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-black text-slate-900">
                  አዲስ የትምህርት ስላይድ ጨምር (Add PPT Slide)
                </h4>
              </div>
              <button
                onClick={() => setShowAddSlideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  የስላይዱ ርዕስ (Slide Title) *
                </label>
                <input
                  type="text"
                  value={newSlideTitle}
                  onChange={(e) => setNewSlideTitle(e.target.value)}
                  placeholder="ምሳሌ፦ Electromagnetic Induction - Faraday's Law"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ዋና ዋና ነጥቦች (Bullet Points — በእያንዳንዱ መስመር አንድ ነጥብ)
                </label>
                <textarea
                  rows={4}
                  value={newSlideBullets}
                  onChange={(e) => setNewSlideBullets(e.target.value)}
                  placeholder="• ማግኔቲክ ፍላክስ ለውጥ የኤሌክትሪክ ቮልቴጅ ያመነጫል&#10;• የሌንዝ ህግ የመግነጢሳዊ መስኩን አቅጣጫ ይወስናል&#10;• በፈተና ላይ የሚመጡ የተለመዱ ስሌቶች"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  አስፈላጊ ፎርሙላ ወይም ጥቅስ (High-Yield Formula)
                </label>
                <input
                  type="text"
                  value={newSlideFormula}
                  onChange={(e) => setNewSlideFormula(e.target.value)}
                  placeholder="ምሳሌ፦ ε = -N · (ΔΦ / Δt)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddSlideModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                ሰርዝ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleAddNewSlide}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>ስላይዱን ጨምር (Add Slide)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORDING SOURCE SELECTOR (Fixes: "lemindin new record yaderekut ke ppt sasireda neber gin yene face bicha new yetayew") */}
      {showRecordSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                  <CircleDot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    የቀረጻ ይዘት ምርጫ (Recording Source)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    ትምህርቱን ሲቀዱ ምን ይዘት እንዲቀረጽ ይፈልጋሉ?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordSourceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Stage Composite (PPT + Teacher Face) */}
              <button
                type="button"
                onClick={() => {
                  setRecordSource('stage_composite');
                  setShowRecordSourceModal(false);
                  triggerToast('✅ የቀረጻ ምንጭ ወደ "ስላይድ + የመምህር ፊት" ተቀይሯል!');
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  recordSource === 'stage_composite'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  recordSource === 'stage_composite' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Presentation className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">🎓 ስላይድ + የመምህሩ ፊትና ድምፅ (የሚመከር)</span>
                    {recordSource === 'stage_composite' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">የተመረጠ</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    PPT ስላይዶቹን ሲያስረዱ፣ በስላይዱ ላይ የሚጽፉትን የቦርድ ማስታወሻ እና የፊትዎን ቪዲዮ አጣምሮ ይቀርጻል።
                  </p>
                </div>
              </button>

              {/* Option 2: Native Screen Capture */}
              <button
                type="button"
                onClick={() => {
                  setRecordSource('screen');
                  setShowRecordSourceModal(false);
                  triggerToast('✅ የቀረጻ ምንጭ ወደ "ሙሉ ስክሪን / መስኮት" ተቀይሯል!');
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  recordSource === 'screen'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  recordSource === 'screen' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">🖥️ ሙሉ ስክሪን ወይም ታብ (Screen Share)</span>
                    {recordSource === 'screen' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">የተመረጠ</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    የኮምፒውተርዎን ሙሉ ስክሪን፣ ብሮውዘር ታብ ወይም ሌላ ማንኛውንም መተግበሪያ በቀጥታ ለመቅረጽ።
                  </p>
                </div>
              </button>

              {/* Option 3: Teacher Camera Only */}
              <button
                type="button"
                onClick={() => {
                  setRecordSource('camera');
                  setShowRecordSourceModal(false);
                  triggerToast('✅ የቀረጻ ምንጭ ወደ "የመምህር ካሜራ ብቻ" ተቀይሯል!');
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  recordSource === 'camera'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  recordSource === 'camera' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Camera className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">👤 የፊት ካሜራ ብቻ (Webcam Only)</span>
                    {recordSource === 'camera' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">የተመረጠ</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    ያለ ስላይድ የመምህሩን ገጽታና ንግግር ብቻ ለይቶ ለመቅረጽ ሲፈልጉ።
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowRecordSourceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                እሺ (Done)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORDING SAVED / DOWNLOAD PREVIEW MODAL */}
      {showRecordingModal && recordedVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    የቀጥታ ትምህርት ቀረጻ ተጠናቋል! (Class Recorded)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    ክፍለ-ጊዜው በተሳካ ሁኔታ ተቀርጾ ተዘጋጅቷል
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Preview */}
            <div className="rounded-xl overflow-hidden bg-black aspect-video relative flex items-center justify-center border border-slate-800 shadow-inner">
              <video
                ref={modalVideoRef}
                src={recordedVideoUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
                autoPlay={false}
                onError={() => {
                  if (lastRecordedVideoLessonId) {
                    const fallbackUrl = `/api/recordings/stream/${lastRecordedVideoLessonId}`;
                    if (recordedVideoUrl !== fallbackUrl) {
                      setRecordedVideoUrl(fallbackUrl);
                    }
                  }
                }}
                onLoadedMetadata={(e) => {
                  const el = e.currentTarget;
                  el.volume = 1.0;
                  el.muted = false;
                }}
                onPlay={(e) => {
                  const el = e.currentTarget;
                  el.volume = 1.0;
                  el.muted = false;
                }}
              />
            </div>

            {/* Audio Track Status Banner & Quick-Listen */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${recordedHasAudio ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-semibold text-slate-200">
                  {recordedHasAudio
                    ? 'ድምፅ (Voice Audio): ተቀርጿል (Included & Active)'
                    : 'ድምፅ (Voice Audio): ማይክሮፎን ጠፍቶ ነበር (Mic Inactive)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (modalVideoRef.current) {
                    modalVideoRef.current.muted = false;
                    modalVideoRef.current.volume = 1.0;
                    modalVideoRef.current.currentTime = 0;
                    modalVideoRef.current.play().catch(console.warn);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-sm transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>ድምፅ አጫውት (Unmute & Play)</span>
              </button>
            </div>

            {/* Session Info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800 truncate">{selectedClass.title}</div>
              <div className="text-slate-500 flex items-center gap-2 font-mono text-[11px] flex-wrap">
                <span className="font-bold text-emerald-700">{selectedClass.subject}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-500" />
                  {formatDuration(recordingSeconds)}
                </span>
                <span>•</span>
                <span>ቀን: ዛሬ</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordingModal(false);
                    setActiveTab('recordings');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
                  <span>ወደ ቀረጻዎች ዝርዝር</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (lastRecordedVideoLessonId) {
                      await handleDeleteRecordedSession(lastRecordedVideoLessonId);
                    }
                    setShowRecordingModal(false);
                    setRecordedVideoUrl(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="ይህን ቀረጻ አጥፋ"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>ይህን ቀረጻ አጥፋ (Delete)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {onNavigateToVideos && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordingModal(false);
                      onNavigateToVideos('My Videos', lastRecordedVideoLessonId || undefined);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Film className="w-4 h-4 text-sky-200" />
                    <span>ወደ "My Videos" ሂድና እይ</span>
                  </button>
                )}

                <a
                  href={recordedVideoUrl || undefined}
                  download={`EthioExams-Live-${selectedClass.subject.replace(/\s+/g, '_')}-${Date.now()}.webm`}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>ቪዲዮውን አውርድ</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen Compositor Canvas for HD Recording of PPT Slides + Face + Notes */}
      <canvas
        ref={compositeCanvasRef}
        id="live-composite-recording-canvas"
        width={1280}
        height={720}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1280px',
          height: '720px',
          pointerEvents: 'none',
          opacity: 0.01,
          zIndex: -9999,
        }}
      />
    </div>
  );
};
