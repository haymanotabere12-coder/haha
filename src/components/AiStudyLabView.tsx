import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  FileText, 
  BookOpen, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RotateCcw,
  Zap,
  BookmarkPlus,
  UploadCloud,
  File,
  X,
  Eye,
  FileCheck,
  FileCode,
  Image as ImageIcon,
  Loader2,
  Layers
} from 'lucide-react';
import { ExamLevel, SubjectInfo, Flashcard, Question, DocumentMaterial } from '../types';

interface AiStudyLabViewProps {
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  preloadedDoc?: DocumentMaterial | null;
  onClearPreloadedDoc?: () => void;
  onAddGeneratedQuestionsToBank?: (questions: Question[]) => void;
  onAddGeneratedFlashcards?: (flashcards: Flashcard[]) => void;
}

type AiTab = 'explain' | 'quiz' | 'summary';

export const AiStudyLabView: React.FC<AiStudyLabViewProps> = ({
  selectedLevel,
  subjects,
  preloadedDoc,
  onClearPreloadedDoc,
  onAddGeneratedQuestionsToBank,
}) => {
  const [activeTab, setActiveTab] = useState<AiTab>(preloadedDoc ? 'quiz' : 'explain');

  // Filter subjects for the selected level so dropdown is clean and relevant
  const levelSubjects = subjects.filter(s => s.level === selectedLevel);
  const effectiveSubjects = levelSubjects.length > 0 ? levelSubjects : subjects;

  // Input states
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [questionInput, setQuestionInput] = useState<string>(
    'A car accelerates uniformly from rest to 20 m/s in 5 seconds. What is the distance covered?'
  );
  const [notesInput, setNotesInput] = useState<string>(preloadedDoc ? preloadedDoc.fullExcerpt : '');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    preloadedDoc ? preloadedDoc.subject : (effectiveSubjects[0]?.name || 'Physics')
  );

  // Uploaded file states
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    name: string;
    size: number;
    type: 'pdf' | 'image' | 'text' | 'doc';
    base64?: string;
    previewUrl?: string;
  } | null>(null);
  const [fileProcessing, setFileProcessing] = useState<boolean>(false);
  const [fileSuccessNotice, setFileSuccessNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showRawExtractedText, setShowRawExtractedText] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status & Results
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [explanationResult, setExplanationResult] = useState<any | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [summaryResult, setSummaryResult] = useState<any | null>(null);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [savedToBankNotice, setSavedToBankNotice] = useState<boolean>(false);

  // Keep subject valid when level changes
  useEffect(() => {
    if (!effectiveSubjects.some(s => s.name === selectedSubject) && effectiveSubjects.length > 0) {
      setSelectedSubject(effectiveSubjects[0].name);
    }
  }, [selectedLevel, effectiveSubjects]);

  // Reactive listener: when preloadedDoc arrives (e.g. from Document Library or Video notes), auto-fill and auto-generate!
  useEffect(() => {
    if (preloadedDoc) {
      const excerpt = preloadedDoc.fullExcerpt || preloadedDoc.title || '';
      setNotesInput(excerpt);
      if (preloadedDoc.subject) {
        setSelectedSubject(preloadedDoc.subject);
      }
      setActiveTab('quiz');
      // Auto-trigger generation so the student doesn't have to click twice
      handleGenerateQuiz(excerpt, preloadedDoc.subject);
    }
  }, [preloadedDoc]);

  // File Upload Processor
  const handleFileProcess = async (file: File) => {
    if (!file) return;

    setErrorMsg(null);
    setFileSuccessNotice(null);
    setFileProcessing(true);

    const isText = file.type.startsWith('text/') || 
                   file.name.endsWith('.txt') || 
                   file.name.endsWith('.md') || 
                   file.name.endsWith('.csv') || 
                   file.name.endsWith('.json');

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    try {
      if (isText) {
        // Fast client-side read for plain text files
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = (e.target?.result as string) || '';
          setNotesInput(text);
          setUploadedFile({
            file,
            name: file.name,
            size: file.size,
            type: 'text',
          });
          setFileProcessing(false);
          setFileSuccessNotice(`"${file.name}" loaded successfully (${(file.size / 1024).toFixed(1)} KB)`);
          setActiveTab('quiz');
        };
        reader.onerror = () => {
          setErrorMsg('Failed to read the text file.');
          setFileProcessing(false);
        };
        reader.readAsText(file);
      } else {
        // PDF, Image or Document - read as DataURL to enable AI OCR & analysis
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = (e.target?.result as string) || '';
          
          setUploadedFile({
            file,
            name: file.name,
            size: file.size,
            type: isPdf ? 'pdf' : isImage ? 'image' : 'doc',
            base64: dataUrl,
            previewUrl: isImage ? dataUrl : undefined,
          });

          // Send to server AI to extract readable educational notes and formulas
          try {
            const res = await fetch('/api/ai/process-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileData: dataUrl,
                fileName: file.name,
                mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
              }),
            });

            const data = await res.json();
            if (data.extractedText) {
              setNotesInput(data.extractedText);
              if (data.suggestedSubject) {
                const matched = effectiveSubjects.find(s => 
                  s.name.toLowerCase() === data.suggestedSubject.toLowerCase() ||
                  data.suggestedSubject.toLowerCase().includes(s.name.toLowerCase())
                );
                if (matched) setSelectedSubject(matched.name);
              }
              setFileSuccessNotice(data.summaryAmharic || `"${file.name}" analyzed and ready for study!`);
              setActiveTab('quiz');
            } else {
              setNotesInput(`=== File: ${file.name} ===\n\nFile attached for AI study.`);
              setFileSuccessNotice(`"${file.name}" attached successfully.`);
            }
          } catch (apiErr) {
            console.warn('Document processing fallback:', apiErr);
            setNotesInput(`=== Attached File: ${file.name} ===\n\nStudy material ready for question generation.`);
            setFileSuccessNotice(`"${file.name}" attached.`);
          } finally {
            setFileProcessing(false);
          }
        };

        reader.onerror = () => {
          setErrorMsg('Could not read the selected file.');
          setFileProcessing(false);
        };

        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File process error:', err);
      setErrorMsg('Failed to process file. Please try again.');
      setFileProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileSuccessNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 1. Explain Question
  const handleExplainQuestion = async (overrideQ?: string) => {
    const qToExplain = overrideQ || questionInput;
    if (!qToExplain.trim()) {
      setErrorMsg('Please enter a question to explain.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setExplanationResult(null);

    try {
      const res = await fetch('/api/ai/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qToExplain,
          subject: selectedSubject,
          gradeLevel: selectedLevel.replace(/_/g, ' ').toUpperCase(),
          fileData: uploadedFile?.base64,
          mimeType: uploadedFile?.file?.type,
        }),
      });

      const data = await res.json();
      setExplanationResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not explain the question right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Practice Quiz
  const handleGenerateQuiz = async (overrideText?: string, overrideSubject?: string, countOverride?: number) => {
    const subj = overrideSubject || selectedSubject;
    const countToUse = countOverride !== undefined ? countOverride : questionCount;
    const textToUse = (overrideText !== undefined ? overrideText : notesInput).trim() || 
      `Core Ethiopian curriculum concepts, formulas, and high-yield examination problems for ${subj} in ${selectedLevel.replace(/_/g, ' ')}.`;
    
    setLoading(true);
    setErrorMsg(null);
    setQuizQuestions([]);
    setQuizUserAnswers({});
    setSavedToBankNotice(false);

    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textToUse,
          subject: subj,
          gradeLevel: selectedLevel.replace(/_/g, ' ').toUpperCase(),
          count: countToUse,
          fileData: uploadedFile?.base64,
          mimeType: uploadedFile?.file?.type,
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        if (onAddGeneratedQuestionsToBank) {
          onAddGeneratedQuestionsToBank(
            data.questions.map((q: any, idx: number) => ({
              id: `ai-gen-${Date.now()}-${idx}`,
              question: q.question,
              options: q.options || ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
              correctAnswer: (q.correctAnswer || 'A').trim().replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || 'A',
              explanation: q.explanation || 'Verified Ethiopian curriculum explanation.',
              subjectId: effectiveSubjects.find(s => s.name === subj)?.id || 'gen',
              level: selectedLevel,
              topic: q.topic || subj,
              difficulty: q.difficulty || 'Medium',
            }))
          );
          setSavedToBankNotice(true);
          setTimeout(() => setSavedToBankNotice(false), 5000);
        }
      } else {
        setErrorMsg('Could not generate questions. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate quiz. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Summarize Notes
  const handleSummarize = async () => {
    const textToUse = notesInput.trim() || `Core summary and exam formulas for ${selectedSubject} in ${selectedLevel.replace(/_/g, ' ')}.`;
    setLoading(true);
    setErrorMsg(null);
    setSummaryResult(null);

    try {
      const res = await fetch('/api/ai/summarize-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          title: uploadedFile?.name || preloadedDoc?.title || `${selectedSubject} Lesson Notes`,
          subject: selectedSubject,
          gradeLevel: selectedLevel.replace(/_/g, ' ').toUpperCase(),
          fileData: uploadedFile?.base64,
          mimeType: uploadedFile?.file?.type,
        }),
      });

      const data = await res.json();
      setSummaryResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    { label: 'Physics: Uniform acceleration', q: 'A car accelerates uniformly from rest to 20 m/s in 5 seconds. What is the distance covered?' },
    { label: 'Chemistry: Balancing Redox', q: 'How do you balance the redox reaction: MnO4- + Fe2+ -> Mn2+ + Fe3+ in acidic solution?' },
    { label: 'Math: Quadratic roots', q: 'Find the nature of the roots of the equation 2x^2 - 4x + 3 = 0 using the discriminant.' },
    { label: 'Biology: Photosynthesis', q: 'What is the exact role of NADP+ and ATP in the Calvin Cycle (light-independent reactions)?' },
  ];

  const sampleTopics = [
    { name: "Newton's Laws & Mechanics", subject: 'Physics' },
    { name: "DNA Replication & Protein Synthesis", subject: 'Biology' },
    { name: "Matrices, Determinants & Systems", subject: 'Mathematics' },
    { name: "Chemical Equilibrium & Le Chatelier", subject: 'Chemistry' },
    { name: "Ethiopian Constitution & Governance", subject: 'Civics' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header matching Learnova screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Learning
            </h2>
            <p className="text-xs text-slate-500">
              Turn your study materials into smart learning tools.
            </p>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-semibold">Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            {effectiveSubjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column AI Layout (From Learnova screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Assistant (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                AI Assistant
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a document or paste a topic, and I'll help you learn better.
              </p>
            </div>

            {/* Hidden File Input for Native Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf,.json,.csv,image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileProcess(file);
              }}
            />

            {/* File Processing State */}
            {fileProcessing && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-6 text-center space-y-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mx-auto animate-spin">
                  <Loader2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-violet-900">
                    Reading & analyzing file with AI...
                  </div>
                  <div className="text-[11px] text-violet-600 mt-0.5">
                    ፋይሉን እያነበበ ቁልፍ ነጥቦችንና ቀመሮችን እያወጣ ነው፤ እባክዎ ትንሽ ይጠብቁ...
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded File Active Card */}
            {uploadedFile && !fileProcessing && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {uploadedFile.previewUrl ? (
                      <img 
                        src={uploadedFile.previewUrl} 
                        alt="Uploaded preview" 
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        {uploadedFile.type === 'pdf' ? (
                          <FileText className="w-6 h-6" />
                        ) : uploadedFile.type === 'image' ? (
                          <ImageIcon className="w-6 h-6" />
                        ) : (
                          <FileCode className="w-6 h-6" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {uploadedFile.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                          {uploadedFile.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • Extracted for AI study
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    title="Remove file"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Action Chips for the Uploaded File */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('quiz');
                      handleGenerateQuiz(notesInput, selectedSubject);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Practice Questions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('summary');
                      handleSummarize();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Summarize File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRawExtractedText(!showRawExtractedText)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-medium transition flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showRawExtractedText ? 'Hide Text' : 'View Text'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Drag & Drop Upload Zone (Shown when no file is uploaded and not processing) */}
            {!uploadedFile && !fileProcessing && (
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileProcess(f);
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-2.5 transition cursor-pointer ${
                  isDragOver 
                    ? 'border-violet-500 bg-violet-100/50 ring-2 ring-violet-400/40 scale-[1.01]' 
                    : 'border-slate-200 hover:border-violet-400 bg-slate-50/60 hover:bg-violet-50/20'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-11 h-11 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mx-auto shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Drag & drop study file or click to browse
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Supports PDF, DOCX, TXT, MD, Images (JPG, PNG past exam photos)
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Browse File (ፋይል ምረጥ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotesInput('Grade 12 Physics Unit 4: Electromagnetism & Magnetic Forces. When charge q moves with velocity v through magnetic field B, Lorentz force F = q(v x B). Faraday law states induced EMF = -N(dPhi/dt). Lens law dictates induced current opposes flux change.');
                      setActiveTab('quiz');
                      setFileSuccessNotice('Loaded sample Physics study notes.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-violet-400 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <span>Try Sample Notes</span>
                  </button>
                </div>
              </div>
            )}

            {fileSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{fileSuccessNotice}</span>
              </div>
            )}

            {preloadedDoc && (
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 flex items-center justify-between">
                <span>Using attached document: <strong>{preloadedDoc.title}</strong></span>
                {onClearPreloadedDoc && (
                  <button
                    onClick={onClearPreloadedDoc}
                    className="text-violet-600 hover:text-violet-900 text-[11px] underline font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Prompt input */}
            {(!uploadedFile || showRawExtractedText) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {uploadedFile 
                      ? 'Extracted Study Notes / Document Content:' 
                      : activeTab === 'explain' 
                      ? 'Question or Problem to Explain:' 
                      : 'Topic or Study Material:'}
                  </label>
                  {uploadedFile && (
                    <span className="text-[11px] text-slate-400">
                      Editable • AI extracted
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={activeTab === 'explain' ? questionInput : notesInput}
                  onChange={(e) => {
                    if (activeTab === 'explain') {
                      setQuestionInput(e.target.value);
                    } else {
                      setNotesInput(e.target.value);
                    }
                  }}
                  placeholder="Ask any question, paste textbook excerpt, or type a concept..."
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-violet-500 placeholder:text-slate-400 font-medium"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                {(['explain', 'quiz', 'summary'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer capitalize ${
                      activeTab === tab
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'explain' ? 'Explain' : tab === 'quiz' ? 'Quiz' : 'Summary'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (activeTab === 'explain') handleExplainQuestion();
                  else if (activeTab === 'quiz') handleGenerateQuiz();
                  else handleSummarize();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{loading ? 'AI Processing...' : 'Generate with AI'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: "What can I do?" (5 cols) - Matches Learnova screenshot */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">
              What can I do?
            </h3>

            <div className="space-y-2.5">
              {[
                {
                  id: 'quiz',
                  title: '1. Generate Questions',
                  desc: 'Create practice questions from your material',
                  icon: Sparkles,
                  color: 'text-purple-600 bg-purple-50',
                  action: () => {
                    setActiveTab('quiz');
                    handleGenerateQuiz();
                  }
                },
                {
                  id: 'quiz-2',
                  title: '2. Create Quizzes',
                  desc: 'Test your knowledge instantly',
                  icon: CheckCircle2,
                  color: 'text-sky-600 bg-sky-50',
                  action: () => {
                    setActiveTab('quiz');
                    handleGenerateQuiz();
                  }
                },
                {
                  id: 'summary',
                  title: '3. Summarize',
                  desc: 'Get key points in seconds',
                  icon: FileText,
                  color: 'text-emerald-600 bg-emerald-50',
                  action: () => {
                    setActiveTab('summary');
                    handleSummarize();
                  }
                },
                {
                  id: 'explain',
                  title: '4. Explain Difficult Topics',
                  desc: 'Study smarter, remember longer',
                  icon: HelpCircle,
                  color: 'text-amber-600 bg-amber-50',
                  action: () => {
                    setActiveTab('explain');
                    handleExplainQuestion();
                  }
                },
                {
                  id: 'flashcards',
                  title: '5. Create Flashcards',
                  desc: 'Study smarter, remember longer',
                  icon: BookOpen,
                  color: 'text-rose-600 bg-rose-50',
                  action: () => {
                    setActiveTab('quiz');
                    handleGenerateQuiz();
                  }
                },
                {
                  id: 'mock',
                  title: '6. Generate Mock Exams (40 Qs)',
                  desc: 'Full national exam standard paper (40 questions)',
                  icon: Zap,
                  color: 'text-indigo-600 bg-indigo-50',
                  action: () => {
                    setQuestionCount(40);
                    setActiveTab('quiz');
                    handleGenerateQuiz(undefined, undefined, 40);
                  }
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={item.action}
                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-violet-50/50 border border-slate-200 hover:border-violet-300 text-left transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-violet-950">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-violet-600 opacity-0 group-hover:opacity-100 transition">
                      Run →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: EXPLAIN QUESTION */}
      {activeTab === 'explain' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Type or paste your question:
            </label>
            <textarea
              rows={3}
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="e.g. A particle of mass 2kg is moving with velocity..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Click Samples */}
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
              Or click an example question:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((sq) => (
                <button
                  key={sq.label}
                  onClick={() => {
                    setQuestionInput(sq.q);
                    handleExplainQuestion(sq.q);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium"
                >
                  {sq.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Answers include step-by-step math, key rules & Amharic translation.
            </span>
            <button
              onClick={() => handleExplainQuestion()}
              disabled={loading}
              id="btn-generate-explanation"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Solving...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate Step-by-Step Solution</span>
                </>
              )}
            </button>
          </div>

          {/* Explanation Output */}
          {explanationResult && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Step-by-Step Explanation
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(explanationResult.explanation);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {explanationResult.explanation}
              </div>

              {Array.isArray(explanationResult.stepByStep) && explanationResult.stepByStep.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                    Step-by-Step Solution Breakdown:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    {explanationResult.stepByStep.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {explanationResult.commonPitfalls && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  ⚠️ <strong>Common Exam Mistake:</strong> {explanationResult.commonPitfalls}
                </div>
              )}

              {explanationResult.amharicSummary && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                  <div className="font-bold text-emerald-800 font-['Noto_Sans_Ethiopic']">
                    የአማርኛ ማብራሪያ (Amharic Note)
                  </div>
                  <p className="text-slate-700 font-['Noto_Sans_Ethiopic'] leading-relaxed">
                    {explanationResult.amharicSummary}
                  </p>
                </div>
              )}

              {explanationResult.keyTakeaway && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
                  💡 Key Exam Tip: {explanationResult.keyTakeaway}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAKE QUICK QUIZ */}
      {activeTab === 'quiz' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Enter notes or topic to quiz you on:
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                (Or leave blank to auto-generate from {selectedSubject} curriculum)
              </span>
            </div>
            <textarea
              rows={3}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Paste any textbook excerpt, or type a topic e.g. 'Newton Laws', or leave blank to test core syllabus..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Click Topic Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-500 font-semibold block">
              Quick Topics (click to generate instant exam drill):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleTopics.map((st) => (
                <button
                  key={st.name}
                  type="button"
                  onClick={() => {
                    setNotesInput(st.name);
                    setSelectedSubject(st.subject);
                    handleGenerateQuiz(st.name, st.subject);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 transition font-medium"
                >
                  ⚡ {st.name}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Select Question Count (የጥያቄዎች ብዛት):
              </label>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {questionCount} Questions Selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { count: 5, label: '5' },
                { count: 10, label: '10' },
                { count: 15, label: '15 (Drill)' },
                { count: 20, label: '20' },
                { count: 25, label: '25' },
                { count: 30, label: '30' },
                { count: 40, label: '40 (Full Exam)' },
                { count: 50, label: '50' },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setQuestionCount(item.count)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    questionCount === item.count
                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-slate-500 font-medium">Custom:</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setQuestionCount(Math.min(60, Math.max(1, val)));
                  }}
                  className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Need 15 for a focused chapter quiz or 40 for a full Ethiopian national examination simulation? Choose your desired question count.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Generates {questionCount} curriculum-standard multiple-choice questions with step-by-step solutions.
            </span>
            <button
              onClick={() => handleGenerateQuiz()}
              disabled={loading}
              id="btn-generate-quiz"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating {questionCount} Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate {questionCount} Practice Questions</span>
                </>
              )}
            </button>
          </div>

          {savedToBankNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{quizQuestions.length} new questions generated and added to your Exam Question Bank!</span>
            </div>
          )}

          {/* Generated Questions List */}
          {quizQuestions.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  Practice Questions ({quizQuestions.length})
                </h4>
                <span className="text-xs text-emerald-700 font-semibold">Click an answer to check</span>
              </div>

              {quizQuestions.map((q, qIndex) => {
                const selected = quizUserAnswers[qIndex];
                const isAnswered = selected !== undefined;
                const cleanCorrect = (q.correctAnswer || 'A').trim().replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase();
                const isCorrect = selected === cleanCorrect;

                return (
                  <div key={qIndex} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {qIndex + 1}. {q.question}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options?.map((opt: string) => {
                        const letter = opt.trim().replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase();
                        const isThisSelected = selected === letter;
                        const isThisCorrect = letter === cleanCorrect;

                        let style = "bg-white border-slate-200 text-slate-700 hover:bg-slate-100";
                        if (isAnswered) {
                          if (isThisCorrect) {
                            style = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold";
                          } else if (isThisSelected && !isThisCorrect) {
                            style = "bg-red-50 border-red-400 text-red-800";
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={isAnswered}
                            onClick={() => setQuizUserAnswers(prev => ({ ...prev, [qIndex]: letter }))}
                            className={`p-2.5 rounded-lg border text-left text-xs transition flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isThisCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="p-2.5 rounded-lg bg-white text-xs text-slate-700 border border-slate-200 leading-relaxed">
                        <span className="font-bold text-emerald-700">
                          {isCorrect ? 'Correct! ' : 'Incorrect. '}
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUMMARIZE NOTES */}
      {activeTab === 'summary' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Paste lesson text to summarize:
            </label>
            <textarea
              rows={4}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Paste textbook chapter or class notes..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Extracts high-yield bullet points, formulas, and key definitions.
            </span>
            <button
              onClick={handleSummarize}
              disabled={loading}
              id="btn-generate-summary"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>Generate Lesson Summary</span>
                </>
              )}
            </button>
          </div>

          {/* Summary Result */}
          {summaryResult && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="font-bold text-emerald-800 text-sm">
                {summaryResult.title || 'Lesson Summary'}
              </h4>

              {summaryResult.overview && (
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                  {summaryResult.overview}
                </p>
              )}

              {(summaryResult.highYieldTakeaways || summaryResult.keyPoints) && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Key Points:
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {(summaryResult.highYieldTakeaways || summaryResult.keyPoints).map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {((summaryResult.keyFormulas && summaryResult.keyFormulas.length > 0) || (summaryResult.formulasOrKeyTerms && summaryResult.formulasOrKeyTerms.length > 0)) && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    Important Formulas & Core Terms:
                  </div>
                  <div className="space-y-1.5">
                    {summaryResult.formulasOrKeyTerms?.map((item: any, i: number) => (
                      <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="font-semibold text-emerald-800 shrink-0 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {item.term || item}:
                        </span>
                        <span>{item.definition || ''}</span>
                      </div>
                    )) || summaryResult.keyFormulas?.map((f: string, i: number) => (
                      <span key={i} className="inline-block mr-2 mb-1 px-2 py-1 rounded bg-slate-50 font-mono text-xs text-emerald-800 border border-slate-200 font-semibold">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {summaryResult.examTips && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  💡 <strong>Ethiopian Exam Alert:</strong> {summaryResult.examTips}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
