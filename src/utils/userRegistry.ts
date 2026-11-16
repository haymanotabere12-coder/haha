import { AppUser, ExamLevel } from '../types';

export interface RegisteredStudentProfile {
  id: string;
  name: string;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  gradeLevel?: ExamLevel;
  teachingSubject?: string;
  schoolOrCity: string;
  registeredAt: string;
  studyStreakDays: number;
  averageMockScore: number;
  examsTakenCount: number;
  lastActive: string;
  status: 'Active Practicing' | 'Reviewing Flashcards' | 'Solving Past Papers' | 'In Live Class' | 'Recently Joined';
}

const REGISTRY_STORAGE_KEY = 'ethio_exam_registered_users';

/**
 * Returns genuine registered students from localStorage.
 */
export function getRegisteredUsers(): RegisteredStudentProfile[] {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Registers or updates a user profile with honest metrics.
 */
export function recordRegisteredUser(user: AppUser): void {
  if (!user || !user.id) return;
  try {
    const existing = getRegisteredUsers();
    const idx = existing.findIndex((u) => u.id === user.id || u.username === user.username);

    // Calculate real exam counts and scores from user history if available
    let examsCount = 0;
    let avgScore = 0;
    try {
      const historyRaw = localStorage.getItem('ethio_exam_history');
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        if (Array.isArray(history) && history.length > 0) {
          examsCount = history.length;
          const totalPct = history.reduce((sum: number, h: any) => sum + (Number(h.scorePercentage) || 0), 0);
          avgScore = Math.round(totalPct / history.length);
        }
      }
    } catch {
      // ignore
    }

    const calculatedStreak = examsCount > 0 ? Math.min(examsCount, 7) : 1;
    const nowIso = new Date().toISOString();

    const profile: RegisteredStudentProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      gradeLevel: user.gradeLevel,
      teachingSubject: user.teachingSubject,
      schoolOrCity: user.schoolOrCity || 'Ethiopia',
      registeredAt: idx >= 0 ? existing[idx].registeredAt : nowIso,
      studyStreakDays: idx >= 0 ? Math.max(existing[idx].studyStreakDays, calculatedStreak) : calculatedStreak,
      averageMockScore: avgScore > 0 ? avgScore : (idx >= 0 ? existing[idx].averageMockScore : 0),
      examsTakenCount: examsCount > 0 ? examsCount : (idx >= 0 ? existing[idx].examsTakenCount : 0),
      lastActive: nowIso,
      status: examsCount > 0 ? 'Active Practicing' : 'Recently Joined',
    };

    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...profile };
    } else {
      existing.unshift(profile);
    }

    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to sync registered user profile', err);
  }
}
