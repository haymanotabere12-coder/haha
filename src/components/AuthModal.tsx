import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  AtSign,
  MapPin,
  BookOpen,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { AppUser, ExamLevel, Language } from '../types';
import { SUBJECTS_DATA } from '../data/mockData';
import { recordRegisteredUser } from '../utils/userRegistry';
import { signInWithGooglePopup, syncFirebaseUserProfile } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  initialRole?: 'student' | 'teacher' | 'admin';
  initialMode?: 'login' | 'register';
  targetActionMessage?: string;
  language?: Language;
}

interface LocalAccountRecord {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  gradeLevel?: ExamLevel;
  teachingSubject?: string;
  schoolOrCity: string;
  password: string;
}

const LOCAL_ACCOUNTS_KEY = 'ethio_exam_auth_accounts';

function readLocalAccounts(): LocalAccountRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAccount(record: LocalAccountRecord): void {
  try {
    const existing = readLocalAccounts().filter(
      (a) =>
        a.username.toLowerCase() !== record.username.toLowerCase() &&
        (!record.email || a.email?.toLowerCase() !== record.email.toLowerCase())
    );
    existing.unshift(record);
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

const GoogleLogoSvg = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'student',
  initialMode = 'login',
  targetActionMessage,
  language = 'en',
}) => {
  const isAm = language === 'am';
  const [isRegister, setIsRegister] = useState<boolean>(initialMode === 'register');

  // Login fields (Username or Email + Password)
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register fields (public registration is strictly for students and teachers only)
  const [role, setRole] = useState<'student' | 'teacher'>(
    initialRole === 'teacher' ? 'teacher' : 'student'
  );
  const [fullName, setFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<ExamLevel>('grade_12_natural');
  const [teachingSubject, setTeachingSubject] = useState<string>('Physics (Natural)');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [cityOrSchool, setCityOrSchool] = useState<string>('Addis Ababa');
  const [regPassword, setRegPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Google Onboarding state (for brand-new Google users signing in from Login tab)
  const [pendingGoogleOnboarding, setPendingGoogleOnboarding] = useState<{
    idToken: string;
    uid: string;
    user: AppUser;
  } | null>(null);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const levelSubjects = useMemo(
    () => SUBJECTS_DATA.filter((s) => s.level === gradeLevel),
    [gradeLevel]
  );

  // Keep selected teaching subject aligned when gradeLevel changes
  useEffect(() => {
    if (teachingSubject === '__custom__') return;
    if (levelSubjects.length > 0 && !levelSubjects.some((s) => s.name === teachingSubject)) {
      setTeachingSubject(levelSubjects[0].name);
    }
  }, [levelSubjects, teachingSubject]);

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole === 'teacher' ? 'teacher' : 'student');
      setIsRegister(initialRole === 'admin' ? false : initialMode === 'register');
      setError(null);
      setShowPassword(false);
      setPendingGoogleOnboarding(null);
    }
  }, [isOpen, initialRole, initialMode]);

  if (!isOpen) return null;

  const normalizeUsername = (val: string) =>
    val.trim().toLowerCase().replace(/\s+/g, '');

  const completeSignIn = (user: AppUser) => {
    localStorage.setItem('ethio_exam_current_user', JSON.stringify(user));
    recordRegisteredUser(user);
    onLoginSuccess(user);
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = loginIdentifier.trim().toLowerCase();
    if (!cleanIdentifier) {
      setError(
        isAm
          ? 'እባክዎ የተጠቃሚ ስም (Username) ወይም ኢሜይል (Email) ያስገቡ።'
          : 'Please enter your username or email address.'
      );
      return;
    }
    if (!loginPassword) {
      setError(isAm ? 'እባክዎ የይለፍ ቃል (Password) ያስገቡ።' : 'Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdentifier, password: loginPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          completeSignIn(data.user);
          return;
        }
      }

      // Check local backup credentials for non-admin accounts
      const localMatch = readLocalAccounts().find(
        (acc) =>
          acc.role !== 'admin' &&
          (acc.username.toLowerCase() === cleanIdentifier ||
            (acc.email && acc.email.toLowerCase() === cleanIdentifier))
      );
      if (localMatch) {
        if (localMatch.password !== loginPassword) {
          setError(
            isAm ? 'የተሳሳተ የተጠቃሚ ስም/ኢሜይል ወይም የይለፍ ቃል!' : 'Invalid username/email or password.'
          );
          return;
        }
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: localMatch.name,
            username: localMatch.username,
            email: localMatch.email || `${localMatch.username}@ethioexam.local`,
            password: localMatch.password,
            role: localMatch.role,
            gradeLevel: localMatch.gradeLevel,
            teachingSubject: localMatch.teachingSubject,
            schoolOrCity: localMatch.schoolOrCity,
          }),
        }).catch(() => {});

        completeSignIn({
          id: localMatch.id,
          username: localMatch.username,
          email: localMatch.email,
          name: localMatch.name,
          role: localMatch.role,
          gradeLevel: localMatch.gradeLevel,
          teachingSubject: localMatch.teachingSubject,
          schoolOrCity: localMatch.schoolOrCity,
        });
        return;
      }

      const errBody = await res.json().catch(() => ({}));
      setError(
        errBody?.error ||
          (isAm
            ? 'የተሳሳተ የተጠቃሚ ስም/ኢሜይል ወይም የይለፍ ቃል! መለያ ከሌለዎት መጀመሪያ Register ያድርጉ።'
            : 'Invalid username/email or password. Please check your details or create an account.')
      );
    } catch {
      const localMatch = readLocalAccounts().find(
        (acc) =>
          acc.role !== 'admin' &&
          (acc.username.toLowerCase() === cleanIdentifier ||
            (acc.email && acc.email.toLowerCase() === cleanIdentifier)) &&
          acc.password === loginPassword
      );
      if (localMatch) {
        completeSignIn({
          id: localMatch.id,
          username: localMatch.username,
          email: localMatch.email,
          name: localMatch.name,
          role: localMatch.role,
          gradeLevel: localMatch.gradeLevel,
          teachingSubject: localMatch.teachingSubject,
          schoolOrCity: localMatch.schoolOrCity,
        });
      } else {
        setError(
          isAm
            ? 'የተሳሳተ የተጠቃሚ ስም/ኢሜይል ወይም የይለፍ ቃል!'
            : 'Invalid username/email or password.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanUsername = normalizeUsername(regUsername);
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanCity = cityOrSchool.trim() || 'Ethiopia';
    const resolvedSubject =
      teachingSubject === '__custom__' ? customSubject.trim() : teachingSubject.trim();

    if (!cleanName) {
      setError(isAm ? 'እባክዎ ሙሉ ስምዎን ያስገቡ።' : 'Please enter your full name.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError(
        isAm
          ? 'የተጠቃሚ ስም (Username) ቢያንስ 3 ፊደላት መሆን አለበት።'
          : 'Username must be at least 3 characters (no spaces).'
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(
        isAm
          ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ (Email) ያስገቡ።'
          : 'Please enter a valid email address.'
      );
      return;
    }
    if (role === 'teacher' && !resolvedSubject) {
      setError(
        isAm
          ? 'እባክዎ የሚያስተምሩትን የትምህርት አይነት (Subject) ይምረጡ ወይም ይጻፉ።'
          : 'Please select or enter the subject you teach.'
      );
      return;
    }
    if (regPassword.length < 4) {
      setError(
        isAm
          ? 'የይለፍ ቃል ቢያንስ 4 ፊደላት ወይም ቁጥሮች መሆን አለበት።'
          : 'Password must be at least 4 characters.'
      );
      return;
    }
    if (regPassword !== confirmPassword) {
      setError(
        isAm
          ? 'የይለፍ ቃሎቹ አይመሳሰሉም፤ እባክዎ ደግመው ያረጋግጡ።'
          : 'Passwords do not match. Please re-enter carefully.'
      );
      return;
    }

    const localDuplicate = readLocalAccounts().some(
      (a) =>
        a.username.toLowerCase() === cleanUsername ||
        (a.email && a.email.toLowerCase() === cleanEmail)
    );

    const assignedLevel = gradeLevel;
    const assignedSubject = role === 'teacher' ? resolvedSubject : undefined;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password: regPassword,
          role,
          gradeLevel: assignedLevel,
          teachingSubject: assignedSubject,
          schoolOrCity: cleanCity,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.error ||
            (isAm ? 'ይህ የተጠቃሚ ስም ወይም ኢሜይል አስቀድሞ ተይዟል።' : 'Registration failed. Username or email may already exist.')
        );
        return;
      }

      const createdUser: AppUser = data?.user || {
        id: `usr-${Date.now()}`,
        username: cleanUsername,
        email: cleanEmail,
        name: cleanName,
        role,
        gradeLevel: assignedLevel,
        teachingSubject: assignedSubject,
        schoolOrCity: cleanCity,
      };

      saveLocalAccount({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email || cleanEmail,
        name: createdUser.name,
        role: createdUser.role,
        gradeLevel: createdUser.gradeLevel,
        teachingSubject: createdUser.teachingSubject,
        schoolOrCity: createdUser.schoolOrCity || cleanCity,
        password: regPassword,
      });

      completeSignIn(createdUser);
    } catch {
      if (localDuplicate) {
        setError(
          isAm
            ? 'ይህ የተጠቃሚ ስም ወይም ኢሜይል አስቀድሞ ተመዝግቧል። እባክዎ Sign In ይጠቀሙ።'
            : 'Username or email is already registered. Please sign in instead.'
        );
        return;
      }
      const createdUser: AppUser = {
        id: `usr-${Date.now()}`,
        username: cleanUsername,
        email: cleanEmail,
        name: cleanName,
        role,
        gradeLevel: assignedLevel,
        teachingSubject: assignedSubject,
        schoolOrCity: cleanCity,
      };
      saveLocalAccount({
        id: createdUser.id,
        username: createdUser.username,
        email: cleanEmail,
        name: createdUser.name,
        role: createdUser.role,
        gradeLevel: createdUser.gradeLevel,
        teachingSubject: createdUser.teachingSubject,
        schoolOrCity: cleanCity,
        password: regPassword,
      });
      completeSignIn(createdUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const { user: fbUser, idToken } = await signInWithGooglePopup();
      const resolvedSubject =
        teachingSubject === '__custom__' ? customSubject.trim() : teachingSubject.trim();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          role,
          gradeLevel,
          teachingSubject: role === 'teacher' ? resolvedSubject : undefined,
          schoolOrCity: cityOrSchool.trim() || 'Ethiopia',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user) {
        setError(
          data?.error ||
            (isAm ? 'በGoogle መግባት አልተቻለም።' : 'Google sign-in failed. Please try again.')
        );
        return;
      }

      const signedUser: AppUser = data.user;

      await syncFirebaseUserProfile({
        uid: fbUser.uid,
        email: signedUser.email || fbUser.email || '',
        displayName: signedUser.name,
        role: signedUser.role === 'teacher' ? 'teacher' : 'student',
        gradeLevel: signedUser.gradeLevel,
      });

      // If brand new user clicked Google on Login tab, offer quick role & level confirmation
      if (data.isNewUser && !isRegister) {
        setPendingGoogleOnboarding({ idToken, uid: fbUser.uid, user: signedUser });
        return;
      }

      completeSignIn(signedUser);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setError(
          isAm ? 'የGoogle መግቢያ መስኮቱ ተዘግቷል።' : 'Google sign-in popup was closed.'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setError(
          isAm
            ? 'እባክዎ በአሳሽዎ Pop-up መስኮት እንዲከፈት ይፍቀዱ።'
            : 'Popup was blocked by your browser. Please allow popups for this site.'
        );
      } else {
        setError(
          err?.message ||
            (isAm ? 'በGoogle መግባት አልተቻለም።' : 'Unable to sign in with Google right now.')
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFinishGoogleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleOnboarding) return;
    setError(null);

    const resolvedSubject =
      teachingSubject === '__custom__' ? customSubject.trim() : teachingSubject.trim();
    if (role === 'teacher' && !resolvedSubject) {
      setError(
        isAm
          ? 'እባክዎ የሚያስተምሩትን የትምህርት አይነት ይምረጡ ወይም ይጻፉ።'
          : 'Please select or enter the subject you teach.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/google/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: pendingGoogleOnboarding.idToken,
          role,
          gradeLevel,
          teachingSubject: role === 'teacher' ? resolvedSubject : undefined,
          schoolOrCity: cityOrSchool.trim() || 'Ethiopia',
        }),
      });
      const data = await res.json().catch(() => ({}));
      const finalUser: AppUser = data?.user || {
        ...pendingGoogleOnboarding.user,
        role,
        gradeLevel,
        teachingSubject: role === 'teacher' ? resolvedSubject : undefined,
        schoolOrCity: cityOrSchool.trim() || 'Ethiopia',
      };

      await syncFirebaseUserProfile({
        uid: pendingGoogleOnboarding.uid,
        email: finalUser.email || '',
        displayName: finalUser.name,
        role: finalUser.role === 'teacher' ? 'teacher' : 'student',
        gradeLevel: finalUser.gradeLevel,
      });

      completeSignIn(finalUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Title */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {pendingGoogleOnboarding
              ? isAm
                ? 'መለያዎን ያጠናቅቁ'
                : 'Complete Your Profile'
              : isRegister
                ? isAm
                  ? 'አዲስ መለያ ይፍጠሩ'
                  : 'Create Account'
                : isAm
                  ? 'ወደ EthioExam ይግቡ'
                  : 'Sign In to EthioExam'}
          </h2>
          <p className="text-xs text-slate-500">
            {pendingGoogleOnboarding
              ? isAm
                ? `እንኳን ደህና መጡ ${pendingGoogleOnboarding.user.name}! የተማሪ ወይም የመምህር ደረጃዎን ይምረጡ።`
                : `Signed in as ${pendingGoogleOnboarding.user.email}. Choose your role and study level.`
              : isRegister
                ? isAm
                  ? 'በኢሜይል ወይም በGoogle አዲስ የተማሪ ወይም የመምህር መለያ ይፍጠሩ'
                  : 'Create a Student or Teacher account using Email or Google.'
                : isAm
                  ? 'በተጠቃሚ ስም/ኢሜይል ወይም በGoogle ወደ መለያዎ ይግቡ'
                  : 'Sign in with Username / Email or continue with Google.'}
          </p>

          {targetActionMessage && !pendingGoogleOnboarding && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 text-left mt-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{targetActionMessage}</span>
            </div>
          )}
        </div>

        {/* Step: Brand new Google user role & education level onboarding */}
        {pendingGoogleOnboarding ? (
          <form onSubmit={handleFinishGoogleOnboarding} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="truncate">{pendingGoogleOnboarding.user.email}</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isAm ? 'የመለያ አይነት (Role)' : 'I am a'}
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl font-bold text-center">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    role === 'student' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAm ? 'ተማሪ (Student)' : 'Student'}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    role === 'teacher' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAm ? 'መምህር (Teacher)' : 'Teacher'}
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {role === 'teacher'
                  ? isAm
                    ? 'የሚያስተምሩበት የትምህርት ደረጃ'
                    : 'Teaching Education Level'
                  : isAm
                    ? 'የፈተና ደረጃ'
                    : 'Examination Target Level'}
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as ExamLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
              >
                <option value="grade_12_natural">Grade 12 Natural Science (ESSLCE)</option>
                <option value="grade_12_social">Grade 12 Social Science (ESSLCE)</option>
                <option value="grade_8">Grade 8 Regional Ministry Exam</option>
                <option value="university_exit">University Exit Exam (Higher Education)</option>
              </select>
            </div>

            {role === 'teacher' && (
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  {isAm ? 'የሚያስተምሩት የትምህርት አይነት' : 'Subject You Teach'}
                </label>
                <select
                  value={teachingSubject}
                  onChange={(e) => setTeachingSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  {levelSubjects.map((subj) => (
                    <option key={subj.id} value={subj.name}>
                      {subj.name}{subj.nameAmharic ? ` (${subj.nameAmharic})` : ''}
                    </option>
                  ))}
                  <option value="__custom__">
                    {isAm ? 'ሌላ የትምህርት አይነት (ይጻፉ)...' : 'Other Subject (Specify)...'}
                  </option>
                </select>
                {teachingSubject === '__custom__' && (
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder={isAm ? 'የትምህርቱን ስም ይጻፉ' : 'Enter subject name'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                )}
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isAm ? 'ከተማ ወይም ትምህርት ቤት' : 'City or School'}
              </label>
              <input
                type="text"
                value={cityOrSchool}
                onChange={(e) => setCityOrSchool(e.target.value)}
                placeholder="e.g. Addis Ababa / Hawassa"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs cursor-pointer transition"
            >
              {isSubmitting
                ? isAm
                  ? 'በማስቀመጥ ላይ...'
                  : 'Saving Profile...'
                : isAm
                  ? 'ቀጥል እና ወደ መድረኩ ግባ'
                  : 'Save & Continue'}
            </button>
          </form>
        ) : (
          <>
            {/* Distinct Mode Tabs: Sign In vs Create Account */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  !isRegister ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAm ? 'ግባ (Sign In)' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  isRegister ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAm ? 'ተመዝገብ (Register)' : 'Create Account'}
              </button>
            </div>

            {/* Error alert */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-In Button (Real Firebase Auth) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition cursor-pointer"
            >
              <GoogleLogoSvg />
              <span>
                {isGoogleLoading
                  ? isAm
                    ? 'በGoogle በመግባት ላይ...'
                    : 'Connecting with Google...'
                  : isRegister
                    ? isAm
                      ? 'በGoogle ይመዝገቡ (Continue with Google)'
                      : 'Sign up with Google'
                    : isAm
                      ? 'በGoogle ይግቡ (Continue with Google)'
                      : 'Continue with Google'}
              </span>
            </button>

            <div className="relative flex items-center py-0.5">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isAm ? 'ወይም በኢሜይል' : 'or'}
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* FORM 1: SIGN IN (Username or Email + Password) */}
            {!isRegister ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAm ? 'የተጠቃሚ ስም ወይም ኢሜይል (Username / Email)' : 'Username or Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. abebe@gmail.com or haymanot.abe"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAm ? 'የይለፍ ቃል (Password)' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {isSubmitting
                    ? isAm
                      ? 'በመግባት ላይ...'
                      : 'Signing In...'
                    : isAm
                      ? 'በመለያ ግባ'
                      : 'Sign In'}
                </button>
              </form>
            ) : (
              /* FORM 2: CREATE ACCOUNT (With Email) */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {/* Role Selector (Students & Teachers only — single Admin exists on server) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAm ? 'የመለያ አይነት (Role)' : 'Account Role'}
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl font-bold text-center">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-2 rounded-lg transition cursor-pointer ${
                        role === 'student' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAm ? 'ተማሪ (Student)' : 'Student'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`py-2 rounded-lg transition cursor-pointer ${
                        role === 'teacher' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAm ? 'መምህር (Teacher)' : 'Teacher'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAm ? 'ሙሉ ስም' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Abebe Bikila"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAm ? 'የተጠቃሚ ስም (Username)' : 'Username'}
                    </label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoComplete="username"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. abebe.b"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAm ? 'ኢሜይል አድራሻ (Email)' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. student@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Education / Exam Level for Students & Teachers */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {role === 'teacher'
                      ? isAm
                        ? 'የሚያስተምሩበት የትምህርት ደረጃ'
                        : 'Teaching Education Level'
                      : isAm
                        ? 'የፈተና ደረጃ'
                        : 'Examination Target Level'}
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value as ExamLevel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  >
                    <option value="grade_12_natural">Grade 12 Natural Science (ESSLCE)</option>
                    <option value="grade_12_social">Grade 12 Social Science (ESSLCE)</option>
                    <option value="grade_8">Grade 8 Regional Ministry Exam</option>
                    <option value="university_exit">University Exit Exam (Higher Education)</option>
                  </select>
                </div>

                {/* Teaching Subject Selection (Teacher side) */}
                {role === 'teacher' && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">
                      {isAm ? 'የሚያስተምሩት የትምህርት አይነት (Subject)' : 'Subject You Teach'}
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={teachingSubject}
                        onChange={(e) => setTeachingSubject(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                      >
                        {levelSubjects.map((subj) => (
                          <option key={subj.id} value={subj.name}>
                            {subj.name}{subj.nameAmharic ? ` (${subj.nameAmharic})` : ''}
                          </option>
                        ))}
                        <option value="__custom__">
                          {isAm ? 'ሌላ የትምህርት አይነት (ይጻፉ)...' : 'Other Subject (Specify)...'}
                        </option>
                      </select>
                    </div>

                    {teachingSubject === '__custom__' && (
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder={isAm ? 'የትምህርቱን ስም ይጻፉ (ለምሳሌ፡ አማርኛ / Civics)' : 'Enter subject name (e.g. Amharic, Civics)'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAm ? 'ከተማ ወይም ትምህርት ቤት' : 'City or School'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cityOrSchool}
                      onChange={(e) => setCityOrSchool(e.target.value)}
                      placeholder="e.g. Addis Ababa / Hawassa"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAm ? 'የይለፍ ቃል' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAm ? 'የይለፍ ቃል ያረጋግጡ' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {isSubmitting
                    ? isAm
                      ? 'በመመዝገብ ላይ...'
                      : 'Creating Account...'
                    : isAm
                      ? 'ምዝገባ አጠናቅቅ'
                      : 'Complete Registration'}
                </button>
              </form>
            )}

            {/* Footer switch helper */}
            <div className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
              {isRegister ? (
                <span>
                  {isAm ? 'ቀደም ብለው መለያ አለዎት? ' : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError(null);
                    }}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {isAm ? 'ይግቡ (Sign In)' : 'Sign In'}
                  </button>
                </span>
              ) : (
                <span>
                  {isAm ? 'ገና መለያ የለዎትም? ' : "Don't have an account yet? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError(null);
                    }}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {isAm ? 'በነጻ ይመዝገቡ (Register)' : 'Create Account'}
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
