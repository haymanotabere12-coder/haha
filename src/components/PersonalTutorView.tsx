import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  GraduationCap,
  Lock,
  CheckCircle2,
  Send,
  Calendar,
  BookOpen,
  CreditCard,
  Clock,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  AppUser,
  ExamLevel,
  Language,
  SubjectInfo,
  TutorAssignment,
  TutorTeacherOption,
} from '../types';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';

interface PersonalTutorViewProps {
  currentUser: AppUser;
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  language?: Language;
  onGoToLiveClasses?: () => void;
}

export const PersonalTutorView: React.FC<PersonalTutorViewProps> = ({
  currentUser,
  selectedLevel,
  subjects,
  language = 'en',
  onGoToLiveClasses,
}) => {
  const isAm = language === 'am';
  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';
  const isAdmin = currentUser.role === 'admin';

  const [teachers, setTeachers] = useState<TutorTeacherOption[]>([]);
  const [assignments, setAssignments] = useState<TutorAssignment[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Student Request Form State
  const [requestLevel, setRequestLevel] = useState<ExamLevel>(currentUser.gradeLevel || selectedLevel);
  const levelSubjects = subjects.filter((s) => s.level === requestLevel);
  const [requestSubject, setRequestSubject] = useState<string>(levelSubjects[0]?.name || 'Physics (Natural)');
  const [preferredTeacherId, setPreferredTeacherId] = useState<string>('admin_assign');
  const [planType, setPlanType] = useState<'monthly_tutor' | 'intensive_exam'>('monthly_tutor');
  const [preferredSchedule, setPreferredSchedule] = useState<string>('Weekdays Evening (5:00 PM - 7:00 PM)');
  const [goalNote, setGoalNote] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState<boolean>(false);

  // Payment modal state
  const [payingAssignment, setPayingAssignment] = useState<TutorAssignment | null>(null);

  // Direct chat message input
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Admin inline teacher picker per assignment
  const [adminTeacherPick, setAdminTeacherPick] = useState<Record<string, string>>({});

  useEffect(() => {
    const subs = subjects.filter((s) => s.level === requestLevel);
    if (subs.length > 0 && !subs.some((s) => s.name === requestSubject)) {
      setRequestSubject(subs[0].name);
    }
  }, [requestLevel, subjects, requestSubject]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadTutorData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [teachersRes, myRes] = await Promise.all([
        fetch('/api/tutors/teachers'),
        fetch(
          `/api/tutors/my?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(
            currentUser.role
          )}&userName=${encodeURIComponent(currentUser.name)}`
        ),
      ]);

      if (teachersRes.ok) {
        const tData = await teachersRes.json();
        setTeachers(Array.isArray(tData.teachers) ? tData.teachers : []);
      }
      if (myRes.ok) {
        const mData = await myRes.json();
        const list: TutorAssignment[] = Array.isArray(mData.assignments) ? mData.assignments : [];
        setAssignments(list);
        if (list.length > 0) {
          setActiveAssignmentId((prev) => (prev && list.some((a) => a.id === prev) ? prev : list[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load tutor data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, currentUser.name, currentUser.role]);

  useEffect(() => {
    loadTutorData();
  }, [loadTutorData]);

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId) || assignments[0] || null;

  const handleSubmitTutorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmittingRequest(true);

    const chosenTeacher =
      preferredTeacherId !== 'admin_assign'
        ? teachers.find((t) => t.id === preferredTeacherId)
        : undefined;

    try {
      const res = await fetch('/api/tutors/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.id,
          studentName: currentUser.name,
          gradeLevel: requestLevel,
          subject: requestSubject,
          goalNote: goalNote.trim(),
          preferredSchedule,
          planType,
          preferredTeacherId: chosenTeacher?.id,
          preferredTeacherName: chosenTeacher?.name,
          preferredTeacherSubject: chosenTeacher?.subject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data?.error || 'Could not create tutor request.');
        return;
      }

      const created: TutorAssignment = data.assignment;
      setAssignments((prev) => [created, ...prev]);
      setActiveAssignmentId(created.id);
      setShowNewRequestForm(false);
      setGoalNote('');
      // Prompt payment immediately so student sees the required payment step to enter
      setPayingAssignment(created);
    } catch {
      setFormError('Network error while submitting request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleConfirmTutorPayment = async ({
    paymentMethod,
    paymentRef,
  }: {
    paymentMethod: string;
    paymentRef: string;
  }) => {
    if (!payingAssignment) return;
    const res = await fetch(`/api/tutors/${encodeURIComponent(payingAssignment.id)}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod, paymentRef }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Payment failed');
    }
    const updated: TutorAssignment = data.assignment;
    setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setActiveAssignmentId(updated.id);
    showToast(
      isAm
        ? 'ክፍያ ተልኳል! አስተዳዳሪው (Admin) ሲያጸድቀው ከመምህርዎ ጋር መነጋገር ይችላሉ።'
        : 'Payment submitted! Once Admin approves your request, you can chat with your teacher.'
    );
  };

  const handleAdminAssignTeacher = async (assignmentId: string) => {
    const pickedId = adminTeacherPick[assignmentId] || teachers[0]?.id;
    const teacher = teachers.find((t) => t.id === pickedId);
    if (!teacher) return;

    try {
      const res = await fetch(`/api/tutors/${encodeURIComponent(assignmentId)}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherSubject: teacher.subject,
        }),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? data.assignment : a)));
        showToast(
          isAm
            ? `መምህር ${teacher.name} ተመድበዋል። ለማስጀመር Approve ይጫኑ።`
            : `Assigned ${teacher.name}. Click Approve to unlock tutoring chat.`
        );
      }
    } catch {
      showToast('Failed to assign teacher.');
    }
  };

  const handleAdminApproveAssignment = async (assignment: TutorAssignment, approve: boolean) => {
    const pickedId = adminTeacherPick[assignment.id] || assignment.assignedTeacherId || teachers[0]?.id;
    const teacher = teachers.find((t) => t.id === pickedId);
    try {
      const res = await fetch(`/api/tutors/${encodeURIComponent(assignment.id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approve,
          teacherId: teacher?.id || assignment.assignedTeacherId,
          teacherName: teacher?.name || assignment.assignedTeacherName,
          teacherSubject: teacher?.subject || assignment.assignedTeacherSubject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Could not update approval status.');
        return;
      }
      if (data.assignment) {
        setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? data.assignment : a)));
        showToast(
          approve
            ? isAm
              ? 'የግል አስጠኚ ጥያቄው ጸድቋል! አሁን ተማሪውና መምህሩ መነጋገር ይችላሉ።'
              : 'Tutor request approved! Student and teacher can now communicate.'
            : isAm
              ? 'ማረጋገጫው ተነስቷል።'
              : 'Approval revoked.'
        );
      }
    } catch {
      showToast('Failed to update approval.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !messageInput.trim()) return;
    setIsSendingMsg(true);
    try {
      const res = await fetch(`/api/tutors/${encodeURIComponent(activeAssignment.id)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          text: messageInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Could not send message.');
        return;
      }
      if (data.assignment) {
        setAssignments((prev) => prev.map((a) => (a.id === data.assignment.id ? data.assignment : a)));
      }
      setMessageInput('');
    } finally {
      setIsSendingMsg(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <UserCheck className="w-4 h-4" />
            <span>
              {isAm ? 'የግል አስጠኚ መምህር (1-on-1 Tutoring)' : 'Personal 1-on-1 Teacher Assignment'}
            </span>
          </div>
          <h2 className="font-['Outfit',sans-serif] text-2xl font-bold text-slate-900">
            {isTeacher
              ? isAm
                ? 'የተመደቡልኝ የግል ተማሪዎች'
                : 'My Assigned Private Students'
              : isAdmin
                ? isAm
                  ? 'የግል አስጠኚ መምህር ምደባ እና ክፍያዎች'
                  : 'Personal Tutor Assignments & Payments'
                : isAm
                  ? 'የራስዎን የግል አስጠኚ መምህር ይመደቡ'
                  : 'Get Your Own Personal Teacher'}
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {isStudent
              ? isAm
                ? 'ተጨማሪ ማብራሪያ እና የግል እገዛ ከፈለጉ መምህር እንዲመደብልዎ ይጠይቁ። የተመደበልዎት መምህር ክፍል ለመግባት ክፍያ መፈጸም ያስፈልጋል።'
                : 'Request a dedicated Ethiopian subject teacher for 1-on-1 guidance. Payment is required to unlock and enter your assigned teacher’s private study room.'
              : isTeacher
                ? isAm
                  ? 'ክፍያ የፈጸሙ እና በአስተዳዳሪ የተመደቡልዎት ተማሪዎች ጥያቄዎቻቸውን እዚህ ይልኩልዎታል።'
                  : 'Students who have completed payment and been assigned to you can message and schedule study sessions here.'
                : isAm
                  ? 'ክፍያ የፈጸሙ ተማሪዎችን ከመምህራን ጋር ያገናኙ።'
                  : 'Assign verified teachers to students requesting private 1-on-1 tutoring.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadTutorData}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isAm ? 'አድስ' : 'Refresh'}</span>
          </button>

          {isStudent && assignments.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNewRequestForm(!showNewRequestForm)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition"
            >
              {showNewRequestForm
                ? isAm
                  ? 'ዝጋ'
                  : 'Close Form'
                : isAm
                  ? '+ ሌላ መምህር ጠይቅ'
                  : '+ Request Another Tutor'}
            </button>
          )}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Request Form (for student when needed) OR Assignments List */}
        <div className="lg:col-span-5 space-y-4">
          {isStudent && (assignments.length === 0 || showNewRequestForm) && (
            <form
              onSubmit={handleSubmitTutorRequest}
              className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 text-xs"
            >
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  {isAm ? 'የግል አስጠኚ መምህር መጠየቂያ' : 'Request a Personal Teacher'}
                </h3>
                <p className="text-slate-500">
                  {isAm
                    ? 'የትምህርት አይነቱን እና እቅድዎን ከመረጡ በኋላ ክፍያ ሲፈጽሙ ከመምህርዎ ጋር ይገናኛሉ።'
                    : 'Choose your subject and package, then complete payment to enter your teacher’s room.'}
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAm ? 'የፈተና ደረጃ' : 'Exam Level'}
                  </label>
                  <select
                    value={requestLevel}
                    onChange={(e) => setRequestLevel(e.target.value as ExamLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                  >
                    <option value="grade_12_natural">Grade 12 Natural</option>
                    <option value="grade_12_social">Grade 12 Social</option>
                    <option value="grade_8">Grade 8 Ministry</option>
                    <option value="university_exit">University Exit Exam</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAm ? 'የትምህርት አይነት' : 'Subject'}
                  </label>
                  <select
                    value={requestSubject}
                    onChange={(e) => setRequestSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                  >
                    {levelSubjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAm ? 'የመምህር ምርጫ' : 'Teacher Preference'}
                </label>
                <select
                  value={preferredTeacherId}
                  onChange={(e) => setPreferredTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="admin_assign">
                    {isAm ? 'አስተዳዳሪው ተስማሚ መምህር ይመድብልኝ (Recommended)' : 'Let Admin Assign Best Teacher (Recommended)'}
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  {isAm ? 'የአስጠኚ ክፍያ እቅድ' : 'Tutoring Package'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlanType('monthly_tutor')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      planType === 'monthly_tutor'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{isAm ? 'ወርሃዊ አስጠኚ' : 'Monthly Tutor'}</div>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5 tabular-nums">850 ETB</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanType('intensive_exam')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      planType === 'intensive_exam'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{isAm ? 'ሙሉ ፈተና ዝግጅት' : 'Exam Bootcamp'}</div>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5 tabular-nums">1,800 ETB</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAm ? 'የጥናት ሰዓት ምርጫ' : 'Preferred Schedule'}
                </label>
                <input
                  type="text"
                  value={preferredSchedule}
                  onChange={(e) => setPreferredSchedule(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAm ? 'ማሻሻል የሚፈልጉት ርዕስ / ግብ' : 'Topics or Goals'}
                </label>
                <textarea
                  rows={2}
                  value={goalNote}
                  onChange={(e) => setGoalNote(e.target.value)}
                  placeholder={
                    isAm
                      ? 'ለምሳሌ፡ በElectromagnetism እና Calculus ላይ ተጨማሪ ልምምድ እፈልጋለሁ...'
                      : 'e.g. Need extra help with Electromagnetism & past ESSLCE problems...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold cursor-pointer transition"
              >
                {isSubmittingRequest
                  ? isAm
                    ? 'በማስገባት ላይ...'
                    : 'Submitting...'
                  : isAm
                    ? 'ጥያቄ አስገባ እና ክፍያ ፈጽም'
                    : 'Request Tutor & Proceed to Payment'}
              </button>
            </form>
          )}

          {/* List of Requests / Assignments */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 px-1">
              {isStudent
                ? isAm
                  ? `የእኔ የአስጠኚ ጥያቄዎች (${assignments.length})`
                  : `My Tutor Requests (${assignments.length})`
                : isTeacher
                  ? isAm
                    ? `የተመደቡልኝ ተማሪዎች (${assignments.length})`
                    : `Assigned Students (${assignments.length})`
                  : `All Tutor Requests (${assignments.length})`}
            </h3>

            {assignments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {isTeacher
                  ? isAm
                    ? 'እስካሁን የተመደበልዎት ተማሪ የለም።'
                    : 'No students have been assigned to you yet.'
                  : isAm
                    ? 'ገና የግል አስጠኚ አልጠየቁም።'
                    : 'No tutor requests yet.'}
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((item) => {
                  const isSelected = activeAssignment?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveAssignmentId(item.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {isStudent ? item.subject : `${item.studentName} · ${item.subject}`}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-600 tabular-nums shrink-0">
                          {item.amountBirr} ETB
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span>
                          {item.assignedTeacherName
                            ? `${isAm ? 'መምህር፦' : 'Tutor:'} ${item.assignedTeacherName}`
                            : isAm
                              ? 'መምህር በመመደብ ላይ'
                              : 'Awaiting Teacher Assignment'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            !item.isPaid
                              ? 'text-amber-700 font-semibold'
                              : item.adminApproved
                                ? 'text-emerald-700 font-semibold'
                                : 'text-purple-700 font-semibold'
                          }
                        >
                          {!item.isPaid
                            ? isAm
                              ? 'ክፍያ ይቀራል'
                              : 'Payment Required'
                            : item.adminApproved
                              ? isAm
                                ? 'ጸድቋል • ክፍት ነው'
                                : 'Admin Approved'
                              : isAm
                                ? 'የአድሚን Approve ይጠብቃል'
                                : 'Pending Admin Approval'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tutor Workspace / Payment Lock Gate */}
        <div className="lg:col-span-7">
          {!activeAssignment ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {isAm ? 'ከግል መምህር ጋር በቀጥታ ይማሩ' : 'Learn 1-on-1 with a Dedicated Teacher'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isAm
                  ? 'የግል አስጠኚ ሲጠይቁ እና ክፍያ ሲፈጽሙ የመምህርዎን የግል የጥናት ክፍል መግባት ይችላሉ።'
                  : 'Submit a tutor request on the left and complete payment to unlock direct 1-on-1 access to your assigned teacher.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              {/* Top Assignment Summary */}
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{activeAssignment.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeAssignment.gradeLevel.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {activeAssignment.assignedTeacherName
                      ? `${activeAssignment.assignedTeacherName}`
                      : isAm
                        ? 'መምህር በመመደብ ላይ ነው'
                        : 'Pending Teacher Assignment'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeAssignment.preferredSchedule}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!activeAssignment.isPaid ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <Lock className="w-4 h-4" />
                      <span>{isAm ? 'ክፍያ ያስፈልጋል' : 'Payment Required'}</span>
                    </span>
                  ) : !activeAssignment.adminApproved ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700">
                      <Clock className="w-4 h-4" />
                      <span>{isAm ? 'የአድሚን Approve ይጠብቃል' : 'Pending Admin Approval'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAm ? 'ጸድቋል እና ክፍት ነው' : 'Approved & Active'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Inline Assignment & Approval Bar */}
              {isAdmin && (
                <div className="px-5 py-3 bg-purple-50 border-b border-purple-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-purple-900">
                    {isAm ? 'የአድሚን መምህር ምደባ እና ማጽደቂያ፦' : 'Admin Teacher Assign & Approval:'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={adminTeacherPick[activeAssignment.id] || activeAssignment.assignedTeacherId || teachers[0]?.id || ''}
                      onChange={(e) =>
                        setAdminTeacherPick((prev) => ({ ...prev, [activeAssignment.id]: e.target.value }))
                      }
                      className="px-3 py-1.5 rounded-lg border border-purple-200 bg-white font-semibold text-slate-800"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subject})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAdminAssignTeacher(activeAssignment.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer"
                    >
                      {isAm ? 'መምህር መድብ' : 'Assign'}
                    </button>
                    {activeAssignment.adminApproved ? (
                      <button
                        type="button"
                        onClick={() => handleAdminApproveAssignment(activeAssignment, false)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                      >
                        {isAm ? 'አግድ (Revoke)' : 'Revoke Approval'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!activeAssignment.isPaid}
                        onClick={() => handleAdminApproveAssignment(activeAssignment, true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold cursor-pointer"
                      >
                        {isAm ? 'አጽድቅ (Approve Chat)' : 'Approve & Unlock Chat'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Gate 1: Payment Required before entering assigned teacher room */}
              {isStudent && !activeAssignment.isPaid ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="text-lg font-bold text-slate-900">
                      {isAm
                        ? 'ወደ መምህርዎ ክፍል ለመግባት ክፍያ መፈጸም አለብዎት'
                        : 'Payment Required to Enter Your Personal Tutor Room'}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {activeAssignment.assignedTeacherName
                        ? isAm
                          ? `መምህር ${activeAssignment.assignedTeacherName} ተመድበውልዎታል። ከመምህርዎ ጋር መነጋገር ለመጀመር የ${activeAssignment.amountBirr} ብር ክፍያውን ፈጽመው የአድሚን ማረጋገጫ ይጠብቁ።`
                          : `${activeAssignment.assignedTeacherName} is selected for your ${activeAssignment.subject} tutoring. Complete the ${activeAssignment.amountBirr} ETB fee, then Admin will approve your chat access.`
                        : isAm
                          ? `የ${activeAssignment.subject} የግል አስጠኚ ጥያቄዎ ገብቷል። የ${activeAssignment.amountBirr} ብር ክፍያውን ይፈጽሙ።`
                          : `Your tutoring request for ${activeAssignment.subject} is saved. Complete the ${activeAssignment.amountBirr} ETB payment and wait for Admin approval.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPayingAssignment(activeAssignment)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isAm
                        ? `ክፍያ ፈጽም (${activeAssignment.amountBirr} ብር)`
                        : `Pay ${activeAssignment.amountBirr} ETB & Submit for Approval`}
                    </span>
                  </button>
                </div>
              ) : !activeAssignment.adminApproved ? (
                /* Gate 2: Admin Approval Required before student & teacher can communicate */
                <div className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {!activeAssignment.isPaid
                      ? isAm
                        ? 'ተማሪው ክፍያ ገና አልፈጸመም'
                        : 'Waiting for Student Payment'
                      : isAm
                        ? 'ክፍያ ተፈጽሟል — የአድሚን ማረጋገጫ (Approval) በመጠባበቅ ላይ ነው'
                        : 'Payment Received — Waiting for Admin Approval'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    {!activeAssignment.isPaid
                      ? isAm
                        ? 'ተማሪው ክፍያ ፈጽሞ አድሚኑ (Admin) Approve ሳያደርግ ውይይት መጀመር አይቻልም።'
                        : 'Student payment and Admin approval are both required before tutoring chat opens.'
                      : isAm
                        ? `የክፍያ መለያ (${activeAssignment.paymentRef || ''}) ተልኳል። አድሚኑ ሲያጸድቀው (Approve ሲያደርግ) ከመምህር ጋር በቀጥታ መነጋገር ይቻላል።`
                        : `Payment ref ${activeAssignment.paymentRef || ''} is recorded. Admin must approve this request before student and teacher can talk here.`}
                  </p>
                  {isAdmin && activeAssignment.isPaid && (
                    <button
                      type="button"
                      onClick={() => handleAdminApproveAssignment(activeAssignment, true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAm ? 'አሁን አጽድቅ (Approve & Unlock Chat)' : 'Approve & Unlock Tutor Room'}</span>
                    </button>
                  )}
                </div>
              ) : !activeAssignment.assignedTeacherName ? (
                /* Gate 3: Approved/Paid, waiting for Teacher assignment */
                <div className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {isAm
                      ? 'መምህር በመመደብ ላይ ነው'
                      : 'Assigning Your Teacher'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    {isAm
                      ? 'አድሚኑ መምህር እንደመደበልዎት እዚህ በቀጥታ መማር ይጀምራሉ።'
                      : 'As soon as Admin assigns your subject teacher, your private classroom will open here.'}
                  </p>
                </div>
              ) : (
                /* Unlocked Private 1-on-1 Tutor Room */
                <div className="flex flex-col">
                  <div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                      <MessageSquare className="w-4 h-4 text-emerald-700" />
                      <span>
                        {isAm
                          ? 'የግል አስጠኚ የውይይት እና የጥናት ክፍል ክፍት ነው'
                          : 'Private 1-on-1 Tutoring Room Active'}
                      </span>
                    </div>
                    {onGoToLiveClasses && (
                      <button
                        type="button"
                        onClick={onGoToLiveClasses}
                        className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
                      >
                        {isAm ? 'ወደ Live ክፍል ሂድ' : 'Open Live Classroom'}
                      </button>
                    )}
                  </div>

                  {/* Goal summary */}
                  <div className="px-5 py-2.5 bg-white border-b border-slate-100 text-xs text-slate-600">
                    <strong className="text-slate-800">{isAm ? 'የጥናት ግብ፦' : 'Study Goal:'}</strong>{' '}
                    {activeAssignment.goalNote}
                  </div>

                  {/* Message Thread */}
                  <div className="p-5 space-y-3 max-h-[340px] overflow-y-auto bg-slate-50/50">
                    {activeAssignment.messages.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-8">
                        {isAm
                          ? 'መልዕክት በመላክ የግል ትምህርትዎን ይጀምሩ!'
                          : 'Start your 1-on-1 study conversation below.'}
                      </div>
                    ) : (
                      activeAssignment.messages.map((msg) => {
                        const isMine = msg.senderId === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            <div className="text-[11px] text-slate-500 mb-1 px-1">
                              {msg.senderName} ·{' '}
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div
                              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                isMine
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-white border border-slate-200 text-slate-800'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send Message Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={
                        isAm
                          ? 'ለመምህርዎ ጥያቄ ወይም መልዕክት ይጻፉ...'
                          : 'Write a question or study update...'
                      }
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMsg || !messageInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAm ? 'ላክ' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentCheckoutModal
        isOpen={Boolean(payingAssignment)}
        onClose={() => setPayingAssignment(null)}
        purpose="tutor_access"
        amountBirr={payingAssignment?.amountBirr || 850}
        title={
          isAm
            ? `የግል አስጠኚ ክፍያ (${payingAssignment?.subject || ''})`
            : `Personal Tutor Access (${payingAssignment?.subject || ''})`
        }
        description={
          isAm
            ? 'ክፍያው ከተላከ በኋላ አድሚኑ (Admin) Approve ሲያደርገው ከመምህርዎ ጋር መነጋገር ይችላሉ።'
            : 'Once payment is submitted, Admin will review and approve your room so you can talk with your teacher.'
        }
        onConfirmPayment={handleConfirmTutorPayment}
        language={language}
      />
    </div>
  );
};
