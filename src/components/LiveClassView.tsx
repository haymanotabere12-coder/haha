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
  Minimize2, 
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
  Shield,
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
  PhoneOff,
  Pin,
  AlertTriangle,
  Paperclip,
  MoreVertical,
  Reply,
  ArrowLeft,
  Globe,
  Settings as SettingsIcon,
  Search,
  Filter,
  CornerDownRight,
  MessageCircle
} from 'lucide-react';
import { LiveClass, LiveChatMessage, ExamLevel, AppUser, LiveSlide, VideoLesson, Language, DocumentMaterial } from '../types';
import { DOCUMENTS_DATA } from '../data/mockData';
import { TRANSLATIONS, getTranslation, TranslationKey } from '../utils/translations';
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
  language?: Language;
  isStartingCamera?: boolean;
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
  language = 'en',
  isStartingCamera = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasLiveVideoTrack = Boolean(
    stream &&
    stream.getVideoTracks().some((t) => t.readyState !== 'ended' && t.enabled)
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && camActive && hasLiveVideoTrack) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      const tryPlay = () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      };

      video.addEventListener('loadedmetadata', tryPlay);
      video.addEventListener('canplay', tryPlay);
      tryPlay();

      return () => {
        video.removeEventListener('loadedmetadata', tryPlay);
        video.removeEventListener('canplay', tryPlay);
      };
    } else if (video.srcObject) {
      video.srcObject = null;
    }
  }, [stream, camActive, hasLiveVideoTrack]);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none ${className}`}>
      {/* 1. Real hardware webcam stream */}
      {hasLiveVideoTrack && camActive ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            id="teacher-live-webcam-video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-transform duration-200"
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          />

          {/* Compact Bottom-Right Camera Controls Overlay */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 shadow-lg text-[11px] text-white">
            <span className="font-bold flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {facingMode === 'user'
                ? (language === 'am' ? 'የፊት ካሜራ' : 'Front')
                : (language === 'am' ? 'የጀርባ ካሜራ' : 'Back')}
            </span>

            {onSwitchToFrontCamera && facingMode !== 'user' && (
              <button
                type="button"
                onClick={onSwitchToFrontCamera}
                className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold transition cursor-pointer"
                title={language === 'am' ? 'ወደ የፊት ካሜራ ቀይር' : 'Switch to Front Camera'}
              >
                {language === 'am' ? 'ፊት' : 'Front'}
              </button>
            )}

            {onSwitchToBackCamera && facingMode === 'user' && (
              <button
                type="button"
                onClick={onSwitchToBackCamera}
                className="px-2 py-0.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition cursor-pointer"
                title={language === 'am' ? 'ወደ የጀርባ ካሜራ ቀይር' : 'Switch to Back Camera'}
              >
                {language === 'am' ? 'ጀርባ' : 'Back'}
              </button>
            )}

            {onFlipCamera && (
              <button
                type="button"
                onClick={onFlipCamera}
                className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold transition cursor-pointer flex items-center gap-1"
                title={language === 'am' ? 'ካሜራ አዙር' : 'Flip Camera'}
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}

            {onToggleMirror && (
              <button
                type="button"
                onClick={onToggleMirror}
                className="px-1.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                title={language === 'am' ? 'መስታወት ገልብጥ' : 'Mirror Video'}
              >
                {isMirrored ? '🪞' : 'Normal'}
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
              <p className="text-emerald-400 text-xs mt-1">
                {language === 'am' ? 'የተሰቀለው ፎቶ አገልግሎት ላይ ነው' : 'Uploaded photo is active'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSwitchToFrontCamera || onTurnOnCamera}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? '🤳 ካሜራ ክፈት' : '🤳 Turn On Camera'}</span>
                </button>
                {onUploadPhoto && (
                  <button
                    type="button"
                    onClick={onUploadPhoto}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'ፎቶ ቀይር' : 'Change Photo'}</span>
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
                {language === 'am' ? 'የፊት ካሜራዎን ያብሩ' : 'Turn On Camera'}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
                {language === 'am' 
                  ? 'ተማሪዎች እርስዎን በቀጥታ እንዲያዩ ካሜራዎን ያብሩ።' 
                  : 'Turn on your camera so students can see you live in the classroom.'}
              </p>

              {cameraError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex flex-col gap-2 text-left w-full">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isInIframe && typeof window !== 'undefined' && (
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-[11px] cursor-pointer transition inline-flex items-center gap-1"
                      >
                        <span>{language === 'am' ? 'በአዲስ ታብ ክፈት (ካሜራ ለመፍቀድ)' : 'Open in New Tab to Allow Camera'}</span>
                      </a>
                    )}
                    {onOpenNewTab && (
                      <button
                        type="button"
                        onClick={onOpenNewTab}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer transition"
                      >
                        {language === 'am' ? 'ሊንክ ገልብጥ' : 'Copy Link'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  disabled={isStartingCamera}
                  onClick={() => (onTurnOnCamera ? onTurnOnCamera() : onSwitchToFrontCamera?.())}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-950/50 cursor-pointer transition active:scale-95"
                >
                  <Video className={`w-4 h-4 ${isStartingCamera ? 'animate-spin' : ''}`} />
                  <span>
                    {isStartingCamera
                      ? (language === 'am' ? 'ካሜራ በመክፈት ላይ...' : 'Opening Camera...')
                      : (language === 'am' ? 'ካሜራ ክፈት' : 'Turn On Camera')}
                  </span>
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {onSwitchToBackCamera && (
                    <button
                      type="button"
                      disabled={isStartingCamera}
                      onClick={onSwitchToBackCamera}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 disabled:opacity-60 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ጀርባ ካሜራ' : 'Back Camera'}</span>
                    </button>
                  )}

                  {onUploadPhoto && (
                    <button
                      type="button"
                      onClick={onUploadPhoto}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ፎቶ ስቀል' : 'Upload Photo'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speaking Active Banner Badge over Face */}
      {isSpeaking && (
        <div className="absolute bottom-3 left-3 z-30 px-2.5 py-1 rounded-xl bg-emerald-950/90 border border-emerald-400/70 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 shadow-xl backdrop-blur-md animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{language === 'am' ? 'ድምፅ እየተናገሩ ነው...' : 'Speaking...'}</span>
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
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
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
  language = 'en',
  onSelectLanguage,
}) => {
  const [internalLang, setInternalLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem('ethio_exam_language') as Language) || language || 'en';
    } catch {
      return language || 'en';
    }
  });

  const currentLang: Language = language || internalLang;
  const setLang = (l: Language) => {
    setInternalLang(l);
    try {
      localStorage.setItem('ethio_exam_language', l);
    } catch {}
    if (onSelectLanguage) onSelectLanguage(l);
  };

  const t = (key: TranslationKey) => getTranslation(key, currentLang);
  const isAm = currentLang === 'am';
  const isAuthorizedTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const effectiveStudentLevel =
    currentUser?.role === 'student' && currentUser.gradeLevel
      ? currentUser.gradeLevel
      : selectedLevel;
  const visibleLiveClasses =
    currentUser?.role === 'student'
      ? liveClasses.filter((c) => c.level === effectiveStudentLevel)
      : liveClasses;

  // Find currently selected class or fallback gracefully within visible grade classes
  const currentLevelClasses = visibleLiveClasses.filter((c) => c.level === effectiveStudentLevel);
  const selectedClass =
    visibleLiveClasses.find((c) => c.id === activeClassId) ||
    currentLevelClasses[0] ||
    visibleLiveClasses[0] ||
    liveClasses[0];

  // Stage display mode: 'slides' | 'video' | 'whiteboard' | 'split' | 'split_ppt' | 'camera' | 'screenshare'
  const [stageMode, setStageMode] = useState<'camera' | 'split' | 'slides' | 'split_ppt' | 'whiteboard' | 'video' | 'screenshare'>(() => {
    if (selectedClass?.youtubeId || selectedClass?.videoUrl) return 'video';
    return 'slides';
  });
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [isTeaching, setIsTeaching] = useState<boolean>(false);
  
  // Interactive Live Classroom states
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isQuestionMode, setIsQuestionMode] = useState<boolean>(false);
  const [chatAttachment, setChatAttachment] = useState<{ name: string; url: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const chatAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [streamStatusFilter, setStreamStatusFilter] = useState<'all' | 'live' | 'scheduled' | 'recordings'>('all');
  const [activeChatTab, setActiveChatTab] = useState<'chat' | 'qa' | 'pending' | 'polls'>('chat');
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [qaStatusFilter, setQaStatusFilter] = useState<'all' | 'unanswered' | 'answered' | 'pinned'>('all');
  const [replyingTo, setReplyingTo] = useState<LiveChatMessage | null>(null);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [teacherAnswerText, setTeacherAnswerText] = useState<string>('');
  const [isSubmittingChat, setIsSubmittingChat] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState<boolean>(false);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [activeClassTool, setActiveClassTool] = useState<'whiteboard' | 'files' | 'polls' | 'attendance' | 'notes'>('whiteboard');
  const [userVotedPollOption, setUserVotedPollOption] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Intelligent auto-scroll: only scrolls to bottom if the user is already near bottom
  useEffect(() => {
    if (!isUserScrolledUp) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [chatMessages.length, isUserScrolledUp]);

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
        triggerToast(currentLang === 'am' ? 'የእርስዎ ፎቶ ተጭኗል! ፊትዎ በቀጥታ እየታየ ነው።' : 'Your face photo is now broadcasting live.');
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
      triggerToast(currentLang === 'am' ? 'የእርስዎ ፊት ፎቶ በቀጥታ ስርጭት ላይ ውሏል።' : 'Teacher photo is now active.');
    } else {
      photoInputRef.current?.click();
    }
  };

  const handleOpenNewTab = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      triggerToast(
        currentLang === 'am'
          ? 'የክፍሉ ሊንክ ተገልብጧል! በሌላ መስኮት ለመክፈት ይለጥፉ።'
          : 'Classroom link copied! Paste in another tab or share with students.'
      );
    } catch {
      triggerToast(
        currentLang === 'am'
          ? 'ይህንን አድራሻ ይጠቀሙ፦ ' + window.location.href
          : 'Share link: ' + window.location.href
      );
    }
  };

  // Interaction Toggles
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState<boolean>(false);
  const [showMoreToolbarMenu, setShowMoreToolbarMenu] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'live_room' | 'recordings'>('recordings');
  const prevActiveClassIdRef = useRef<string | undefined>(activeClassId);

  // When activeClassId prop explicitly changes to a different ID (e.g. user clicked Join), enter live_room
  useEffect(() => {
    if (activeClassId && activeClassId !== prevActiveClassIdRef.current) {
      setActiveTab('live_room');
      // Set appropriate stage mode for newly opened class
      const targetClass = liveClasses.find((c) => c.id === activeClassId);
      if (targetClass?.youtubeId || targetClass?.videoUrl) {
        setStageMode('video');
      } else {
        setStageMode('slides');
      }
    }
    prevActiveClassIdRef.current = activeClassId;
  }, [activeClassId, liveClasses]);

  // Fullscreen, mobile layout & teacher console states
  const classroomStageRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mobileClassroomTab, setMobileClassroomTab] = useState<'stage' | 'chat'>('stage');
  const [isTeacherConsoleOpen, setIsTeacherConsoleOpen] = useState<boolean>(true);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!classroomStageRef.current) return;
    if (!document.fullscreenElement) {
      classroomStageRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleOpenClassMaterial = (matTitle: string) => {
    const cleanTitle = matTitle.trim().toLowerCase();
    const found = DOCUMENTS_DATA.find(
      (d) =>
        d.title.toLowerCase() === cleanTitle ||
        d.title.toLowerCase().includes(cleanTitle) ||
        cleanTitle.includes(d.title.toLowerCase())
    );
    if (found) {
      setViewingClassDocument(found);
    } else {
      setViewingClassDocument({
        id: `mat-${selectedClass.id}`,
        title: matTitle,
        subject: selectedClass.subject,
        subjectId: selectedClass.subjectId,
        level: selectedClass.level,
        chapter: selectedClass.currentTopic || selectedClass.title,
        category: 'Teacher Summary',
        fileType: 'PDF',
        pages: selectedClass.slides?.length || 5,
        fileSize: '2.4 MB',
        uploadedBy: selectedClass.teacherName && !selectedClass.teacherName.includes('መምህር አልተመደበም') && !selectedClass.teacherName.toLowerCase().includes('no teacher') ? selectedClass.teacherName : (currentLang === 'am' ? 'የሥርዓተ-ትምህርት አዘጋጅ ኮሚቴ' : 'National Curriculum Specialist Panel'),
        uploadDate: '2026-03-01',
        downloadsCount: 0,
        fullExcerpt: `${selectedClass.title.toUpperCase()}\nTOPIC: ${selectedClass.currentTopic}\n\n${(selectedClass.slides || []).map((s, idx) => `SECTION ${idx + 1}: ${s.title}\n${s.bulletPoints.map((b) => `• ${b}`).join('\n')}\n${s.formulaOrQuote ? `Formula / Theorem: ${s.formulaOrQuote}\n` : ''}`).join('\n')}`,
      });
    }
  };

  // Teacher Start Class Modal
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [newClassTitle, setNewClassTitle] = useState<string>('');
  const [newClassSubject, setNewClassSubject] = useState<string>(currentUser?.teachingSubject || 'Physics');
  const [newClassTopic, setNewClassTopic] = useState<string>('');
  const [newClassLevel, setNewClassLevel] = useState<ExamLevel>(currentUser?.gradeLevel || selectedLevel);
  const [newClassYoutube, setNewClassYoutube] = useState<string>('');
  const [newClassVideoFile, setNewClassVideoFile] = useState<File | null>(null);
  const [newClassVideoPreviewUrl, setNewClassVideoPreviewUrl] = useState<string | null>(null);
  const [isUploadingNewClassVideo, setIsUploadingNewClassVideo] = useState<boolean>(false);
  const startModalVideoInputRef = useRef<HTMLInputElement | null>(null);
  const [startAsLive, setStartAsLive] = useState<boolean>(true);

  // Live Classroom Uploaded Lesson Video State (for teachers teaching with pre-recorded videos)
  const liveLessonVideoInputRef = useRef<HTMLInputElement | null>(null);
  const lessonVideoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const isRemoteSyncingVideoRef = useRef<boolean>(false);
  const [roomLessonVideoUrl, setRoomLessonVideoUrl] = useState<string | null>(selectedClass?.videoUrl || null);
  const [roomLessonYoutubeId, setRoomLessonYoutubeId] = useState<string | null>(selectedClass?.youtubeId || null);
  const [roomLessonVideoTitle, setRoomLessonVideoTitle] = useState<string | null>(null);
  const [isUploadingLiveLessonVideo, setIsUploadingLiveLessonVideo] = useState<boolean>(false);
  const [showQuickYoutubeInput, setShowQuickYoutubeInput] = useState<boolean>(false);
  const [quickYoutubeUrl, setQuickYoutubeUrl] = useState<string>('');

  useEffect(() => {
    setRoomLessonVideoUrl(selectedClass?.videoUrl || null);
    setRoomLessonYoutubeId(selectedClass?.youtubeId || null);
    setRoomLessonVideoTitle(null);
  }, [selectedClass?.id, selectedClass?.videoUrl, selectedClass?.youtubeId]);

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
  const [liveViewerCount, setLiveViewerCount] = useState<number>(0);
  const [viewingClassDocument, setViewingClassDocument] = useState<DocumentMaterial | null>(null);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState<boolean>(false);
  const [remoteAudioVolume, setRemoteAudioVolume] = useState<number>(1.0);
  const remoteAudioVolumeRef = useRef<number>(1.0);
  remoteAudioVolumeRef.current = remoteAudioVolume;
  const isRemoteAudioMutedRef = useRef<boolean>(false);
  isRemoteAudioMutedRef.current = isRemoteAudioMuted;
  const [activeServerBroadcast, setActiveServerBroadcast] = useState<ActiveBroadcastInfo | null>(null);
  const activeServerBroadcastRef = useRef<ActiveBroadcastInfo | null>(null);
  activeServerBroadcastRef.current = activeServerBroadcast;
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
        triggerToast(
          currentLang === 'am'
            ? `🔴 መምህር ${info.teacherName} የቀጥታ ስርጭት ጀምረዋል!`
            : `🔴 Instructor ${info.teacherName} started live broadcast!`
        );
      },
      (stopInfo) => {
        if (!stopInfo?.roomId || stopInfo.roomId === activeServerBroadcastRef.current?.roomId) {
          setActiveServerBroadcast(null);
        }
      }
    );

    return cleanup;
  }, [currentLang]);

  useEffect(() => {
    const roomId = `room-${selectedClass?.id || 'live-ethio-class'}`;
    const clientUser = {
      id: stableUserIdRef.current,
      name: currentUser?.name || (currentUser?.role === 'teacher' ? 'Teacher' : 'Student'),
      role: currentUser?.role || 'student',
    };

    const client = new LiveClassroomClient(roomId, clientUser, {
      onRoomInit: (room) => {
        setLiveViewerCount(room.userCount || (room.users ? Object.keys(room.users).length : 0));
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
        if (room.videoUrl !== undefined) {
          setRoomLessonVideoUrl(room.videoUrl);
        }
        if (room.youtubeId !== undefined) {
          setRoomLessonYoutubeId(room.youtubeId);
        }
        if (room.videoTitle !== undefined) {
          setRoomLessonVideoTitle(room.videoTitle);
        }
      },
      onUserJoined: (u, count) => {
        setLiveViewerCount(count);
        setOnlineParticipants((prev) => [...prev.filter((p) => p.id !== u.id), u]);
        triggerToast(
          currentLang === 'am'
            ? `👋 ${u.name} አሁን በቀጥታ ክፍል ውስጥ ተቀላቅለዋል`
            : `👋 ${u.name} joined the live classroom`
        );
      },
      onUserLeft: (uid, count) => {
        setLiveViewerCount(count);
        setOnlineParticipants((prev) => prev.filter((p) => p.id !== uid));
      },
      onBroadcastStarted: (info) => {
        setLiveBroadcasterInfo(info);
        triggerToast(
          currentLang === 'am'
            ? `🔴 መምህር ${info.teacherName} የቀጥታ ስርጭት ጀምረዋል! ድምፃቸውንና ምስላቸውን በቀጥታ ይከታተሉ።`
            : `🔴 Instructor ${info.teacherName} is now live! Audio and video are broadcasting.`
        );
      },
      onBroadcastStopped: () => {
        setLiveBroadcasterInfo(null);
        setRemoteTeacherStream(null);
        setRemoteTeacherFrame(null);
        triggerToast(currentLang === 'am' ? 'የቀጥታ ስርጭቱ ተጠናቋል።' : 'Live broadcast ended.');
      },
      onVideoFrame: (frameBase64) => {
        setRemoteTeacherFrame(frameBase64);
      },
      onAudioChunk: (chunkBase64) => {
        // Fallback Audio chunk playback: guarantees student hears teacher even without P2P WebRTC
        try {
          if (!remoteTeacherStream && !isRemoteAudioMutedRef.current && remoteAudioVolumeRef.current > 0) {
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
            fallbackAudioRef.current.volume = remoteAudioVolumeRef.current;
            fallbackAudioRef.current.muted = isRemoteAudioMutedRef.current;
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
        if (!isAuthorizedTeacher) {
          if (info.stageMode) setStageMode(info.stageMode as any);
          if (typeof info.currentSlideIndex === 'number') setCurrentSlideIndex(info.currentSlideIndex);
          if (info.videoUrl !== undefined) setRoomLessonVideoUrl(info.videoUrl);
          if (info.youtubeId !== undefined) setRoomLessonYoutubeId(info.youtubeId);
          if (info.videoTitle !== undefined) setRoomLessonVideoTitle(info.videoTitle);
        }
      },
      onVideoControl: (ctrl) => {
        if (!isAuthorizedTeacher && lessonVideoPlayerRef.current) {
          const vidEl = lessonVideoPlayerRef.current;
          isRemoteSyncingVideoRef.current = true;
          try {
            if (typeof ctrl.currentTime === 'number' && Math.abs(vidEl.currentTime - ctrl.currentTime) > 1.2) {
              vidEl.currentTime = ctrl.currentTime;
            }
            if (ctrl.action === 'play') {
              vidEl.play().catch(() => {});
            } else if (ctrl.action === 'pause') {
              vidEl.pause();
            }
          } finally {
            setTimeout(() => {
              isRemoteSyncingVideoRef.current = false;
            }, 250);
          }
        }
      },
      onChatMessage: (msg) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (isUserScrolledUp) {
          setUnreadCount((c) => c + 1);
        }
      },
      onChatReaction: ({ messageId, emoji, reactions, upvotes }) => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions, upvotes } : m))
        );
      },
      onChatPin: ({ messageId, isPinned }) => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m))
        );
      },
      onChatAnswer: ({ messageId, isAnswered, teacherAnswer, answeredBy, answeredAt }) => {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  isAnswered,
                  teacherAnswer: teacherAnswer || m.teacherAnswer,
                  answeredBy: answeredBy || m.answeredBy,
                  answeredAt: answeredAt || m.answeredAt,
                }
              : m
          )
        );
      },
      onChatDelete: ({ messageId }) => {
        setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
      },
      onChatEdit: ({ messageId, text }) => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, text } : m))
        );
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

  // Broadcast teacher's active stage mode and slide index to connected students
  useEffect(() => {
    if (isAuthorizedTeacher && activeTab === 'live_room') {
      liveClientRef.current?.updateStage(stageMode, currentSlideIndex);
    }
  }, [isAuthorizedTeacher, activeTab, stageMode, currentSlideIndex]);

  const toggleLiveBroadcast = async () => {
    if (isBroadcastingLive) {
      liveClientRef.current?.stopBroadcast();
      setIsBroadcastingLive(false);
      triggerToast(t('liveBroadcastStoppedToast'));
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
      triggerToast(t('liveBroadcastStartedToast'));
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

    triggerToast(t('recordingDeletedToast'));
  };

  const defaultCurriculumSlides: LiveSlide[] = currentLang === 'am' ? [
    {
      title: `${selectedClass?.subject || 'ፊዚክስ'} 12ኛ ክፍል፦ የአገር አቀፍ ፈተና ክለሳ`,
      subtitle: 'የፈተና ዝግጅት ዋና ዋና ነጥቦች',
      bulletPoints: [
        'ክለሳ 1፦ መሰረታዊ ጽንሰ-ሀሳቦች እና ፎርሙላዎች',
        'ክለሳ 2፦ የአገር አቀፍ ፈተና የተመረጡ ጥያቄዎችና አሰራሮች',
        'ክለሳ 3፦ ፈጣን የማስያ ዘዴዎችና የተማሪዎች የተለመዱ ስህተቶች',
      ],
      formulaOrQuote: 'P = V · I = I² · R  |  ε = -N · (ΔΦ / Δt)',
    },
    {
      title: `${selectedClass?.subject || 'ፊዚክስ'}፦ የተመረጠ የፈተና ጥያቄ እና አሰራር`,
      subtitle: 'በሰሌዳው ላይ ደረጃ በደረጃ የሚሰራ ስሌት',
      bulletPoints: [
        'ጥያቄውን በጥንቃቄ አንብበው የተሰጡ መረጃዎችን ለይተው ይፃፉ',
        'አሃዶችን ወደ መደበኛ መለኪያ ማስተካከልዎን ያረጋግጡ',
        'ትክክለኛውን ፎርሙላ በመጠቀም ውጤቱን በቀጥታ በሰሌዳው ላይ ይስሩ',
      ],
      formulaOrQuote: 'F_net = m · a  |  W = F · d',
    },
    {
      title: 'የማጠቃለያ ምክሮች እና የተማሪዎች ጥያቄዎች',
      subtitle: 'የቀጥታ ውይይት እና ማብራሪያ',
      bulletPoints: [
        'ተማሪዎች ያልገባችሁን ነጥብ በቀጥታ ውይይት ላይ ጻፉ',
        'የቀጣይ ክፍለ-ጊዜ የቤት ስራና የተዘጋጁ ማስታወሻዎችን ከታች ያውርዱ',
      ],
      formulaOrQuote: 'ትኩረት + ልምምድ = የላቀ ውጤት!',
    },
  ] : [
    {
      title: `${selectedClass?.subject || 'Physics'} Grade 12: National Examination Review`,
      subtitle: 'ESSLCE High-Yield Exam Preparation',
      bulletPoints: [
        'Review 1: Core Formulas & Fundamental Principles',
        'Review 2: ESSLCE Matric Exam Selected Questions & Solutions',
        'Review 3: Quick Calculation Shortcuts & Common Student Pitfalls',
      ],
      formulaOrQuote: 'P = V · I = I² · R  |  ε = -N · (ΔΦ / Δt)',
    },
    {
      title: `${selectedClass?.subject || 'Physics'}: Step-by-Step Exam Problem & Solution`,
      subtitle: 'Step-by-Step Problem Solving on Whiteboard',
      bulletPoints: [
        'Read the problem statement carefully and list all given variables',
        'Verify and convert all units to standard SI units before calculating',
        'Apply the governing formula and show clear steps on the board',
      ],
      formulaOrQuote: 'F_net = m · a  |  W = F · d',
    },
    {
      title: 'Summary Tips & Student Interactive Q&A',
      subtitle: 'Q&A and Interactive Discussion',
      bulletPoints: [
        'Students: Submit any questions or doubts in the live chat or Q&A tab',
        'Download attached lecture summary notes and formula sheets below',
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
            ctx.fillText(isAm ? 'የዲጂታል ሰሌዳ — የቀጥታ ስሌቶችና ማብራሪያ' : 'Interactive Digital Blackboard — Draw & solve problems live.', 24, 36);
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
    triggerToast(t('exitClassToast'));
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
      triggerToast(t('liveAudioMonitorOff'));
    } else {
      try {
        const mic = await ensureActiveMicrophone();
        if (!mic) {
          triggerToast(t('micNotFound'));
          return;
        }
        const audioTrack = mic.getAudioTracks().find((t) => t.readyState === 'live');
        if (!audioTrack) {
          triggerToast(t('audioNotReady'));
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
          triggerToast(t('liveAudioMonitorActive'));
        }
      } catch (err) {
        console.warn('Monitor mic error:', err);
        triggerToast(t('cannotOpenAudioMonitor'));
      }
    }
  };

  // Start Camera immediately within user gesture so browser prompts reliably without losing activation
  const startCameraWithFacing = async (
    facing: 'user' | 'environment',
    explicitDeviceId?: string,
    preserveStage: boolean = false
  ) => {
    if (isStartingCamera) return;
    setCameraFacing(facing);
    setIsMirrored(facing === 'user');
    setCameraError(null);
    setIsTeaching(true);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCamActive(false);
      setCameraError(
        isAm
          ? 'ካሜራ በዚህ አሳሽ ውስጥ አልተደገፈም (HTTPS ወይም አዲስ አሳሽ ያስፈልጋል)'
          : 'Camera not supported in this browser (HTTPS or modern browser required).'
      );
      return;
    }

    setIsStartingCamera(true);

    // Detach onended handlers and stop previous video tracks cleanly before requesting new stream
    if (userStreamRef.current) {
      userStreamRef.current.getVideoTracks().forEach((t) => {
        try {
          t.onended = null;
          t.stop();
        } catch (e) {}
      });
    }

    try {
      let stream: MediaStream | null = null;
      const cleanDeviceId = explicitDeviceId && explicitDeviceId.trim() ? explicitDeviceId.trim() : undefined;

      // Call getUserMedia IMMEDIATELY (before enumerateDevices) so browser keeps user gesture activation
      if (cleanDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: cleanDeviceId } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { ideal: cleanDeviceId }, facingMode: { ideal: facing } },
            audio: false,
          });
        }
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facing } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      const vTrack = stream?.getVideoTracks()?.[0];
      if (!stream || !vTrack) {
        throw new Error('No live video track returned');
      }

      vTrack.enabled = true;
      vTrack.onended = () => {
        if (userStreamRef.current === stream) {
          userStreamRef.current = null;
          setCamActive(false);
          setUserStream(null);
        }
      };

      const settings = vTrack.getSettings ? vTrack.getSettings() : {};
      if (settings.deviceId) {
        setSelectedCameraId(settings.deviceId);
      }
      setIsMirrored(facing === 'user');
      setCameraFacing(facing);

      // Attach existing active mic track only if user already has mic running (never prompt mic unexpectedly on camera click)
      if (micStreamRef.current) {
        const audioTrack = micStreamRef.current.getAudioTracks().find((t) => t.readyState === 'live');
        if (audioTrack && !stream.getAudioTracks().some((t) => t.id === audioTrack.id)) {
          audioTrack.enabled = micActive;
          stream.addTrack(audioTrack);
        }
      }

      userStreamRef.current = stream;
      setUserStream(stream);
      setCamActive(true);
      if (!preserveStage && stageMode !== 'split' && stageMode !== 'split_ppt') {
        setStageMode('camera');
      }

      // Discover labeled devices now that permission has been granted
      refreshCameraDevices().catch(() => {});
      triggerToast(
        currentLang === 'am'
          ? (facing === 'user' ? 'የፊት ካሜራ በርቷል' : 'የጀርባ ካሜራ በርቷል')
          : (facing === 'user' ? 'Camera turned on' : 'Back camera turned on')
      );
    } catch (err: any) {
      console.error('Camera open error:', err);
      userStreamRef.current = null;
      setCamActive(false);
      setUserStream(null);
      const isNotAllowed = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.name === 'SecurityError';
      const isNotFound = err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';
      const isNotReadable = err?.name === 'NotReadableError' || err?.name === 'TrackStartError';
      if (isNotAllowed) {
        setCameraError(
          currentLang === 'am'
            ? 'የካሜራ ፈቃድ ተከልክሏል። በአሳሽዎ ይፍቀዱ ወይም ከታች "በአዲስ ታብ ክፈት" የሚለውን ይጫኑ።'
            : 'Camera permission denied. Allow camera in your browser or open this classroom in a new tab.'
        );
      } else if (isNotFound) {
        setCameraError(
          currentLang === 'am'
            ? 'ካሜራ አልተገኘም። እባክዎ ካሜራ መገናኘቱን ያረጋግጡ ወይም ፎቶ ይስቀሉ።'
            : 'No camera device found on this device. Connect a camera or upload a photo.'
        );
      } else if (isNotReadable) {
        setCameraError(
          currentLang === 'am'
            ? 'ካሜራው በሌላ መተግበሪያ እየተጠቀመበት ነው፤ እባክዎ ሌሎችን ይዝጉ።'
            : 'Camera is currently in use by another app.'
        );
      } else {
        setCameraError(
          currentLang === 'am'
            ? 'ካሜራ መክፈት አልተቻለም። እባክዎ ፈቃድ ያረጋግጡ ወይም ፎቶ ይስቀሉ።'
            : 'Could not start camera. Check browser permissions or upload a photo.'
        );
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Switch to specific camera device
  const handleSelectCameraDevice = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    const dev = availableCameras.find((d) => d.deviceId === deviceId);
    const label = (dev?.label || '').toLowerCase();
    const isBack = label.includes('back') || label.includes('environment') || label.includes('rear');
    const targetFacing = isBack ? 'environment' : 'user';
    await startCameraWithFacing(targetFacing, deviceId, stageMode === 'split' || stageMode === 'split_ppt');
  };

  // Toggle Camera with front/back camera support
  const handleToggleCamera = async (forceOn?: boolean, preserveStage?: boolean) => {
    const hasActiveVideo = Boolean(
      (userStreamRef.current && userStreamRef.current.getVideoTracks().some((t) => t.readyState === 'live')) ||
      teacherPhoto
    );
    if (camActive && !forceOn && hasActiveVideo) {
      if (userStreamRef.current) {
        userStreamRef.current.getVideoTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
      }
      setUserStream(null);
      setTeacherPhoto(null);
      setCamActive(false);
      triggerToast(t('cameraTurnedOff'));
    } else {
      await startCameraWithFacing(
        cameraFacing || 'user',
        undefined,
        preserveStage ?? (stageMode === 'split' || stageMode === 'split_ppt')
      );
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
      await startCameraWithFacing(nextFacing, undefined, stageMode === 'split' || stageMode === 'split_ppt');
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
        const activeName = freshMic.getAudioTracks()[0]?.label || (isAm ? 'ውጫዊ ማይክሮፎን' : 'External Microphone');
        triggerToast(isAm ? `ማይክሮፎን ተቀይሯል: ${activeName}` : `Microphone changed: ${activeName}`);
        syncBroadcastStream();
      }
    } catch (err) {
      console.error('Microphone select error:', err);
      triggerToast(isAm ? 'ማይክሮፎኑን መቀየር አልተቻለም' : 'Could not change microphone device');
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
            ? (isAm ? '🔊 የውጭ ድምፅ ተቀባይ በርቷል' : '🔊 External room sound mode enabled')
            : (isAm ? '🔇 የተጣራ የንግግር ድምፅ በርቷል' : '🔇 Standard voice filter enabled')
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
          triggerToast(isAm ? '🔊 የድምፅ ቃጭል ተሰምቷል! ስፒከርዎ በጥሩ ሁኔታ እየሰራ ነው' : '🔊 Sound chime played! Speakers are working properly');
        }, 900);
      } else {
        setIsTestingSpeakers(false);
        triggerToast(isAm ? 'የድምፅ ሞተር አልተደገፈም' : 'Audio engine not supported');
      }
    } catch (e) {
      setIsTestingSpeakers(false);
      triggerToast(isAm ? 'የስፒከር ድምፅ መፈተሽ አልተቻለም' : 'Could not test speaker output');
    }
  };

  const handleTestMic = async () => {
    setIsTestingMic(true);
    triggerToast(isAm ? '🎤 እባክዎ አሁን ወደ ማይክሮፎንዎ ይናገሩ — ድምፅዎ በስፒከር ላይ ይሰማዎታል...' : '🎤 Please speak into your microphone to test voice transmission...');
    try {
      const mic = await ensureActiveMicrophone();
      if (!mic) {
        setIsTestingMic(false);
        triggerToast(isAm ? '⚠️ ማይክሮፎን አልተፈቀደም! እባክዎ በአሳሽዎ ውስጥ ማይክሮፎን ይፍቀዱ' : '⚠️ Microphone permission denied! Please allow access in browser');
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
            triggerToast(isAm ? '✅ ማይክሮፎንዎ በጥሩ ሁኔታ እየሰራ ነው! ድምፅዎ በግልጽ ይሰማል' : '✅ Microphone is working properly! Loud and clear');
          } else {
            triggerToast(isAm ? '💡 ማይክሮፎኑ ክፍት ነው፤ ለተሻለ ድምፅ ወደ ማይክሮፎኑ ጠጋ ብለው ይናገሩ' : '💡 Mic is open; speak closer to your microphone for best audio');
          }
        }, 2800);
      } else {
        setTimeout(() => {
          setIsTestingMic(false);
          triggerToast(isAm ? '✅ ማይክሮፎንዎ ተከፍቷል' : '✅ Microphone is ready');
        }, 1500);
      }
    } catch (e) {
      setIsTestingMic(false);
      triggerToast(isAm ? '⚠️ ማይክሮፎን መክፈት አልተቻለም' : '⚠️ Could not access microphone');
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
      setMicPermissionError(null);
      syncBroadcastStream();
      triggerToast(isAm ? 'ማይክሮፎን ተዘግቷል' : 'Microphone muted');
    } else {
      const mic = await ensureActiveMicrophone();
      if (mic) {
        setMicPermissionError(null);
        setMicActive(true);
        mic.getAudioTracks().forEach((t) => (t.enabled = true));
        if (userStream) {
          userStream.getAudioTracks().forEach((t) => (t.enabled = true));
        }
        syncBroadcastStream();
        triggerToast(isAm ? 'ማይክሮፎን ተከፍቷል - ድምፅዎ ይሰማል' : 'Microphone unmuted - Voice transmitting');
      } else {
        setMicActive(false);
        setMicPermissionError(
          isAm
            ? 'የማይክሮፎን ፍቃድ ተከልክሏል ወይም መሣሪያ አልተገኘም። እባክዎ በብሮውዘሩ ፍቃድ ይስጡ።'
            : 'Microphone permission denied or device not detected. Please allow microphone access in your browser settings.'
        );
        triggerToast(isAm ? '⚠️ ማይክሮፎን አልተፈቀደም፤ እባክዎ በብሮውዘሩ ፍቃድ ይስጡ' : '⚠️ Microphone permission denied; please allow in browser settings');
      }
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
      ctx.fillText(isAm ? `• ስላይድ ${currentSlideIndex + 1} / ${slides.length}` : `• Slide ${currentSlideIndex + 1} / ${slides.length}`, 310, 34);
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
        ctx.fillText(isAm ? '👤 የቀጥታ መምህር ካሜራ' : '👤 Live Teacher Camera Active', W / 2 - 180, H / 2);
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
      ctx.fillText(isSpeaking ? (isAm ? '🎙️ ድምፅ እየተናገሩ ነው' : '🎙️ Voice Transmitting') : (isAm ? '🎙️ ድምፅ ዝግጁ ነው' : '🎙️ Mic Active'), 42, H - 28);

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
        ctx.fillText(isAm ? '👤 መምህር' : '👤 Teacher Presenter', teachX + 55, teachY + 130);
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
      ctx.fillText(isAm ? '📋 የቀጥታ ትምህርት መረጃ' : '📋 Live Class Info', infoX + 20, infoY + 36);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText(isAm ? `• ርዕስ: ${selectedClass?.currentTopic || 'Live Lecture'}` : `• Topic: ${selectedClass?.currentTopic || 'Live Lecture'}`, infoX + 20, infoY + 75);
      ctx.fillText(isAm ? `• ደረጃ: ${selectedClass?.level || 'Grade 12'}` : `• Level: ${selectedClass?.level || 'Grade 12'}`, infoX + 20, infoY + 105);
      ctx.fillText(isAm ? `• ተሳታፊዎች: ${(selectedClass as any)?.activeStudents || 48} ተማሪዎች` : `• Attendees: ${(selectedClass as any)?.activeStudents || 48} Students`, infoX + 20, infoY + 135);

      ctx.fillStyle = micActive ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(infoX + 26, infoY + 175, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px sans-serif';
      ctx.fillText(
        micActive
          ? (isSpeaking ? (isAm ? 'ድምፅ እየተሰማ ነው' : 'Voice Transmitting') : (isAm ? 'ማይክሮፎን ክፍት ነው' : 'Mic Active'))
          : (isAm ? 'ድምፅ ዝም ብሏል' : 'Muted'),
        infoX + 40,
        infoY + 180
      );

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(infoX + 16, infoY + 215, infoW - 32, 125, 10);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(isAm ? '💡 የፈተና ጠቃሚ ማስታወሻ' : '💡 Exam Study Tip', infoX + 28, infoY + 242);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(isAm ? 'ይህ ቀረጻ ሙሉውን የስላይድ ማብራሪያ፣' : 'This recording captures full slides,', infoX + 28, infoY + 270);
      ctx.fillText(isAm ? 'በስላይዱ ላይ የተጻፉ ማስታወሻዎችን እና' : 'on-screen annotations and equations,', infoX + 28, infoY + 292);
      ctx.fillText(isAm ? 'የመምህሩን ድምፅና ገለጻ አጣምሮ ይዟል።' : 'plus instructor audio commentary.', infoX + 28, infoY + 314);
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
        triggerToast(
          isAm
            ? 'ማሳሰቢያ: ቀረጻው በጣም አጭር ስለነበር ቪዲዮ አልተመዘገበም። እባክዎ ቢያንስ ለ 2-3 ሰከንዶች ይቅረጹ።'
            : 'Notice: Recording was too short. Please record for at least 2-3 seconds.'
        );
        return;
      }

      const blob = new Blob(recordedChunksRef.current, { type: mime });
      if (blob.size < 500) {
        triggerToast(
          isAm
            ? 'ማሳሰቢያ: የቀረጻው ፋይል አልተሟላም፤ እባክዎ እንደገና ይሞክሩ።'
            : 'Notice: Recording file incomplete, please try again.'
        );
        return;
      }

      const recId = `rec-${Date.now()}`;
      const recTitle = isAm
        ? `${selectedClass?.title || 'የቀጥታ ክፍለ-ጊዜ'} - የቀጥታ ቀረጻ`
        : `${selectedClass?.title || 'Live Class Session'} - Recorded Lecture`;
      const serverStreamUrl = `/api/recordings/stream/vid-${recId}`;

      // Persist blob in IndexedDB and memory cache
      const playUrl = await saveRecordedVideoBlob(`vid-${recId}`, blob);
      setRecordedVideoUrl(playUrl);

      const newRec = {
        id: recId,
        title: recTitle,
        subject: selectedClass?.subject || 'Curriculum',
        date: isAm ? 'ዛሬ' : 'Today',
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
        subjectId: selectedClass?.subjectId || 'g12_physics',
        level: selectedLevel || selectedClass?.level || 'grade_12_natural',
        chapter: selectedClass?.currentTopic || (isAm ? 'የቀጥታ ስርጭት ትምህርት' : 'Live Classroom Lecture'),
        instructor: authorName,
        duration: finalDuration,
        views: 0,
        videoUrl: serverStreamUrl,
        thumbnailGradient: 'from-emerald-950 via-slate-900 to-indigo-950',
        thumbnailUrl: snapshotThumb || selectedClass?.teacherAvatar || teacherPhoto || undefined,
        timestamps: [
          { time: '00:00', label: isAm ? 'የቀጥታ ስላይድ ማብራሪያ መግቢያ' : 'Lecture Introduction' },
          { time: '01:15', label: isAm ? 'የስላይድ ነጥቦች እና የቦርድ ማስታወሻ' : 'Core Topics & Blackboard Notes' },
        ],
        keyTakeaways: isAm
          ? [
              'በቀጥታ የክፍል ስርጭት ወቅት ከስላይድ እና ከመምህሩ ማብራሪያ ጋር የተቀዳ ቪዲዮ ነው።',
              'የስላይዱ ይዘት፣ በእጅ የተጻፉ ማስታወሻዎች እና የመምህሩ ድምፅና ገለጻ ተካተዋል።',
            ]
          : [
              'Recorded live session combining slides, ink annotations, and teacher audio.',
              'Includes high-yield exam principles and problem walkthroughs.',
            ],
        summaryNotes: isAm
          ? `ይህ ቪዲዮ በ ${authorName} ከነ ሙሉ ስላይዱና የድምፅ ማብራሪያው የተዘጋጀ የቀጥታ ትምህርት ቀረጻ ሲሆን በ "My Videos" ስር በቀጥታ ተቀምጧል።`
          : `Recorded classroom lecture by ${authorName} with full slides and audio commentary, saved in My Videos.`,
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
        chapter: selectedClass?.currentTopic || (isAm ? 'የቀጥታ ስርጭት ትምህርት' : 'Live Classroom Lecture'),
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
      triggerToast(
        isAm
          ? `🔴 የቀረጻው ክፍለ-ጊዜ ቆሟል (${finalDuration})! የስላይዱ፣ የፊትዎና የድምፅዎ ቪዲዮ ወደ "My Videos" ገብቷል!`
          : `🔴 Recording stopped (${finalDuration})! Video saved to "My Videos".`
      );
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
          triggerToast(
            isAm
              ? '🔴 ቀረጻው ጀምሯል! የስላይድ ማብራሪያ፣ ማስታወሻዎችና የመምህሩ ድምፅ በቀጥታ እየተቀዱ ነው!'
              : '🔴 Recording started! Capturing slides, blackboard notes, and teacher audio live!'
          );
        } else {
          triggerToast(
            isAm
              ? '🔴 ቀረጻው ጀምሯል! (ማሳሰቢያ: ማይክሮፎን አልበራም)'
              : '🔴 Recording started (Notice: Microphone is muted)'
          );
        }
      } catch (err) {
        console.warn('MediaRecorder error:', err);
        triggerToast(isAm ? '🔴 የቀረጻ ስህተት አጋጥሟል፤ እባክዎ እንደገና ይሞክሩ።' : '🔴 Recording error occurred; please try again.');
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
      triggerToast(isAm ? 'የመጨረሻው ጽሑፍ ተመልሷል' : 'Undo completed');
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      triggerToast(isAm ? 'ሰሌዳው ባዶ ነው' : 'Board is empty');
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
    triggerToast(isAm ? 'የሰሌዳው ጽሑፍ በሙሉ ተሰርዟል!' : 'Whiteboard cleared successfully!');
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
        triggerToast(isAm ? 'በስላይዱ ላይ የሚመለስ ጽሑፍ የለም' : 'Nothing to undo');
        return prev;
      }
      triggerToast(isAm ? 'የመጨረሻው የስላይድ ጽሑፍ ተመልሷል' : 'Undo completed');
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
    triggerToast(isAm ? 'በዚህ ስላይድ ላይ የተጻፉት በሙሉ ተሰርዘዋል!' : 'Slide annotations cleared');
  };

  const handleDownloadSlideNotes = () => {
    const canvas = slideCanvasRef.current;
    if (!canvas) return;
    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${selectedClass.subject}_Slide_${currentSlideIndex + 1}_Annotated_Notes.png`;
    link.href = imageUri;
    link.click();
    triggerToast(isAm ? 'የስላይዱ ማስታወሻ በምስል ተቀምጧል!' : 'Slide notes saved');
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
            triggerToast(!isSlideAnnotating ? (isAm ? 'በስላይዱ ላይ መጻፊያ በርቷል' : 'Slide drawing enabled') : (isAm ? 'በስላይዱ ላይ መጻፊያ ቆሟል' : 'Slide drawing paused'));
          }}
          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
            isSlideAnnotating
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Toggle Drawing/Highlighting on Slide"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>{isSlideAnnotating ? (isAm ? 'ስላይድ ላይ ጻፍ/አስምር: በርቷል' : 'Slide Annotations: ON') : (isAm ? 'ስላይድ ላይ መጻፊያ: ጠፍቷል' : 'Slide Annotations: OFF')}</span>
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
              title={isAm ? 'አስማሪ / ማድመቂያ' : 'Highlighter'}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>{isAm ? 'አስማሪ' : 'Highlighter'}</span>
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
              title={isAm ? 'ብዕር' : 'Pen'}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isAm ? 'ብዕር' : 'Pen'}</span>
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
              title={isAm ? 'ማጥፊያ' : 'Eraser'}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>{isAm ? 'ማጥፊያ' : 'Eraser'}</span>
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
                { color: '#facc15', label: isAm ? 'ቢጫ' : 'Yellow' },
                { color: '#38bdf8', label: isAm ? 'ሲያን' : 'Cyan' },
                { color: '#34d399', label: isAm ? 'አረንጓዴ' : 'Green' },
                { color: '#f87171', label: isAm ? 'ቀይ' : 'Red' },
                { color: '#ffffff', label: isAm ? 'ነጭ' : 'White' },
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
                title={isAm ? 'ቀጭን መስመር' : 'Fine Line'}
              >
                {isAm ? 'ቀጭን' : 'Fine'}
              </button>
              <button
                type="button"
                onClick={() => setSlidePenSize(6)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${slidePenSize === 6 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title={isAm ? 'መካከለኛ መስመር' : 'Medium Line'}
              >
                {isAm ? 'መካከለኛ' : 'Medium'}
              </button>
              <button
                type="button"
                onClick={() => setSlidePenSize(14)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${slidePenSize >= 12 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
                title={isAm ? 'ሰፊ አስማሪ' : 'Highlighter'}
              >
                {isAm ? 'ሰፊ አስማሪ' : 'Highlighter'}
              </button>
            </div>
          )}

          {/* Undo */}
          <button
            type="button"
            onClick={handleSlideUndo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title={isAm ? 'የመጨረሻውን መልስ' : 'Undo'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleSlideClear}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
            title={isAm ? 'በዚህ ስላይድ ላይ የተጻፈውን በሙሉ አጥፋ' : 'Clear Slide Ink'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Download Slide Notes */}
          <button
            type="button"
            onClick={handleDownloadSlideNotes}
            className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 transition cursor-pointer"
            title={isAm ? 'የተጻፈበትን ስላይድ በምስል አውርድ' : 'Save Annotated Slide'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
  // -------------------------------------------------------------
  const handlePptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const lowerName = fileName.toLowerCase();

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        const newSlide: LiveSlide = {
          title: `🖼️ ${baseName}`,
          subtitle: isAm ? `የተጫነ ዲያግራም (${fileName})` : `Uploaded Diagram (${fileName})`,
          bulletPoints: isAm
            ? [
                'ይህ ስላይድ ከመሳሪያዎ በቀጥታ የተጫነ ምስል/ዲያግራም ነው',
                'ዲያግራሙን እያብራሩ በስላይድ ላይ ማስታወሻ ይጻፉ',
              ]
            : [
                'This slide is an uploaded diagram/image from your device',
                'Annotate directly on the slide while lecturing and explaining key concepts',
              ],
          imageUrl,
        };
        setCustomSlidesMap((prev) => {
          const current = prev[selectedClass.id] || selectedClass.slides || [];
          return { ...prev, [selectedClass.id]: [...current, newSlide] };
        });
        setCurrentSlideIndex((prev) => prev + 1);
        setStageMode('slides');
        triggerToast(isAm ? `የዲያግራም ስላይድ ተጭኗል: ${fileName}` : `Diagram slide uploaded: ${fileName}`);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        triggerToast(isAm ? `PDF "${fileName}" እየተነበበ ነው...` : `Extracting pages from "${fileName}"...`);
        const buffer = await file.arrayBuffer();
        const [pdfjs, workerMod] = await Promise.all([
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        ]);
        if (pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
        }
        const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        const total = pdfDoc.numPages;
        const extractedSlides: LiveSlide[] = [];

        for (let p = 1; p <= Math.min(total, 40); p++) {
          const page = await pdfDoc.getPage(p);
          const tc = await page.getTextContent();
          const lines = tc.items
            .map((it: any) => ('str' in it ? it.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          const sentences = lines
            ? lines.split(/(?<=[.!?])\s+|\s{2,}|•/).map((s) => s.trim()).filter((s) => s.length > 2)
            : [];

          const slideTitle = sentences[0]
            ? sentences[0].slice(0, 75)
            : `${baseName} — ${isAm ? 'ገጽ' : 'Page'} ${p}`;
          const bulletPoints = sentences.length > 1
            ? sentences.slice(1, 6)
            : sentences.length === 1
              ? [sentences[0]]
              : [isAm ? `ከ ${fileName} ገጽ ${p} ይዘት` : `Content from ${fileName} (Page ${p})`];

          extractedSlides.push({
            title: slideTitle,
            subtitle: `${baseName} • ${isAm ? 'ገጽ' : 'Page'} ${p} / ${total}`,
            bulletPoints,
          });
        }

        if (extractedSlides.length > 0) {
          setCustomSlidesMap((prev) => ({
            ...prev,
            [selectedClass.id]: extractedSlides,
          }));
          setCurrentSlideIndex(0);
          setStageMode('slides');
          triggerToast(isAm ? `${extractedSlides.length} ገጾች ከ "${fileName}" ተከፍተዋል!` : `Loaded ${extractedSlides.length} real slides from "${fileName}"!`);
          return;
        }
      } catch (err) {
        console.warn('LiveClassView PDF extraction note:', err);
      }
    }

    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || file.type.startsWith('text/')) {
      try {
        const text = await file.text();
        const blocks = text
          .split(/\n(?=(?:---+|===+|Slide\s+\d+|Page\s+\d+|ስላይድ\s+\d+))|\n\s*\n/)
          .map((b) => b.trim())
          .filter(Boolean);

        const parsedSlides: LiveSlide[] = (blocks.length > 0 ? blocks : [text || baseName]).map((block, idx) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          const heading = (lines[0] || `${baseName} (${idx + 1})`).replace(/^[-#=*]+\s*/, '');
          const bullets = lines.slice(1, 7).map((l) => l.replace(/^[-•*]\s*/, ''));
          return {
            title: heading.slice(0, 80),
            subtitle: `${fileName} • Slide ${idx + 1}`,
            bulletPoints: bullets.length > 0 ? bullets : [block.slice(0, 220)],
          };
        });

        setCustomSlidesMap((prev) => ({
          ...prev,
          [selectedClass.id]: parsedSlides,
        }));
        setCurrentSlideIndex(0);
        setStageMode('slides');
        triggerToast(isAm ? `${parsedSlides.length} ስላይዶች ከ "${fileName}" ተከፍተዋል!` : `Loaded ${parsedSlides.length} slides from "${fileName}"!`);
        return;
      } catch (err) {
        console.warn('LiveClassView text parse note:', err);
      }
    }

    // Fallback for binary PPT/PPTX outlines (cannot parse native binary PPTX directly in browser without server conversion)
    const fallbackSlides: LiveSlide[] = [
      {
        title: `📊 ${baseName}`,
        subtitle: `${fileName} (${selectedClass?.subject || 'Live Lecture'})`,
        bulletPoints: isAm
          ? [
              `"${fileName}" በስላይድ መድረኩ ላይ ተዘጋጅቷል።`,
              'ስላይዶችን በሙሉ ይዘት ለማሳየት PDF ወይም TXT ይጫኑ ወይም Screen Share ይጠቀሙ።',
              'በስላይዱ ላይ በቀጥታ ለመጻፍ "Slide Annotations" ይክፈቱ።',
            ]
          : [
              `Presentation deck "${fileName}" attached to classroom stage.`,
              'For full page-by-page slide rendering, upload as PDF or use Share Screen.',
              'Click Slide Annotations above to highlight or write equations live.',
            ],
      },
    ];
    setCustomSlidesMap((prev) => ({
      ...prev,
      [selectedClass.id]: fallbackSlides,
    }));
    setCurrentSlideIndex(0);
    setStageMode('slides');
    triggerToast(isAm ? `ስላይድ ተጭኗል (${fileName})` : `Presentation loaded (${fileName})`);
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
    triggerToast(isAm ? `የ${subjectKey} የትምህርት PPT ስላይዶች ተከፍተዋል!` : `${subjectKey} curriculum slides loaded!`);
  };

  const handleAddNewSlide = () => {
    if (!newSlideTitle.trim()) {
      triggerToast(isAm ? 'እባክዎ የስላይዱን ርዕስ ያስገቡ' : 'Please enter a title for the slide');
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
    triggerToast(isAm ? 'አዲስ ስላይድ በተሳካ ሁኔታ ተጨምሯል!' : 'New slide added successfully!');
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

  const handleChatAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setChatAttachment({ name: file.name, url });
      triggerToast(`📎 File attached: ${file.name}`);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  const handleQuickDoubtPrompt = (promptText: string) => {
    setIsQuestionMode(true);
    setInputMessage(promptText + ' ');
  };

  // Send Chat Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !chatAttachment) || isSubmittingChat) return;

    setIsSubmittingChat(true);

    const isQuestion = isQuestionMode || inputMessage.includes('?') || inputMessage.toLowerCase().startsWith('what') || inputMessage.toLowerCase().startsWith('how') || inputMessage.toLowerCase().startsWith('why') || inputMessage.toLowerCase().startsWith('can') || inputMessage.toLowerCase().startsWith('could');

    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: currentUser?.name || (isAuthorizedTeacher ? 'Instructor (You)' : 'You (Student)'),
      userId: currentUser?.id || `user-${Date.now()}`,
      role: isAuthorizedTeacher ? 'teacher' : (currentUser?.role === 'admin' ? 'teacher' : 'student'),
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isQuestion,
      isAnswered: false,
      upvotes: 0,
      reactions: {},
      attachmentName: chatAttachment?.name,
      attachmentUrl: chatAttachment?.url,
      replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender, text: replyingTo.text.slice(0, 80) } : undefined,
    };

    // Optimistically update
    setChatMessages((prev) => [...prev, newMsg]);

    // Broadcast in real-time over WebSocket
    liveClientRef.current?.sendChatMessage(newMsg);

    setInputMessage('');
    setChatAttachment(null);
    setIsQuestionMode(false);
    setShowEmojiPicker(false);
    setReplyingTo(null);
    setIsSubmittingChat(false);

    // If it's a question, trigger an AI Co-Tutor response after 1.5 seconds!
    if (isQuestion) {
      setTimeout(() => {
        const aiReplies: Record<string, string> = {
          default: `Thanks for asking! In ${selectedClass.subject}, always double check given parameters, units, and boundary conditions before applying key equations.`,
          Physics: `Study Tip: For electromagnetic induction, remember Lenz's Law dictates the direction of induced EMF opposing flux change. Keep track of magnetic field angle!`,
          Mathematics: `Exam Strategy: For Grade 12 National Exam multiple-choice problems, testing extreme values or graphing asymptotes often eliminates wrong answers quickly.`,
          Geography: `Key Fact: The Great East African Rift Valley divides Ethiopian topography into the northwestern and southeastern highlands, heavily dictating drainage basins.`,
        };

        const replyText = aiReplies[selectedClass.subject] || aiReplies.default;

        const aiResponse: LiveChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'EthioAI Study Assistant',
          role: 'ai_tutor',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          upvotes: 12,
          reactions: { '💡': 8, '👏': 4 },
        };

        setChatMessages((prev) => [...prev, aiResponse]);
        liveClientRef.current?.sendChatMessage(aiResponse);
      }, 1500);
    }
  };

  const handleSendReaction = (messageId: string, emoji: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions, upvotes: m.upvotes + 1 };
      })
    );
    liveClientRef.current?.sendChatReaction(messageId, emoji);
  };

  const handleToggleAnswered = (id: string, currentAnswered?: boolean) => {
    const nextState = !currentAnswered;
    const answeredBy = currentUser?.name || 'Instructor';
    const answeredAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isAnswered: nextState, answeredBy, answeredAt } : m
      )
    );
    liveClientRef.current?.sendChatAnswer(id, nextState);
    triggerToast(nextState ? 'Question marked as answered.' : 'Question marked as pending review.');
  };

  const handleAnswerQuestionSubmit = (messageId: string, answerText: string) => {
    if (!answerText.trim()) return;
    const teacherName = currentUser?.name || 'Instructor';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              isAnswered: true,
              teacherAnswer: answerText.trim(),
              answeredBy: teacherName,
              answeredAt: now,
            }
          : m
      )
    );
    liveClientRef.current?.sendChatAnswer(messageId, true, answerText.trim());
    setAnsweringQuestionId(null);
    setTeacherAnswerText('');
    triggerToast('Instructor response published to class.');
  };

  const handleDeleteChatMessage = (id: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
    liveClientRef.current?.sendChatDelete(id);
    triggerToast('Message deleted.');
  };

  const handleTogglePinChatMessage = (id: string) => {
    const target = chatMessages.find((m) => m.id === id);
    const newPinned = !target?.isPinned;
    setChatMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinned: newPinned } : m))
    );
    liveClientRef.current?.sendChatPin(id, newPinned);
    triggerToast(newPinned ? 'Message pinned to top.' : 'Message unpinned.');
  };

  // Upload a pre-recorded video directly inside the Live Classroom for teaching & explanation
  const handleUploadLiveLessonVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const looksLikeVideo =
      file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|ogv|m4v)$/i.test(file.name);
    if (!looksLikeVideo) {
      triggerToast(isAm ? 'እባክዎ ትክክለኛ የቪዲዮ ፋይል ይምረጡ (MP4, WebM, MOV)' : 'Please select a valid video file (MP4, WebM, MOV)');
      return;
    }

    setIsUploadingLiveLessonVideo(true);
    const vidId = `live-lesson-${selectedClass.id}-${Date.now()}`;
    try {
      const localUrl = await saveRecordedVideoBlob(vidId, file);
      const serverStreamUrl = await uploadRecordedVideoToServer({
        id: vidId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        subject: selectedClass.subject,
        instructor: currentUser?.name || selectedClass.teacherName || 'Teacher',
        duration: '15:00',
        level: selectedClass.level,
        chapter: selectedClass.currentTopic || selectedClass.title,
        blob: file,
        isLiveRecording: false,
        archiveInLibrary: false,
      });

      const finalUrl = serverStreamUrl || localUrl;
      setRoomLessonVideoUrl(finalUrl);
      setRoomLessonYoutubeId(null);
      setRoomLessonVideoTitle(file.name);
      setStageMode('video');

      if (onUpdateLiveClass) {
        onUpdateLiveClass({
          ...selectedClass,
          videoUrl: finalUrl,
          youtubeId: undefined,
        });
      }

      liveClientRef.current?.updateStage('video', currentSlideIndex, {
        videoUrl: finalUrl,
        youtubeId: null,
        videoTitle: file.name,
      });

      triggerToast(
        isAm
          ? `✅ ቪዲዮው "${file.name}" ተጭኗል! Play በመጫን ለተማሪዎች ማስረዳት ይችላሉ።`
          : `✅ Video "${file.name}" loaded! Press Play and use your mic to explain it to students.`
      );
    } catch (err) {
      console.warn('Error uploading lesson video for live class:', err);
      triggerToast(isAm ? 'ቪዲዮውን መጫን አልተቻለም' : 'Could not load video file');
    } finally {
      setIsUploadingLiveLessonVideo(false);
      e.target.value = '';
    }
  };

  const handleAttachQuickYoutubeToLiveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickYoutubeUrl.trim();
    if (!raw) return;
    const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const extractedId = match ? match[1] : (/^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : '');
    if (!extractedId) {
      triggerToast(isAm ? 'እባክዎ ትክክለኛ የYouTube ሊንክ ወይም ID ያስገቡ' : 'Please enter a valid YouTube link or 11-character ID');
      return;
    }

    setRoomLessonYoutubeId(extractedId);
    setRoomLessonVideoUrl(null);
    setRoomLessonVideoTitle(null);
    setStageMode('video');
    setShowQuickYoutubeInput(false);
    setQuickYoutubeUrl('');

    if (onUpdateLiveClass) {
      onUpdateLiveClass({
        ...selectedClass,
        youtubeId: extractedId,
        videoUrl: undefined,
      });
    }

    liveClientRef.current?.updateStage('video', currentSlideIndex, {
      youtubeId: extractedId,
      videoUrl: null,
      videoTitle: null,
    });

    triggerToast(isAm ? 'የYouTube ትምህርት ቪዲዮ በክፍሉ ተያይዟል!' : 'YouTube lesson video attached to live classroom!');
  };

  // Teacher Start Class submission
  const handleTeacherStartClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedTeacher) {
      triggerToast(isAm ? 'ተማሪዎች አዲስ የቀጥታ ክፍል መጨመር አይችሉም።' : 'Students cannot create live classes.');
      setShowStartModal(false);
      return;
    }
    if (!newClassTitle.trim()) {
      triggerToast('Please provide a class title.');
      return;
    }

    // Extract YouTube ID if URL is provided
    let extractedYoutubeId: string | undefined = undefined;
    if (newClassYoutube.trim()) {
      const match = newClassYoutube.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      extractedYoutubeId = match ? match[1] : newClassYoutube.trim();
    }

    const classId = `live-${Date.now()}`;
    let uploadedVideoUrl: string | undefined = undefined;
    if (newClassVideoFile) {
      setIsUploadingNewClassVideo(true);
      try {
        const vidId = `live-lesson-${classId}`;
        const localUrl = await saveRecordedVideoBlob(vidId, newClassVideoFile);
        const serverStreamUrl = await uploadRecordedVideoToServer({
          id: vidId,
          title: newClassTitle.trim(),
          subject: newClassSubject,
          instructor: currentUser?.name || 'Teacher',
          duration: '15:00',
          level: newClassLevel,
          chapter: newClassTopic.trim() || newClassTitle.trim(),
          blob: newClassVideoFile,
          isLiveRecording: false,
          archiveInLibrary: false,
        });
        uploadedVideoUrl = serverStreamUrl || localUrl;
      } finally {
        setIsUploadingNewClassVideo(false);
      }
    }

    const isTeacher = currentUser?.role === 'teacher';
    const teacherName = isTeacher && currentUser?.name ? currentUser.name : (isAm ? 'መምህር አልተመደበም' : 'No Teacher Assigned');
    const teacherTitle = isTeacher ? (isAm ? 'መምህር' : 'Teacher') : (isAm ? 'መምህር ይጠበቃል (Pending Assignment)' : 'Pending Assignment');

    const createdClass: LiveClass = {
      id: classId,
      title: newClassTitle.trim(),
      subject: newClassSubject,
      subjectId: `subj-${newClassSubject.toLowerCase()}`,
      level: newClassLevel,
      teacherName,
      teacherTitle,
      teacherAvatar: '',
      isLiveNow: startAsLive,
      scheduledTime: startAsLive ? (isAm ? 'አሁን በቀጥታ' : 'Live Right Now') : (isAm ? 'የታቀደ ክፍለ-ጊዜ' : 'Scheduled Session'),
      durationMinutes: 75,
      currentViewers: startAsLive ? 1 : 0,
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
      hasRecording: false,
      materialsAttached: [],
      youtubeId: extractedYoutubeId,
      videoUrl: uploadedVideoUrl,
    };

    if (onAddLiveClass) {
      onAddLiveClass(createdClass);
    }
    onSelectClass(createdClass.id);
    setRoomLessonVideoUrl(uploadedVideoUrl || null);
    setRoomLessonYoutubeId(extractedYoutubeId || null);
    setShowStartModal(false);
    setNewClassTitle('');
    setNewClassTopic('');
    setNewClassYoutube('');
    setNewClassVideoFile(null);
    setNewClassVideoPreviewUrl(null);

    if (startAsLive) {
      setActiveTab('live_room');
      setIsTeaching(true);
      const hasPreloadedVideo = Boolean(uploadedVideoUrl || extractedYoutubeId);
      setStageMode(hasPreloadedVideo ? 'video' : 'split');
      if (!hasPreloadedVideo) {
        handleToggleCamera(true);
      }
      triggerToast(isAm ? `የቀጥታ ስርጭት ተጀምሯል: "${createdClass.title}"` : `Live class "${createdClass.title}" is now broadcasting live!`);
    } else {
      triggerToast(isAm ? `የክፍለ-ጊዜ መርሃ-ግብር ተመዝግቧል: "${createdClass.title}"` : `Class scheduled: "${createdClass.title}"`);
    }
  };

  const activeVideoTrack = userStream?.getVideoTracks()[0];
  const activeCameraLabel = activeVideoTrack?.label || '';
  const isIriunActive = camActive && !!userStream && activeCameraLabel.toLowerCase().includes('iriun');

  const isTeacherInClass = Boolean(
    selectedClass.isLiveNow ||
    liveBroadcasterInfo?.teacherName ||
    (activeServerBroadcast && (activeServerBroadcast.roomId === `room-${selectedClass.id}` || activeServerBroadcast.roomId === selectedClass.id)) ||
    isBroadcastingLive
  );

  const studentWaitingAdmittedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isAuthorizedTeacher && activeTab === 'live_room') {
      if (!isTeacherInClass) {
        studentWaitingAdmittedRef.current = true;
      } else if (studentWaitingAdmittedRef.current) {
        studentWaitingAdmittedRef.current = false;
        triggerToast(
          isAm
            ? '🎉 መምህሩ ገብተው የቀጥታ ስርጭቱን ጀምረዋል! እንኳን ደህና መጡ!'
            : '🎉 Instructor has entered and started broadcasting! You are now in the live classroom!'
        );
      }
    }
  }, [isAuthorizedTeacher, activeTab, isTeacherInClass, isAm]);

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

      {/* Hidden file input for chat attachments (screenshots, notes, homework questions) */}
      <input
        type="file"
        ref={chatAttachmentInputRef}
        onChange={handleChatAttachmentUpload}
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        id="live-chat-attachment-input"
      />

      {/* Floating In-app Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-emerald-500/50 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Active Broadcast Discovery Banner: Appears whenever teacher is broadcasting live for this grade */}
      {(() => {
        if (!activeServerBroadcast || activeServerBroadcast.roomId === `room-${selectedClass.id}`) {
          return null;
        }
        const targetClassId = activeServerBroadcast.roomId.replace(/^room-/, '');
        const targetClass = liveClasses.find((c) => c.id === targetClassId);
        const studentGrade = currentUser?.gradeLevel || selectedLevel;
        const isGradeMatch = isAuthorizedTeacher || !targetClass || targetClass.level === studentGrade;
        if (!isGradeMatch) return null;

        return (
          <div className="bg-linear-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse border border-red-300/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-black text-sm sm:text-base flex items-center gap-2">
                  <span>{isAm ? '🔴 የቀጥታ ስርጭት በመካሄድ ላይ ነው!' : '🔴 Live Broadcast In Progress!'}</span>
                  <span className="text-[10px] bg-white text-red-700 px-2 py-0.5 rounded-full font-black uppercase">LIVE NOW</span>
                </div>
                <p className="text-xs text-white/95 mt-0.5">
                  {isAm ? (
                    <>መምህር <strong>{activeServerBroadcast.teacherName}</strong> በ <strong>{activeServerBroadcast.subject || 'National Exam Prep'}</strong> ({activeServerBroadcast.topic || 'Live Session'}) የቀጥታ ትምህርት እያስተላለፉ ነው።</>
                  ) : (
                    <>Instructor <strong>{activeServerBroadcast.teacherName}</strong> is broadcasting live on <strong>{activeServerBroadcast.subject || 'National Exam Prep'}</strong> ({activeServerBroadcast.topic || 'Live Session'}).</>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectClass(targetClassId);
                setActiveTab('live_room');
              }}
              className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 text-xs font-black shadow-md shrink-0 cursor-pointer transition active:scale-95 flex items-center gap-1.5 justify-center"
            >
              <Radio className="w-3.5 h-3.5 text-red-600" />
              <span>{isAm ? 'ወደ ቀጥታ ስርጭቱ ግባ' : 'Join Live Class'}</span>
            </button>
          </div>
        );
      })()}

      {/* Top Header & Mode Tabs (Visible on Recordings/Catalog) */}
      {activeTab === 'recordings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  {currentLang === 'am' ? 'የቀጥታ ትምህርት' : 'Live Interactive Classroom'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {currentLang === 'am' ? 'የቀጥታ ክፍሎችና የታቀዱ መርሃ-ግብሮች' : 'Live Classes & Schedules'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {currentLang === 'am' 
                  ? 'የቀጥታ ክፍለ-ጊዜዎችን ይከታተሉ፣ ከተማሪዎች ጋር ይወያዩ ወይም ያለፉ ትምህርቶችን ይመልከቱ።'
                  : 'Real-time interactive lectures, digital whiteboard, live Q&A with Ethiopian teachers & MoE exam reviews.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Live Now / Scheduled / Recorded Switcher & Filter */}
              <div className="flex items-center p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <button
                  onClick={() => {
                    setActiveTab('recordings');
                    setStreamStatusFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'recordings' && streamStatusFilter === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{currentLang === 'am' ? `ሁሉም (${visibleLiveClasses.length})` : `All (${visibleLiveClasses.length})`}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('recordings');
                    setStreamStatusFilter('live');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'recordings' && streamStatusFilter === 'live'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                  <span>{currentLang === 'am' ? `ቀጥታ (${visibleLiveClasses.filter(c => c.isLiveNow).length})` : `Live Now (${visibleLiveClasses.filter(c => c.isLiveNow).length})`}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('recordings');
                    setStreamStatusFilter('scheduled');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'recordings' && streamStatusFilter === 'scheduled'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentLang === 'am' ? `መርሃ-ግብር (${visibleLiveClasses.filter(c => !c.isLiveNow).length})` : `Scheduled (${visibleLiveClasses.filter(c => !c.isLiveNow).length})`}</span>
                </button>
                <button
                  onClick={() => setStreamStatusFilter('recordings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    streamStatusFilter === 'recordings' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{currentLang === 'am' ? `የተቀዱ (${visibleLiveClasses.filter(c => c.hasRecording).length})` : `Recordings (${visibleLiveClasses.filter(c => c.hasRecording).length})`}</span>
                </button>
              </div>

              {/* Teacher & Admin Only: Schedule / Start Live Class Button */}
              {isAuthorizedTeacher && (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  id="btn-teacher-start-class"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{currentLang === 'am' ? '+ አዲስ የቀጥታ ክፍለ-ጊዜ' : '+ Schedule / Start Live Class'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Newly Recorded Teacher Sessions */}
          {recordedSessionsList.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 shadow-xs mb-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span>
                  <h4 className="text-sm font-black text-slate-900">
                    {isAm ? 'የቀረጹዋቸው የቀጥታ ትምህርቶች' : 'Your Live Recorded Classes'}
                  </h4>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-3 py-0.5 rounded-full">
                  {recordedSessionsList.length} {isAm ? 'ቀረጻዎች ተቀምጠዋል' : 'recordings saved'}
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
                          title={isAm ? 'በቪዲዮዎች ዝርዝር ውስጥ ተመልከት' : 'View in My Videos'}
                        >
                          <Film className="w-3.5 h-3.5 text-sky-600" />
                          <span>{isAm ? 'በቪዲዮዎች እይ' : 'View in Videos'}</span>
                        </button>
                      )}
                      <a
                        href={rec.url}
                        download={`Live-Session-${rec.id}.webm`}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                        title={isAm ? 'ቪዲዮውን አውርድ' : 'Download Video'}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isAm ? 'አውርድ' : 'Download'}</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRecordedSession(rec.id, e)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title={isAm ? 'ይህን ቀረጻ አጥፋ' : 'Delete Recording'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span className="hidden sm:inline">{isAm ? 'አጥፋ' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Live Stream Selection Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>
                  {currentLang === 'am'
                    ? (currentUser?.role === 'student'
                        ? `ለእርስዎ ክፍል (${effectiveStudentLevel.replace(/_/g, ' ').toUpperCase()}) የተዘጋጁ የቀጥታ ክፍለ-ጊዜዎች`
                        : 'በኢትዮጵያ የሚገኙ የቀጥታ ክፍለ-ጊዜዎች')
                    : (currentUser?.role === 'student'
                        ? `Live Sessions for Your Level (${effectiveStudentLevel.replace(/_/g, ' ').toUpperCase()})`
                        : 'Available Live Sessions & Classrooms across Ethiopia')}
                </span>
                {streamStatusFilter !== 'all' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {currentLang === 'am' 
                      ? (streamStatusFilter === 'live' ? 'ቀጥታ ስርጭት ብቻ' : streamStatusFilter === 'recordings' ? 'የተቀዱ ብቻ' : 'የታቀዱ ብቻ') 
                      : (streamStatusFilter === 'live' ? 'Live Only' : streamStatusFilter === 'recordings' ? 'Recordings Only' : 'Scheduled Only')}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
                {currentLang === 'am' ? 'ክፍል ለመቀላቀል ማንኛውንም ይጫኑ' : 'Click any session to enter room'}
              </span>
            </div>

            {(() => {
              const filteredStreams = visibleLiveClasses.filter((cls) => {
                if (streamStatusFilter === 'live') return cls.isLiveNow;
                if (streamStatusFilter === 'scheduled') return !cls.isLiveNow;
                if (streamStatusFilter === 'recordings') return cls.hasRecording;
                return true;
              });

              if (filteredStreams.length === 0) {
                return (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Radio className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{currentLang === 'am' ? 'ምንም ክፍለ-ጊዜ አልተገኘም' : 'No sessions match the current filter'}</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {currentLang === 'am'
                        ? 'በተመረጠው መስፈርት የተገኘ ክፍለ-ጊዜ የለም። ሁሉንም ክፍሎች መመልከት ይችላሉ።'
                        : 'There are no broadcasts matching this filter right now. You can view all available sessions.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStreamStatusFilter('all')}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {currentLang === 'am' ? 'ሁሉንም ክፍሎች አሳይ' : 'Show All Sessions'}
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredStreams.map((cls) => {
                    const isSelected = cls.id === selectedClass.id;
                    const hasAssignedTeacher = cls.teacherName && !cls.teacherName.includes('መምህር አልተመደበም') && !cls.teacherName.toLowerCase().includes('no teacher') && !cls.teacherName.toLowerCase().includes('pending');
                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          onSelectClass(cls.id);
                          setActiveTab('live_room');
                          setCurrentSlideIndex(0);
                          if (cls.youtubeId || cls.videoUrl) {
                            setStageMode('video');
                          } else {
                            setStageMode('slides');
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 text-left ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500/40'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[11px] font-bold text-emerald-800">
                              {cls.subject} · {cls.level.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            {cls.isLiveNow ? (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                                {currentLang === 'am' ? 'ቀጥታ' : 'Live'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {currentLang === 'am' ? 'የታቀደ' : 'Scheduled'}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                            {cls.title}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5 truncate mr-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              hasAssignedTeacher ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {hasAssignedTeacher ? cls.teacherName.charAt(0) : '⚪'}
                            </span>
                            <span className={`truncate text-[11px] ${hasAssignedTeacher ? 'font-bold text-slate-800' : 'text-slate-400 font-medium'}`}>
                              {hasAssignedTeacher ? cls.teacherName : (currentLang === 'am' ? 'መምህር አልተመደበም' : 'No teacher assigned')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 font-mono text-slate-500 text-[10px]">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{cls.currentViewers}</span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 py-1.5 px-2 rounded-xl text-center">
                            {cls.isLiveNow
                              ? (currentLang === 'am' ? '✓ አሁን በቀጥታ ክፍል ውስጥ' : '✓ In Live Classroom')
                              : (isAuthorizedTeacher
                                  ? (currentLang === 'am' ? '✓ አሁን የተመረጠ' : '✓ Currently Selected')
                                  : (currentLang === 'am' ? '⏳ በመጠባበቂያ ክፍል ውስጥ' : '⏳ In Waiting Room'))}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 py-1.5 px-2 rounded-xl text-center transition">
                            {cls.isLiveNow
                              ? (currentLang === 'am' ? 'ወደ ክፍል ግባ →' : 'Join Live Class →')
                              : (isAuthorizedTeacher
                                  ? (currentLang === 'am' ? 'ክፍሉን ጀምር / አስተምር →' : 'Start Session / Teach →')
                                  : (currentLang === 'am' ? 'መጠባበቂያ ክፍል ግባ (መምህር ይጠበቃል) ⏳' : 'Enter Waiting Room ⏳'))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW 1: ACTIVE LIVE CLASSROOM OR STUDENT WAITING LOBBY */}
      {activeTab === 'live_room' && (
        !isAuthorizedTeacher && !isTeacherInClass ? (
          /* Dedicated Waiting Lobby for Students when Teacher has not entered */
          <div className="space-y-6">
            {/* Waiting Room Top Nav Bar */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('recordings')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isAm ? '← ወደ ክፍሎች መርሃ-ግብር ተመለስ' : '← Back to Live Classes'}</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {selectedClass.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {selectedClass.subject}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>{isAm ? 'መምህር በመጠባበቅ ላይ' : 'Awaiting Instructor'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttendeesModal(true)}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title={isAm ? 'ተሳታፊዎች' : 'Attendees'}
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{onlineParticipants.length} {isAm ? 'ተማሪዎች' : 'Waiting'}</span>
                </button>
              </div>
            </div>

            {/* Centered Waiting Room Content */}
            <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-12 text-white shadow-2xl overflow-hidden max-w-3xl mx-auto text-center space-y-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 blur-3xl pointer-events-none rounded-full"></div>

              {/* Pulsing Radar Beacon */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                <div className="absolute inset-3 rounded-full bg-amber-500/30 animate-pulse"></div>
                <div className="relative w-14 h-14 rounded-2xl bg-linear-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-black">
                  <Radio className="w-7 h-7 text-slate-950 animate-pulse" />
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>{isAm ? 'የተማሪዎች መጠባበቂያ ክፍል' : 'Student Waiting Lobby'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isAm ? 'መምህሩ ክፍለ-ጊዜውን እስኪጀምሩ ድረስ በመጠባበቅ ላይ...' : 'Waiting for Instructor to Start Broadcasting...'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                  {isAm
                    ? 'ይህ የቀጥታ ክፍለ-ጊዜ እስካሁን በመምህሩ አልተጀመረም። መምህሩ ገብተው የቀጥታ ስርጭቱን ሲጀምሩ ይህ ገጽ ወዲያውኑ ወደ ቀጥታ ማስተማሪያ ክፍሉ በቀጥታ ያስገባዎታል።'
                    : 'The instructor has not entered the classroom yet. As soon as the teacher connects and begins broadcasting, you will be automatically admitted into the live lecture room.'}
                </p>
              </div>

              {/* Class Summary Box */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    {isAm ? 'የትምህርት አይነትና ደረጃ' : 'Subject & Curriculum Level'}
                  </span>
                  <div className="font-bold text-white text-sm">
                    {selectedClass.subject} · {selectedClass.level.replace(/_/g, ' ').toUpperCase()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    {isAm ? 'የክፍለ-ጊዜው ርዕስ' : 'Lecture Topic'}
                  </span>
                  <div className="font-bold text-emerald-400 text-sm truncate">
                    {selectedClass.currentTopic || selectedClass.title}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    {isAm ? 'የታቀደበት ሰዓት' : 'Scheduled Time'}
                  </span>
                  <div className="font-bold text-slate-200">
                    {selectedClass.scheduledTime}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    {isAm ? 'የተመደበው መምህር' : 'Assigned Instructor'}
                  </span>
                  <div className="font-bold text-slate-200">
                    {selectedClass.teacherName || (isAm ? 'መምህር በቅርቡ ይመደባል' : 'Pending Instructor Assignment')}
                  </div>
                </div>
              </div>

              {/* Scanner beacon status */}
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isAm ? 'የመምህሩን መግባት በየሰከንዱ በራስ-ሰር በመፈተሽ ላይ...' : 'Auto-checking instructor presence in real-time...'}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('recordings')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isAm ? 'ወደ ክፍሎች መርሃ-ግብር ተመለስ' : 'Browse Other Sessions'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerToast(
                      isAm
                        ? 'የመምህሩ ሁኔታ ተፈትሿል፤ መምህሩ ገና አልገቡም። በመጠባበቅ ላይ ኖት።'
                        : 'Status rechecked: Instructor has not started yet. You will be auto-admitted.'
                    );
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Radio className="w-4 h-4" />
                  <span>{isAm ? 'ሁኔታውን አሁን ፈትሽ' : 'Check Instructor Status'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Room Top Navigation & Status Bar */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  if (camActive || userStream || isBroadcastingLive) {
                    shutdownAllLiveStreams();
                  }
                  setActiveTab('recordings');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isAm ? '← ወደ ክፍሎች መርሃ-ግብር ተመለስ' : '← Back to Live Classes'}</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  isBroadcastingLive ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isBroadcastingLive ? 'bg-white animate-ping' : 'bg-red-500 animate-pulse'}`}></span>
                  <span>{isBroadcastingLive ? 'LIVE' : 'Live'}</span>
                </span>
                <span className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {selectedClass.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {selectedClass.subject}
                </span>
                {liveBroadcasterInfo?.teacherName && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                    {liveBroadcasterInfo.teacherName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttendeesModal(true)}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title={isAm ? 'ተሳታፊዎች' : 'Attendees'}
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{onlineParticipants.length} {isAm ? 'ተሳታፊዎች' : 'Online'}</span>
                </button>
              </div>
            </div>

            {/* Mobile View Switcher Tab (Classroom vs Live Chat vs Q&A) */}
            <div className="flex lg:hidden items-center p-1 bg-slate-200/80 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setMobileClassroomTab('stage')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mobileClassroomTab === 'stage' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-emerald-700" />
                <span>Classroom</span>
              </button>
            <button
              type="button"
              onClick={() => {
                setMobileClassroomTab('chat');
                setActiveChatTab('chat');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileClassroomTab === 'chat' && activeChatTab === 'chat'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>Chat ({chatMessages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileClassroomTab('chat');
                setActiveChatTab('qa');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileClassroomTab === 'chat' && (activeChatTab === 'qa' || activeChatTab === 'pending')
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Q&amp;A ({chatMessages.filter((m) => m.isQuestion).length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Stage: Video / Digital Whiteboard / Screen Share / Slides */}
            <div className={`lg:col-span-2 space-y-4 ${mobileClassroomTab === 'stage' ? 'block' : 'hidden lg:block'}`}>

              {/* Hardware & Permission Diagnostics Banner (shown for mic or when not already inside Camera stage) */}
              {(micPermissionError || (cameraError && stageMode !== 'camera' && stageMode !== 'split' && stageMode !== 'split_ppt')) && (
                <div className="bg-amber-50 border border-amber-300 text-amber-950 px-4 py-3 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">Hardware Permission Notice: </span>
                      <span>{cameraError || micPermissionError}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (cameraError) handleToggleCamera();
                        if (micPermissionError) handleToggleMic();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => {
                        setCameraError(null);
                        setMicPermissionError(null);
                      }}
                      className="text-amber-800 hover:text-amber-950 font-bold px-2 py-1 rounded text-[11px] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

            <div ref={classroomStageRef} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col">
              
              {/* Stage View Switcher Header Bar */}
              <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-white gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] overflow-x-auto max-w-full">
                  <button
                    onClick={() => setStageMode('slides')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'slides' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title={isAm ? 'የክፍል ስላይዶች' : 'Slide Presentation'}
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    <span>{isAm ? 'ስላይዶች' : 'Slides'}</span>
                  </button>

                  <button
                    onClick={() => setStageMode('whiteboard')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'whiteboard' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title={isAm ? 'ዲጂታል ሰሌዳ' : 'Interactive Whiteboard'}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isAm ? 'ሰሌዳ' : 'Whiteboard'}</span>
                  </button>

                  {(isAuthorizedTeacher || roomLessonYoutubeId || roomLessonVideoUrl || selectedClass.youtubeId || selectedClass.videoUrl || stageMode === 'video') && (
                    <button
                      onClick={() => setStageMode('video')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        stageMode === 'video' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                      title={isAm ? 'የተቀረጸ ወይም የተጫነ ቪዲዮ በማጫወት ያስረዱ' : 'Play uploaded or recorded lecture video'}
                    >
                      <Video className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isAm ? 'ቪዲዮ' : 'Video'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setStageMode('split');
                      if (!camActive) handleToggleCamera(true, true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'split' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title={isAm ? 'ፊትና ሰሌዳ ጎን ለጎን' : 'Side-by-side: Face and Board'}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isAm ? 'ፊት + ሰሌዳ' : 'Face + Board'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setStageMode('split_ppt');
                      if (!camActive) handleToggleCamera(true, true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      stageMode === 'split_ppt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title={isAm ? 'ፊትና PPT ስላይድ ጎን ለጎን' : 'Side-by-side: Face and Slides'}
                  >
                    <Presentation className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAm ? 'ፊት + PPT' : 'Face + PPT'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setStageMode('camera');
                      if (!camActive) handleToggleCamera(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      stageMode === 'camera' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Open webcam or face view"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{isAm ? 'ካሜራ' : 'Camera'}</span>
                  </button>

                  {isScreenSharing && (
                    <button
                      onClick={() => setStageMode('screenshare')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        stageMode === 'screenshare' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <ScreenShare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Screen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* STAGE CONTAINER */}
              <div className="min-h-[460px] bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
                
                {/* Active Recording / Mic Indicator (No duplicate LIVE badge) */}
                {(isRecording || micActive) && (
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-none">
                    {isRecording && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-[11px] font-bold text-white shadow-md border border-rose-400/50">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        <span className="font-mono font-black tracking-wide">REC {formatDuration(recordingSeconds)}</span>
                      </div>
                    )}

                    {micActive && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border ${
                        isSpeaking ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300' : 'bg-slate-900/80 border-slate-700 text-slate-300'
                      }`}>
                        <Mic className={`w-3 h-3 ${isSpeaking ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
                        <AudioWaveBars isSpeaking={isSpeaking} level={audioLevel} barCount={4} />
                      </div>
                    )}
                  </div>
                )}

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
                          language={currentLang}
                          isStartingCamera={isStartingCamera}
                          className="w-full h-full"
                        />
                      ) : camActive && teacherPhoto ? (
                        <img
                          src={teacherPhoto}
                          alt={currentUser?.name || selectedClass.teacherName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : selectedClass.teacherAvatar ? (
                        <img
                          src={selectedClass.teacherAvatar}
                          alt={selectedClass.teacherName}
                          className="w-full h-full object-cover opacity-80"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-200 font-black text-lg">
                          {(selectedClass.teacherName || 'T').trim().charAt(0).toUpperCase()}
                        </div>
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
                {!isBroadcastingLive && !(camActive && (userStream || teacherPhoto)) && stageMode === 'camera' && (remoteTeacherStream || remoteTeacherFrame || (liveBroadcasterInfo && liveBroadcasterInfo.teacherId !== currentUser?.id)) && (
                  <div className="absolute inset-0 z-25 bg-slate-950 flex flex-col items-center justify-center p-4">
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
                          <span>{isAm ? '🔴 የቀጥታ ምስል' : '🔴 Live Feed'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 text-white space-y-3 max-w-md">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                          <Radio className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm sm:text-base font-black">
                          {isAm ? 'የቀጥታ ካሜራ ስርጭት አልተገኘም' : 'No Live Camera Broadcast Active'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                          {isAm
                            ? 'በዚህ ሰዓት መምህሩ በቀጥታ ካሜራ እያስተማሩ አይደለም። የትምህርት ስላይዶቹን ወይም ዲጂታል ሰሌዳውን መመልከት ይችላሉ።'
                            : 'No live camera broadcast is active. You can review the lesson slides or use the digital whiteboard.'}
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setStageMode('slides')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                          >
                            <Presentation className="w-3.5 h-3.5" />
                            <span>{isAm ? 'ስላይዶችን ይመልከቱ' : 'View Slides'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setStageMode('whiteboard')}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>{isAm ? 'ዲጂታል ሰሌዳ' : 'Whiteboard'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dedicated audio pipeline element ensuring remote teacher voice is cleanly played */}
                    {remoteTeacherStream && (
                      <audio
                        ref={(node) => {
                          remoteAudioElementRef.current = node;
                          if (node && remoteTeacherStream && node.srcObject !== remoteTeacherStream) {
                            node.srcObject = remoteTeacherStream;
                            node.volume = remoteAudioVolume;
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
                        {isAm
                          ? `🔴 መምህር ${liveBroadcasterInfo?.teacherName || selectedClass.teacherName} በቀጥታ እያስተማሩ ነው`
                          : `🔴 Instructor ${liveBroadcasterInfo?.teacherName || selectedClass.teacherName} is Live`}
                      </span>
                    </div>

                    {/* Unmute Center Callout if audio is muted or blocked by browser policy */}
                    {isRemoteAudioMuted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 z-30 pointer-events-none p-4">
                        <button
                          type="button"
                          onClick={() => {
                            const restoreVol = remoteAudioVolume > 0 ? remoteAudioVolume : 1.0;
                            if (remoteAudioVolume === 0) setRemoteAudioVolume(1.0);
                            if (remoteVideoElementRef.current) {
                              remoteVideoElementRef.current.muted = false;
                              remoteVideoElementRef.current.volume = restoreVol;
                              remoteVideoElementRef.current.play().catch(console.warn);
                            }
                            if (remoteAudioElementRef.current) {
                              remoteAudioElementRef.current.muted = false;
                              remoteAudioElementRef.current.volume = restoreVol;
                              remoteAudioElementRef.current.play().catch(console.warn);
                            }
                            if (fallbackAudioRef.current) {
                              fallbackAudioRef.current.muted = false;
                              fallbackAudioRef.current.volume = restoreVol;
                            }
                            setIsRemoteAudioMuted(false);
                            triggerToast(currentLang === 'am' ? 'የመምህሩ ድምፅ ተከፍቷል።' : 'Teacher voice unmuted.');
                          }}
                          className="pointer-events-auto px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center gap-3 shadow-2xl border-2 border-white/60 animate-bounce cursor-pointer transition transform hover:scale-105"
                        >
                          <VolumeX className="w-6 h-6 animate-pulse" />
                          <span>{isAm ? '🔊 የመምህሩን ድምፅ ለመስማት እዚህ ይጫኑ' : '🔊 Click to Unmute Live Audio'}</span>
                        </button>
                      </div>
                    )}

                    {/* Volume & Mute Controls for Student */}
                    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => {
                          const nextMuted = !isRemoteAudioMuted;
                          const restoreVol = remoteAudioVolume > 0 ? remoteAudioVolume : 1.0;
                          if (!nextMuted && remoteAudioVolume === 0) setRemoteAudioVolume(1.0);
                          if (remoteVideoElementRef.current) {
                            remoteVideoElementRef.current.muted = nextMuted;
                            if (!nextMuted) remoteVideoElementRef.current.volume = restoreVol;
                            if (!nextMuted) remoteVideoElementRef.current.play().catch(() => {});
                          }
                          if (remoteAudioElementRef.current) {
                            remoteAudioElementRef.current.muted = nextMuted;
                            if (!nextMuted) remoteAudioElementRef.current.volume = restoreVol;
                            if (!nextMuted) remoteAudioElementRef.current.play().catch(() => {});
                          }
                          if (fallbackAudioRef.current) {
                            fallbackAudioRef.current.muted = nextMuted;
                            if (!nextMuted) fallbackAudioRef.current.volume = restoreVol;
                          }
                          setIsRemoteAudioMuted(nextMuted);
                          triggerToast(
                            !nextMuted
                              ? (currentLang === 'am' ? 'ድምፅ ተከፍቷል።' : 'Live audio unmuted.')
                              : (currentLang === 'am' ? 'ድምፅ ተዘግቷል።' : 'Audio muted.')
                          );
                        }}
                        className={`p-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                          isRemoteAudioMuted ? 'bg-rose-600 text-white' : 'text-emerald-400 hover:bg-slate-800'
                        }`}
                        title={isRemoteAudioMuted ? (isAm ? 'ድምጽ ክፈት' : 'Unmute') : (isAm ? 'ድምጽ ዝጋ' : 'Mute')}
                      >
                        {isRemoteAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isRemoteAudioMuted ? 0 : remoteAudioVolume}
                        onChange={(e) => {
                          const nextVol = parseFloat(e.target.value);
                          const muted = nextVol === 0;
                          setRemoteAudioVolume(nextVol);
                          setIsRemoteAudioMuted(muted);
                          if (remoteVideoElementRef.current) {
                            remoteVideoElementRef.current.volume = nextVol;
                            remoteVideoElementRef.current.muted = muted;
                          }
                          if (remoteAudioElementRef.current) {
                            remoteAudioElementRef.current.volume = nextVol;
                            remoteAudioElementRef.current.muted = muted;
                          }
                          if (fallbackAudioRef.current) {
                            fallbackAudioRef.current.volume = nextVol;
                            fallbackAudioRef.current.muted = muted;
                          }
                        }}
                        className="w-16 sm:w-20 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        aria-label="Live audio volume"
                        title={`${Math.round((isRemoteAudioMuted ? 0 : remoteAudioVolume) * 100)}%`}
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-200 min-w-[28px] text-right">
                        {isRemoteAudioMuted ? '0%' : `${Math.round(remoteAudioVolume * 100)}%`}
                      </span>
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
                      language={currentLang}
                      isStartingCamera={isStartingCamera}
                      className="w-full h-full"
                      isSpeaking={isSpeaking}
                    />

                    {/* Dismissible Notice if Iriun Webcam is waiting for phone */}
                    {isIriunActive && !dismissIriunBanner && (
                      <div className="absolute top-14 left-3 right-3 z-30 p-2.5 bg-slate-950/90 border border-amber-500/80 rounded-xl shadow-xl backdrop-blur-md text-white flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate text-slate-200">
                            {isAm
                              ? 'Iriun Webcam: ስልክዎ ካልበራ ወደ ኮምፒውተር ካሜራ ይቀይሩ'
                              : 'Iriun Webcam: If phone is disconnected, switch to computer camera'}
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
                              {isAm ? 'ወደ ኮምፒውተር ካሜራ ቀይር' : 'Switch to PC Cam'}
                            </button>
                          )}
                          <button
                            onClick={() => setDismissIriunBanner(true)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title={isAm ? 'ዝጋ' : 'Dismiss'}
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
                        onSwitchToFrontCamera={() => startCameraWithFacing('user', undefined, true)}
                        onSwitchToBackCamera={() => startCameraWithFacing('environment', undefined, true)}
                        onFlipCamera={handleFlipCamera}
                        onToggleMirror={() => setIsMirrored((prev) => !prev)}
                        facingMode={cameraFacing}
                        language={currentLang}
                        isStartingCamera={isStartingCamera}
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
                            title={isAm ? 'የሰሌዳ ማጥፊያ' : 'Eraser'}
                          >
                            <Eraser className="w-3 h-3" />
                            <span>{isAm ? 'ማጥፊያ' : 'Eraser'}</span>
                          </button>
                          {/* Eraser Sizes when active */}
                          {isEraser && (
                            <div className="flex items-center gap-0.5 bg-amber-500/20 px-1 py-0.5 rounded text-[9px] font-bold">
                              {[
                                { sz: 16, lbl: isAm ? 'ቀጭን' : 'Fine' },
                                { sz: 32, lbl: isAm ? 'መካከለኛ' : 'Medium' },
                                { sz: 56, lbl: isAm ? 'ሰፊ' : 'Broad' },
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
                            title={isAm ? 'የመጨረሻውን ጽሑፍ መልስ' : 'Undo'}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isAm ? 'መልስ' : 'Undo'}</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={clearCanvas}
                            className="text-red-400 text-[10px] font-bold px-1.5 py-0.5 hover:text-red-300 bg-red-950/40 rounded border border-red-800/40 cursor-pointer"
                            title={isAm ? 'ሰሌዳውን በሙሉ አጽዳ' : 'Clear Board'}
                          >
                            {isAm ? 'አጽዳ' : 'Clear'}
                          </button>
                          <button
                            onClick={() => setStageMode('whiteboard')}
                            className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 hover:text-emerald-300 bg-emerald-950/40 rounded border border-emerald-800/40 cursor-pointer"
                          >
                            {isAm ? 'ሙሉ ሰሌዳ' : 'Full Board'}
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
                        onSwitchToFrontCamera={() => startCameraWithFacing('user', undefined, true)}
                        onSwitchToBackCamera={() => startCameraWithFacing('environment', undefined, true)}
                        onFlipCamera={handleFlipCamera}
                        onToggleMirror={() => setIsMirrored((prev) => !prev)}
                        facingMode={cameraFacing}
                        language={currentLang}
                        isStartingCamera={isStartingCamera}
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
                            <span>{isAm ? 'PPT ጫን' : 'Upload PPT'}</span>
                          </button>
                          <button
                            onClick={() => setStageMode('slides')}
                            className="px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-[10px] font-bold text-white cursor-pointer"
                            title={isAm ? 'ሙሉ ስላይድ አሳይ' : 'Expand to Full Slide view'}
                          >
                            {isAm ? 'ሙሉ ስላይድ' : 'Full Slide'}
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
                                {isAm ? 'ወደ ሰሌዳ' : 'To Board'}
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
                          <span>{isAm ? 'ወደኋላ' : 'Previous'}</span>
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
                          <span>{isAm ? 'ወደፊት' : 'Next'}</span>
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
                          <span>{isAm ? `ስላይድ ${currentSlideIndex + 1} ከ ${slides.length}` : `Slide ${currentSlideIndex + 1} of ${slides.length}`}</span>
                          <span>•</span>
                          <span>{selectedClass.subject}</span>
                        </div>
                      </div>

                      {/* Quick PPT Decks & Upload Controls */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-300">
                          <span className="text-slate-400">{isAm ? 'የትምህርት ስላይዶች፦' : 'Curriculum Decks:'}</span>
                          <button
                            onClick={() => handleLoadPresetPpt('Physics')}
                            className="px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          >
                            {isAm ? 'ፊዚክስ' : 'Physics'}
                          </button>
                          <button
                            onClick={() => handleLoadPresetPpt('Chemistry')}
                            className="px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          >
                            {isAm ? 'ኬሚስትሪ' : 'Chemistry'}
                          </button>
                          <button
                            onClick={() => handleLoadPresetPpt('Mathematics')}
                            className="px-1.5 py-0.5 rounded hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                          >
                            {isAm ? 'ሂሳብ' : 'Math'}
                          </button>
                        </div>

                        <button
                          onClick={() => pptFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                          title="Upload PowerPoint (.pptx, .ppt), PDF or Slide Image"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>{isAm ? 'PPT/PDF ጫን' : 'Load PPT/PDF'}</span>
                        </button>

                        <button
                          onClick={() => setShowAddSlideModal(true)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                          title="Add a new custom slide"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isAm ? 'አዲስ ስላይድ' : 'New Slide'}</span>
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
                          <span>{isAm ? '👥 ፊት + PPT' : '👥 Camera + PPT'}</span>
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
                              <span className="text-[10px] uppercase text-emerald-400 block font-sans font-bold">
                                {isAm ? 'አስፈላጊ የፈተና ፎርሙላ:' : 'High-Yield Exam Formula:'}
                              </span>
                              <span className="text-base text-white">{currentSlide.formulaOrQuote}</span>
                            </div>
                            <button
                              onClick={() => {
                                setStageMode('whiteboard');
                                insertFormulaToWhiteboard(currentSlide.formulaOrQuote!);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition cursor-pointer shadow-xs"
                              title={isAm ? 'ወደ ሰሌዳ ገልብጥ' : 'Copy to Whiteboard'}
                            >
                              {isAm ? 'ወደ ሰሌዳ ገልብጥ' : 'Copy to Board'}
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

                    {/* Slide Navigation Controls & Interactive Carousel Strip */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          disabled={currentSlideIndex === 0}
                          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-bold text-xs flex items-center gap-1.5"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>{isAm ? 'ወደኋላ' : 'Previous'}</span>
                        </button>

                        {/* Interactive Direct Slide Number Pills */}
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
                              title={isAm ? `ስላይድ ${idx + 1}` : `Slide ${idx + 1}`}
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
                          <span>{isAm ? 'ወደፊት' : 'Next'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Keyboard & Swipe helper hint */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                        <span>{isAm ? '💡 ቀስቶች (← / →) ወይም Space በመጫን ስላይዶቹን ማሸጋሸግ ይችላሉ' : '💡 Use arrows (← / →) or Space to navigate slides'}</span>
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
                        title={isAm ? 'የሰሌዳ ማጥፊያ' : 'Eraser Tool'}
                      >
                        <Eraser className="w-4 h-4" />
                        <span>{isAm ? 'ማጥፊያ' : 'Eraser'}</span>
                      </button>

                      {/* Eraser Thickness Selector */}
                      {isEraser && (
                        <div className="flex items-center gap-1 px-1 border-l border-slate-800 bg-amber-500/10 rounded-lg p-0.5">
                          {[
                            { sz: 16, label: isAm ? 'ቀጭን' : 'Fine' },
                            { sz: 32, label: isAm ? 'መካከለኛ' : 'Medium' },
                            { sz: 56, label: isAm ? 'ሰፊ' : 'Broad' },
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
                        title={isAm ? 'የመጨረሻውን ጽሑፍ መልስ' : 'Undo'}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline text-[10px]">{isAm ? 'መልስ' : 'Undo'}</span>
                      </button>

                      {/* Clear Canvas */}
                      <button
                        onClick={clearCanvas}
                        className="p-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                        title={isAm ? 'ሰሌዳውን በሙሉ አጽዳ' : 'Clear Entire Board'}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline text-[10px]">{isAm ? 'አጽዳ' : 'Clear'}</span>
                      </button>

                      {/* Download Snapshot */}
                      <button
                        onClick={downloadCanvasImage}
                        className="p-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                        title={isAm ? 'የተጻፈበትን ሰሌዳ በምስል አውርድ' : 'Download Board Notes'}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline text-[10px]">{isAm ? 'አውርድ' : 'Download'}</span>
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

                {/* 4. MODE: LIVE LESSON VIDEO / UPLOADED RECORDING / YOUTUBE STREAM */}
                {stageMode === 'video' && (
                  <div className="w-full h-[460px] bg-black flex flex-col items-center justify-center relative">
                    {/* Hidden file input for teacher uploading a pre-recorded video right inside the room */}
                    <input
                      ref={liveLessonVideoInputRef}
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.ogg,.m4v"
                      onChange={handleUploadLiveLessonVideo}
                      className="hidden"
                    />

                    {/* Top control bar for teacher video upload & stage switch */}
                    <div className="w-full bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 z-10 flex-wrap gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                        <span className="text-[11px] text-slate-300 truncate">
                          {roomLessonVideoTitle
                            ? (isAm ? `🎬 የመምህሩ ቪዲዮ፦ ${roomLessonVideoTitle}` : `🎬 Lesson Video: ${roomLessonVideoTitle}`)
                            : isAuthorizedTeacher
                              ? (isAm
                                  ? 'የሰሩትን ቪዲዮ ጭነው በማይክሮፎን እየተናገሩ ለተማሪዎች ያስረዱ'
                                  : 'Upload a pre-recorded video to play & explain live with your mic')
                              : (isAm
                                  ? 'መምህሩ የትምህርት ቪዲዮ በማሳየት ላይ ናቸው'
                                  : 'Instructor is presenting a lesson video')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAuthorizedTeacher && (
                          <>
                            <button
                              type="button"
                              onClick={() => liveLessonVideoInputRef.current?.click()}
                              disabled={isUploadingLiveLessonVideo}
                              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                            >
                              {isUploadingLiveLessonVideo ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {isUploadingLiveLessonVideo
                                  ? (isAm ? 'በመጫን ላይ...' : 'Uploading...')
                                  : (roomLessonVideoUrl || roomLessonYoutubeId)
                                    ? (isAm ? 'ሌላ ቪዲዮ ጫን' : 'Change Video')
                                    : (isAm ? 'ቪዲዮ ጫን' : 'Upload Video')}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowQuickYoutubeInput((v) => !v)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer shrink-0"
                            >
                              YouTube
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setStageMode('camera');
                            if (!camActive) handleToggleCamera(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{isAm ? '👤 ካሜራ' : '👤 Camera'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Optional quick YouTube URL bar for teachers */}
                    {isAuthorizedTeacher && showQuickYoutubeInput && (
                      <form
                        onSubmit={handleAttachQuickYoutubeToLiveRoom}
                        className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2 z-10"
                      >
                        <input
                          type="text"
                          value={quickYoutubeUrl}
                          onChange={(e) => setQuickYoutubeUrl(e.target.value)}
                          placeholder="Paste YouTube URL or 11-char ID..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                        >
                          {isAm ? 'አያይዝ' : 'Load'}
                        </button>
                      </form>
                    )}

                    <div className="w-full flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                      {roomLessonVideoUrl ? (
                        <video
                          ref={lessonVideoPlayerRef}
                          src={roomLessonVideoUrl}
                          controls
                          playsInline
                          onPlay={() => {
                            if (isAuthorizedTeacher && !isRemoteSyncingVideoRef.current && lessonVideoPlayerRef.current) {
                              liveClientRef.current?.sendVideoControl('play', lessonVideoPlayerRef.current.currentTime);
                            }
                          }}
                          onPause={() => {
                            if (isAuthorizedTeacher && !isRemoteSyncingVideoRef.current && lessonVideoPlayerRef.current) {
                              liveClientRef.current?.sendVideoControl('pause', lessonVideoPlayerRef.current.currentTime);
                            }
                          }}
                          onSeeked={() => {
                            if (isAuthorizedTeacher && !isRemoteSyncingVideoRef.current && lessonVideoPlayerRef.current) {
                              liveClientRef.current?.sendVideoControl('seek', lessonVideoPlayerRef.current.currentTime);
                            }
                          }}
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : roomLessonYoutubeId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${roomLessonYoutubeId}?autoplay=1&enablejsapi=1&rel=0`}
                          title={selectedClass.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-center p-6 space-y-4 max-w-md">
                          <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center mx-auto text-sky-300">
                            <Film className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white">
                              {isAuthorizedTeacher
                                ? (isAm ? 'የሰሩትን የትምህርት ቪዲዮ ይጫኑ' : 'Upload a Lesson Video to Teach With')
                                : (isAm ? 'የትምህርት ቪዲዮ በመጠበቅ ላይ' : 'Waiting for Lesson Video')}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {isAuthorizedTeacher
                                ? (isAm
                                    ? 'ከኮምፒውተርዎ ወይም ከስልክዎ የቀረጹትን ቪዲዮ (MP4, WebM, MOV) በመጫን ለተማሪዎች እያሳዩ እና በድምፅ እየተናገሩ ማስረዳት ይችላሉ።'
                                    : 'Upload any video file (MP4, WebM, MOV) from your device. Play, pause, and explain concepts live with your microphone.')
                                : (isAm
                                    ? 'መምህሩ ቪዲዮ ሲጭኑ በቀጥታ እዚህ ይታያል።'
                                    : 'When the instructor loads a lesson video, it will appear right here.')}
                            </p>
                          </div>
                          {isAuthorizedTeacher ? (
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => liveLessonVideoInputRef.current?.click()}
                                disabled={isUploadingLiveLessonVideo}
                                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                              >
                                <Upload className="w-4 h-4" />
                                <span>{isAm ? 'ቪዲዮ ከመሳሪያ ጫን (MP4/WebM)' : 'Upload Video File'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setStageMode('whiteboard')}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                              >
                                {isAm ? 'ወደ ሰሌዳ ሂድ' : 'Whiteboard'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setStageMode('slides')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                            >
                              {isAm ? 'ስላይዶችን እይ' : 'View Slides'}
                            </button>
                          )}
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

              {/* Clean Bottom Classroom Toolbar with 3-Dot Overflow Menu */}
              <div className="bg-slate-50 px-3 sm:px-4 py-2.5 border-t border-slate-200 flex items-center justify-between gap-2 relative">
                {/* Primary Left Controls: Mic + Camera + Go Live / Raise Hand */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`px-3 py-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      micActive
                        ? isSpeaking
                          ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-400'
                          : 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={micActive ? (isAm ? 'ማይክሮፎን ዝጋ' : 'Mute Microphone') : (isAm ? 'ማይክሮፎን ክፈት' : 'Unmute Microphone')}
                  >
                    {micActive ? <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-white' : ''}`} /> : <MicOff className="w-3.5 h-3.5 text-rose-500" />}
                    <span>{micActive ? (isAm ? 'ድምፅ ክፍት' : 'Mic On') : (isAm ? 'ድምፅ ዝግ' : 'Mic Off')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isStartingCamera}
                    onClick={() => handleToggleCamera()}
                    className={`px-3 py-2 rounded-xl border transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5 text-xs font-bold ${
                      camActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={camActive ? (isAm ? 'ካሜራ አጥፋ' : 'Turn off camera') : (isAm ? 'ካሜራ አብራ' : 'Turn on camera')}
                  >
                    <Camera className={`w-3.5 h-3.5 ${isStartingCamera ? 'animate-spin' : ''}`} />
                    <span>
                      {isStartingCamera
                        ? (isAm ? 'በመክፈት ላይ...' : 'Opening...')
                        : camActive
                          ? (isAm ? 'ካሜራ በርቷል' : 'Cam On')
                          : (isAm ? 'ካሜራ ክፈት' : 'Start Camera')}
                    </span>
                  </button>

                  {isAuthorizedTeacher ? (
                    <button
                      type="button"
                      onClick={toggleLiveBroadcast}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isBroadcastingLive
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-sm'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                      }`}
                      title={isBroadcastingLive ? (isAm ? 'ስርጭት አቁም' : 'Stop Broadcast') : (isAm ? 'የቀጥታ ስርጭት ጀምር' : 'Start Broadcast')}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{isBroadcastingLive ? (isAm ? 'ስርጭት አቁም' : 'Stop Live') : (isAm ? 'ስርጭት ጀምር' : 'Broadcast')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsHandRaised(!isHandRaised);
                        triggerToast(!isHandRaised ? (isAm ? 'እጅዎ ተነስቷል፤ መምህሩ ተነግሮታል።' : 'Hand raised. Instructor notified.') : (isAm ? 'እጅዎ ዝቅ ብሏል።' : 'Hand lowered.'));
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        isHandRaised
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-black'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={isAm ? 'እጅ አንሳ' : 'Raise Hand'}
                    >
                      <span>✋</span>
                      <span>{isHandRaised ? (isAm ? 'እጅ ተነስቷል' : 'Hand Up') : (isAm ? 'እጅ አንሳ' : 'Raise Hand')}</span>
                    </button>
                  )}
                </div>

                {/* Right Controls: 3-Dot More Menu + Leave */}
                <div className="flex items-center gap-2 relative">
                  {isRecording && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-mono font-black animate-pulse hidden sm:inline-flex items-center gap-1">
                      REC {formatDuration(recordingSeconds)}
                    </span>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoreToolbarMenu((prev) => !prev)}
                      className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                        showMoreToolbarMenu
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                      title={isAm ? 'ተጨማሪ መሳሪያዎች' : 'More Tools'}
                      aria-expanded={showMoreToolbarMenu}
                    >
                      <MoreVertical className="w-4 h-4" />
                      <span className="hidden sm:inline">{isAm ? 'ተጨማሪ' : 'More'}</span>
                    </button>

                    {showMoreToolbarMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowMoreToolbarMenu(false)}
                        />
                        <div className="absolute right-0 bottom-full mb-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-2xl p-1.5 z-40 space-y-1 text-xs text-slate-800">
                          {isAuthorizedTeacher && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowMoreToolbarMenu(false);
                                setStageMode('video');
                                if (!roomLessonVideoUrl && !roomLessonYoutubeId) {
                                  liveLessonVideoInputRef.current?.click();
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                            >
                              <Film className="w-4 h-4 text-sky-600 shrink-0" />
                              <span>{isAm ? 'የትምህርት ቪዲዮ ጫን/አጫውት' : 'Upload / Play Lesson Video'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreToolbarMenu(false);
                              handleToggleScreenShare();
                            }}
                            className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                          >
                            <ScreenShare className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{isScreenSharing ? (isAm ? 'ስክሪን ማጋራት አቁም' : 'Stop Screen Share') : (isAm ? 'ስክሪን አጋራ' : 'Share Screen')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreToolbarMenu(false);
                              handleToggleRecording();
                            }}
                            className={`w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between font-semibold text-left cursor-pointer ${
                              isRecording ? 'bg-rose-50 text-rose-700' : ''
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <CircleDot className={`w-4 h-4 shrink-0 ${isRecording ? 'text-rose-600 animate-pulse' : 'text-rose-500'}`} />
                              <span>{isRecording ? (isAm ? 'ቀረጻ አቁም' : 'Stop Recording') : (isAm ? 'ክፍሉን ቅረጽ' : 'Record Class')}</span>
                            </span>
                            {isRecording && <span className="text-[10px] font-mono">{formatDuration(recordingSeconds)}</span>}
                          </button>

                          {camActive && userStream && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowMoreToolbarMenu(false);
                                handleFlipCamera();
                              }}
                              className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{isAm ? 'ካሜራ ቀያይር (ፊት/ጀርባ)' : 'Flip Camera (Front/Back)'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreToolbarMenu(false);
                              handleTestMic();
                            }}
                            className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{isAm ? 'ማይክሮፎን ሞክር' : 'Test Microphone'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreToolbarMenu(false);
                              handleToggleMicMonitor();
                            }}
                            className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                          >
                            <Mic className={`w-4 h-4 shrink-0 ${isMonitoringMic ? 'text-emerald-600' : 'text-slate-500'}`} />
                            <span>{isMonitoringMic ? (isAm ? 'የድምፅ ማዳመጫ አጥፋ' : 'Stop Mic Monitor') : (isAm ? 'ድምፅህን አዳምጥ' : 'Monitor My Voice')}</span>
                          </button>

                          {isAuthorizedTeacher && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowMoreToolbarMenu(false);
                                setIsHandRaised(!isHandRaised);
                                triggerToast(!isHandRaised ? (isAm ? 'እጅዎ ተነስቷል።' : 'Hand raised.') : (isAm ? 'እጅዎ ዝቅ ብሏል።' : 'Hand lowered.'));
                              }}
                              className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                            >
                              <span className="w-4 text-center">✋</span>
                              <span>{isHandRaised ? (isAm ? 'እጅ ዝቅ አድርግ' : 'Lower Hand') : (isAm ? 'እጅ አንሳ' : 'Raise Hand')}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreToolbarMenu(false);
                              handleToggleFullscreen();
                            }}
                            className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                          >
                            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-600 shrink-0" /> : <Maximize2 className="w-4 h-4 text-slate-600 shrink-0" />}
                            <span>{isFullscreen ? (isAm ? 'ሙሉ ስክሪን ዝጋ' : 'Exit Fullscreen') : (isAm ? 'ሙሉ ስክሪን' : 'Fullscreen')}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Leave Class */}
                  <button
                    type="button"
                    onClick={handleExitClass}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title={isAm ? 'ከክፍል ውጣ' : 'Leave Classroom'}
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>{isAm ? 'ውጣ' : 'Leave'}</span>
                  </button>
                </div>
              </div>

              {/* Lesson Materials Attached */}
              {selectedClass.materialsAttached && selectedClass.materialsAttached.length > 0 ? (
                <div className="bg-emerald-50/70 px-4 py-2 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isAm ? 'የትምህርት ሰነዶች:' : 'Lesson Materials:'}</span>
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedClass.materialsAttached.map((mat) => (
                      <button
                        key={mat}
                        onClick={() => handleOpenClassMaterial(mat)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs transition cursor-pointer text-[11px]"
                        title={isAm ? 'ሰነዱን ክፈት እና አንብብ' : 'Preview & Download Material'}
                      >
                        <FileText className="w-3 h-3 text-emerald-600" />
                        <span className="truncate max-w-[200px]">{mat}</span>
                        <span className="text-emerald-700 font-bold">↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/80 px-4 py-1.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isAm ? 'ምንም የተያያዘ ሰነድ የለም' : 'No attached materials for this session'}</span>
                  </span>
                </div>
              )}
            </div>

            {/* In-Lecture Live Poll */}
            {selectedClass.pollQuestion && (
              <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                    <BarChart2 className="w-4 h-4" />
                    <span>Live Class Poll</span>
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

          {/* Right Column: Live Chat & Real-Time Interactive Q&A System */}
          <div className={`rounded-3xl bg-white border border-slate-200/90 shadow-sm p-4 flex-col h-[700px] overflow-hidden ${
            mobileClassroomTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* 1. Header with Real-time Presence & Search Bar */}
            <div className="pb-3 border-b border-slate-100 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                      Classroom Chat &amp; Q&amp;A
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                      Real-time interactive discussion &amp; academic doubt resolution
                    </p>
                  </div>
                </div>

                {/* Real-time Presence Counters */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{onlineParticipants.length} {isAm ? 'ተሳታፊዎች' : 'Online'}</span>
                  </div>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Search questions, doubts, topics, or formulas..."
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                {chatSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setChatSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Primary Navigation Tabs: Live Chat | Academic Q&A | Unanswered | Polls */}
            <div className="grid grid-cols-4 gap-1 py-2.5 border-b border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setActiveChatTab('chat')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeChatTab === 'chat'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
                title="All live classroom messages"
              >
                <MessageSquare className="w-3 h-3 shrink-0" />
                <span className="truncate">Chat ({chatMessages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChatTab('qa')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeChatTab === 'qa'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
                title="All academic questions and doubts"
              >
                <HelpCircle className="w-3 h-3 shrink-0" />
                <span className="truncate">Q&amp;A ({chatMessages.filter((m) => m.isQuestion).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChatTab('pending')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeChatTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
                title="Questions awaiting instructor answer"
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">Unanswered ({chatMessages.filter((m) => m.isQuestion && !m.isAnswered).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChatTab('polls')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                  activeChatTab === 'polls'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
                title="Live classroom polls & interactive quizzes"
              >
                <BarChart2 className="w-3 h-3 shrink-0" />
                <span className="truncate">Polls ({selectedClass.pollQuestion ? 1 : 0})</span>
              </button>
            </div>

            {/* 3. Sub-filter bar for Q&A tab */}
            {activeChatTab === 'qa' && (
              <div className="flex items-center gap-1 py-2 border-b border-slate-100 shrink-0 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  <span>Filter:</span>
                </span>
                {[
                  { id: 'all', label: `All (${chatMessages.filter((m) => m.isQuestion).length})` },
                  { id: 'unanswered', label: `Pending (${chatMessages.filter((m) => m.isQuestion && !m.isAnswered).length})` },
                  { id: 'answered', label: `Answered (${chatMessages.filter((m) => m.isQuestion && m.isAnswered).length})` },
                  { id: 'pinned', label: `Pinned (${chatMessages.filter((m) => m.isQuestion && m.isPinned).length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setQaStatusFilter(f.id as any)}
                    className={`px-2.5 py-0.5 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                      qaStatusFilter === f.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* 4. Sticky Pinned Announcement Banner (if any message is pinned) */}
            {chatMessages.find((m) => m.isPinned) && (
              <div className="mx-0 my-2 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-start gap-2 shadow-2xs shrink-0 animate-in fade-in">
                <Pin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <span>Pinned by Instructor</span>
                      <span className="text-amber-700">({chatMessages.find((m) => m.isPinned)?.sender})</span>
                    </span>
                    {isAuthorizedTeacher && (
                      <button
                        type="button"
                        onClick={() => handleTogglePinChatMessage(chatMessages.find((m) => m.isPinned)!.id)}
                        className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                        title="Unpin message"
                      >
                        Unpin
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-amber-950 font-medium line-clamp-2 mt-0.5 leading-relaxed">
                    {chatMessages.find((m) => m.isPinned)?.text}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Messages Feed / Polls / Empty States */}
            {activeChatTab === 'polls' ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-purple-700 font-extrabold">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Classroom Poll</span>
                    </span>
                    <span className="text-emerald-700 font-mono">Question 1 of 1</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedClass.pollQuestion?.question || 'Which law explains the direction of induced EMF?'}
                  </h4>
                  <div className="space-y-2 pt-1">
                    {(selectedClass.pollQuestion?.options || ['Faraday\'s Law', 'Lenz\'s Law', 'Ampere\'s Law', 'Gauss\'s Law']).map((opt, idx) => {
                      const isSelected = userVotedPollOption === idx;
                      const baseVotes = selectedClass.pollQuestion?.votes?.[idx] || [12, 45, 6, 4][idx];
                      const voteCount = baseVotes + (isSelected ? 1 : 0);
                      const totalVotes = 67 + (userVotedPollOption !== null ? 1 : 0);
                      const pct = Math.round((voteCount / totalVotes) * 100);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setUserVotedPollOption(idx);
                            triggerToast(`Voted for option ${String.fromCharCode(65 + idx)}: "${opt}"`);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition relative overflow-hidden flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-emerald-600/15 pointer-events-none transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative z-10 flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt}</span>
                          </span>
                          <span className="relative z-10 font-mono font-bold text-slate-700">
                            {pct}% ({voteCount})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={chatScrollContainerRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                  const scrolledUp = distanceToBottom > 80;
                  setIsUserScrolledUp(scrolledUp);
                  if (!scrolledUp) setUnreadCount(0);
                }}
                className="flex-1 overflow-y-auto py-2.5 space-y-3 pr-1 relative"
              >
                {(() => {
                  let filteredList = chatMessages;

                  // Tab filtering
                  if (activeChatTab === 'qa') {
                    filteredList = filteredList.filter((m) => m.isQuestion);
                    if (qaStatusFilter === 'unanswered') {
                      filteredList = filteredList.filter((m) => !m.isAnswered);
                    } else if (qaStatusFilter === 'answered') {
                      filteredList = filteredList.filter((m) => m.isAnswered);
                    } else if (qaStatusFilter === 'pinned') {
                      filteredList = filteredList.filter((m) => m.isPinned);
                    }
                  } else if (activeChatTab === 'pending') {
                    filteredList = filteredList.filter((m) => m.isQuestion && !m.isAnswered);
                  }

                  // Search filtering
                  if (chatSearchQuery.trim()) {
                    const q = chatSearchQuery.toLowerCase();
                    filteredList = filteredList.filter(
                      (m) =>
                        m.text.toLowerCase().includes(q) ||
                        m.sender.toLowerCase().includes(q) ||
                        (m.teacherAnswer && m.teacherAnswer.toLowerCase().includes(q))
                    );
                  }

                  if (filteredList.length === 0) {
                    return (
                      <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-2.5 text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                          {activeChatTab === 'pending' ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          ) : activeChatTab === 'qa' ? (
                            <HelpCircle className="w-6 h-6 text-amber-500" />
                          ) : (
                            <MessageSquare className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700">
                            {activeChatTab === 'pending'
                              ? 'All questions answered!'
                              : activeChatTab === 'qa'
                              ? 'No academic questions yet'
                              : chatSearchQuery
                              ? 'No matching messages found'
                              : 'No messages yet'}
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-[260px]">
                            {activeChatTab === 'pending'
                              ? 'There are currently no unanswered doubts awaiting the instructor.'
                              : activeChatTab === 'qa'
                              ? 'Have a question about this national exam lesson? Use Question mode below to submit your doubt!'
                              : chatSearchQuery
                              ? `No results for "${chatSearchQuery}". Try a different keyword.`
                              : 'Be the first to say hello or ask a question!'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return filteredList.map((msg) => {
                    const initials = msg.sender
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const isTeacher = msg.role === 'teacher';
                    const isAi = msg.role === 'ai_tutor';
                    const isMod = msg.role === 'moderator';

                    const avatarBg = isTeacher
                      ? 'bg-slate-900 text-white ring-2 ring-blue-500/30'
                      : isAi
                      ? 'bg-purple-600 text-white ring-2 ring-purple-500/30'
                      : isMod
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white';

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-2xl border transition shadow-2xs p-3 space-y-2 ${
                          msg.isPinned
                            ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/60'
                            : isTeacher
                            ? 'bg-blue-50/25 border-blue-200/80 shadow-xs'
                            : isAi
                            ? 'bg-purple-50/30 border-purple-200/80'
                            : msg.isQuestion
                            ? 'bg-amber-50/20 border-amber-200/70'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        {/* Header: Avatar, Name, Role Badges, Timestamp */}
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarBg}`}>
                            {isAi ? '🤖' : initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900">{msg.sender}</span>

                                {/* Role Badges */}
                                {isTeacher ? (
                                  <span className="bg-slate-900 text-blue-300 border border-blue-400/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                    <Shield className="w-2.5 h-2.5 text-blue-400" />
                                    <span>Instructor</span>
                                  </span>
                                ) : isAi ? (
                                  <span className="bg-purple-700 text-purple-100 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-purple-300" />
                                    <span>AI Study Assistant</span>
                                  </span>
                                ) : isMod ? (
                                  <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    Moderator
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                                    Student
                                  </span>
                                )}

                                {/* Question & Resolution Badges */}
                                {msg.isQuestion && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                    <HelpCircle className="w-2.5 h-2.5 text-amber-700" />
                                    <span>Academic Question</span>
                                  </span>
                                )}

                                {msg.isQuestion && (
                                  msg.isAnswered ? (
                                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300/80 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                                      <span>Answered by Instructor</span>
                                    </span>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                                      <span>Pending Review</span>
                                    </span>
                                  )
                                )}
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono ml-auto shrink-0">
                                {msg.timestamp}
                              </span>
                            </div>

                            {/* Replying To Quote Block (if exists) */}
                            {msg.replyTo && (
                              <div className="mt-1 p-1.5 px-2 rounded-lg bg-slate-100/90 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-1.5">
                                <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-800">@{msg.replyTo.sender}:</span>
                                <span className="truncate italic">"{msg.replyTo.text}"</span>
                              </div>
                            )}

                            {/* Main Message Text */}
                            <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal break-words mt-1 whitespace-pre-wrap">
                              {msg.text}
                            </p>

                            {/* File Attachment preview (if attached) */}
                            {msg.attachmentName && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono shadow-2xs">
                                <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="truncate max-w-[200px] font-bold">{msg.attachmentName}</span>
                              </div>
                            )}

                            {/* Official Instructor Answer Block (if question has been answered) */}
                            {msg.teacherAnswer && (
                              <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 text-xs shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Official Answer from {msg.answeredBy || 'Instructor'}</span>
                                  </span>
                                  {msg.answeredAt && <span className="text-slate-500 font-mono font-normal">{msg.answeredAt}</span>}
                                </div>
                                <p className="text-xs text-slate-900 leading-relaxed font-medium whitespace-pre-wrap">
                                  {msg.teacherAnswer}
                                </p>
                              </div>
                            )}

                            {/* Teacher Inline Answering Form (active when teacher clicks 'Answer') */}
                            {isAuthorizedTeacher && answeringQuestionId === msg.id && (
                              <div className="mt-2.5 p-3 rounded-xl bg-slate-900 text-white text-xs space-y-2 border border-emerald-500/50 shadow-md animate-in fade-in">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>Answer Student Question</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setAnsweringQuestionId(null)}
                                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <textarea
                                  value={teacherAnswerText}
                                  onChange={(e) => setTeacherAnswerText(e.target.value)}
                                  placeholder="Type the official academic explanation or exam formula for this student..."
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none h-20"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAnsweringQuestionId(null)}
                                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAnswerQuestionSubmit(msg.id, teacherAnswerText)}
                                    disabled={!teacherAnswerText.trim()}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                                  >
                                    Publish Answer
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Message Actions Row: Reactions, Reply, Moderation */}
                            <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100/80 flex-wrap">
                              {/* Left: Reactions & Reply */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Upvote/Like Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSendReaction(msg.id, '👍')}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 transition cursor-pointer text-[11px] font-bold"
                                  title="Upvote or react"
                                >
                                  <ThumbsUp className="w-3 h-3 text-emerald-600" />
                                  <span>{msg.upvotes || 0}</span>
                                </button>

                                {/* Emoji Reaction Chips */}
                                {msg.reactions &&
                                  Object.entries(msg.reactions).map(([emo, count]) => {
                                    if (!count || emo === '👍') return null;
                                    return (
                                      <button
                                        key={emo}
                                        type="button"
                                        onClick={() => handleSendReaction(msg.id, emo)}
                                        className="px-1.5 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <span>{emo}</span>
                                        <span className="text-[10px] text-slate-600">{count}</span>
                                      </button>
                                    );
                                  })}

                                {/* Reply Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(msg);
                                    setInputMessage(`@${msg.sender} `);
                                  }}
                                  className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                                >
                                  <Reply className="w-3 h-3 text-slate-500" />
                                  <span>Reply</span>
                                </button>
                              </div>

                              {/* Right: Teacher Controls & Student Delete */}
                              <div className="flex items-center gap-1.5 ml-auto">
                                {/* Teacher: Answer Button */}
                                {isAuthorizedTeacher && msg.isQuestion && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAnsweringQuestionId(msg.id);
                                      setTeacherAnswerText(msg.teacherAnswer || '');
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold transition cursor-pointer"
                                    title="Write teacher answer"
                                  >
                                    ✍️ {msg.isAnswered ? 'Edit Answer' : 'Answer Question'}
                                  </button>
                                )}

                                {/* Teacher: Toggle Resolved */}
                                {isAuthorizedTeacher && msg.isQuestion && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAnswered(msg.id, msg.isAnswered)}
                                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                                      msg.isAnswered
                                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                    }`}
                                  >
                                    {msg.isAnswered ? 'Mark Pending' : '✓ Resolve'}
                                  </button>
                                )}

                                {/* Teacher: Pin */}
                                {isAuthorizedTeacher && (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePinChatMessage(msg.id)}
                                    className={`p-1 rounded-lg border text-[11px] transition cursor-pointer ${
                                      msg.isPinned
                                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                                    }`}
                                    title={msg.isPinned ? 'Unpin message' : 'Pin message to top'}
                                  >
                                    <Pin className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Delete Control: Allowed for Teacher or Message Author */}
                                {(isAuthorizedTeacher || msg.userId === currentUser?.id) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChatMessage(msg.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}

                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Floating 'New Messages' Pill (visible when user scrolled up) */}
            {isUserScrolledUp && unreadCount > 0 && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2">
                <button
                  type="button"
                  onClick={() => {
                    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setUnreadCount(0);
                    setIsUserScrolledUp(false);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  <span>{unreadCount} New Message{unreadCount > 1 ? 's' : ''}</span>
                </button>
              </div>
            )}

            {/* 6. Professional Message Composer & Interactive Question Submission Form */}
            <div className="mt-auto pt-2.5 border-t border-slate-100 shrink-0 space-y-2">
              {/* Replying To Quote Banner */}
              {replyingTo && (
                <div className="p-1.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 min-w-0 text-slate-700">
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-900">Replying to @{replyingTo.sender}:</span>
                    <span className="truncate italic text-[11px]">"{replyingTo.text.slice(0, 75)}"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer shrink-0"
                    title="Cancel reply"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Mode Switcher & Quick Academic Doubts Toolbar */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Academic Question Mode Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsQuestionMode(!isQuestionMode)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isQuestionMode
                        ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                    title="Toggle Academic Question Mode to highlight question for instructor and Q&A panel"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>{isQuestionMode ? 'Question Mode Active' : 'Ask Academic Question'}</span>
                  </button>

                  {/* High-Yield Doubt Prompt Chips */}
                  <button
                    type="button"
                    onClick={() => handleQuickDoubtPrompt('Please explain this concept again:')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Explain again
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDoubtPrompt('What is the formula step for:')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Formula step
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDoubtPrompt('Can you provide an exam example for:')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Exam example
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMessage('Understood, thank you!')}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                  >
                    Understood!
                  </button>
                </div>

                {/* Instant Emoji Reaction Shortcuts */}
                <div className="flex items-center gap-1">
                  {['👍', '👏', '💡', '❤️', '✋'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleInsertEmoji(em)}
                      className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-xs transition cursor-pointer active:scale-90"
                      title={`Insert ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active File Attachment Chip (if attached) */}
              {chatAttachment && (
                <div className="p-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold truncate text-[11px]">{chatAttachment.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatAttachment(null)}
                    className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer shrink-0"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Main Composer Form: Multiline Textarea + Controls */}
              <form onSubmit={handleSendMessage} className="space-y-1.5">
                <div className={`p-2 rounded-2xl flex flex-col gap-1.5 shadow-2xs transition border ${
                  isQuestionMode
                    ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-slate-50/90 border-slate-200/90 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
                }`}>
                  {/* Multiline Question / Message Input */}
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={isQuestionMode ? 2 : 1}
                    maxLength={500}
                    placeholder={
                      isQuestionMode
                        ? 'Type your academic question or doubt in detail for the instructor...'
                        : 'Type your message or ask a question...'
                    }
                    className="w-full bg-transparent border-0 text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium resize-none leading-relaxed"
                  />

                  {/* Composer Bottom Row: Attachments, Emojis, Counter, Send */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <div className="flex items-center gap-1.5">
                      {/* Attachment Button */}
                      <button
                        type="button"
                        onClick={() => chatAttachmentInputRef.current?.click()}
                        className="text-slate-400 hover:text-emerald-700 transition p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Attach diagram, formula screenshot, or notes"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Attach</span>
                      </button>

                      {/* Emoji Picker Button */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                        title="Open emoji palette"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {/* Keyboard Hint */}
                      <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                        ↵ Enter to send
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Character Counter */}
                      <span className={`text-[10px] font-mono ${
                        inputMessage.length > 450 ? 'text-rose-600 font-bold' : 'text-slate-400'
                      }`}>
                        {inputMessage.length}/500
                      </span>

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={(!inputMessage.trim() && !chatAttachment) || isSubmittingChat}
                        className={`text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-40 ${
                          isQuestionMode
                            ? 'bg-amber-600 hover:bg-amber-700 disabled:hover:bg-amber-600'
                            : 'bg-emerald-600 hover:bg-emerald-700 disabled:hover:bg-emerald-600'
                        }`}
                      >
                        {isQuestionMode ? (
                          <HelpCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isSubmittingChat
                            ? 'Submitting...'
                            : isQuestionMode
                            ? 'Submit Question'
                            : 'Send'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Emoji Palette (if open) */}
              {showEmojiPicker && (
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-lg flex items-center gap-1.5 flex-wrap animate-in fade-in slide-in-from-bottom-2">
                  {['😀', '😂', '🔥', '👏', '🙌', '💡', '❓', '✅', '📚', '🎯', '💯', '⭐'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleInsertEmoji(em)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition cursor-pointer active:scale-90"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  )}



      {/* MODAL: TEACHER START CLASS (አዲስ ላይቭ ክላስ ማሰራጫ - Teachers/Admin Only) */}
      {isAuthorizedTeacher && showStartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-600 animate-pulse" />
                <span>{isAm ? 'አዲስ የቀጥታ ክፍለ-ጊዜ (Live Class Form)' : 'Create or Schedule Live Class'}</span>
              </h3>
              <button
                onClick={() => setShowStartModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTeacherStartClass} className="space-y-3.5">
              {/* Teacher Assignment Indicator */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>{isAm ? 'የመምህር ሁኔታ:' : 'Instructor Status:'}</span>
                <span className="font-bold text-slate-800">
                  {currentUser?.role === 'teacher' && currentUser?.name
                    ? currentUser.name
                    : (isAm ? '⚪ መምህር አልተመደበም (ክፍት ክፍለ-ጊዜ)' : '⚪ No Teacher Assigned')}
                </span>
              </div>

              {/* Mode Toggle: Go Live Now vs Schedule for Later */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStartAsLive(true)}
                  className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    startAsLive ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{isAm ? '🔴 የቀጥታ ስርጭት ጀምር' : '🔴 Broadcast Live'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStartAsLive(false)}
                  className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    !startAsLive ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isAm ? '📅 መርሃ-ግብር ብቻ መዝግብ' : '📅 Schedule Only'}</span>
                </button>
              </div>

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
                    {currentUser?.teachingSubject &&
                      !['Physics', 'Mathematics', 'Chemistry', 'Biology', 'English', 'Geography', 'History', 'Economics', 'Computer Science', 'Law'].includes(currentUser.teachingSubject) && (
                        <option value={currentUser.teachingSubject}>{currentUser.teachingSubject}</option>
                      )}
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

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAm ? 'የሰሩትን ቪዲዮ ይጫኑ (አማራጭ - MP4 / WebM / MOV)' : 'Upload Pre-Recorded Lesson Video (Optional)'}
                  </label>
                  <input
                    ref={startModalVideoInputRef}
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.ogg,.m4v"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const looksLikeVideo =
                        f.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|ogv|m4v)$/i.test(f.name);
                      if (!looksLikeVideo) {
                        triggerToast(isAm ? 'እባክዎ ትክክለኛ የቪዲዮ ፋይል ይምረጡ' : 'Please select a valid video file');
                        return;
                      }
                      if (newClassVideoPreviewUrl && newClassVideoPreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(newClassVideoPreviewUrl);
                      }
                      setNewClassVideoFile(f);
                      setNewClassVideoPreviewUrl(URL.createObjectURL(f));
                    }}
                    className="hidden"
                  />

                  {newClassVideoFile ? (
                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Film className="w-4 h-4 text-sky-700 shrink-0" />
                        <span className="font-bold text-slate-900 truncate">{newClassVideoFile.name}</span>
                        <span className="text-[11px] text-slate-500 shrink-0">
                          ({(newClassVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewClassVideoFile(null);
                          if (newClassVideoPreviewUrl?.startsWith('blob:')) {
                            URL.revokeObjectURL(newClassVideoPreviewUrl);
                          }
                          setNewClassVideoPreviewUrl(null);
                        }}
                        className="text-rose-600 font-bold hover:underline cursor-pointer shrink-0"
                      >
                        {isAm ? 'አስወግድ' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startModalVideoInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-sky-300 bg-sky-50/40 hover:bg-sky-50 text-sky-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isAm ? 'የትምህርት ቪዲዮ ከመሳሪያ ይምረጡ (MP4, WebM, MOV)' : 'Select Pre-Recorded Video File (MP4, WebM, MOV)'}</span>
                    </button>
                  )}
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
                    {isAm
                      ? 'ቪዲዮ ካልተመረጠ፣ ክፍሉ በዲጂታል ሰሌዳና በካሜራ ስርጭት ይከፈታል።'
                      : 'If neither video file nor YouTube URL is set, class starts with interactive whiteboard and camera broadcast.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {isAm ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploadingNewClassVideo}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60 ${
                    startAsLive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {isUploadingNewClassVideo ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : startAsLive ? (
                    <Radio className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>
                    {isUploadingNewClassVideo
                      ? (isAm ? 'ቪዲዮ በመጫን ላይ...' : 'Uploading Video...')
                      : startAsLive
                        ? (isAm ? 'ስርጭት ጀምር' : 'Go Live Now')
                        : (isAm ? 'መርሃ-ግብር መዝግብ' : 'Save Schedule')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATTENDEES & RAISED HANDS */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {isAm
                    ? `ተሳታፊዎች (${onlineParticipants.length})`
                    : `Live Attendees (${onlineParticipants.length})`}
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
              {/* Host / Presenter Status */}
              {liveBroadcasterInfo?.teacherName || (selectedClass.teacherName && !selectedClass.teacherName.includes('መምህር አልተመደበም') && !selectedClass.teacherName.toLowerCase().includes('no teacher') && !selectedClass.teacherName.toLowerCase().includes('pending')) ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xs">
                      {(liveBroadcasterInfo?.teacherName || selectedClass.teacherName).charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{liveBroadcasterInfo?.teacherName || selectedClass.teacherName}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {isAm ? 'መምህር - አስተናጋጅ' : 'Instructor - Host'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    {isAm ? 'መምህር' : 'Teacher'}
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                      ⚪
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {isAm ? 'መምህር አልተመደበም' : 'No teacher assigned yet'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isAm ? 'ይህ ክፍል መምህር በመጠባበቅ ላይ ነው' : 'Session is awaiting assigned instructor'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    {isAm ? 'መምህር ይጠበቃል' : 'Pending'}
                  </span>
                </div>
              )}

              {/* Raised hand student (if active) */}
              {isHandRaised && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✋</span>
                    <div>
                      <div className="font-bold text-slate-900">{currentUser?.name || (isAm ? 'እርስዎ' : 'You')}</div>
                      <div className="text-[10px] text-amber-800 font-bold">
                        {isAm ? 'መምህሩን ለመጠየቅ በመጠባበቅ ላይ' : 'Waiting to ask instructor'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    {isAm ? 'እጅ ተነስቷል' : 'Hand Raised'}
                  </span>
                </div>
              )}

              {/* REAL Active Connected Live Participants */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  {isAm
                    ? `በክፍሉ ውስጥ ያሉ ሰዎች (${onlineParticipants.length})`
                    : `Connected In This Room (${onlineParticipants.length})`}
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
                                  {isAm ? 'እርስዎ' : 'You'}
                                </span>
                              )}
                              {isHost && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-700 text-white font-black">
                                  🔴 {isAm ? 'አስተማሪ' : 'Broadcaster'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {p.role === 'teacher' ? (isAm ? '👨‍🏫 መምህር' : '👨‍🏫 Teacher') : (isAm ? '👨‍🎓 ተማሪ' : '👨‍🎓 Student')} • {isAm ? 'አሁን በቀጥታ ክፍል ውስጥ ይገኛል' : 'Currently in live room'}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {p.role === 'teacher' ? (isAm ? 'መምህር' : 'Teacher') : (isAm ? 'ተማሪ' : 'Student')}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    {isAm ? 'እስካሁን ሌላ ሰው አልተቀላቀለም' : 'No other students connected yet'}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowAttendeesModal(false)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                {isAm ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IN-CLASSROOM AUTHENTIC DOCUMENT VIEWER */}
      {viewingClassDocument && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 leading-snug">
                    {viewingClassDocument.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                    <span className="font-semibold text-emerald-700">{viewingClassDocument.subject}</span>
                    <span>•</span>
                    <span>{viewingClassDocument.chapter}</span>
                    <span>•</span>
                    <span>{viewingClassDocument.pages} pages</span>
                    <span>•</span>
                    <span>{viewingClassDocument.fileSize}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingClassDocument(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 font-mono whitespace-pre-wrap leading-relaxed text-[11px] select-text">
                {viewingClassDocument.fullExcerpt}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(viewingClassDocument.fullExcerpt)}`}
                  download={`${viewingClassDocument.title.replace(/\.pdf$/, '')}_Notes.txt`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAm ? 'ሰነዱን አውርድ' : 'Download Document'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const title = viewingClassDocument.title;
                    setViewingClassDocument(null);
                    onOpenDocument(title);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAm ? 'በሰነዶች ማውጫ ክፈት' : 'Open in Library'}</span>
                </button>
              </div>
              <button
                onClick={() => setViewingClassDocument(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                {isAm ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM SLIDE */}
      {showAddSlideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-black text-slate-900">
                  {isAm ? 'አዲስ የትምህርት ስላይድ ጨምር' : 'Add Lesson Slide'}
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
                  {isAm ? 'የስላይዱ ርዕስ *' : 'Slide Title *'}
                </label>
                <input
                  type="text"
                  value={newSlideTitle}
                  onChange={(e) => setNewSlideTitle(e.target.value)}
                  placeholder={isAm ? "ምሳሌ፦ Electromagnetic Induction - Faraday's Law" : "e.g. Electromagnetic Induction - Faraday's Law"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAm ? 'ዋና ዋና ነጥቦች - በየመስመሩ አንድ ነጥብ' : 'Bullet Points - one per line'}
                </label>
                <textarea
                  rows={4}
                  value={newSlideBullets}
                  onChange={(e) => setNewSlideBullets(e.target.value)}
                  placeholder={isAm ? "• ማግኔቲክ ፍላክስ ለውጥ የኤሌክትሪክ ቮልቴጅ ያመነጫል\n• የሌንዝ ህግ የመግነጢሳዊ መስኩን አቅጣጫ ይወስናል\n• በፈተና ላይ የሚመጡ የተለመዱ ስሌቶች" : "• Magnetic flux change induces electromotive force\n• Lenz's law determines the induced direction\n• High-yield calculation patterns"}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAm ? 'አስፈላጊ ፎርሙላ ወይም ማስታወሻ' : 'Important Formula or Note'}
                </label>
                <input
                  type="text"
                  value={newSlideFormula}
                  onChange={(e) => setNewSlideFormula(e.target.value)}
                  placeholder={isAm ? "ምሳሌ፦ ε = -N · (ΔΦ / Δt)" : "e.g. ε = -N · (ΔΦ / Δt)"}
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
                {isAm ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddNewSlide}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isAm ? 'ስላይዱን ጨምር' : 'Add Slide'}</span>
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
                    {isAm ? 'የቀረጻ ይዘት ምርጫ' : 'Recording Source Selection'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isAm ? 'ትምህርቱን ሲቀዱ ምን ይዘት እንዲቀረጽ ይፈልጋሉ?' : 'Select what you want to capture during class'}
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
                  triggerToast(isAm ? '✅ የቀረጻ ምንጭ ወደ "ስላይድ + የመምህር ፊት" ተቀይሯል!' : '✅ Record source set to "Slides + Teacher Face"');
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
                    <span className="font-bold text-xs text-slate-900">
                      {isAm ? '🎓 ስላይድ + የመምህሩ ፊትና ድምፅ' : '🎓 Slides + Teacher Face & Voice'}
                    </span>
                    {recordSource === 'stage_composite' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                        {isAm ? 'የተመረጠ' : 'Selected'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {isAm
                      ? 'PPT ስላይዶቹን ሲያስረዱ፣ በስላይዱ ላይ የሚጽፉትን የቦርድ ማስታወሻ እና የፊትዎን ቪዲዮ አጣምሮ ይቀርጻል።'
                      : 'Records your PowerPoint slides, digital whiteboard ink notes, and webcam video simultaneously.'}
                  </p>
                </div>
              </button>

              {/* Option 2: Native Screen Capture */}
              <button
                type="button"
                onClick={() => {
                  setRecordSource('screen');
                  setShowRecordSourceModal(false);
                  triggerToast(isAm ? '✅ የቀረጻ ምንጭ ወደ "ሙሉ ስክሪን / መስኮት" ተቀይሯል!' : '✅ Record source set to "Screen Share"');
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
                    <span className="font-bold text-xs text-slate-900">
                      {isAm ? '🖥️ ሙሉ ስክሪን ወይም ታብ' : '🖥️ Screen or Browser Tab'}
                    </span>
                    {recordSource === 'screen' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                        {isAm ? 'የተመረጠ' : 'Selected'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {isAm
                      ? 'የኮምፒውተርዎን ሙሉ ስክሪን፣ ብሮውዘር ታብ ወይም ሌላ ማንኛውንም መተግበሪያ በቀጥታ ለመቅረጽ።'
                      : 'Records full screen, window, or specific browser application tab.'}
                  </p>
                </div>
              </button>

              {/* Option 3: Teacher Camera Only */}
              <button
                type="button"
                onClick={() => {
                  setRecordSource('camera');
                  setShowRecordSourceModal(false);
                  triggerToast(isAm ? '✅ የቀረጻ ምንጭ ወደ "የመምህር ካሜራ ብቻ" ተቀይሯል!' : '✅ Record source set to "Webcam Only"');
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
                    <span className="font-bold text-xs text-slate-900">
                      {isAm ? '👤 የፊት ካሜራ ብቻ' : '👤 Teacher Webcam Only'}
                    </span>
                    {recordSource === 'camera' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                        {isAm ? 'የተመረጠ' : 'Selected'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {isAm
                      ? 'ያለ ስላይድ የመምህሩን ገጽታና ንግግር ብቻ ለይቶ ለመቅረጽ ሲፈልጉ።'
                      : 'Captures webcam video stream exclusively without slides.'}
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
                {isAm ? 'እሺ' : 'Done'}
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
                    {isAm ? 'የቀጥታ ትምህርት ቀረጻ ተጠናቋል!' : 'Class Recording Finished!'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isAm ? 'ክፍለ-ጊዜው በተሳካ ሁኔታ ተቀርጾ ተዘጋጅቷል' : 'Session recorded and ready to view or download'}
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
                src={recordedVideoUrl || undefined}
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
              />
            </div>

            {/* Audio Track Status Banner & Quick-Listen */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${recordedHasAudio ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-semibold text-slate-200">
                  {recordedHasAudio
                    ? (isAm ? 'ድምፅ: ተቀርጿል' : 'Voice Audio: Included')
                    : (isAm ? 'ድምፅ: ማይክሮፎን ጠፍቶ ነበር' : 'Voice Audio: Mic Inactive')}
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
                <span>{isAm ? 'ድምፅ አጫውት' : 'Unmute & Play'}</span>
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
                <span>{isAm ? 'ቀን: ዛሬ' : 'Date: Today'}</span>
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
                  <span>{isAm ? 'ወደ ቀረጻዎች ዝርዝር' : 'Recorded Sessions'}</span>
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
                  title={isAm ? 'ይህን ቀረጻ አጥፋ' : 'Delete Recording'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>{isAm ? 'ይህን ቀረጻ አጥፋ' : 'Delete Recording'}</span>
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
                    <span>{isAm ? 'በቪዲዮዎች እይ' : 'Open in My Videos'}</span>
                  </button>
                )}

                <a
                  href={recordedVideoUrl || undefined}
                  download={`EthioExams-Live-${selectedClass.subject.replace(/\s+/g, '_')}-${Date.now()}.webm`}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAm ? 'ቪዲዮውን አውርድ' : 'Download Video'}</span>
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
