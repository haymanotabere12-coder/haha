import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Bookmark, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  PlusCircle, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw,
  Tv,
  ListFilter,
  Eye,
  Check,
  Film,
  UploadCloud,
  Youtube,
  Lock,
  Trash2,
  X,
  FileVideo,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { VideoLesson, ExamLevel, SubjectInfo, AppUser, Language, VideoMembership } from '../types';
import { getRecordedVideoUrl, saveRecordedVideoBlob, deleteRecordedVideoBlob } from '../utils/recordedVideoStorage';
import { uploadRecordedVideoToServer } from '../utils/liveStreamService';

interface VideoLearningViewProps {
  videoLessons: VideoLesson[];
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  currentUser?: AppUser | null;
  membership?: VideoMembership | null;
  onRequestVideoAccess?: (videoId: string) => Promise<boolean>;
  onOpenVideoUpgradeModal?: () => void;
  onRefreshMembership?: () => Promise<void> | void;
  onOpenPersonalTutor?: () => void;
  onAddVideoLesson?: (video: VideoLesson) => void;
  onDeleteVideoLesson?: (videoId: string) => void;
  onRecordVideoView?: (videoId: string) => void;
  onGenerateQuizFromVideo: (video: VideoLesson) => void;
  initialFilterTab?: 'All' | 'My Videos' | 'Saved';
  initialSelectedVideoId?: string;
  language?: Language;
}

// Parse time format "03:15" or "01:20:45" to total seconds for seek
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

// Robust YouTube ID extractor from full URL, shorts, youtu.be, or raw ID
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const str = input.trim();
  // If it's already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  // Standard regex for youtube.com, youtu.be, shorts, embeds
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = str.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export const VideoLearningView: React.FC<VideoLearningViewProps> = ({
  videoLessons,
  selectedLevel,
  subjects,
  currentUser,
  membership,
  onRequestVideoAccess,
  onOpenVideoUpgradeModal,
  onRefreshMembership,
  onOpenPersonalTutor,
  onAddVideoLesson,
  onDeleteVideoLesson,
  onRecordVideoView,
  onGenerateQuizFromVideo,
  initialFilterTab,
  initialSelectedVideoId,
  language = 'en',
}) => {
  const isAm = language === 'am';

  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';
  const canUploadVideo = currentUser?.role === 'admin' || currentUser?.role === 'teacher';
  const isPendingVideoApproval = isStudent && membership?.videoPlan === 'pending_approval';
  const isPremiumVideos = !isStudent || membership?.videoPlan === 'premium';
  const unlockedVideoIds = membership?.freeVideosUnlockedIds || [];
  const freeVideosRemaining = isPremiumVideos ? 999 : Math.max(0, 2 - unlockedVideoIds.length);
  const [activeFilterTab, setActiveFilterTab] = useState<'All' | 'My Videos' | 'Saved'>(initialFilterTab || 'All');
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson>(videoLessons[0] || null);

  const isVideoUnlocked = (videoId?: string): boolean => {
    if (!videoId) return false;
    if (isPremiumVideos) return true;
    return unlockedVideoIds.includes(videoId);
  };
  const isSelectedVideoUnlocked = isVideoUnlocked(selectedVideo?.id);

  // Real Playback Engine State (students start paused so they choose which 2 free videos to unlock)
  const [isPlaying, setIsPlaying] = useState<boolean>(() =>
    !isStudent || isVideoUnlocked(videoLessons[0]?.id)
  );
  const [playerMode, setPlayerMode] = useState<'youtube' | 'html5'>(() => {
    return videoLessons[0]?.youtubeId ? 'youtube' : 'html5';
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(1.0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>('00:00');
  const [playbackError, setPlaybackError] = useState<boolean>(false);
  const [isReadingAloud, setIsReadingAloud] = useState<boolean>(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(() => {
    return videoLessons[0]?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  });
  const [savedVideos, setSavedVideos] = useState<Record<string, boolean>>({
    'vid-calc-intro': true,
    'vid-cell-bio': true,
    'vid-1': true,
  });

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showRestrictedModal, setShowRestrictedModal] = useState<boolean>(false);
  const [uploadSourceType, setUploadSourceType] = useState<'file' | 'youtube'>('file');

  // New Video Form state
  const [newVideoTitle, setNewVideoTitle] = useState<string>('');
  const [newSubjectId, setNewSubjectId] = useState<string>(subjects[0]?.id || 'g12_physics');
  const [newLevel, setNewLevel] = useState<ExamLevel>(selectedLevel);
  const [newInstructor, setNewInstructor] = useState<string>(currentUser?.name || 'Administrator');
  const [newChapter, setNewChapter] = useState<string>('Unit Core Concepts');
  const [newDuration, setNewDuration] = useState<string>('15:00');

  // File Upload state (from device)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // YouTube Input state
  const [youtubeInput, setYoutubeInput] = useState<string>('');
  const [detectedYoutubeId, setDetectedYoutubeId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoPendingDelete, setVideoPendingDelete] = useState<VideoLesson | null>(null);
  const [autoplayMutedWarning, setAutoplayMutedWarning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastNonZeroVolumeRef = useRef<number>(1.0);
  const recordedViewsSessionRef = useRef<Set<string>>(new Set());

  const triggerRecordView = (videoId?: string) => {
    if (!videoId || !onRecordVideoView) return;
    if (recordedViewsSessionRef.current.has(videoId)) return;
    recordedViewsSessionRef.current.add(videoId);
    onRecordVideoView(videoId);
  };

  const sendYouTubeCommand = (func: string, args: unknown[] = []) => {
    const win = youtubeIframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
    } catch {
      // ignore cross-origin postMessage errors
    }
  };

  useEffect(() => {
    setNewLevel(selectedLevel);
  }, [selectedLevel]);

  useEffect(() => {
    const levelSubjs = subjects.filter((s) => s.level === newLevel);
    if (levelSubjs.length > 0 && !levelSubjs.some((s) => s.id === newSubjectId)) {
      setNewSubjectId(levelSubjs[0].id);
    }
  }, [newLevel, subjects]);

  const canDeleteVideo = (video: VideoLesson | null | undefined): boolean => {
    if (!video) return false;
    if (isAdmin) return true;
    if (currentUser?.role === 'teacher') return true;
    if (video.isLiveRecording || video.id.startsWith('vid-rec-') || video.id.startsWith('vid-custom-')) return true;
    if ((video as any).isRecordedByMe) return true;
    if (currentUser?.name && video.instructor?.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    return false;
  };

  useEffect(() => {
    if (initialFilterTab) {
      setActiveFilterTab(initialFilterTab);
    }
  }, [initialFilterTab]);

  useEffect(() => {
    if (initialSelectedVideoId) {
      const cleanId = initialSelectedVideoId.startsWith('vid-') ? initialSelectedVideoId : `vid-${initialSelectedVideoId}`;
      const rawId = initialSelectedVideoId.replace(/^vid-/, '');
      const match = videoLessons.find((v) => v.id === initialSelectedVideoId || v.id === cleanId || v.id === rawId);
      if (match) {
        setSelectedVideo(match);
        setPlayerMode(match.youtubeId ? 'youtube' : 'html5');
      }
    }
  }, [initialSelectedVideoId, videoLessons]);

  // Sync selected video if initial list or its real view count changes
  useEffect(() => {
    if (!selectedVideo && videoLessons.length > 0) {
      setSelectedVideo(videoLessons[0]);
      return;
    }
    if (selectedVideo) {
      const updated = videoLessons.find((v) => v.id === selectedVideo.id);
      if (updated && updated.views !== selectedVideo.views) {
        setSelectedVideo(updated);
      }
    }
  }, [videoLessons, selectedVideo]);

  // Auto-align selected video when switching to "My Videos" tab
  useEffect(() => {
    if (activeFilterTab === 'My Videos') {
      const myVids = videoLessons.filter((v) => {
        return (
          v.isLiveRecording === true ||
          (v as any).isRecordedByMe === true ||
          v.id.startsWith('vid-rec-') ||
          v.title.includes('ቀረጻ') ||
          v.instructor.toLowerCase().includes('admin') ||
          v.instructor.toLowerCase().includes('hayma') ||
          v.instructor.toLowerCase().includes('birhanu') ||
          v.instructor.toLowerCase().includes('teacher') ||
          v.instructor.toLowerCase().includes('user') ||
          v.id.startsWith('vid-custom-')
        );
      });
      if (myVids.length > 0) {
        const isCurrentInMyVideos = selectedVideo && myVids.some((mv) => mv.id === selectedVideo.id);
        if (!isCurrentInMyVideos) {
          setSelectedVideo(myVids[0]);
          setPlayerMode(myVids[0].youtubeId ? 'youtube' : 'html5');
        }
      }
    }
  }, [activeFilterTab, videoLessons]);

  // Keep activeVideoUrl in sync with selected video
  useEffect(() => {
    let isCancelled = false;
    if (selectedVideo) {
      setPlaybackError(false);
      if (selectedVideo.isLiveRecording || !selectedVideo.youtubeId) {
        setPlayerMode('html5');
      } else {
        setPlayerMode('youtube');
      }
      const resolveUrl = async () => {
        let url = typeof window !== 'undefined' ? (window as any).__ETHIO_RECORDED_VIDEOS?.[selectedVideo.id] : null;
        const isManagedVideo =
          selectedVideo.isLiveRecording ||
          selectedVideo.id.startsWith('vid-rec-') ||
          selectedVideo.id.startsWith('vid-custom-') ||
          selectedVideo.id.startsWith('vid-admin-');

        if (!url && isManagedVideo) {
          url = await getRecordedVideoUrl(selectedVideo.id);
        }
        if (!url || (url.startsWith('/api/recordings/stream/') && selectedVideo.videoUrl && !selectedVideo.videoUrl.startsWith('blob:'))) {
          if (selectedVideo.videoUrl && !selectedVideo.videoUrl.startsWith('blob:')) {
            url = selectedVideo.videoUrl;
          }
        }
        if (!url && !selectedVideo.isLiveRecording && !selectedVideo.youtubeId) {
          url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        }

        if (!isCancelled && url) {
          setActiveVideoUrl(url);
          setAutoplayMutedWarning(false);
          if (videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.volume = volumeLevel;
            videoRef.current.load();
            if (isVideoUnlocked(selectedVideo.id)) {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            } else {
              setIsPlaying(false);
            }
          }
        }
      };
      resolveUrl();
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedVideo]);

  // When YouTube input changes, auto-extract clean ID
  useEffect(() => {
    if (uploadSourceType === 'youtube' && youtubeInput) {
      const extracted = extractYouTubeId(youtubeInput);
      setDetectedYoutubeId(extracted);
    } else {
      setDetectedYoutubeId(null);
    }
  }, [youtubeInput, uploadSourceType]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedVideos((prev) => {
      const next = !prev[id];
      triggerToast(next ? 'Saved video to bookmarks' : 'Removed from bookmarks');
      return { ...prev, [id]: next };
    });
  };

  // Text-To-Speech voice narration of lesson content & key examination points
  const handleToggleTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      triggerToast(isAm ? 'በዚህ አሳሽ ውስጥ የድምፅ ንባብ አልተደገፈም' : 'Speech synthesis not supported in this browser');
      return;
    }
    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      triggerToast(isAm ? 'የድምፅ ንባብ ቆሟል' : 'Voice lecture paused');
      return;
    }
    window.speechSynthesis.cancel();
    const textToRead = [
      `Lesson: ${selectedVideo.title}.`,
      `Subject: ${selectedVideo.subject}.`,
      `Instructor: ${selectedVideo.instructor}.`,
      selectedVideo.chapter ? `Chapter: ${selectedVideo.chapter}.` : '',
      selectedVideo.summaryNotes || '',
      'Key Examination Takeaways:',
      ...(selectedVideo.keyTakeaways || []),
    ].filter(Boolean).join(' ');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsReadingAloud(false);
    utterance.onerror = () => setIsReadingAloud(false);

    window.speechSynthesis.speak(utterance);
    setIsReadingAloud(true);
    triggerToast(isAm ? '🔊 የትምህርቱ ማብራሪያ በድምፅ እየተነበበ ነው' : '🔊 Reading lecture notes aloud');
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVideo]);

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, Math.round(newVol * 100) / 100));
    if (clamped > 0) {
      lastNonZeroVolumeRef.current = clamped;
    }
    setVolumeLevel(clamped);
    const shouldMute = clamped === 0;
    setIsMuted(shouldMute);
    setAutoplayMutedWarning(false);

    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = shouldMute;
    }
    if (playerMode === 'youtube') {
      sendYouTubeCommand('setVolume', [Math.round(clamped * 100)]);
      sendYouTubeCommand(shouldMute ? 'mute' : 'unMute');
    }
  };

  const handleStepVolume = (delta: number) => {
    const base = isMuted ? 0 : volumeLevel;
    handleVolumeChange(base + delta);
  };

  const ensureVideoAccessOrPrompt = async (videoId?: string): Promise<boolean> => {
    if (!videoId) return false;
    if (isVideoUnlocked(videoId)) return true;
    if (!onRequestVideoAccess) return true;
    const allowed = await onRequestVideoAccess(videoId);
    if (!allowed) {
      setIsPlaying(false);
      if (!isPendingVideoApproval) {
        onOpenVideoUpgradeModal?.();
      }
      return false;
    }
    return true;
  };

  const handleTogglePlay = async () => {
    if (!isSelectedVideoUnlocked) {
      const ok = await ensureVideoAccessOrPrompt(selectedVideo?.id);
      if (!ok) return;
    }
    if (playerMode === 'youtube') {
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);
      sendYouTubeCommand(nextPlaying ? 'playVideo' : 'pauseVideo');
      if (nextPlaying) {
        triggerRecordView(selectedVideo?.id);
      }
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const targetVol = isMuted ? 0 : (volumeLevel > 0 ? volumeLevel : lastNonZeroVolumeRef.current);
      video.muted = isMuted;
      video.volume = targetVol > 0 ? targetVol : 1.0;
      video.play().then(() => {
        setIsPlaying(true);
        setAutoplayMutedWarning(false);
      }).catch((err) => {
        console.warn('Autoplay restricted without gesture/audio:', err);
        video.muted = true;
        setIsMuted(true);
        setAutoplayMutedWarning(true);
        video.play().then(() => {
          setIsPlaying(true);
          triggerToast(isAm ? 'ድምፅ ለመስማት የድምፅ ምልክቱን ይጫኑ' : 'Click unmute to enable audio');
        }).catch(() => setIsPlaying(false));
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    const restoreVol =
      volumeLevel > 0
        ? volumeLevel
        : lastNonZeroVolumeRef.current > 0
          ? lastNonZeroVolumeRef.current
          : 1.0;

    setIsMuted(nextMuted);
    setAutoplayMutedWarning(false);
    if (!nextMuted && volumeLevel === 0) {
      setVolumeLevel(restoreVol);
    }

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = restoreVol;
      }
    }
    if (playerMode === 'youtube') {
      if (nextMuted) {
        sendYouTubeCommand('mute');
      } else {
        sendYouTubeCommand('unMute');
        sendYouTubeCommand('setVolume', [Math.round(restoreVol * 100)]);
      }
    }
    triggerToast(nextMuted ? (isAm ? 'ድምፅ ተዘግቷል' : 'Audio Muted') : (isAm ? 'ድምፅ ተከፍቷል' : 'Audio Unmuted'));
  };

  const handleVideoError = async () => {
    console.warn('Video failed to load source:', activeVideoUrl);
    if (selectedVideo?.isLiveRecording || selectedVideo?.id?.startsWith('vid-rec-')) {
      const serverStreamUrl = `/api/recordings/stream/${selectedVideo.id}`;
      if (activeVideoUrl !== serverStreamUrl) {
        setActiveVideoUrl(serverStreamUrl);
        setPlaybackError(false);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }, 150);
        return;
      }
      setPlaybackError(true);
      triggerToast(isAm ? 'የተቀዳው ቪዲዮ በመጫን ላይ ነው፤ እባክዎ "ዳግም ሞክር" የሚለውን ይጫኑ።' : 'Recording is loading, please click retry.');
      return;
    }
    const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    if (activeVideoUrl !== fallbackUrl) {
      setActiveVideoUrl(fallbackUrl);
      triggerToast(isAm ? 'የተጠባባቂ ትምህርት ቪዲዮ ተከፍቷል' : 'Backup educational video stream opened');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }, 300);
    }
  };

  const handleJumpToTimestamp = (timeStr: string, label: string) => {
    setCurrentTimeFormatted(timeStr);
    const seconds = parseTimeToSeconds(timeStr);
    if (playerMode === 'html5' && videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (playerMode === 'youtube') {
      sendYouTubeCommand('seekTo', [seconds, true]);
      sendYouTubeCommand('playVideo');
      setIsPlaying(true);
    }
    triggerToast(`ወደ ተመረጠው ርዕስ ተሸጋግሯል: ${label} (${timeStr})`);
  };

  const handleSelectVideo = async (video: VideoLesson) => {
    setSelectedVideo(video);
    setPlaybackError(false);
    setAutoplayMutedWarning(false);
    setCurrentTimeFormatted('00:00');

    const canWatch = await ensureVideoAccessOrPrompt(video.id);
    if (!canWatch) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    // If it's a live recording, custom uploaded file, or missing youtubeId, default to HTML5 direct player
    if (video.isLiveRecording || !video.youtubeId) {
      setPlayerMode('html5');
      let url = typeof window !== 'undefined' ? (window as any).__ETHIO_RECORDED_VIDEOS?.[video.id] : null;
      const isManagedVideo =
        video.isLiveRecording ||
        video.id.startsWith('vid-rec-') ||
        video.id.startsWith('vid-custom-') ||
        video.id.startsWith('vid-admin-');
      if (!url && isManagedVideo) {
        url = await getRecordedVideoUrl(video.id);
      }
      if (!url || (url.startsWith('/api/recordings/stream/') && video.videoUrl && !video.videoUrl.startsWith('blob:'))) {
        if (video.videoUrl && !video.videoUrl.startsWith('blob:')) {
          url = video.videoUrl;
        }
      }
      if (!url && !video.isLiveRecording) {
        url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      }
      if (url) {
        setActiveVideoUrl(url);
      }
    } else {
      setPlayerMode('youtube');
    }

    // Trigger video playback attempt preserving user's chosen volume
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        videoRef.current.volume = volumeLevel > 0 ? volumeLevel : lastNonZeroVolumeRef.current;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }, 150);
  };

  // Handle local video file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const looksLikeVideo =
      file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|ogv|m4v)$/i.test(file.name);
    if (!looksLikeVideo) {
      triggerToast('Please select a valid video file (MP4, WebM, MOV, etc.)');
      return;
    }

    if (selectedFileUrl && selectedFileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedFileUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setSelectedFileUrl(objectUrl);

    // Auto-populate title if empty
    if (!newVideoTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setNewVideoTitle(cleanName);
    }

    // Auto-populate duration estimate
    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration && !isNaN(tempVideo.duration)) {
        const mins = Math.floor(tempVideo.duration / 60);
        const secs = Math.floor(tempVideo.duration % 60);
        setNewDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    triggerToast(`Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
  };

  const handleOpenUploadModal = () => {
    if (!canUploadVideo) {
      setShowRestrictedModal(true);
      return;
    }
    setShowUploadModal(true);
  };

  // Submission handler for Teacher / Admin video upload (persisted in IndexedDB + server)
  const handleUploadVideo = async () => {
    if (isUploadingVideo) return;
    if (!newVideoTitle.trim()) {
      triggerToast(isAm ? 'እባክዎ የቪዲዮውን ርዕስ ያስገቡ' : 'Please enter a video title');
      return;
    }

    const selectedSubjectObj = subjects.find((s) => s.id === newSubjectId) || subjects[0];
    const newVidId = `vid-custom-${Date.now()}`;

    let finalYoutubeId: string | undefined = undefined;
    let finalVideoUrl: string | undefined = undefined;

    if (uploadSourceType === 'file') {
      if (!selectedFile || !selectedFileUrl) {
        triggerToast(isAm ? 'እባክዎ ከመሳሪያዎ የቪዲዮ ፋይል ይምረጡ' : 'Please choose a video file from your device to upload.');
        return;
      }
      setIsUploadingVideo(true);
      try {
        const localSavedUrl = await saveRecordedVideoBlob(newVidId, selectedFile);
        const serverStreamUrl = await uploadRecordedVideoToServer({
          id: newVidId,
          title: newVideoTitle.trim(),
          subject: selectedSubjectObj?.name || 'General Studies',
          instructor: newInstructor.trim() || currentUser?.name || 'Instructor',
          duration: newDuration || '15:00',
          level: newLevel,
          chapter: newChapter.trim() || 'General Topic Review',
          blob: selectedFile,
          isLiveRecording: false,
          archiveInLibrary: true,
        });
        finalVideoUrl = serverStreamUrl || localSavedUrl;
      } finally {
        setIsUploadingVideo(false);
      }
    } else {
      const extracted = extractYouTubeId(youtubeInput);
      if (!extracted) {
        triggerToast(isAm ? 'እባክዎ ትክክለኛ የYouTube ሊንክ ወይም ID ያስገቡ' : 'Please enter a valid YouTube link or video ID.');
        return;
      }
      finalYoutubeId = extracted;
    }

    const newVid: VideoLesson = {
      id: newVidId,
      title: newVideoTitle.trim(),
      level: newLevel,
      subject: selectedSubjectObj?.name || 'General Studies',
      subjectId: selectedSubjectObj?.id || 'gen',
      chapter: newChapter.trim() || 'General Topic Review',
      instructor: newInstructor.trim() || currentUser?.name || 'Instructor',
      duration: newDuration || '15:00',
      views: 0,
      youtubeId: finalYoutubeId,
      videoUrl: finalVideoUrl,
      thumbnailGradient: uploadSourceType === 'youtube' 
        ? 'from-red-950 via-rose-900 to-slate-900' 
        : 'from-sky-950 via-indigo-900 to-slate-900',
      thumbnailUrl: finalYoutubeId ? `https://img.youtube.com/vi/${finalYoutubeId}/hqdefault.jpg` : undefined,
      timestamps: [
        { time: '00:00', label: 'Lesson Introduction & Key Concepts' },
        { time: '04:30', label: 'In-Depth Theory & Ministry Traps' },
        { time: '09:15', label: 'Solved Examination Problems & Review' },
      ],
      keyTakeaways: [
        `Comprehensive lesson on ${newVideoTitle.trim()}`,
        'Core curriculum breakdown for Ethiopian standardized examinations',
        'Practical step-by-step problem walkthroughs'
      ],
      summaryNotes: `Uploaded video lecture covering ${newChapter} for ${selectedSubjectObj?.name}. Published by ${newInstructor.trim() || currentUser?.name}.`,
    };

    if (onAddVideoLesson) {
      onAddVideoLesson(newVid);
    }

    setSelectedVideo(newVid);
    setPlayerMode(uploadSourceType === 'youtube' ? 'youtube' : 'html5');
    if (finalVideoUrl) {
      setActiveVideoUrl(finalVideoUrl);
    }
    setIsPlaying(true);
    triggerToast(isAm ? `ቪዲዮ "${newVid.title}" በተሳካ ሁኔታ ተጭኗል!` : `Video "${newVid.title}" published successfully!`);

    // Reset modal
    setShowUploadModal(false);
    setNewVideoTitle('');
    setSelectedFile(null);
    setSelectedFileUrl(null);
    setYoutubeInput('');
    setDetectedYoutubeId(null);
  };

  const handleDeleteVideo = (video: VideoLesson, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVideoPendingDelete(video);
  };

  const handleConfirmDelete = async () => {
    if (!videoPendingDelete) return;
    const video = videoPendingDelete;
    const cleanId = video.id.startsWith('vid-') ? video.id : `vid-${video.id}`;
    const rawId = video.id.replace(/^vid-/, '');
    setVideoPendingDelete(null);

    // Call parent onDeleteVideoLesson
    if (onDeleteVideoLesson) {
      onDeleteVideoLesson(video.id);
      onDeleteVideoLesson(cleanId);
      onDeleteVideoLesson(rawId);
    }

    // Delete blob and cached URLs
    await deleteRecordedVideoBlob(video.id);
    await deleteRecordedVideoBlob(cleanId);
    await deleteRecordedVideoBlob(rawId);

    // Clean up localStorage
    try {
      const saved = localStorage.getItem('ethio_exam_video_lessons');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((p: any) => p.id !== video.id && p.id !== cleanId && p.id !== rawId);
        localStorage.setItem('ethio_exam_video_lessons', JSON.stringify(filtered));
      }
    } catch {}

    triggerToast(`"${video.title}" በተሳካ ሁኔታ ተሰርዟል! (Video removed)`);

    // Switch selected video if we just deleted it
    if (selectedVideo?.id === video.id || selectedVideo?.id === cleanId || selectedVideo?.id === rawId) {
      const remaining = videoLessons.filter((v) => v.id !== video.id && v.id !== cleanId && v.id !== rawId);
      if (remaining.length > 0) {
        handleSelectVideo(remaining[0]);
      } else {
        setSelectedVideo(null as any);
      }
    }
  };

  // Filter video playlist
  const displayedVideos = videoLessons.filter((v) => {
    if (activeFilterTab === 'Saved') return !!savedVideos[v.id];
    if (activeFilterTab === 'My Videos') {
      return (
        v.isLiveRecording === true ||
        (v as any).isRecordedByMe === true ||
        v.id.startsWith('vid-rec-') ||
        v.id.startsWith('vid-custom-') ||
        v.id.startsWith('vid-admin-') ||
        v.title.includes('ቀረጻ') ||
        v.instructor.toLowerCase().includes('admin') ||
        v.instructor.toLowerCase().includes('hayma') ||
        v.instructor.toLowerCase().includes('birhanu') ||
        v.instructor.toLowerCase().includes('teacher') ||
        (currentUser?.name && v.instructor.toLowerCase().includes(currentUser.name.toLowerCase()))
      );
    }
    return true; // All
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-sky-800 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-sky-600 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Video Learning Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Video Learning Center
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Direct Stream & YouTube
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Watch official lessons, step-by-step problem breakdowns, and curriculum lectures.
            </p>
          </div>
        </div>

        {/* Filter Pills + Admin Upload Button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            {(['All', 'My Videos', 'Saved'] as const).map((tab) => {
              const tabCount =
                tab === 'All'
                  ? videoLessons.length
                  : tab === 'My Videos'
                  ? videoLessons.filter(
                      (v) =>
                        v.isLiveRecording === true ||
                        (v as any).isRecordedByMe === true ||
                        v.id.startsWith('vid-rec-') ||
                        v.id.startsWith('vid-custom-') ||
                        v.id.startsWith('vid-admin-') ||
                        v.instructor.toLowerCase().includes('admin') ||
                        v.instructor.toLowerCase().includes('hayma') ||
                        v.instructor.toLowerCase().includes('birhanu') ||
                        v.instructor.toLowerCase().includes('teacher') ||
                        (currentUser?.name && v.instructor.toLowerCase().includes(currentUser.name.toLowerCase()))
                    ).length
                  : Object.keys(savedVideos).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilterTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeFilterTab === tab
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab === 'My Videos' ? (isAm ? 'የኔ ቪዲዮዎች' : 'My Videos') : tab === 'Saved' ? (isAm ? 'የተቀመጡ' : 'Saved') : (isAm ? 'ሁሉም' : 'All')}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      activeFilterTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tabCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Upload Button: Teachers & Admins can upload */}
          {canUploadVideo ? (
            <button
              onClick={handleOpenUploadModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer active:scale-95"
              id="btn-upload-video-admin"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAm ? 'ቪዲዮ ጫን' : 'Upload Video'}</span>
            </button>
          ) : (
            <button
              onClick={handleOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-200 transition shrink-0 cursor-pointer"
              title={isAm ? 'ቪዲዮ መጫን የሚችሉት መምህራን እና አስተዳዳሪዎች ብቻ ናቸው' : 'Only teachers and administrators can upload videos'}
              id="btn-upload-video-restricted"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAm ? 'ቪዲዮ ጫን' : 'Upload Video'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Student Free Video Allowance & Personal Tutor Bar */}
      {isStudent && (
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
                {isPremiumVideos ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {isAm
                    ? 'ሙሉ የቪዲዮ አባልነት ተከፍቷል — ሁሉንም ቪዲዮዎች ያለ ገደብ መመልከት ይችላሉ'
                    : 'Unlimited Video Membership Active · Watch all lessons without limits'}
                </span>
              </>
            ) : isPendingVideoApproval ? (
              <>
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-900 font-semibold">
                  {isAm
                    ? `ክፍያዎ ተልኳል (${membership?.videoPaymentRef || ''}) — የአድሚን ማረጋገጫ (Approval) በመጠባበቅ ላይ ነው`
                    : `Payment Submitted (${membership?.videoPaymentRef || ''}) · Waiting for Admin Approval to unlock all videos`}
                </span>
              </>
            ) : (
              <>
                <Lock className={`w-4 h-4 shrink-0 ${freeVideosRemaining > 0 ? 'text-sky-600' : 'text-amber-600'}`} />
                <span className="text-slate-700 font-medium">
                  {freeVideosRemaining > 0 ? (
                    isAm
                      ? `ነጻ ሙከራ፦ ${freeVideosRemaining} ከ2 ነጻ ቪዲዮዎች ቀርተውታል (ከ2 በኋላ ክፍያ እና የአድሚን ማረጋገጫ ያስፈልጋል)`
                      : `Free Student Plan · ${freeVideosRemaining} of 2 free videos remaining`
                  ) : (
                    isAm
                      ? '2ቱ ነጻ ቪዲዮዎች ተጠናቀዋል — ቀሪ ቪዲዮዎችን ለማየት ይክፈሉ እና የአድሚን ማረጋገጫ ይጠብቁ'
                      : '2 free videos used · Pay & get Admin approval to unlock all remaining videos'
                  )}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isPendingVideoApproval && onRefreshMembership && (
              <button
                type="button"
                onClick={() => onRefreshMembership()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold cursor-pointer transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAm ? 'ማረጋገጫ አድስ' : 'Check Approval'}</span>
              </button>
            )}
            {!isPremiumVideos && !isPendingVideoApproval && onOpenVideoUpgradeModal && (
              <button
                type="button"
                onClick={onOpenVideoUpgradeModal}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition"
              >
                {isAm ? 'ሁሉንም ክፈት (199 ብር)' : 'Unlock All Videos (199 ETB)'}
              </button>
            )}
            {onOpenPersonalTutor && (
              <button
                type="button"
                onClick={onOpenPersonalTutor}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer transition"
              >
                {isAm ? 'የግል አስጠኚ ይፈልጋሉ?' : 'Need a Personal Tutor?'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Video Theatre / Player & Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Video Player (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedVideo ? (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
              {/* Playable Viewport */}
              <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group">
                {!isSelectedVideoUnlocked ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-400 flex items-center justify-center">
                      {isPendingVideoApproval ? <Clock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h3 className="text-lg font-bold text-white">
                        {freeVideosRemaining > 0
                          ? isAm
                            ? 'ይህን ቪዲዮ ለመክፈት Play ይጫኑ'
                            : 'Click below to unlock this lesson'
                          : isPendingVideoApproval
                            ? isAm
                              ? 'የአድሚን ማረጋገጫ (Approval) በመጠባበቅ ላይ'
                              : 'Waiting for Admin Approval'
                            : isAm
                              ? 'የነጻ ቪዲዮ ገደብ (2 ቪዲዮ) ተጠናቋል'
                              : '2 Free Video Limit Reached'}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {freeVideosRemaining > 0
                          ? isAm
                            ? `ከ2ቱ ነጻ ቪዲዮዎች ውስጥ ${freeVideosRemaining} ቀርቶታል። ለመክፈት ከታች ይጫኑ።`
                            : `You have ${freeVideosRemaining} of 2 free video lessons remaining. Unlock this video now.`
                          : isPendingVideoApproval
                            ? isAm
                              ? `የክፍያ መለያ (${membership?.videoPaymentRef || ''}) ተልኳል። አድሚኑ ክፍያውን አይቶ Approve እስኪያደርገው ድረስ ተጨማሪ ቪዲዮዎች ተቆልፈዋል።`
                              : `Your payment (${membership?.videoPaymentRef || ''}) is under review. Videos remain locked until the Admin approves your request.`
                            : isAm
                              ? 'ሁሉንም የትምህርት ቪዲዮዎች ያለ ገደብ ለመመልከት 199 ብር ክፍያ ይፈጽሙ እና የአድሚን ማረጋገጫ ይጠብቁ።'
                              : 'You have watched your 2 free videos. Pay 199 ETB and wait for Admin approval to unlock unlimited video access.'}
                      </p>
                    </div>
                    {freeVideosRemaining > 0 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await ensureVideoAccessOrPrompt(selectedVideo.id);
                          if (ok) setIsPlaying(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{isAm ? 'በነጻ ክፈት እና አጫውት' : 'Unlock Free Video & Play'}</span>
                      </button>
                    ) : isPendingVideoApproval ? (
                      <button
                        type="button"
                        onClick={() => onRefreshMembership?.()}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>{isAm ? 'አድሚን ማጽደቁን አረጋግጥ' : 'Refresh Approval Status'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenVideoUpgradeModal?.()}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{isAm ? 'ክፍያ ፈጽም (199 ብር)' : 'Pay 199 ETB & Request Approval'}</span>
                      </button>
                    )}
                  </div>
                ) : playerMode === 'youtube' && selectedVideo.youtubeId ? (
                  <div className="w-full h-full relative">
                    <iframe
                      ref={youtubeIframeRef}
                      key={selectedVideo.id}
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=${isPlaying ? '1' : '0'}&enablejsapi=1&rel=0&modestbranding=1`}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => {
                        const targetVol = isMuted ? 0 : Math.round(volumeLevel * 100);
                        sendYouTubeCommand('setVolume', [targetVol]);
                        sendYouTubeCommand(isMuted ? 'mute' : 'unMute');
                        if (isPlaying) {
                          triggerRecordView(selectedVideo.id);
                        }
                      }}
                      className="w-full h-full border-0"
                    />
                    {/* YouTube help banner */}
                    <div className="absolute top-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200 flex items-center justify-between gap-2 z-10">
                      <span className="truncate text-[11px]">
                        {isAm
                          ? '💡 ቪዲዮው ድምፅ ከሌለው ወይም ካልተጫወተ ወደ ቀጥታ ማጫወቻ ይቀይሩ፦'
                          : '💡 If video is silent or cannot play, switch to direct player:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerMode('html5');
                          setTimeout(() => {
                            if (videoRef.current) {
                              const targetVol = volumeLevel > 0 ? volumeLevel : lastNonZeroVolumeRef.current;
                              videoRef.current.muted = isMuted;
                              videoRef.current.volume = targetVol > 0 ? targetVol : 1.0;
                              videoRef.current.play().catch(console.warn);
                            }
                          }, 150);
                        }}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shrink-0 transition cursor-pointer shadow-xs"
                      >
                        {isAm ? 'ቀጥታ በድምፅ አጫውት' : 'Direct Audio & Video'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      key={selectedVideo.id}
                      src={activeVideoUrl || undefined}
                      controls
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => {
                        const el = e.currentTarget;
                        el.volume = volumeLevel > 0 ? volumeLevel : lastNonZeroVolumeRef.current;
                        el.muted = isMuted;
                      }}
                      onVolumeChange={(e) => {
                        const el = e.currentTarget;
                        if (el.volume > 0) {
                          lastNonZeroVolumeRef.current = el.volume;
                        }
                        setIsMuted(el.muted || el.volume === 0);
                        setVolumeLevel(el.volume);
                      }}
                      onPlay={() => {
                        setIsPlaying(true);
                        triggerRecordView(selectedVideo.id);
                      }}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      onError={handleVideoError}
                      className="w-full h-full object-contain"
                    />

                    {/* Big Centered Play Button when paused */}
                    {!isPlaying && (
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-sky-600/90 hover:bg-sky-500 text-white flex flex-col items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95 cursor-pointer z-20 backdrop-blur-xs border-2 border-white/40"
                        title={isAm ? 'ቪዲዮውን አጫውት' : 'Play Video'}
                      >
                        <Play className="w-9 h-9 fill-current ml-1" />
                        <span className="text-[10px] font-black mt-0.5">{isAm ? 'አጫውት' : 'Play'}</span>
                      </button>
                    )}

                    {/* Prominent Center Unmute Callout ONLY when browser autoplay forced mute */}
                    {autoplayMutedWarning && isMuted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none p-4">
                        <button
                          type="button"
                          onClick={() => {
                            const restoreVol = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1.0;
                            if (videoRef.current) {
                              videoRef.current.muted = false;
                              videoRef.current.volume = restoreVol;
                              setIsMuted(false);
                              setVolumeLevel(restoreVol);
                              setAutoplayMutedWarning(false);
                              videoRef.current.play().catch(() => {});
                              triggerToast(isAm ? '🔊 ድምፅ ተከፍቷል' : '🔊 Sound Unmuted');
                            }
                          }}
                          className="pointer-events-auto px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl border-2 border-white/60 animate-bounce cursor-pointer transition transform hover:scale-105"
                          title={isAm ? 'ድምፅ ክፈት' : 'Click to unmute sound'}
                        >
                          <VolumeX className="w-5 h-5 animate-pulse" />
                          <span>{isAm ? '🔊 ድምፅ ክፈት' : '🔊 Unmute Audio'}</span>
                        </button>
                      </div>
                    )}

                    {/* Playback Error recovery badge */}
                    {playbackError && (
                      <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between gap-2 z-20">
                        <div className="flex items-center gap-1.5 truncate">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">{isAm ? 'የተጠባባቂ ትምህርት ቪዲዮ ተከፍቷል' : 'Backup Lesson Stream Active'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPlaybackError(false);
                            if (videoRef.current) {
                              videoRef.current.load();
                              videoRef.current.play().catch(console.warn);
                            }
                          }}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                        >
                          {isAm ? 'ዳግም ሞክር' : 'Retry'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Playback Controls & Mode Toggles */}
              <div className="p-3.5 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Direct Play/Pause Button */}
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isPlaying
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                    title={isPlaying ? (isAm ? 'ቪዲዮውን አቁም' : 'Pause') : (isAm ? 'ቪዲዮውን አጫውት' : 'Play')}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>{isAm ? 'አቁም' : 'Pause'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isAm ? 'አጫውት' : 'Play'}</span>
                      </>
                    )}
                  </button>

                  {/* Mute toggle, - / + Volume Buttons & Volume Slider (works for both HTML5 & YouTube) */}
                  <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 shadow-sm">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                      title={isMuted ? (isAm ? 'ድምፅ ክፈት' : 'Unmute') : (isAm ? 'ድምፅ ዝጋ' : 'Mute')}
                    >
                      {isMuted || volumeLevel === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepVolume(-0.1)}
                      className="w-6 h-6 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-black text-xs flex items-center justify-center transition cursor-pointer"
                      title={isAm ? 'ድምፅ ቀንስ (-10%)' : 'Decrease Volume (-10%)'}
                      aria-label="Decrease volume"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volumeLevel}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 sm:w-24 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      title={isAm ? `የድምፅ መጠን፦ ${Math.round((isMuted ? 0 : volumeLevel) * 100)}%` : `Volume: ${Math.round((isMuted ? 0 : volumeLevel) * 100)}%`}
                      aria-label="Volume"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepVolume(0.1)}
                      className="w-6 h-6 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-black text-xs flex items-center justify-center transition cursor-pointer"
                      title={isAm ? 'ድምፅ ጨምር (+10%)' : 'Increase Volume (+10%)'}
                      aria-label="Increase volume"
                    >
                      +
                    </button>
                    <span className="text-[10px] font-mono font-bold text-slate-300 min-w-[32px] text-right">
                      {isMuted ? '0%' : `${Math.round(volumeLevel * 100)}%`}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-400 font-mono font-bold text-[11px] border border-sky-500/30">
                    {selectedVideo.subject}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {isAm ? 'የቪዲዮው ርዝመት፦' : 'Duration:'} <strong className="text-white font-mono">{selectedVideo.duration}</strong>
                  </span>
                  {selectedVideo.isLiveRecording && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      <span>{isAm ? 'የቀጥታ ትምህርት ቀረጻ' : 'Live Recording'}</span>
                    </span>
                  )}
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 text-[11px]">{isAm ? 'ማጫወቻ፦' : 'Player:'}</span>
                  <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerMode('html5');
                        setTimeout(() => {
                          if (videoRef.current) {
                            videoRef.current.play().catch(console.warn);
                          }
                        }, 100);
                      }}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition flex items-center gap-1 ${
                        playerMode === 'html5' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileVideo className="w-3 h-3" />
                      <span>{isAm ? 'ቀጥታ ማጫወቻ' : 'Direct Player'}</span>
                    </button>

                    {selectedVideo.youtubeId && (
                      <button
                        type="button"
                        onClick={() => setPlayerMode('youtube')}
                        className={`px-2.5 py-1 rounded font-bold cursor-pointer transition flex items-center gap-1 ${
                          playerMode === 'youtube' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Youtube className="w-3 h-3" />
                        <span>YouTube</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSave(selectedVideo.id)}
                    className={`p-1.5 rounded-lg border cursor-pointer transition ${
                      savedVideos[selectedVideo.id]
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Bookmark Lesson"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Video Details & AI Retention Quiz Button */}
              <div className="p-5 bg-white border-t border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {selectedVideo.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAm ? 'መምህር፦' : 'Instructor:'}{' '}
                      <strong className="text-slate-800">{selectedVideo.instructor}</strong> • {selectedVideo.chapter} •{' '}
                      <span className="font-semibold text-slate-700">
                        {isAm
                          ? (selectedVideo.views || 0) === 1
                            ? '1 ሰው ተመልክቶታል'
                            : `${(selectedVideo.views || 0).toLocaleString()} ሰዎች ተመልክተውታል`
                          : (selectedVideo.views || 0) === 1
                            ? '1 view'
                            : `${(selectedVideo.views || 0).toLocaleString()} views`}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {canDeleteVideo(selectedVideo) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(selectedVideo)}
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title={isAm ? 'ይህን ቪዲዮ ከስርዓቱ ሰርዝ' : 'Delete this video'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>{isAm ? 'ቪዲዮውን አጥፋ' : 'Delete Video'}</span>
                      </button>
                    )}

                    {/* Voice Lecture TTS Button */}
                    <button
                      type="button"
                      onClick={handleToggleTTS}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                        isReadingAloud
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title={isAm ? 'የትምህርቱን ማብራሪያ በድምፅ ያዳምጡ' : 'Listen to lecture voice read-aloud'}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isReadingAloud ? 'animate-bounce' : 'text-emerald-100'}`} />
                      <span>{isReadingAloud ? (isAm ? 'ድምፅ አቁም' : 'Stop Voice') : (isAm ? '🔊 በድምፅ አድምጥ' : '🔊 Listen Aloud')}</span>
                    </button>

                    <button
                      onClick={() => onGenerateQuizFromVideo(selectedVideo)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Generate AI Quiz from Lesson</span>
                    </button>
                  </div>
                </div>

                {/* Key Takeaways */}
                {selectedVideo.keyTakeaways && Array.isArray(selectedVideo.keyTakeaways) && selectedVideo.keyTakeaways.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Lesson Key Takeaways</span>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedVideo.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-sky-600 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500">
              <Film className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-800">No video selected</p>
              <p className="text-xs text-slate-500 mt-1">Please pick a lesson from the playlist.</p>
            </div>
          )}

          {/* Chapter Markers & Timestamps */}
          {selectedVideo && Array.isArray(selectedVideo.timestamps) && selectedVideo.timestamps.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Chapter Timeline & Interactive Markers</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedVideo.timestamps.map((ts, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpToTimestamp(ts.time, ts.label)}
                    className="text-left p-3 rounded-xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 flex items-center justify-between text-xs text-slate-700 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[11px] font-bold">
                        {ts.time}
                      </span>
                      <span className="group-hover:text-sky-950 font-medium truncate max-w-[180px]">
                        {ts.label}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video Playlist Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Course Playlist ({displayedVideos.length})
            </h3>
            <span className="text-xs text-slate-500">Tap to watch</span>
          </div>

          <div className="space-y-3">
            {displayedVideos.map((video) => {
              const isCurrent = selectedVideo?.id === video.id;
              const isSaved = !!savedVideos[video.id];

              return (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  className={`p-3 rounded-2xl border transition flex items-center gap-3 cursor-pointer group relative ${
                    isCurrent
                      ? 'bg-sky-50/90 border-sky-400 shadow-xs ring-1 ring-sky-400/40'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Thumbnail box */}
                  <div className={`relative w-28 h-20 rounded-xl bg-gradient-to-tr ${video.thumbnailGradient || 'from-sky-950 to-indigo-900'} shrink-0 overflow-hidden flex items-center justify-center shadow-xs`}>
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition"></div>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-md ${
                      isCurrent ? 'bg-sky-600 text-white scale-110' : 'bg-black/60 text-white group-hover:bg-sky-600'
                    }`}>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white">
                      {video.duration}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                      isCurrent ? 'text-sky-950 font-black' : 'text-slate-900 group-hover:text-sky-700'
                    }`}>
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {video.duration} • <span className="font-semibold text-slate-700">{video.subject}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-[10px] text-slate-400 truncate">
                        {video.instructor}
                      </p>
                      {!isVideoUnlocked(video.id) && freeVideosRemaining === 0 && (
                        <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{isAm ? 'ክፍያ' : 'Pro'}</span>
                        </span>
                      )}
                      {video.isLiveRecording ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-black border border-rose-200 flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                          <span>🔴 Live REC</span>
                        </span>
                      ) : video.youtubeId ? (
                        <span className="text-[9px] px-1 rounded bg-red-100 text-red-700 font-semibold shrink-0">
                          YT
                        </span>
                      ) : (
                        <span className="text-[9px] px-1 rounded bg-sky-100 text-sky-700 font-semibold shrink-0">
                          Direct
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Bookmark + Admin Delete) */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => toggleSave(video.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer"
                      title="Bookmark"
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>

                    {canDeleteVideo(video) && (
                      <button
                        onClick={(e) => handleDeleteVideo(video, e)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 cursor-pointer transition"
                        title={isAm ? 'ይህን ቪዲዮ አጥፋ' : 'Delete Video'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {displayedVideos.length === 0 && (
              <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-2.5 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Film className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {activeFilterTab === 'My Videos'
                    ? (isAm ? 'በ "My Videos" ስር የተቀመጠ ቪዲዮ የለም' : 'No videos under "My Videos"')
                    : activeFilterTab === 'Saved'
                    ? (isAm ? 'ምንም የተቀመጠ ቪዲዮ የለም' : 'No saved bookmarks')
                    : (isAm ? 'ምንም ቪዲዮ አልተገኘም' : 'No videos found')}
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {activeFilterTab === 'My Videos'
                    ? (isAm ? 'በቀጥታ የትምህርት ክፍለ-ጊዜ ውስጥ የቀረጹዋቸው ትምህርቶች እዚህ "My Videos" ስር ይገኛሉ!' : 'Classes recorded during live sessions appear here under "My Videos"!')
                    : (isAm ? 'እባክዎ የተለየ ማጣሪያ ይምረጡ።' : 'Please select another subject or search term.')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RESTRICTED ACCESS MODAL (Shown when non-admin tries to upload)      */}
      {/* ------------------------------------------------------------------ */}
      {showRestrictedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {isAm ? 'የመምህር ወይም የአስተዳዳሪ ፈቃድ ያስፈልጋል' : 'Teacher / Admin Permission Required'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAm
                  ? 'የቪዲዮ ትምህርቶችን መጫን የሚችሉት መምህራን እና አስተዳዳሪዎች ብቻ ናቸው።'
                  : 'Video lecture uploading is available for Teacher and Administrator accounts.'}
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-['Noto_Sans_Ethiopic'] leading-relaxed">
                {isAm
                  ? 'የቪዲዮ ትምህርቶችን ከኮምፒውተር፣ ከስልክ ወይም ከ YouTube ማከል የሚችሉት መምህራንና አስተዳዳሪዎች ናቸው።'
                  : 'Please sign in as a Teacher or Admin to upload video lessons.'}
              </div>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setShowRestrictedModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                {isAm ? 'እሺ ገብቶኛል' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TEACHER / ADMIN VIDEO UPLOAD MODAL (Device File OR YouTube Import) */}
      {/* ------------------------------------------------------------------ */}
      {showUploadModal && canUploadVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isAm ? 'የቪዲዮ ትምህርት ጫን' : 'Upload & Publish Video Lesson'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAm ? 'ከመሳሪያዎ ቪዲዮ ይጫኑ ወይም ከYouTube ያስመጡ' : 'Direct Device Video Upload or YouTube Import (Teachers & Admins)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Selector Tabs: Device File vs YouTube */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setUploadSourceType('file')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  uploadSourceType === 'file'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isAm ? 'ከመሳሪያችን ጫን' : 'Upload from Device'}</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSourceType('youtube')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  uploadSourceType === 'youtube'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>{isAm ? 'ከዩቲዩብ አስመጣ' : 'Import from YouTube'}</span>
              </button>
            </div>

            {/* SOURCE A: DIRECT DEVICE FILE UPLOAD */}
            {uploadSourceType === 'file' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.ogg,.m4v"
                  onChange={handleFileChange}
                  className="hidden"
                  id="direct-video-file-input"
                />

                {!selectedFileUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/80 rounded-2xl p-6 text-center space-y-2.5 transition cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-2xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {isAm ? 'የቪዲዮ ፋይል ከመሳሪያዎ ለመምረጥ እዚህ ይጫኑ' : 'Click to select video file from your computer or phone'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isAm ? 'የሚደገፉ ቅርጸቶች፦ MP4, WebM, MOV, OGG' : 'Supports MP4, WebM, MOV, OGG'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-700 text-xs font-bold shadow-2xs hover:bg-sky-100 transition"
                    >
                      Browse Device Files
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-sky-700" />
                        <span className="text-xs font-bold text-slate-900 truncate max-w-xs">
                          {selectedFile?.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setSelectedFileUrl(null);
                        }}
                        className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>

                    {/* Real preview inside modal */}
                    <div className="aspect-video w-full rounded-xl bg-black overflow-hidden shadow-inner">
                      <video
                        src={selectedFileUrl || undefined}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready to play directly with HTML5 direct video player!</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SOURCE B: IMPORT FROM YOUTUBE */}
            {uploadSourceType === 'youtube' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    YouTube Video Link or Video ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/watch?v=kKKM8Y-u7ds or kKKM8Y-u7ds"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono"
                    />
                    <Youtube className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Paste any YouTube URL (watch, youtu.be, shorts) or 11-digit video code.
                  </p>
                </div>

                {/* Detected ID Preview */}
                {detectedYoutubeId ? (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${detectedYoutubeId}/hqdefault.jpg`}
                      alt="YouTube Thumbnail Preview"
                      className="w-24 h-16 rounded-lg object-cover bg-black border border-red-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Valid YouTube ID Detected:</span>
                      </div>
                      <code className="text-xs font-mono font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
                        {detectedYoutubeId}
                      </code>
                      <p className="text-[10px] text-slate-500">
                        Will be embedded with fast, ad-free player.
                      </p>
                    </div>
                  </div>
                ) : youtubeInput ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Please enter a valid YouTube video address or 11-digit code.</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* General Lesson Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Video Lesson Title *
                </label>
                <input
                  type="text"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder="e.g. Grade 12 Physics: Electromagnetism & Induced EMF"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Subject *
                </label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Grade / Level
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as ExamLevel)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
                >
                  <option value="grade_12_natural">Grade 12 Natural Science (ESSLCE)</option>
                  <option value="grade_12_social">Grade 12 Social Science (ESSLCE)</option>
                  <option value="grade_8">Grade 8 Ministry Exam</option>
                  <option value="university_exit">University Exit Exam</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={newInstructor}
                  onChange={(e) => setNewInstructor(e.target.value)}
                  placeholder="e.g. Ustaz Jemal / Dr. Kebede"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="e.g. 18:30"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chapter / Topic Description
                </label>
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  placeholder="e.g. Unit 4: Magnetic Flux and Faraday's Law"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadVideo}
                disabled={isUploadingVideo}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isUploadingVideo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isAm ? 'ቪዲዮውን በመጫን ላይ...' : 'Uploading Video...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isAm ? 'ቪዲዮውን ጫን' : 'Publish Lesson to Platform'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {videoPendingDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {isAm ? 'ቪዲዮውን ማጥፋት ይፈልጋሉ?' : 'Delete This Video?'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {isAm ? 'የቪዲዮ ስረዛ ማረጋገጫ' : 'Delete Video Confirmation'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 line-clamp-2">
                {videoPendingDelete.title}
              </div>
              <div className="text-slate-500 flex items-center gap-2 text-[11px] font-mono flex-wrap">
                <span className="font-bold text-sky-700 px-1.5 py-0.5 rounded bg-sky-50">{videoPendingDelete.subject}</span>
                <span>•</span>
                <span>{isAm ? `ርዝመት፦ ${videoPendingDelete.duration}` : `Duration: ${videoPendingDelete.duration}`}</span>
                <span>•</span>
                <span>{isAm ? `መምህር፦ ${videoPendingDelete.instructor}` : `Instructor: ${videoPendingDelete.instructor}`}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isAm
                ? 'ይህ ቪዲዮ ከስርዓቱና ከቪዲዮ ዝርዝር ውስጥ ሙሉ በሙሉ ይሰረዛል። ይህን እርምጃ መመለስ አይቻልም። በእርግጥ ማጥፋት ይፈልጋሉ?'
                : 'This video will be permanently removed from the system and video lessons list. This action cannot be undone. Are you sure you want to delete it?'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVideoPendingDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                {isAm ? 'ተመለስ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAm ? 'አዎ፣ አጥፋ' : 'Delete Video'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
