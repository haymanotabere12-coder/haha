import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  BookOpen, 
  Bookmark, 
  Sparkles, 
  Upload, 
  Eye, 
  Check, 
  Share2, 
  ZoomIn, 
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckCircle2
} from 'lucide-react';
import { DocumentMaterial, ExamLevel, SubjectInfo } from '../types';

interface DocumentLibraryViewProps {
  documents: DocumentMaterial[];
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  onOpenAiWithDocument: (doc: DocumentMaterial) => void;
  onUploadDocument?: (doc: DocumentMaterial) => void;
}

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  documents: initialDocuments,
  selectedLevel,
  subjects,
  onOpenAiWithDocument,
  onUploadDocument,
}) => {
  const [localDocs, setLocalDocs] = useState<DocumentMaterial[]>(initialDocuments);
  const currentDocs = localDocs.filter((d) => d.level === selectedLevel);
  const currentSubjects = subjects.filter((s) => s.level === selectedLevel);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [viewingDoc, setViewingDoc] = useState<DocumentMaterial | null>(currentDocs[0] || null);

  // In-reader controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activePage, setActivePage] = useState<number>(1);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({ 'doc-1': true, 'doc-4': true });

  // Upload modal state & Toast
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>(currentSubjects[0]?.name || 'General');
  const [newExcerpt, setNewExcerpt] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = !prev[id];
      triggerToast(next ? 'Saved to bookmarks' : 'Removed from bookmarks');
      return { ...prev, [id]: next };
    });
  };

  const handleCreateDocument = () => {
    if (!newTitle.trim() || !newExcerpt.trim()) {
      triggerToast('Please provide both a title and excerpt text');
      return;
    }

    const createdDoc: DocumentMaterial = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      level: selectedLevel,
      subject: newSubject,
      subjectId: 'custom-doc',
      chapter: 'Custom User Upload',
      category: 'Teacher Summary',
      fileType: 'PDF',
      uploadedBy: 'You (Teacher / Contributor)',
      uploadDate: new Date().toLocaleDateString(),
      fileSize: '1.2 MB',
      pages: 4,
      downloadsCount: 1,
      fullExcerpt: newExcerpt.trim(),
    };

    setLocalDocs((prev) => [createdDoc, ...prev]);
    setViewingDoc(createdDoc);
    if (onUploadDocument) {
      onUploadDocument(createdDoc);
    }
    triggerToast(`Document "${createdDoc.title}" successfully added!`);
    setShowUploadModal(false);
    setNewTitle('');
    setNewExcerpt('');
  };

  const categories = ['All', 'Notes', 'Slides', 'Exams'];

  const filteredDocs = currentDocs.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory === 'Notes') {
      matchesCategory = doc.title.toLowerCase().includes('notes') || doc.title.toLowerCase().includes('chapter') || doc.category === 'Teacher Summary' || doc.fileType === 'PDF';
    } else if (selectedCategory === 'Slides') {
      matchesCategory = doc.fileType === 'SLIDES' || doc.title.toLowerCase().includes('slides') || doc.title.toLowerCase().includes('pptx');
    } else if (selectedCategory === 'Exams') {
      matchesCategory = doc.title.toLowerCase().includes('exam') || doc.category === 'Ministry Past Papers' || doc.subject.toLowerCase().includes('exam');
    }

    const matchesSubject = selectedSubjectFilter === 'All' || doc.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesSubject;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-emerald-600 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Documents & PDFs
            </h2>
            <p className="text-xs text-slate-500">
              Access your study materials anytime.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer active:scale-95"
          id="btn-upload-document"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents, formulas, chapters..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Document List & In-App PDF Reader Modal/Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents List (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredDocs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs shadow-xs">
              No documents match your filters. Try selecting "All" or change the search query.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = viewingDoc?.id === doc.id;
              const isBookmarked = !!bookmarks[doc.id];

              return (
                <div
                  key={doc.id}
                  onClick={() => setViewingDoc(doc)}
                  className={`cursor-pointer rounded-2xl p-4 border transition flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.subject}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(doc.id);
                        }}
                        className="text-slate-400 hover:text-amber-500 transition"
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {doc.title}
                    </h4>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {doc.chapter} • <span className="text-slate-700 font-semibold">{doc.pages} Pages</span> ({doc.fileSize})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      By {doc.uploadedBy}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAiWithDocument(doc);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 transition"
                        title="Generate Quiz & Flashcards from this text"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>AI Study</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: In-Platform Interactive Document & PDF Reader (7 cols) */}
        <div className="lg:col-span-7">
          {viewingDoc ? (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[750px]">
              {/* Document Reader Toolbar */}
              <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate max-w-sm">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-900 truncate">
                    {viewingDoc.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Zoom controls */}
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-mono text-slate-700 shadow-2xs">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                      className="hover:text-emerald-700 px-1 font-bold"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                      className="hover:text-emerald-700 px-1 font-bold"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* AI Questions action */}
                  <button
                    onClick={() => onOpenAiWithDocument(viewingDoc)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Generate Questions</span>
                  </button>

                  {/* Download button */}
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(viewingDoc.fullExcerpt)}`}
                    download={`${viewingDoc.title.replace(/\s+/g, '_')}.txt`}
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs"
                    title="Download document text"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Reader Document Canvas */}
              <div className="flex-1 bg-slate-100/70 p-6 sm:p-8 overflow-y-auto">
                <div 
                  className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-slate-800 shadow-sm leading-relaxed transition-transform origin-top"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <div className="text-center pb-6 mb-6 border-b border-slate-200">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold block mb-1">
                      Federal Democratic Republic of Ethiopia • Ministry of Education
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {viewingDoc.title}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      Subject: {viewingDoc.subject} • Chapter: {viewingDoc.chapter}
                    </div>
                  </div>

                  <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 leading-loose">
                    {viewingDoc.fullExcerpt}
                  </div>
                </div>
              </div>

              {/* Reader Footer Navigation */}
              <div className="bg-white px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <button
                  disabled={activePage === 1}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 hover:text-slate-900 font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Section</span>
                </button>

                <span className="font-mono text-slate-800 font-bold">
                  Section {activePage} of {viewingDoc.pages}
                </span>

                <button
                  disabled={activePage === viewingDoc.pages}
                  onClick={() => setActivePage((p) => Math.min(viewingDoc.pages, p + 1))}
                  className="flex items-center gap-1 hover:text-slate-900 font-medium disabled:opacity-40"
                >
                  <span>Next Section</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-8 text-slate-500 text-xs shadow-xs">
              Select a document on the left to read inside the platform.
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>Upload Document / Notes to Library</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Grade 12 Chemistry Organic Synthesis Notes"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Physics, General Science, Computer Science"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Document Text / Chapter Excerpt
                </label>
                <textarea
                  rows={5}
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Paste textbook summary, notes, or key formulas..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                Publish Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
