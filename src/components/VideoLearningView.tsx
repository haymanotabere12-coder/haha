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
import { VideoLesson, ExamLevel, SubjectInfo, AppUser } from '../types';
import { getRecordedVideoUrl, deleteRecordedVideoBlob } from '../utils/recordedVideoStorage';

interface VideoLearningViewProps {
  videoLessons: VideoLesson[];
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  currentUser?: AppUser | null;
  onAddVideoLesson?: (video: VideoLesson) => void;
  onDeleteVideoLesson?: (videoId: string) => void;
  onGenerateQuizFromVideo: (video: VideoLesson) => void;
  initialFilterTab?: 'All' | 'My Videos' | 'Saved';
  initialSelectedVideoId?: string;
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
  onAddVideoLesson,
  onDeleteVideoLesson,
  onGenerateQuizFromVideo,
  initialFilterTab,
  initialSelectedVideoId,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [activeFilterTab, setActiveFilterTab] = useState<'All' | 'My Videos' | 'Saved'>(initialFilterTab || 'All');
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson>(videoLessons[0] || null);
  
  // Real Playback Engine State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
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
  const [newSubjectId, setNewSubjectId] = useState<string>(subjects[0]?.id || 'phy12');
  const [newLevel, setNewLevel] = useState<ExamLevel>(selectedLevel);
  const [newInstructor, setNewInstructor] = useState<string>(currentUser?.name || 'Administrator');
  const [newChapter, setNewChapter] = useState<string>('Unit Core Concepts');
  const [newDuration, setNewDuration] = useState<string>('15:00');

  // File Upload state (from device)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // YouTube Input state
  const [youtubeInput, setYoutubeInput] = useState<string>('');
  const [detectedYoutubeId, setDetectedYoutubeId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoPendingDelete, setVideoPendingDelete] = useState<VideoLesson | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Sync selected video if initial list changes
  useEffect(() => {
    if (!selectedVideo && videoLessons.length > 0) {
      setSelectedVideo(videoLessons[0]);
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
        if (!url && (selectedVideo.isLiveRecording || selectedVideo.id.startsWith('vid-rec-'))) {
          url = await getRecordedVideoUrl(selectedVideo.id);
        }
        if (!url) {
          url = selectedVideo.videoUrl;
        }
        if (!url && !selectedVideo.isLiveRecording && !selectedVideo.youtubeId) {
          url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        }

        if (!isCancelled && url) {
          setActiveVideoUrl(url);
          setIsMuted(false);
          if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
            videoRef.current.load();
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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
      triggerToast('በዚህ አሳሽ ውስጥ የድምፅ ንባብ (Speech) አልተደገፈም');
      return;
    }
    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      triggerToast('የድምፅ ንባብ ቆሟል (Voice lecture paused)');
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
    triggerToast('🔊 የትምህርቱ ማብራሪያ በድምፅ እየተነበበ ነው (Reading lecture notes aloud)');
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedVideo]);

  const handleVolumeChange = (newVol: number) => {
    setVolumeLevel(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (newVol === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const handleTogglePlay = () => {
    if (playerMode === 'youtube') {
      setIsPlaying((prev) => !prev);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      // User explicitly clicked play - unmute and set 100% volume so voice is clearly heard!
      video.muted = false;
      video.volume = 1.0;
      setIsMuted(false);
      setVolumeLevel(1.0);
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Autoplay restricted without gesture/audio:', err);
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => {
          setIsPlaying(true);
          triggerToast('ድምፅ ለመስማት የድምፅ ምልክቱን (Unmute) ይጫኑ');
        }).catch(() => setIsPlaying(false));
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = volumeLevel > 0 ? volumeLevel : 1.0;
      }
      setIsMuted(nextMuted);
      triggerToast(nextMuted ? 'ድምፅ ተዘግቷል (Muted)' : 'ድምፅ ተከፍቷል (Unmuted - 100%)');
    } else {
      setIsMuted(!isMuted);
    }
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
      triggerToast('የተቀዳው ቪዲዮ በመጫን ላይ ነው፤ እባክዎ "ዳግም ሞክር" የሚለውን ይጫኑ።');
      return;
    }
    const fallbackUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    if (activeVideoUrl !== fallbackUrl) {
      setActiveVideoUrl(fallbackUrl);
      triggerToast('የቪዲዮው ፋይል በቀጥታ አልተጫወተም፤ የተጠባባቂ ትምህርት ቪዲዮ (Backup Stream) ተከፍቷል!');
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
    }
    triggerToast(`ወደ ተመረጠው ርዕስ ተሸጋግሯል: ${label} (${timeStr})`);
  };

  const handleSelectVideo = async (video: VideoLesson) => {
    setSelectedVideo(video);
    setPlaybackError(false);
    setIsPlaying(true);
    setCurrentTimeFormatted('00:00');
    
    // If it's a live recording, custom uploaded file, or missing youtubeId, default to HTML5 direct player
    if (video.isLiveRecording || !video.youtubeId) {
      setPlayerMode('html5');
      let url = typeof window !== 'undefined' ? (window as any).__ETHIO_RECORDED_VIDEOS?.[video.id] : null;
      if (!url && (video.isLiveRecording || video.id.startsWith('vid-rec-'))) {
        url = await getRecordedVideoUrl(video.id);
      }
      if (!url) {
        url = video.videoUrl;
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

    // Trigger video playback attempt
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
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

    if (!file.type.startsWith('video/')) {
      triggerToast('Please select a valid video file (MP4, WebM, MOV, etc.)');
      return;
    }

    // Revoke previous blob URL to prevent memory leaks
    if (selectedFileUrl) {
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
    if (!isAdmin) {
      setShowRestrictedModal(true);
      return;
    }
    setShowUploadModal(true);
  };

  // Submission handler for admin video upload
  const handleUploadVideo = () => {
    if (!newVideoTitle.trim()) {
      triggerToast('Please enter a video title');
      return;
    }

    const selectedSubjectObj = subjects.find((s) => s.id === newSubjectId) || subjects[0];

    let finalYoutubeId: string | undefined = undefined;
    let finalVideoUrl: string | undefined = undefined;

    if (uploadSourceType === 'file') {
      if (!selectedFileUrl) {
        triggerToast('Please choose a video file from your device to upload.');
        return;
      }
      finalVideoUrl = selectedFileUrl;
    } else {
      const extracted = extractYouTubeId(youtubeInput);
      if (!extracted) {
        triggerToast('Please enter a valid YouTube link or video ID.');
        return;
      }
      finalYoutubeId = extracted;
    }

    const newVid: VideoLesson = {
      id: `vid-custom-${Date.now()}`,
      title: newVideoTitle.trim(),
      level: newLevel,
      subject: selectedSubjectObj?.name || 'General Studies',
      subjectId: selectedSubjectObj?.id || 'gen',
      chapter: newChapter.trim() || 'General Topic Review',
      instructor: newInstructor.trim() || currentUser?.name || 'Platform Admin',
      duration: newDuration || '15:00',
      views: 1,
      youtubeId: finalYoutubeId,
      videoUrl: finalVideoUrl || (finalYoutubeId ? undefined : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
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
      summaryNotes: `Uploaded video lecture covering ${newChapter} for ${selectedSubjectObj?.name}. Verified and published by ${newInstructor.trim()}.`,
    };

    if (onAddVideoLesson) {
      onAddVideoLesson(newVid);
    }

    setSelectedVideo(newVid);
    setPlayerMode(uploadSourceType === 'youtube' ? 'youtube' : 'html5');
    setIsPlaying(true);
    triggerToast(`Video "${newVid.title}" published successfully!`);

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

      {/* Header bar matching Learnova platform design */}
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
                  <span>{tab === 'My Videos' ? 'የኔ ቪዲዮዎች (My Videos)' : tab === 'Saved' ? 'የተቀመጡ (Saved)' : 'ሁሉም (All)'}</span>
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

          {/* Upload Button: Admin only can upload, restricted message for students */}
          {isAdmin ? (
            <button
              onClick={handleOpenUploadModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer active:scale-95"
              id="btn-upload-video-admin"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Video</span>
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-black uppercase tracking-wider">
                Admin
              </span>
            </button>
          ) : (
            <button
              onClick={handleOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-200 transition shrink-0 cursor-pointer"
              title="Only administrators can upload videos"
              id="btn-upload-video-restricted"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Upload Video</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 text-[10px] font-medium">
                Admin Only
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Theatre / Player & Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Video Player (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedVideo ? (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
              {/* Playable Viewport */}
              <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group">
                {playerMode === 'youtube' && selectedVideo.youtubeId ? (
                  <div className="w-full h-full relative">
                    <iframe
                      key={selectedVideo.id}
                      src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=${isPlaying ? '1' : '0'}&rel=0&modestbranding=1`}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                    {/* YouTube help banner */}
                    <div className="absolute top-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200 flex items-center justify-between gap-2 z-10">
                      <span className="truncate text-[11px]">
                        💡 ቪዲዮው ድምፅ ከሌለው ወይም ካልተጫወተ ወደ ቀጥታ ማጫወቻ ይቀይሩ፦
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerMode('html5');
                          setTimeout(() => {
                            if (videoRef.current) {
                              videoRef.current.muted = false;
                              videoRef.current.volume = 1.0;
                              setIsMuted(false);
                              setVolumeLevel(1.0);
                              videoRef.current.play().catch(console.warn);
                            }
                          }, 150);
                        }}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shrink-0 transition cursor-pointer shadow-xs"
                      >
                        ቀጥታ በድምፅ አጫውት (Direct Audio & Video)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      key={selectedVideo.id}
                      src={activeVideoUrl}
                      controls
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => {
                        const el = e.currentTarget;
                        el.volume = 1.0;
                        el.muted = false;
                      }}
                      onVolumeChange={(e) => {
                        setIsMuted(e.currentTarget.muted || e.currentTarget.volume === 0);
                        setVolumeLevel(e.currentTarget.volume);
                      }}
                      onPlay={() => setIsPlaying(true)}
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
                        title="ቪዲዮውን አጫውት (Play Video)"
                      >
                        <Play className="w-9 h-9 fill-current ml-1" />
                        <span className="text-[10px] font-black mt-0.5">አጫውት</span>
                      </button>
                    )}

                    {/* Prominent Center Unmute Callout if audio was restricted by browser autoplay */}
                    {isMuted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none p-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.muted = false;
                              videoRef.current.volume = 1.0;
                              setIsMuted(false);
                              setVolumeLevel(1.0);
                              videoRef.current.play().catch(() => {});
                              triggerToast('🔊 ድምፅ ተከፍቷል (100% Volume Unmuted)');
                            }
                          }}
                          className="pointer-events-auto px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl border-2 border-white/60 animate-bounce cursor-pointer transition transform hover:scale-105"
                          title="ድምፅ ክፈት (Click to unmute sound)"
                        >
                          <VolumeX className="w-5 h-5 animate-pulse" />
                          <span>🔊 ድምፅ ክፈት (የቪዲዮውን ድምፅ ለመስማት ይጫኑ - Unmute Audio)</span>
                        </button>
                      </div>
                    )}

                    {/* Unmute floating banner if playing while muted */}
                    {isPlaying && isMuted && (
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl border border-white/40 animate-pulse cursor-pointer backdrop-blur-xs transition"
                        title="ድምፅ ክፈት (Click to unmute sound)"
                      >
                        <VolumeX className="w-4 h-4" />
                        <span>ድምፅ ክፈት (Unmute Audio)</span>
                      </button>
                    )}

                    {/* Playback Error recovery badge */}
                    {playbackError && (
                      <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between gap-2 z-20">
                        <div className="flex items-center gap-1.5 truncate">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">የተጠባባቂ ትምህርት ቪዲዮ (Backup Lesson Stream) ተከፍቷል</span>
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
                          ዳግም ሞክር
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
                    title={isPlaying ? 'ቪዲዮውን አቁም (Pause)' : 'ቪዲዮውን አጫውት (Play)'}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>አቁም (Pause)</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>አጫውት (Play)</span>
                      </>
                    )}
                  </button>

                  {/* Mute toggle & Volume Slider */}
                  <div className="flex items-center gap-2 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 shadow-sm">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="p-1 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                      title={isMuted ? 'ድምጽ ክፈት (Unmute)' : 'ድምጽ አጥፋ (Mute)'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volumeLevel}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 sm:w-20 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      title={`ድምፅ (Volume): ${Math.round((isMuted ? 0 : volumeLevel) * 100)}%`}
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-300 min-w-[30px]">
                      {isMuted ? '0%' : `${Math.round(volumeLevel * 100)}%`}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-md bg-sky-500/20 text-sky-400 font-mono font-bold text-[11px] border border-sky-500/30">
                    {selectedVideo.subject}
                  </span>
                  <span className="text-slate-400 text-xs">
                    የቪዲዮው ርዝመት: <strong className="text-white font-mono">{selectedVideo.duration}</strong>
                  </span>
                  {selectedVideo.isLiveRecording && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      <span>የቀጥታ ትምህርት ቀረጻ (Live REC)</span>
                    </span>
                  )}
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 text-[11px]">ማጫወቻ (Player):</span>
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
                      <span>ቀጥታ ማጫወቻ (Direct)</span>
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
                      Instructor: <strong className="text-slate-800">{selectedVideo.instructor}</strong> • {selectedVideo.chapter} • {selectedVideo.views.toLocaleString()} views
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {canDeleteVideo(selectedVideo) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(selectedVideo)}
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="ይህን ቪዲዮ ከስርዓቱ ሰርዝ / አጥፋ (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>ቪዲዮውን አጥፋ (Delete)</span>
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
                      title="የትምህርቱን ማብራሪያ በድምፅ ያዳምጡ (Listen to lecture voice read-aloud)"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isReadingAloud ? 'animate-bounce' : 'text-emerald-100'}`} />
                      <span>{isReadingAloud ? 'ድምፅ አቁም (Stop Voice)' : '🔊 በድምፅ አድምጥ (Listen to Voice)'}</span>
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
                        title="ይህን ቪዲዮ ሰርዝ / አጥፋ (Delete Video)"
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
                    ? 'በ "My Videos" ስር የተቀመጠ ቪዲዮ የለም'
                    : activeFilterTab === 'Saved'
                    ? 'ምንም የተቀመጠ ቪዲዮ የለም'
                    : 'ምንም ቪዲዮ አልተገኘም'}
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {activeFilterTab === 'My Videos'
                    ? 'በቀጥታ የትምህርት ክፍለ-ጊዜ (Live Class) ውስጥ 🔴 Record (ቅረጽ) ተጭነው ሲቀዱ እዚህ "My Videos" ስር በቀጥታ ይገኛል!'
                    : 'እባክዎ የተለየ ማጣሪያ ይምረጡ።'}
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
                Admin Permission Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Video lecture uploading is restricted to authorized platform <strong>Administrators (Admin)</strong>.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-['Noto_Sans_Ethiopic'] leading-relaxed">
                የቪዲዮ ትምህርቶችን ከኮምፒውተር ወይም ከ YouTube ማከል የሚችለው አስተዳዳሪ (Admin) ብቻ ነው። እባክዎ እንደ Admin ይግቡ።
              </div>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setShowRestrictedModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Understood / እሺ ገብቶኛል
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ADMIN VIDEO UPLOAD MODAL (Local Device File OR YouTube Import)     */}
      {/* ------------------------------------------------------------------ */}
      {showUploadModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Upload & Publish Video Lesson
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direct Device File Upload or YouTube Channel Import (Admin Only)
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
                <span>Upload from Device (ፋይል)</span>
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
                <span>Import from YouTube (ከዩቲዩብ)</span>
              </button>
            </div>

            {/* SOURCE A: DIRECT DEVICE FILE UPLOAD */}
            {uploadSourceType === 'file' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
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
                        Click to select video file from your computer or phone
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Supports MP4, WebM, MOV, OGG (የራስዎን ቪዲዮ ፋይል ይምረጡ)
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
                        src={selectedFileUrl}
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
                  <option value="grade_12_natural">Grade 12 Natural Science</option>
                  <option value="grade_12_social">Grade 12 Social Science</option>
                  <option value="university_entrance">University Entrance (Freshman)</option>
                  <option value="university_exit">University Exit Exam</option>
                  <option value="grade_8_ministry">Grade 8 Ministry Exam</option>
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Publish Lesson to Platform</span>
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
                  ቪዲዮውን ማጥፋት ይፈልጋሉ?
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Delete Video Confirmation
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
                <span>ርዝመት፦ {videoPendingDelete.duration}</span>
                <span>•</span>
                <span>መምህር፦ {videoPendingDelete.instructor}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ይህ ቪዲዮ ከስርዓቱና ከቪዲዮ ዝርዝር ውስጥ ሙሉ በሙሉ ይሰረዛል። ይህን እርምጃ መመለስ አይቻልም። በእርግጥ ማጥፋት ይፈልጋሉ?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVideoPendingDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                ተመለስ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>አዎ፣ አጥፋ (Delete Video)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
