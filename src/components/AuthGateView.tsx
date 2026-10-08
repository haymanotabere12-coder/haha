import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  BookOpen,
  Video
} from 'lucide-react';
import { AppUser, ExamLevel } from '../types';

interface AuthGateViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'student' | 'teacher' | 'admin'>('student');

  // Student form state
  const [studentName, setStudentName] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');
  const [studentLevel, setStudentLevel] = useState<ExamLevel>('grade_12_natural');
  const [studentCity, setStudentCity] = useState<string>('Addis Ababa');

  // Teacher form state
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherSubject, setTeacherSubject] = useState<string>('Physics (Grade 12)');
  const [teacherPassword, setTeacherPassword] = useState<string>('');
  const [showTeacherPassword, setShowTeacherPassword] = useState<boolean>(false);

  // Admin form state
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [showStudentPassword, setShowStudentPassword] = useState<boolean>(false);

  // Errors & notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick preset student login helper
  const handleQuickStudentLogin = (name: string, level: ExamLevel, city: string) => {
    const user: AppUser = {
      id: `std-${Date.now()}`,
      username: name.toLowerCase().replace(/\s+/g, '.'),
      name,
      role: 'student',
      gradeLevel: level,
      schoolOrCity: city,
    };
    localStorage.setItem('ethio_exam_current_user', JSON.stringify(user));
    onLoginSuccess(user);
  };

  // Quick preset teacher login helper
  const handleQuickTeacherLogin = (name: string, subject: string) => {
    const user: AppUser = {
      id: `tch-${Date.now()}`,
      username: name.toLowerCase().replace(/\s+/g, '.'),
      name,
      role: 'teacher',
      gradeLevel: 'grade_12_natural',
      schoolOrCity: `Addis Ababa (${subject})`,
    };
    localStorage.setItem('ethio_exam_current_user', JSON.stringify(user));
    onLoginSuccess(user);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = studentName.trim();
    if (!trimmedName) {
      setErrorMsg('እባክዎ የተማሪ ሙሉ ስም ያስገቡ (Please enter student full name)');
      return;
    }

    if (!studentPassword.trim()) {
      setErrorMsg('እባክዎ የይለፍ ቃል ያስገቡ (Please enter student password)');
      return;
    }

    const user: AppUser = {
      id: `std-${Date.now()}`,
      username: trimmedName.toLowerCase().replace(/\s+/g, '_'),
      name: trimmedName,
      role: 'student',
      gradeLevel: studentLevel,
      schoolOrCity: studentCity.trim() || 'Ethiopia',
    };

    localStorage.setItem('ethio_exam_current_user', JSON.stringify(user));
    onLoginSuccess(user);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = teacherName.trim();
    if (!trimmedName) {
      setErrorMsg('እባክዎ የመምህር ሙሉ ስም ያስገቡ (Please enter teacher full name)');
      return;
    }

    if (!teacherPassword.trim()) {
      setErrorMsg('እባክዎ የይለፍ ቃል ያስገቡ (Please enter password)');
      return;
    }

    const user: AppUser = {
      id: `tch-${Date.now()}`,
      username: trimmedName.toLowerCase().replace(/\s+/g, '_'),
      name: trimmedName,
      role: 'teacher',
      gradeLevel: 'grade_12_natural',
      schoolOrCity: `Faculty of ${teacherSubject}`,
    };

    localStorage.setItem('ethio_exam_current_user', JSON.stringify(user));
    onLoginSuccess(user);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUser = adminUsername.trim();
    const trimmedPass = adminPassword.trim();

    // Check credentials strictly per user requirement:
    // name: hayma
    // password: hayab2121
    if (trimmedUser.toLowerCase() === 'hayma' && trimmedPass === 'hayab2121') {
      const adminUser: AppUser = {
        id: 'admin-hayma-01',
        username: 'hayma',
        name: 'Hayma (Admin)',
        role: 'admin',
        gradeLevel: 'grade_12_natural',
        schoolOrCity: 'Ministry Portal HQ',
      };

      localStorage.setItem('ethio_exam_current_user', JSON.stringify(adminUser));
      onLoginSuccess(adminUser);
    } else {
      setErrorMsg('Incorrect Admin credentials. Required: Username "hayma", Password "hayab2121"');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30 text-white mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ethio<span className="text-emerald-400">Exam</span> Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            የኢትዮጵያ ሀገር አቀፍ ፈተና ዝግጅት እና የቀጥታ ትምህርት ፖርታል
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-800/95 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setAuthMode('student');
                setErrorMsg(null);
              }}
              id="tab-student-login"
              className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                authMode === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>ተማሪ (Student)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('teacher');
                setErrorMsg(null);
              }}
              id="tab-teacher-login"
              className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                authMode === 'teacher'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span>መምህር (Teacher)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('admin');
                setErrorMsg(null);
              }}
              id="tab-admin-login"
              className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                authMode === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>አድሚን (Admin)</span>
            </button>
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* TEACHER FORM */}
          {authMode === 'teacher' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  የመምህር ስም (Teacher Full Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="መምህር ሃይማኖት አበራ / Teacher Haymanot"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  የሚያስተምሩት የትምህርት ዘርፍ (Subject Area)
                </label>
                <select
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500 transition cursor-pointer"
                >
                  <option value="Physics (Grade 12)">ፊዚክስ (Physics Grade 12)</option>
                  <option value="Mathematics (Grade 12)">ሒሳብ (Mathematics Natural/Social)</option>
                  <option value="Chemistry (Grade 12)">ኬሚስትሪ (Chemistry Grade 12)</option>
                  <option value="Biology (Grade 12)">ባዮሎጂ (Biology Grade 12)</option>
                  <option value="English (Grade 12)">እንግሊዝኛ (English Grade 12)</option>
                  <option value="Grade 8 Ministry">የ 8ኛ ክፍል ሚኒስትሪ (Grade 8 All Subjects)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  የይለፍ ቃል (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Enter password (e.g. 123456)"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-teacher-submit"
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>የመምህር የቀጥታ ስርጭት ይግቡ (Enter Teacher Studio)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Fast Teacher Login */}
              <div className="pt-2 border-t border-slate-700/60 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block text-center">
                  ፈጣን የመምህር መግቢያ (1-Click Teacher Profile):
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickTeacherLogin('መምህር ሃይማኖት አበራ', 'Physics & ESSLCE')}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-700/80 border border-sky-500/40 text-xs transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sky-400">መምህር ሃይማኖት አበራ (Teacher Haymanot)</div>
                    <div className="text-[10px] text-slate-400">Physics & National Exam Specialist</div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">ግባ</span>
                </button>
              </div>
            </form>
          )}

          {/* STUDENT FORM */}
          {authMode === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Examination / Grade Level
                </label>
                <select
                  value={studentLevel}
                  onChange={(e) => setStudentLevel(e.target.value as ExamLevel)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                >
                  <option value="grade_8">Grade 8 Regional Ministry Exam</option>
                  <option value="grade_12_natural">Grade 12 Natural Science (ESSLCE)</option>
                  <option value="grade_12_social">Grade 12 Social Science (ESSLCE)</option>
                  <option value="university_exit">University Exit Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  School / City / Region
                </label>
                <input
                  type="text"
                  value={studentCity}
                  onChange={(e) => setStudentCity(e.target.value)}
                  placeholder="e.g. Addis Ababa / Hawassa / Bahir Dar"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-student-submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Enter Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Fast Student Demo Profiles */}
              <div className="pt-2 border-t border-slate-700/60 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block text-center">
                  Quick Demo Accounts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('Abebe Kebede', 'grade_12_natural', 'Addis Ababa')}
                    className="text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-xs transition"
                  >
                    <div className="font-bold text-emerald-400">Abebe Kebede</div>
                    <div className="text-[10px] text-slate-400">Grade 12 Natural Science</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('Selamawit Desta', 'grade_8', 'Hawassa')}
                    className="text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-xs transition"
                  >
                    <div className="font-bold text-emerald-400">Selamawit Desta</div>
                    <div className="text-[10px] text-slate-400">Grade 8 Regional</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ADMIN FORM */}
          {authMode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Credentials:</span>
                </div>
                <p className="text-[11px] text-purple-200/90 font-mono">
                  Username: <strong className="text-white bg-purple-950 px-1 py-0.5 rounded border border-purple-500/40">hayma</strong> &nbsp;|&nbsp;
                  Password: <strong className="text-white bg-purple-950 px-1 py-0.5 rounded border border-purple-500/40">hayab2121</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="hayma"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="hayab2121"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Fill Admin Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAdminUsername('hayma');
                    setAdminPassword('hayab2121');
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                >
                  Autofill Credentials (hayma / hayab2121)
                </button>
              </div>

              <button
                type="submit"
                id="btn-admin-submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Login to Admin Center</span>
              </button>
            </form>
          )}
        </div>

        {/* Security / System Footer Note */}
        <div className="text-center text-[11px] text-slate-500">
          <span>Secured Ethiopian National Examination Portal</span>
        </div>
      </div>
    </div>
  );
};
