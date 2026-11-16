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
} from 'lucide-react';
import { AppUser, ExamLevel, Language } from '../types';
import { SUBJECTS_DATA } from '../data/mockData';
import { recordRegisteredUser } from '../utils/userRegistry';

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
      (a) => a.username.toLowerCase() !== record.username.toLowerCase()
    );
    existing.unshift(record);
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

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

  // Login fields (Username + Password only)
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register fields
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>(initialRole);
  const [fullName, setFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<ExamLevel>('grade_12_natural');
  const [teachingSubject, setTeachingSubject] = useState<string>('Physics (Natural)');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [cityOrSchool, setCityOrSchool] = useState<string>('Addis Ababa');
  const [regPassword, setRegPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
      setRole(initialRole);
      setIsRegister(initialMode === 'register');
      setError(null);
      setShowPassword(false);
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

    const cleanUsername = normalizeUsername(loginUsername);
    if (!cleanUsername) {
      setError(isAm ? 'እባክዎ የተጠቃሚ ስም (Username) ያስገቡ።' : 'Please enter your username.');
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
        body: JSON.stringify({ username: cleanUsername, password: loginPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          completeSignIn(data.user);
          return;
        }
      }

      // Check local backup credentials (only matches exact username + exact password)
      const localMatch = readLocalAccounts().find(
        (acc) => acc.username.toLowerCase() === cleanUsername
      );
      if (localMatch) {
        if (localMatch.password !== loginPassword) {
          setError(isAm ? 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል!' : 'Invalid username or password.');
          return;
        }
        // Re-sync local account onto server silently if server restarted
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: localMatch.name,
            username: localMatch.username,
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
            ? 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል! መለያ ከሌለዎት መጀመሪያ Register ያድርጉ።'
            : 'Invalid username or password. Please check your details or create an account.')
      );
    } catch {
      const localMatch = readLocalAccounts().find(
        (acc) => acc.username.toLowerCase() === cleanUsername && acc.password === loginPassword
      );
      if (localMatch) {
        completeSignIn({
          id: localMatch.id,
          username: localMatch.username,
          name: localMatch.name,
          role: localMatch.role,
          gradeLevel: localMatch.gradeLevel,
          teachingSubject: localMatch.teachingSubject,
          schoolOrCity: localMatch.schoolOrCity,
        });
      } else {
        setError(
          isAm
            ? 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል!'
            : 'Invalid username or password.'
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
      (a) => a.username.toLowerCase() === cleanUsername
    );

    const assignedLevel = role === 'student' || role === 'teacher' ? gradeLevel : undefined;
    const assignedSubject = role === 'teacher' ? resolvedSubject : undefined;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          username: cleanUsername,
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
            (isAm ? 'ይህ የተጠቃሚ ስም አስቀድሞ ተይዟል።' : 'Registration failed. Try another username.')
        );
        return;
      }

      const createdUser: AppUser = data?.user || {
        id: `usr-${Date.now()}`,
        username: cleanUsername,
        name: cleanName,
        role,
        gradeLevel: assignedLevel,
        teachingSubject: assignedSubject,
        schoolOrCity: cleanCity,
      };

      saveLocalAccount({
        id: createdUser.id,
        username: createdUser.username,
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
            ? 'ይህ የተጠቃሚ ስም አስቀድሞ ተመዝግቧል። እባክዎ Sign In ይጠቀሙ።'
            : 'Username is already registered. Please sign in instead.'
        );
        return;
      }
      const createdUser: AppUser = {
        id: `usr-${Date.now()}`,
        username: cleanUsername,
        name: cleanName,
        role,
        gradeLevel: assignedLevel,
        teachingSubject: assignedSubject,
        schoolOrCity: cleanCity,
      };
      saveLocalAccount({
        id: createdUser.id,
        username: createdUser.username,
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
            {isRegister
              ? isAm
                ? 'አዲስ መለያ ይፍጠሩ'
                : 'Create Account'
              : isAm
                ? 'ወደ EthioExam ይግቡ'
                : 'Sign In to EthioExam'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? isAm
                ? 'ለተማሪዎች፣ መምህራን እና አስተዳዳሪዎች አዲስ መለያ መመዝገቢያ'
                : 'Register a new account with your username, role, and password.'
              : isAm
                ? 'በተጠቃሚ ስምዎ (Username) እና በይለፍ ቃልዎ (Password) ይግቡ'
                : 'Enter your username and password to access your account.'}
          </p>

          {targetActionMessage && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 text-left mt-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{targetActionMessage}</span>
            </div>
          )}
        </div>

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

        {/* FORM 1: SIGN IN (Username + Password ONLY) */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isAm ? 'የተጠቃሚ ስም (Username)' : 'Username'}
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. haymanot.abe"
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
              disabled={isSubmitting}
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
          /* FORM 2: CREATE ACCOUNT */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            {/* Role Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {isAm ? 'የመለያ አይነት (Role)' : 'Account Role'}
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl font-bold text-center">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    role === 'student' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAm ? 'ተማሪ' : 'Student'}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    role === 'teacher' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAm ? 'መምህር' : 'Teacher'}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    role === 'admin' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAm ? 'አስተዳዳሪ' : 'Admin'}
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
                    placeholder="e.g. Haymanot Abera"
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
                    placeholder="e.g. haymanot.abe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Education / Exam Level for BOTH Students AND Teachers */}
            {(role === 'student' || role === 'teacher') && (
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
            )}

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
              disabled={isSubmitting}
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
      </div>
    </div>
  );
};
