export type ExamLevel = 'grade_8' | 'grade_12_natural' | 'grade_12_social' | 'university_exit';

export interface SubjectInfo {
  id: string;
  name: string;
  nameAmharic?: string;
  level: ExamLevel;
  iconName: string;
  description: string;
  questionCount: number;
  totalHours: number;
  chapters: string[];
  color: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[]; // e.g. ["A) ...", "B) ...", "C) ...", "D) ..."]
  correctAnswer: string; // "A" | "B" | "C" | "D"
  explanation: string;
  amharicExplanation?: string;
  subjectId: string;
  level: ExamLevel;
  topic: string;
  year?: string; // e.g. "2016 E.C. (2024 G.C.)"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPastExam?: boolean;
}

export type ExamMode = 'practice' | 'exam';

export interface ExamResult {
  id: string;
  title: string;
  level: ExamLevel;
  subjectId: string;
  totalQuestions: number;
  correctAnswersCount: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  passed: boolean;
  date: string;
  userAnswers: Record<string, string>; // questionId -> selectedOption letter
  weakTopics: string[];
  strongTopics: string[];
}

export interface LiveSlide {
  title: string;
  bulletPoints: string[];
  formulaOrQuote?: string;
  diagramDescription?: string;
  imageUrl?: string;
  subtitle?: string;
}

export interface LiveClass {
  id: string;
  title: string;
  subject: string;
  subjectId: string;
  level: ExamLevel;
  teacherName: string;
  teacherTitle: string;
  teacherAvatar: string;
  isLiveNow: boolean;
  scheduledTime: string;
  durationMinutes: number;
  currentViewers: number;
  currentTopic: string;
  slides: LiveSlide[];
  pollQuestion?: {
    id: string;
    question: string;
    options: string[];
    votes: number[];
  };
  hasRecording: boolean;
  recordingDuration?: string;
  materialsAttached: string[];
  youtubeId?: string;
  streamUrl?: string;
  videoUrl?: string;
}

export interface LiveChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  role: 'teacher' | 'student' | 'moderator' | 'ai_tutor';
  text: string;
  timestamp: string;
  isQuestion?: boolean;
  upvotes: number;
  isAnswered?: boolean;
}

export interface DocumentMaterial {
  id: string;
  title: string;
  subject: string;
  subjectId: string;
  level: ExamLevel;
  chapter: string;
  category: 'Textbook' | 'Ministry Past Papers' | 'Teacher Summary' | 'Formula Sheet' | 'Exit Exam Guide';
  fileType: 'PDF' | 'DOCX' | 'SLIDES';
  pages: number;
  fileSize: string;
  uploadedBy: string;
  uploadDate: string;
  bookmarked?: boolean;
  downloadsCount: number;
  fullExcerpt: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  subject: string;
  subjectId: string;
  level: ExamLevel;
  chapter: string;
  instructor: string;
  duration: string;
  views: number;
  youtubeId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  thumbnailGradient: string;
  timestamps: Array<{ time: string; label: string }>;
  keyTakeaways: string[];
  summaryNotes: string;
  saved?: boolean;
  isLiveRecording?: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  subject: string;
  level: ExamLevel;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mastered?: boolean;
}

export interface TopicMastery {
  topic: string;
  subject: string;
  level: ExamLevel;
  accuracy: number; // 0 - 100
  questionsAttempted: number;
  status: 'critical_weak' | 'moderate' | 'mastered';
  lastPracticed: string;
  suggestedAction: string;
}

export type UserRole = 'student' | 'admin' | 'teacher';

export interface AppUser {
  id: string;
  username: string; // e.g. "hayma" or "abebe"
  name: string;
  role: UserRole;
  gradeLevel?: ExamLevel;
  email?: string;
  schoolOrCity?: string;
  avatar?: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'exam_prep' 
  | 'live_classes' 
  | 'documents' 
  | 'videos' 
  | 'ai_lab' 
  | 'analytics'
  | 'admin';
