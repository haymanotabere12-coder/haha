import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  BookOpen, 
  Bookmark, 
  Sparkles, 
  Upload, 
  ZoomIn, 
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  X,
  File,
  Layers,
  Presentation,
  Check,
  Maximize2,
  Minimize2,
  Copy,
  AlignLeft,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Coffee,
  LayoutGrid,
  ExternalLink
} from 'lucide-react';
import { DocumentMaterial, ExamLevel, SubjectInfo, AppUser, Language, ActiveTab } from '../types';
import { saveDocumentBlob, getDocumentBlob, getDocumentObjectUrl } from '../utils/documentFileStorage';

interface DocumentLibraryViewProps {
  documents: DocumentMaterial[];
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  currentUser?: AppUser | null;
  language?: Language;
  selectedDocId?: string | null;
  onOpenAiWithDocument: (doc: DocumentMaterial) => void;
  onUploadDocument?: (doc: DocumentMaterial) => void;
  onSelectLevel?: (level: ExamLevel) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenAuth?: (role?: 'student' | 'teacher' | 'admin', mode?: 'login' | 'register') => void;
}

interface ParsedSlide {
  title: string;
  bullets: string[];
  formula?: string;
  takeaway?: string;
  isVisualOnly?: boolean;
}

interface ParsedPage {
  pageNum: number;
  title: string;
  subtitle?: string;
  content: string;
  bullets?: string[];
  formula?: string;
}

// ---------------------------------------------------------------------------
// REAL DOCUMENT PAGE & SLIDE PARSER
// Uses ONLY the actual text of the document — never invents unrelated lessons,
// generic themes, or placeholder lightbulb formulas.
// ---------------------------------------------------------------------------
const generateCurriculumPages = (
  docTitle: string,
  subject: string,
  chapter: string,
  desiredPageCount: number,
  existingText: string
): { pages: ParsedPage[]; slides: ParsedSlide[] } => {
  const cleanDocTitle = (docTitle || 'Document').trim();
  const cleanSubj = (subject || 'Notes').trim();
  const cleanChap = (chapter || cleanDocTitle).trim();
  const trimmed = (existingText || '').trim();

  let rawChunks: string[] = [];
  let hasExplicitPageMarkers = false;

  if (trimmed) {
    // 1. Explicit page/slide markers (e.g., from uploaded PDFs: === Page 1 ===)
    const pageMarkerSplit = trimmed.split(/\n(?=(?:---+|===+|Page\s+\d+|Slide\s+\d+|ገጽ\s+\d+|ስላይድ\s+\d+))/i);
    if (pageMarkerSplit.length > 1) {
      rawChunks = pageMarkerSplit.map((c) => c.trim()).filter(Boolean);
      hasExplicitPageMarkers = true;
    } else {
      // 2. Numbered/headed sections (1., Section 1, Unit 1, Slide 1:, etc.)
      const numberedSplit = trimmed.split(/\n(?=(?:\d+[\.\)]\s|Section\s+\d+|SECTION\s+\d+|Unit\s+\d+|Chapter\s+\d+|Slide\s+\d+|ክፍል\s+\d+|ምዕራፍ\s+\d+))/i);
      if (numberedSplit.length > 1) {
        rawChunks = numberedSplit.map((c) => c.trim()).filter(Boolean);
      } else {
        // 3. Paragraphs separated by blank lines
        const paragraphSplit = trimmed.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
        if (paragraphSplit.length > 1) {
          rawChunks = paragraphSplit;
        } else {
          // 4. Individual lines if multi-line notes
          const lineSplit = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
          rawChunks = lineSplit.length > 1 ? lineSplit : [trimmed];
        }
      }
    }
  }

  // If explicit page markers exist (e.g. 11 PDF pages), keep exact 1-to-1 count;
  // otherwise keep ONLY the real chunks parsed from existingText (never invent filler pages).
  const targetCount = hasExplicitPageMarkers
    ? Math.max(rawChunks.length, desiredPageCount || 1, 1)
    : Math.max(rawChunks.length, 1);

  const isPlaceholderLine = (line: string) =>
    /^(?:•\s*)?(?:Document page \d+ content from|Authentic page \d+ content extracted from|Section \d+ curriculum notes for|High-yield exam points, formulas, and principles\.?)/i.test(line.trim());

  const isFormulaCandidate = (line: string) => {
    const t = line.trim();
    if (!t || t.length > 120) return false;
    if (/^[=\-_]{2,}/.test(t) || /={3,}/.test(t)) return false;
    return /(?:[A-Za-z0-9\)\]]\s*=\s*[A-Za-z0-9\(\[]|[∝Δλε∑√±×÷²³]|=>|→)/.test(t);
  };

  const pages: ParsedPage[] = [];
  const slides: ParsedSlide[] = [];

  for (let i = 0; i < targetCount; i++) {
    const pageNum = i + 1;
    const rawChunk = rawChunks[i] || '';

    // Strip pure marker header line (=== Page X === / --- / Slide X:)
    const rawLines = rawChunk
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => Boolean(l) && !isPlaceholderLine(l));

    const firstClean = (rawLines[0] || '')
      .replace(/^=+\s*|\s*=+$/g, '')
      .replace(/^-+\s*|\s*-+$/g, '')
      .trim();
    const isPureMarker = /^(?:page|slide|ገጽ|ስላይድ)\s*\d+(?:\s*[:\-–].*)?$/i.test(firstClean) && rawChunk.trim().startsWith('===');

    const contentLines = isPureMarker ? rawLines.slice(1) : rawLines;
    const pageContent = contentLines.join('\n').trim();

    let pageTitle = '';
    if (isPureMarker) {
      const colonIdx = firstClean.indexOf(':');
      if (colonIdx > -1 && firstClean.slice(colonIdx + 1).trim()) {
        pageTitle = firstClean.slice(colonIdx + 1).trim();
      } else if (contentLines[0]) {
        pageTitle = contentLines[0].replace(/^[-•*#\d\.\)]\s*/, '').trim();
      } else {
        pageTitle = `${cleanDocTitle} (${firstClean})`;
      }
    } else if (contentLines[0]) {
      pageTitle = contentLines[0].replace(/^[-•*#\d\.\)]\s*/, '').trim();
    } else {
      pageTitle = `${cleanChap} • Page ${pageNum}`;
    }

    // Build slide bullets strictly from this page's real text
    const explicitBullets = contentLines
      .filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^\d+[\.\)]/.test(l))
      .map((l) => l.replace(/^[-•*#\d\.\)]\s*/, '').trim())
      .filter(Boolean);

    let slideBullets: string[] = [];
    if (explicitBullets.length > 0) {
      slideBullets = explicitBullets.slice(0, 6);
    } else if (contentLines.length > 1) {
      // Skip first line if we already used it cleanly as the slide title
      const bodyLines = contentLines.slice(1).filter(Boolean);
      slideBullets = bodyLines.length > 0 ? bodyLines.slice(0, 6) : contentLines.slice(0, 6);
    } else if (contentLines.length === 1) {
      // Single paragraph line: split into clean readable sentences instead of faking text!
      const singleLine = contentLines[0];
      const sentences = singleLine
        .split(/(?<=[.!?።])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      slideBullets = sentences.length > 1 ? sentences.slice(0, 6) : [singleLine];
    }

    // Only keep a genuine formula line actually present on this page
    const formulaLine = contentLines.find(isFormulaCandidate);

    const isVisualOnly = contentLines.length === 0;

    pages.push({
      pageNum,
      title: pageTitle.length > 75 ? pageTitle.slice(0, 75) + '...' : pageTitle,
      subtitle: `${cleanSubj} • Page ${pageNum} of ${targetCount}`,
      content: pageContent,
      formula: formulaLine,
      bullets: slideBullets,
    });

    slides.push({
      title: pageTitle.length > 70 ? pageTitle.slice(0, 70) + '...' : pageTitle,
      bullets: slideBullets,
      formula: formulaLine,
      takeaway: `${cleanSubj} • Slide ${pageNum} of ${targetCount}`,
      isVisualOnly,
    });
  }

  return { pages, slides };
};

// ---------------------------------------------------------------------------
// GENUINE PDF / FILE CANVAS VIEWER (Never blocked by data: URL iframe restrictions)
// ---------------------------------------------------------------------------
interface PdfCanvasViewerProps {
  docId: string;
  title: string;
  fileType: 'PDF' | 'DOCX' | 'SLIDES';
  fileUrl?: string;
  currentPage: number;
  onPageChange: (p: number) => void;
  onNumPagesLoaded?: (n: number) => void;
  isAm: boolean;
  onSwitchToText: () => void;
}

const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  docId,
  title,
  fileType,
  fileUrl,
  currentPage,
  onPageChange,
  onNumPagesLoaded,
  isAm,
  onSwitchToText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfZoom, setPdfZoom] = useState<number>(1.15);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(fileUrl || null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewerError, setViewerError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let activePdf: any = null;

    const loadBinary = async () => {
      setIsLoading(true);
      setViewerError(null);
      setPdfDoc(null);
      setImageUrl(null);
      setNumPages(0);

      try {
        let bytes: Uint8Array | null = null;
        let mime = '';
        let resolvedUrl: string | null = fileUrl || null;

        const storedBlob = await getDocumentBlob(docId);
        if (storedBlob) {
          mime = storedBlob.type || '';
          resolvedUrl = await getDocumentObjectUrl(docId);
          if (mime.startsWith('image/')) {
            if (!cancelled) {
              setDownloadUrl(resolvedUrl);
              setImageUrl(resolvedUrl);
              setIsLoading(false);
            }
            return;
          }
          if (mime === 'application/pdf' || fileType === 'PDF' || title.toLowerCase().endsWith('.pdf')) {
            const buf = await storedBlob.arrayBuffer();
            bytes = new Uint8Array(buf);
          }
        } else if (fileUrl) {
          if (fileUrl.startsWith('data:image/')) {
            if (!cancelled) {
              setDownloadUrl(fileUrl);
              setImageUrl(fileUrl);
              setIsLoading(false);
            }
            return;
          }
          if (fileUrl.startsWith('data:')) {
            const commaIdx = fileUrl.indexOf(',');
            const header = commaIdx > -1 ? fileUrl.slice(0, commaIdx) : '';
            mime = header.replace(/^data:/, '').replace(/;base64$/, '');
            if (mime === 'application/pdf' || fileType === 'PDF') {
              const b64 = commaIdx > -1 ? fileUrl.slice(commaIdx + 1) : '';
              const bin = atob(b64);
              const arr = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              bytes = arr;
            }
          } else {
            const res = await fetch(fileUrl);
            const blob = await res.blob();
            mime = blob.type || '';
            if (mime.startsWith('image/')) {
              if (!cancelled) {
                setDownloadUrl(fileUrl);
                setImageUrl(fileUrl);
                setIsLoading(false);
              }
              return;
            }
            if (mime === 'application/pdf' || fileType === 'PDF') {
              bytes = new Uint8Array(await blob.arrayBuffer());
            }
          }
        }

        if (!cancelled) setDownloadUrl(resolvedUrl);

        if (!bytes) {
          if (!cancelled) {
            setViewerError(
              resolvedUrl
                ? (isAm ? 'ይህ ፋይል PDF ስላልሆነ በመደበኛ ንባብ ወይም በማውረድ ይክፈቱት።' : 'Non-PDF format detected. Use Normal Reading / Slide View or download the original file.')
                : (isAm ? 'ኦሪጅናል ፋይሉ በማህደር ውስጥ አልተገኘም።' : 'Original binary file not cached in memory.')
            );
            setIsLoading(false);
          }
          return;
        }

        const [pdfjs, workerMod] = await Promise.all([
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        ]);
        if (pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
        }

        const task = pdfjs.getDocument({ data: bytes });
        activePdf = await task.promise;
        if (!cancelled) {
          setPdfDoc(activePdf);
          setNumPages(activePdf.numPages);
          if (onNumPagesLoaded) onNumPagesLoaded(activePdf.numPages);
          setIsLoading(false);
        } else {
          activePdf.destroy?.();
        }
      } catch (err) {
        console.warn('PdfCanvasViewer load error:', err);
        if (!cancelled) {
          setViewerError(isAm ? 'ፒዲኤፍ ፋይሉን መክፈት አልተቻለም። እባክዎ መደበኛ ንባብ ይሞክሩ።' : 'Could not render PDF binary. Try Normal Reading or Download.');
          setIsLoading(false);
        }
      }
    };

    loadBinary();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }
      if (activePdf) {
        try { activePdf.destroy?.(); } catch {}
      }
    };
  }, [docId, fileUrl, fileType, title, isAm]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || numPages === 0) return;

    let cancelled = false;
    const safePage = Math.min(Math.max(1, currentPage), numPages);

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch {}
        }
        const page = await pdfDoc.getPage(safePage);
        if (cancelled || !canvasRef.current) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: pdfZoom });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PDF page render error:', err);
        }
      }
    };

    renderPage();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, numPages, currentPage, pdfZoom]);

  const safePage = numPages > 0 ? Math.min(Math.max(1, currentPage), numPages) : 1;

  return (
    <div className="flex-1 bg-slate-100 flex flex-col justify-between overflow-hidden">
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{title}</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold shrink-0">
            {isAm ? 'ኦሪጅናል ፋይል' : 'Original File'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {numPages > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1.5 py-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setPdfZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] font-bold text-slate-700 w-10 text-center">
                {Math.round(pdfZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPdfZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))}
                className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={title}
              className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-800 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAm ? 'አውርድ' : 'Download'}</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto bg-slate-800 flex items-start justify-center p-4">
        {isLoading ? (
          <div className="m-auto flex flex-col items-center gap-3 text-slate-300 text-xs">
            <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>{isAm ? 'ኦሪጅናል ፋይሉን በመክፈት ላይ...' : 'Rendering original document...'}</span>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full rounded-lg shadow-xl border border-slate-700 bg-white"
          />
        ) : pdfDoc && numPages > 0 ? (
          <div className="my-auto flex flex-col items-center">
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-2xl bg-white max-w-full h-auto"
            />
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3 max-w-sm">
            <FileText className="w-12 h-12 text-slate-500" />
            <p className="text-sm font-bold text-slate-200">
              {viewerError || (isAm ? 'ኦሪጅናል የፋይል ዩአርኤል አልተገኘም' : 'Original binary file not available')}
            </p>
            <button
              type="button"
              onClick={onSwitchToText}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 cursor-pointer"
            >
              {isAm ? 'ወደ መደበኛ ንባብ ተመለስ' : 'Switch to Normal Reading'}
            </button>
          </div>
        )}
      </div>

      {numPages > 0 && (
        <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-30 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isAm ? 'ቀዳሚ ገጽ' : 'Previous'}</span>
          </button>

          <span className="font-mono font-bold text-slate-800">
            {isAm ? 'ገጽ' : 'Page'} {safePage} {isAm ? 'ከ' : 'of'} {numPages}
          </span>

          <button
            type="button"
            disabled={safePage >= numPages}
            onClick={() => onPageChange(Math.min(numPages, safePage + 1))}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-30 flex items-center gap-1 cursor-pointer"
          >
            <span>{isAm ? 'ቀጣይ ገጽ' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  documents: initialDocuments,
  selectedLevel,
  subjects,
  currentUser,
  language = 'en',
  selectedDocId,
  onOpenAiWithDocument,
  onUploadDocument,
  onSelectLevel,
  onNavigate,
  onOpenAuth,
}) => {
  const isAm = language === 'am';
  const isAdmin = currentUser?.role === 'admin';

  const [localDocs, setLocalDocs] = useState<DocumentMaterial[]>(initialDocuments);

  useEffect(() => {
    setLocalDocs(initialDocuments);
  }, [initialDocuments]);

  const currentDocs = localDocs.filter((d) => d.level === selectedLevel);
  const currentSubjects = subjects.filter((s) => s.level === selectedLevel);

  // Search and Category Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Notes' | 'Slides' | 'Exams'>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [viewingDoc, setViewingDoc] = useState<DocumentMaterial | null>(() => {
    if (selectedDocId) {
      const target = initialDocuments.find((d) => d.id === selectedDocId);
      if (target) return target;
    }
    return currentDocs[0] || null;
  });

  useEffect(() => {
    if (selectedDocId) {
      const target = localDocs.find((d) => d.id === selectedDocId);
      if (target) {
        setViewingDoc(target);
        setIsMobileReaderOpen(true);
      }
    }
  }, [selectedDocId, localDocs]);

  // Reader Modes & Controls: 'text' (reading pages), 'slide' (slide presentation), 'file' (original uploaded file preview)
  const [readerMode, setReaderMode] = useState<'text' | 'slide' | 'file'>('text');
  const [textDisplayMode, setTextDisplayMode] = useState<'page' | 'continuous'>('page');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [actualBinaryPages, setActualBinaryPages] = useState<number | null>(null);
  const [showAllSlidesModal, setShowAllSlidesModal] = useState<boolean>(false);

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isMobileReaderOpen, setIsMobileReaderOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ethio_exam_doc_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { 'doc-math-ch1': true, 'doc-phys-notes': true };
  });

  useEffect(() => {
    try {
      localStorage.setItem('ethio_exam_doc_bookmarks', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Voice Read-Aloud (Text-to-Speech)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Modals & Upload State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload form state
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newLevel, setNewLevel] = useState<ExamLevel>(selectedLevel);
  const [newSubject, setNewSubject] = useState<string>(currentSubjects[0]?.name || 'General');
  const [newCategory, setNewCategory] = useState<'Teacher Summary' | 'Ministry Past Papers' | 'Textbook' | 'Formula Sheet' | 'Exit Exam Guide'>('Teacher Summary');
  const [newFileType, setNewFileType] = useState<'SLIDES' | 'PDF' | 'DOCX'>('PDF');
  const [newChapter, setNewChapter] = useState<string>('');
  const [newPageCount, setNewPageCount] = useState<number>(11);
  const [newExcerpt, setNewExcerpt] = useState<string>('');
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadModalSubjects = subjects.filter((s) => s.level === newLevel);

  useEffect(() => {
    setNewLevel(selectedLevel);
  }, [selectedLevel]);

  useEffect(() => {
    const levelSubjects = subjects.filter((s) => s.level === newLevel);
    if (levelSubjects.length > 0 && !levelSubjects.some((s) => s.name === newSubject)) {
      setNewSubject(levelSubjects[0].name);
    }
  }, [newLevel, subjects]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = !prev[id];
      triggerToast(next 
        ? (isAm ? 'በዕልባት ውስጥ ተቀምጧል' : 'Saved to bookmarks') 
        : (isAm ? 'ከዕልባት ተወግዷል' : 'Removed from bookmarks')
      );
      return { ...prev, [id]: next };
    });
  };

  // Stop speech when document changes or unmounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [viewingDoc?.id, readerMode]);

  // Allow Escape key to exit expanded fullscreen reading
  useEffect(() => {
    if (!isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Filtered documents
  const filteredDocs = currentDocs.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      doc.title.toLowerCase().includes(q) ||
      doc.subject.toLowerCase().includes(q) ||
      doc.chapter.toLowerCase().includes(q) ||
      (doc.fullExcerpt && doc.fullExcerpt.toLowerCase().includes(q));
    
    let matchesCategory = true;
    if (selectedCategory === 'Notes') {
      matchesCategory = doc.title.toLowerCase().includes('note') || doc.title.toLowerCase().includes('chapter') || doc.category === 'Teacher Summary' || doc.category === 'Textbook' || doc.category === 'Formula Sheet';
    } else if (selectedCategory === 'Slides') {
      matchesCategory = doc.fileType === 'SLIDES' || doc.title.toLowerCase().includes('slide') || doc.title.toLowerCase().includes('pptx');
    } else if (selectedCategory === 'Exams') {
      matchesCategory = doc.title.toLowerCase().includes('exam') || doc.category === 'Ministry Past Papers' || doc.category === 'Exit Exam Guide' || doc.subject.toLowerCase().includes('exam');
    }

    const matchesSubject = selectedSubjectFilter === 'All' || doc.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesSubject;
  });

  // Keep viewingDoc synced
  useEffect(() => {
    if (filteredDocs.length > 0) {
      if (!viewingDoc || !filteredDocs.some(d => d.id === viewingDoc.id)) {
        setViewingDoc(filteredDocs[0]);
      }
    }
  }, [filteredDocs, viewingDoc]);

  // Track whether currently viewed document has a stored binary in IndexedDB/url
  const [hasBinaryFile, setHasBinaryFile] = useState<boolean>(false);

  // Reset page and slide counters on document switch & detect binary availability
  useEffect(() => {
    let cancelled = false;
    setActiveSlideIndex(0);
    setActivePage(1);
    setActualBinaryPages(null);

    const resolveMode = async () => {
      if (!viewingDoc) {
        setHasBinaryFile(false);
        return;
      }
      const stored = await getDocumentBlob(viewingDoc.id);
      if (cancelled) return;
      const available = Boolean(viewingDoc.fileUrl || stored);
      setHasBinaryFile(available);

      if (available) {
        setReaderMode('file');
      } else if (viewingDoc.fileType === 'SLIDES' || selectedCategory === 'Slides') {
        setReaderMode('slide');
      } else {
        setReaderMode('text');
      }
    };

    resolveMode();
    return () => {
      cancelled = true;
    };
  }, [viewingDoc?.id, selectedCategory]);

  // Generate guaranteed distinct pages and slides based on viewingDoc
  const parsedDocument = React.useMemo(() => {
    const docTitle = viewingDoc?.title || 'Document';
    const subj = viewingDoc?.subject || 'Curriculum';
    const ch = viewingDoc?.chapter || 'National Syllabus';
    const pageNum = actualBinaryPages || viewingDoc?.pages || 11;
    const txt = viewingDoc?.fullExcerpt || '';

    return generateCurriculumPages(docTitle, subj, ch, pageNum, txt);
  }, [viewingDoc, actualBinaryPages]);

  const totalPages = parsedDocument.pages.length;
  const safeActivePage = Math.min(Math.max(1, activePage), totalPages);
  const currentPage = parsedDocument.pages[safeActivePage - 1] || parsedDocument.pages[0];

  const totalSlides = parsedDocument.slides.length;
  const safeActiveSlide = Math.min(Math.max(0, activeSlideIndex), totalSlides - 1);
  const currentSlide = parsedDocument.slides[safeActiveSlide] || parsedDocument.slides[0];

  // Voice Read-Aloud for currently visible page or slide
  const toggleSpeechReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      triggerToast(isAm ? 'ብሮውዘርዎ ድምፅ ማንበብ አይደግፍም' : 'Voice synthesis not supported in this browser');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    let textToRead = '';
    if (readerMode === 'slide') {
      textToRead = `Slide ${safeActiveSlide + 1}. ${currentSlide?.title || ''}. ${currentSlide?.bullets.join('. ') || ''}. ${currentSlide?.formula || ''}`;
    } else {
      textToRead = `Section ${safeActivePage}. ${currentPage?.title || ''}. ${currentPage?.content || ''}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    triggerToast(isAm ? 'ድምፅ ማንበብ ጀመረ...' : 'Reading aloud...');
  };

  // Immediate file upload reader (no setTimeout!)
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileObj(file);
    setUploadedFileName(file.name);
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    setUploadedFileSize(sizeStr);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!newTitle.trim()) {
      setNewTitle(cleanTitle);
    }

    const lowerName = file.name.toLowerCase();
    const isSlides = lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt') || lowerName.includes('slide');
    if (lowerName.includes('exit')) {
      setNewCategory('Exit Exam Guide');
      setNewLevel('university_exit');
      if (!isSlides) setNewFileType('PDF');
    } else if (isSlides) {
      setNewFileType('SLIDES');
      setNewCategory('Teacher Summary');
    } else if (lowerName.includes('exam') || lowerName.includes('past')) {
      setNewCategory('Ministry Past Papers');
      setNewFileType('PDF');
    }

    setIsReadingFile(true);

    // Only build in-memory DataURL for small files (<1.5 MB); larger binaries live in IndexedDB + ObjectURL
    if (file.size <= 1.5 * 1024 * 1024) {
      const dataUrlReader = new FileReader();
      dataUrlReader.onload = (evt) => {
        setUploadedFileDataUrl((evt.target?.result as string) || '');
      };
      dataUrlReader.readAsDataURL(file);
    } else {
      setUploadedFileDataUrl('');
    }

    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');

    if (isText) {
      const textReader = new FileReader();
      textReader.onload = (evt) => {
        const text = (evt.target?.result as string) || '';
        setNewExcerpt(text);
        setIsReadingFile(false);
      };
      textReader.onerror = () => setIsReadingFile(false);
      textReader.readAsText(file);
    } else if (isPdf) {
      // Real client-side PDF text extraction via pdfjs-dist
      const fileArrayBufferReader = new FileReader();
      fileArrayBufferReader.onload = async (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          if (!buffer) throw new Error('No buffer');

          // Dynamically import pdfjs-dist and its local Vite-bundled worker asset
          const [pdfjs, workerMod] = await Promise.all([
            import('pdfjs-dist'),
            import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
          ]);
          if (pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
          }

          const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
          const pdfDoc = await loadingTask.promise;
          const numPages = pdfDoc.numPages;
          setNewPageCount(numPages);

          const extractedPages: string[] = [];
          for (let p = 1; p <= numPages; p++) {
            const page = await pdfDoc.getPage(p);
            const textContent = await page.getTextContent();
            let currentLine = '';
            let lastY: number | null = null;
            const pageLines: string[] = [];

            for (const item of textContent.items as any[]) {
              if (!('str' in item)) continue;
              const str = item.str as string;
              const y = Array.isArray(item.transform) ? item.transform[5] : null;
              if (lastY !== null && y !== null && Math.abs(y - lastY) > 4 && currentLine.trim()) {
                pageLines.push(currentLine.trim());
                currentLine = '';
              }
              currentLine +=
                (currentLine && str && !currentLine.endsWith(' ') && !str.startsWith(' ') ? ' ' : '') + str;
              if (item.hasEOL && currentLine.trim()) {
                pageLines.push(currentLine.trim());
                currentLine = '';
              }
              if (y !== null) lastY = y;
            }
            if (currentLine.trim()) pageLines.push(currentLine.trim());

            const pageText = pageLines.join('\n').trim();
            if (pageText) {
              extractedPages.push(`=== Page ${p} ===\n${pageText}`);
            } else {
              extractedPages.push(`=== Page ${p} ===`);
            }
          }

          const fullExtracted = extractedPages.join('\n\n');
          setNewExcerpt(fullExtracted);
          setIsReadingFile(false);
          triggerToast(isAm ? `${numPages} ገጾች ከPDF ተነበዋል!` : `Extracted ${numPages} pages from PDF!`);
        } catch (err) {
          console.warn('PDF parser fallback:', err);
          setNewExcerpt('');
          setIsReadingFile(false);
        }
      };
      fileArrayBufferReader.onerror = () => setIsReadingFile(false);
      fileArrayBufferReader.readAsArrayBuffer(file);
    } else {
      // Non-text / Office binary files (PPTX/DOCX/Images): do not invent fake curriculum text
      setNewExcerpt('');
      setIsReadingFile(false);
    }
  };

  // Submit Upload
  const handlePublishDocument = () => {
    if (isReadingFile) {
      triggerToast(isAm ? 'እባክዎ ፋይሉ ተነብቦ እስኪያልቅ ትንሽ ይጠብቁ...' : 'Please wait until file extraction completes...');
      return;
    }
    if (!newTitle.trim()) {
      triggerToast(isAm ? 'እባክዎ የሰነዱን ርዕስ ያስገቡ' : 'Please provide a document title');
      return;
    }

    const pagesCount = newPageCount && newPageCount > 0 ? newPageCount : 1;
    const fallbackExcerpt = newExcerpt.trim();

    const docId = `doc-${Date.now()}`;
    const blobUrl = uploadedFileObj ? URL.createObjectURL(uploadedFileObj) : undefined;
    if (uploadedFileObj) {
      saveDocumentBlob(docId, uploadedFileObj).catch(() => {});
    }

    const createdDoc: DocumentMaterial = {
      id: docId,
      title: newTitle.trim(),
      level: newLevel,
      subject: newSubject.trim() || 'General',
      subjectId: 'user-doc',
      chapter: newChapter.trim() || 'Curriculum Revision Material',
      category: newCategory,
      fileType: newFileType,
      uploadedBy: currentUser?.name ? `${currentUser.name}` : (isAm ? 'ተማሪ' : 'Student Contributor'),
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: uploadedFileSize || '2.1 MB',
      pages: pagesCount,
      downloadsCount: 0,
      fullExcerpt: fallbackExcerpt,
      fileUrl: blobUrl || uploadedFileDataUrl || undefined,
    };

    const initialMode: 'text' | 'slide' | 'file' = (blobUrl || uploadedFileDataUrl)
      ? 'file' 
      : newFileType === 'SLIDES' 
        ? 'slide' 
        : 'text';

    setHasBinaryFile(Boolean(blobUrl || uploadedFileDataUrl));
    setLocalDocs((prev) => [createdDoc, ...prev]);

    if (onUploadDocument) {
      onUploadDocument(createdDoc);
    }

    if (newLevel !== selectedLevel && onSelectLevel) {
      onSelectLevel(newLevel);
    }

    if (newLevel === selectedLevel || onSelectLevel) {
      setViewingDoc(createdDoc);
      setReaderMode(initialMode);
      setActiveSlideIndex(0);
      setActivePage(1);
      setIsMobileReaderOpen(true);
      triggerToast(isAm ? `ሰነድ "${createdDoc.title}" (${pagesCount} ገጾች) ተጭኖ ተከፍቷል!` : `Document "${createdDoc.title}" (${pagesCount} pages) loaded & opened!`);
    } else {
      const levelLabel =
        newLevel === 'university_exit'
          ? 'University Exit Exam'
          : newLevel === 'grade_8'
            ? 'Grade 8 Ministry Exam'
            : newLevel === 'grade_12_social'
              ? 'Grade 12 Social Science'
              : 'Grade 12 Natural Science';
      triggerToast(isAm ? `ሰነድ "${createdDoc.title}" በ${levelLabel} ቤተ-መጽሐፍት ተመዝግቧል።` : `Document "${createdDoc.title}" saved under ${levelLabel}.`);
    }

    setShowUploadModal(false);

    // Reset upload form
    setUploadedFileObj(null);
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadedFileDataUrl('');
    setNewTitle('');
    setNewChapter('');
    setNewLevel(selectedLevel);
    setNewPageCount(1);
    setNewExcerpt('');
  };

  const copyExcerptToClipboard = () => {
    if (viewingDoc?.fullExcerpt) {
      navigator.clipboard.writeText(viewingDoc.fullExcerpt);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
      triggerToast(isAm ? 'ጽሑፉ ተገልብጧል' : 'Copied to clipboard');
    }
  };

  const categories = ['All', 'Notes', 'Slides', 'Exams'] as const;

  // Reading Theme CSS classes
  const themeClasses = {
    light: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#fbf0d9] text-[#433422] border-[#ecd5b3]',
    dark: 'bg-slate-900 text-slate-100 border-slate-800',
  }[readingTheme];

  const fontSizeClasses = {
    sm: 'text-xs leading-relaxed',
    base: 'text-sm leading-relaxed',
    lg: 'text-base leading-loose',
    xl: 'text-lg leading-loose',
  }[fontSize];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[70] bg-emerald-700 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-emerald-600 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CLEAN TOP BAR: SEARCH, 4 BUTTONS (NO NUMBERS), AND UPLOAD          */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* 1. Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAm ? 'ሰነዶችን፣ ፎርሙላዎችን ወይም ምዕራፎችን ይፈልጉ...' : 'Search documents, formulas, chapters...'}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-2xs"
            id="input-search-documents"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. ONLY the Category Buttons (NO count numbers on the side) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const label = cat === 'All' 
              ? (isAm ? 'ሁሉም' : 'All')
              : cat === 'Notes' 
                ? (isAm ? 'ማስታወሻዎች' : 'Notes')
                : cat === 'Slides'
                  ? (isAm ? 'ስላይዶች' : 'Slides')
                  : (isAm ? 'ፈተናዎች' : 'Exams');

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                id={`btn-category-${cat.toLowerCase()}`}
              >
                {cat === 'All' && <Layers className="w-3.5 h-3.5" />}
                {cat === 'Notes' && <BookOpen className="w-3.5 h-3.5" />}
                {cat === 'Slides' && <Presentation className="w-3.5 h-3.5" />}
                {cat === 'Exams' && <GraduationCap className="w-3.5 h-3.5" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer active:scale-95 w-full md:w-auto"
          id="btn-upload-document"
        >
          <Upload className="w-4 h-4" />
          <span>{isAm ? 'ሰነድ ጫን' : 'Upload Material'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE SCREEN SWITCHER: DOCUMENT LIST vs ACTIVE READER             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex lg:hidden items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setIsMobileReaderOpen(false)}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
            !isMobileReaderOpen ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isAm ? 'የሰነዶች ዝርዝር' : 'Documents List'}</span>
          <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">{filteredDocs.length}</span>
        </button>
        <button
          onClick={() => setIsMobileReaderOpen(true)}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
            isMobileReaderOpen ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isAm ? 'ማንበቢያ ክፍል' : 'Document Reader'}</span>
          {viewingDoc && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN TWO-COLUMN WORKSPACE: DOCUMENTS LIST & TRUE SLIDE/TEXT READER */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents List (5 cols) */}
        <div className={`space-y-3 max-h-[760px] overflow-y-auto pr-1 ${isMobileReaderOpen ? 'hidden lg:block lg:col-span-5' : 'col-span-12 lg:col-span-5'}`}>
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isAm ? 'ለማንበብ ሰነድ ይምረጡ' : 'Select Document to Read'}</span>
            </span>
            <span className="text-[11px] font-mono">
              {filteredDocs.length} {isAm ? 'ሰነዶች' : 'items'}
            </span>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs shadow-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">
                {isAm ? 'ምንም የሚዛመድ ሰነድ አልተገኘም' : 'No documents found'}
              </div>
              <p className="text-[11px] text-slate-400">
                {isAm ? 'እባክዎ "ሁሉም" የሚለውን ይጫኑ ወይም ፈልጉ።' : 'Try selecting "All" or clearing the search.'}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
              >
                {isAm ? 'ሁሉንም አሳይ' : 'Show All'}
              </button>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = viewingDoc?.id === doc.id;
              const isBookmarked = !!bookmarks[doc.id];
              const isSlide = doc.fileType === 'SLIDES' || doc.title.toLowerCase().includes('slide');

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setViewingDoc(doc);
                    setIsMobileReaderOpen(true);
                    if (doc.fileUrl) {
                      setReaderMode('file');
                    } else if (isSlide) {
                      setReaderMode('slide');
                    }
                  }}
                  className={`cursor-pointer rounded-2xl p-4 border transition flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.subject}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSlide ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {doc.fileType}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(doc.id);
                          }}
                          className="text-slate-400 hover:text-amber-500 transition p-0.5"
                          title={isBookmarked ? (isAm ? 'ከዕልባት አስወግድ' : 'Remove bookmark') : (isAm ? 'ዕልባት አድርግ' : 'Save bookmark')}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {doc.title}
                    </h4>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {doc.chapter} • <span className="text-slate-700 font-semibold">{doc.pages} {isAm ? 'ገጽ/ስላይድ' : 'Pages'}</span> ({doc.fileSize})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px] truncate max-w-[150px]">
                      {isAm ? 'አቅራቢ፦' : 'By'} {doc.uploadedBy}
                    </span>

                    {/* Prominent Standard Reading Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDoc(doc);
                          setIsMobileReaderOpen(true);
                          if (doc.fileUrl) {
                            setReaderMode('file');
                          } else if (isSlide) {
                            setReaderMode('slide');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isAm ? 'ሰነዱን አንብብ' : 'Read Document'}</span>
                      </button>

                      {/* Optional Secondary AI Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAiWithDocument(doc);
                        }}
                        className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1 transition"
                        title={isAm ? 'አማራጭ፦ በ AI ጥያቄ አውጣ' : 'Optional: Practice with AI'}
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: In-Platform Interactive Document & Slide Reader (7 cols) */}
        <div className={`col-span-12 lg:col-span-7 ${!isMobileReaderOpen ? 'hidden lg:block' : 'block'}`}>
          {viewingDoc ? (
            <>
              {isFullScreen && (
                <div
                  className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs"
                  onClick={() => setIsFullScreen(false)}
                />
              )}
              <div
                className={
                  isFullScreen
                    ? `fixed inset-2 sm:inset-6 z-[60] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${themeClasses}`
                    : `rounded-2xl border shadow-xs overflow-hidden flex flex-col h-[760px] ${themeClasses}`
                }
              >
              {/* Document Reader Toolbar */}
              <div className="bg-slate-50/90 dark:bg-slate-800/90 p-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2 truncate max-w-sm">
                  {/* Mobile Back Button */}
                  {isMobileReaderOpen && (
                    <button
                      onClick={() => setIsMobileReaderOpen(false)}
                      className="lg:hidden p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center gap-1 text-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{isAm ? 'ዝርዝር' : 'List'}</span>
                    </button>
                  )}
                  {readerMode === 'slide' ? (
                    <Presentation className="w-4 h-4 text-violet-600 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-bold truncate">
                    {viewingDoc.title}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Mode Switcher: Normal Reading vs Slide View vs Original File */}
                  <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-0.5 shadow-2xs text-[11px] font-bold">
                    <button
                      onClick={() => {
                        if (readerMode === 'slide') {
                          setActivePage(Math.min(Math.max(1, safeActiveSlide + 1), Math.max(1, totalPages)));
                        }
                        setReaderMode('text');
                      }}
                      className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                        readerMode === 'text'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>{isAm ? 'መደበኛ ንባብ' : 'Normal Reading'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSlideIndex(Math.min(Math.max(0, safeActivePage - 1), Math.max(0, totalSlides - 1)));
                        setReaderMode('slide');
                      }}
                      className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                        readerMode === 'slide'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <Presentation className="w-3.5 h-3.5" />
                      <span>{isAm ? 'ስላይድ እይታ' : 'Slide View'}</span>
                    </button>
                    {(viewingDoc.fileUrl || hasBinaryFile) && (
                      <button
                        onClick={() => {
                          if (readerMode === 'slide') {
                            setActivePage(Math.min(Math.max(1, safeActiveSlide + 1), Math.max(1, actualBinaryPages || totalPages)));
                          }
                          setReaderMode('file');
                        }}
                        className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          readerMode === 'file'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                        title={isAm ? 'የተጫነውን ዋና ፋይል በቀጥታ ተመልከት' : 'View original uploaded file directly'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isAm ? 'ኦሪጅናል ፋይል' : 'Original File'}</span>
                      </button>
                    )}
                  </div>

                  {/* If in Text Mode: Page-by-Page vs Continuous Toggle */}
                  {readerMode === 'text' && (
                    <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-0.5 text-[10px] font-bold">
                      <button
                        onClick={() => setTextDisplayMode('page')}
                        className={`px-2 py-0.5 rounded transition cursor-pointer ${textDisplayMode === 'page' ? 'bg-emerald-700 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                        title={isAm ? 'ገጽ በገጽ አንብብ' : 'Page by page'}
                      >
                        {isAm ? 'ገጽ በገጽ' : 'Page-by-Page'}
                      </button>
                      <button
                        onClick={() => setTextDisplayMode('continuous')}
                        className={`px-2 py-0.5 rounded transition cursor-pointer ${textDisplayMode === 'continuous' ? 'bg-emerald-700 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                        title={isAm ? 'ሙሉውን ገጽ በአንድ ላይ አንብብ' : 'Continuous reading'}
                      >
                        {isAm ? 'ቀጣይ ንባብ' : 'Continuous'}
                      </button>
                    </div>
                  )}

                  {/* If in Slide Mode: View All Slides Grid button */}
                  {readerMode === 'slide' && (
                    <button
                      onClick={() => setShowAllSlidesModal(true)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1 shadow-2xs cursor-pointer"
                      title={isAm ? 'ሁሉንም ስላይዶች እይ' : 'View all slides grid'}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAm ? 'ሁሉንም ስላይዶች' : 'All Slides'}</span>
                    </button>
                  )}

                  {/* Voice Read-Aloud Button */}
                  <button
                    onClick={toggleSpeechReadAloud}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                      isSpeaking
                        ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title={isSpeaking ? (isAm ? 'ድምፅ አቁም' : 'Stop voice') : (isAm ? 'በድምፅ አንብብልኝ' : 'Listen to Document')}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{isSpeaking ? (isAm ? 'ድምፅ አቁም' : 'Stop') : (isAm ? '🔊 አድምጥ' : '🔊 Listen')}</span>
                  </button>

                  {/* Reading Themes: Day, Sepia, Night */}
                  <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-0.5 shadow-2xs">
                    <button
                      onClick={() => setReadingTheme('light')}
                      className={`p-1 rounded transition cursor-pointer ${readingTheme === 'light' ? 'bg-amber-100 text-amber-900' : 'text-slate-400'}`}
                      title={isAm ? 'የቀን ንባብ' : 'Light Mode'}
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setReadingTheme('sepia')}
                      className={`p-1 rounded transition cursor-pointer ${readingTheme === 'sepia' ? 'bg-amber-200 text-amber-900' : 'text-slate-400'}`}
                      title={isAm ? 'የመጽሐፍ ወረቀት ንባብ' : 'Sepia Paper Mode'}
                    >
                      <Coffee className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setReadingTheme('dark')}
                      className={`p-1 rounded transition cursor-pointer ${readingTheme === 'dark' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
                      title={isAm ? 'የምሽት ንባብ' : 'Night Mode'}
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Font Size Toggle */}
                  <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-0.5 text-[10px] font-bold">
                    {(['sm', 'base', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setFontSize(sz)}
                        className={`px-1.5 py-0.5 rounded uppercase cursor-pointer ${fontSize === sz ? 'bg-emerald-700 text-white' : 'text-slate-500'}`}
                      >
                        {sz === 'sm' ? 'A-' : sz === 'base' ? 'A' : 'A+'}
                      </button>
                    ))}
                  </div>

                  {/* Expand / Full Screen Toggle Button */}
                  <button
                    onClick={() => setIsFullScreen((prev) => !prev)}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer"
                    title={
                      isFullScreen
                        ? (isAm ? 'ሙሉ ስክሪን ዝጋ' : 'Exit Full Screen')
                        : (isAm ? 'ሙሉ ስክሪን አንብብ' : 'Full Screen Reading')
                    }
                  >
                    {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Download */}
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(viewingDoc.fullExcerpt || viewingDoc.title)}`}
                    download={`${viewingDoc.title.replace(/\s+/g, '_')}.txt`}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                    title={isAm ? 'ሰነድ አውርድ' : 'Download text file'}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {/* Copy */}
                  <button
                    onClick={copyExcerptToClipboard}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer"
                    title={isAm ? 'ጽሑፍ ገልብጥ' : 'Copy document text'}
                  >
                    {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* NORMAL DOCUMENT READING MODE (PAGE-BY-PAGE OR CONTINUOUS)   */}
              {/* ---------------------------------------------------------- */}
              {readerMode === 'text' ? (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                    <div 
                      className={`${isFullScreen ? 'max-w-4xl' : 'max-w-2xl'} mx-auto rounded-2xl p-6 sm:p-8 shadow-xs border transition-transform origin-top leading-loose`}
                      style={{ 
                        transform: `scale(${zoomLevel / 100})`,
                        backgroundColor: readingTheme === 'sepia' ? '#fbf0d9' : readingTheme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: readingTheme === 'sepia' ? '#ecd5b3' : readingTheme === 'dark' ? '#1e293b' : '#e2e8f0',
                        color: readingTheme === 'sepia' ? '#433422' : readingTheme === 'dark' ? '#f1f5f9' : '#0f172a',
                      }}
                    >
                      {/* Document Header */}
                      <div className="text-center pb-6 mb-6 border-b border-current/15">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold block mb-1">
                          Federal Democratic Republic of Ethiopia • Ministry of Education
                        </span>
                        <h2 className="text-lg sm:text-xl font-black">
                          {viewingDoc.title}
                        </h2>
                        <div className="text-xs opacity-75 mt-1 font-medium">
                          {isAm ? 'የትምህርት ዓይነት፦' : 'Subject:'} {viewingDoc.subject} • {isAm ? 'ምዕራፍ፦' : 'Chapter:'} {viewingDoc.chapter}
                        </div>
                      </div>

                      {/* PAGE-BY-PAGE RENDERING: Every page from 1 to totalPages has REAL text! */}
                      {textDisplayMode === 'page' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-current/10">
                            <span className="text-xs font-mono font-bold text-emerald-600 uppercase">
                              {isAm ? 'ገጽ' : 'Page'} {safeActivePage} {isAm ? 'ከ' : 'of'} {totalPages}
                            </span>
                            <span className="text-xs font-bold opacity-80 truncate max-w-sm">
                              {currentPage?.title}
                            </span>
                          </div>

                          <div className={`whitespace-pre-line ${fontSizeClasses} font-serif select-text`}>
                            {currentPage?.content || (
                              <span className="italic text-slate-400">
                                {isAm
                                  ? 'በዚህ ገጽ ላይ የተነበበ ጽሑፍ የለም — "ኦሪጅናል ፋይል" የሚለውን በመጫን ገጹን ይመልከቱ።'
                                  : 'No selectable text on this page — switch to Original File to view the page visually.'}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* CONTINUOUS RENDERING: All pages shown in one scrollable view */
                        <div className="space-y-8">
                          {parsedDocument.pages.map((pg, idx) => (
                            <div key={idx} className="space-y-3 pt-6 first:pt-0 border-t first:border-t-0 border-current/10">
                              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-600">
                                <span>{isAm ? 'ገጽ' : 'Page'} {idx + 1}: {pg.title}</span>
                                <span>{pg.pageNum} / {totalPages}</span>
                              </div>
                              <div className={`whitespace-pre-line ${fontSizeClasses} font-serif select-text`}>
                                {pg.content || (
                                  <span className="italic text-slate-400">
                                    {isAm
                                      ? 'በዚህ ገጽ ላይ የተነበበ ጽሑፍ የለም — "ኦሪጅናል ፋይል" የሚለውን ይመልከቱ።'
                                      : 'No selectable text on this page — switch to Original File to view.'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Note */}
                      <div className="mt-8 pt-4 border-t border-current/10 text-[11px] opacity-60 flex items-center justify-between">
                        <span>{isAm ? 'አዘጋጅ፦' : 'Curriculum Material By:'} {viewingDoc.uploadedBy}</span>
                        <span>{totalPages} {isAm ? 'የተሟሉ ገጾች' : 'Complete Pages'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Text Zoom & Page Navigation (Actively updates content on Next/Previous!) */}
                  <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs opacity-80">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                        className="hover:text-emerald-700 font-bold p-1 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[11px]">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                        className="hover:text-emerald-700 font-bold p-1 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs">
                        {isAm ? 'ገጽ' : 'Page'} {safeActivePage} {isAm ? 'ከ' : 'of'} {totalPages}
                      </span>
                      {textDisplayMode === 'page' && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[150px]">
                          ({currentPage?.title})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={safeActivePage === 1}
                        onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">{isAm ? 'ቀዳሚ ገጽ' : 'Previous'}</span>
                      </button>
                      <button
                        disabled={safeActivePage === totalPages}
                        onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="hidden sm:inline">{isAm ? 'ቀጣይ ገጽ' : 'Next'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : readerMode === 'slide' ? (
                /* -------------------------------------------------------- */
                /* SLIDE PRESENTATION VIEW MODE (AUTHENTIC DOCUMENT SLIDES) */
                /* -------------------------------------------------------- */
                (currentSlide?.isVisualOnly || currentSlide?.bullets.length === 0) && (viewingDoc.fileUrl || hasBinaryFile) ? (
                  <PdfCanvasViewer
                    docId={viewingDoc.id}
                    title={viewingDoc.title}
                    fileType={viewingDoc.fileType}
                    fileUrl={viewingDoc.fileUrl}
                    currentPage={safeActiveSlide + 1}
                    onPageChange={(p) => setActiveSlideIndex(Math.max(0, p - 1))}
                    onNumPagesLoaded={(n) => setActualBinaryPages(n)}
                    isAm={isAm}
                    onSwitchToText={() => setReaderMode('text')}
                  />
                ) : (
                <div className="flex-1 bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                        {viewingDoc.subject} • {viewingDoc.chapter}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(viewingDoc.fileUrl || hasBinaryFile) && (
                        <button
                          onClick={() => {
                            setActivePage(safeActiveSlide + 1);
                            setReaderMode('file');
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer"
                        >
                          {isAm ? 'ኦሪጅናል ገጽ እይ' : 'View Original Page'}
                        </button>
                      )}
                      <button
                        onClick={() => setShowAllSlidesModal(true)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-emerald-300 text-[11px] font-bold cursor-pointer"
                      >
                        {isAm ? 'ሁሉንም ስላይዶች' : 'All Slides'}
                      </button>
                      <div className="font-mono text-emerald-400 font-bold text-xs bg-white/10 px-2 py-0.5 rounded-md">
                        {isAm ? 'ስላይድ' : 'Slide'} {safeActiveSlide + 1} / {totalSlides}
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE SLIDE PRESENTATION CARD */}
                  <div className="my-auto py-6 max-w-2xl mx-auto w-full space-y-6">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                        {currentSlide?.takeaway}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {currentSlide?.title}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {currentSlide?.bullets && currentSlide.bullets.length > 0 ? (
                        currentSlide.bullets.map((bullet, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-xs">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="flex-1">{bullet}</span>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-slate-300 italic">
                          {isAm
                            ? 'በዚህ ስላይድ ላይ የተነበበ ጽሑፍ የለም።'
                            : 'No selectable text on this slide.'}
                        </div>
                      )}
                    </div>

                    {currentSlide?.formula && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs space-y-1">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                          {isAm ? 'ቀመር / ዋና መርህ፦' : 'Key Formula from Page:'}
                        </div>
                        <div className="font-mono text-emerald-200 font-bold text-xs sm:text-sm">
                          {currentSlide.formula}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slide Carousel Controls */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
                    <button
                      disabled={safeActiveSlide === 0}
                      onClick={() => setActiveSlideIndex(i => Math.max(0, i - 1))}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{isAm ? 'ወደኋላ' : 'Previous'}</span>
                    </button>

                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs no-scrollbar py-1">
                      {parsedDocument.slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlideIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                            idx === safeActiveSlide
                              ? 'bg-emerald-400 w-6'
                              : 'bg-white/30 hover:bg-white/60'
                          }`}
                          title={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      disabled={safeActiveSlide === totalSlides - 1}
                      onClick={() => setActiveSlideIndex(i => Math.min(totalSlides - 1, i + 1))}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAm ? 'ወደፊት' : 'Next'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                )
              ) : (
                /* -------------------------------------------------------- */
                /* ORIGINAL UPLOADED FILE VIEW MODE (PDF CANVAS / FILE)     */
                /* -------------------------------------------------------- */
                <PdfCanvasViewer
                  docId={viewingDoc.id}
                  title={viewingDoc.title}
                  fileType={viewingDoc.fileType}
                  fileUrl={viewingDoc.fileUrl}
                  currentPage={activePage}
                  onPageChange={(p) => setActivePage(p)}
                  onNumPagesLoaded={(n) => setActualBinaryPages(n)}
                  isAm={isAm}
                  onSwitchToText={() => setReaderMode('text')}
                />
              )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs shadow-xs space-y-2">
              <FileText className="w-10 h-10 text-slate-300" />
              <div className="font-bold text-slate-700">
                {isAm ? 'ሰነድ አልተመረጠም' : 'No Document Selected'}
              </div>
              <p className="text-slate-400">
                {isAm ? 'በግራ በኩል ካለው ዝርዝር ሰነድ ይምረጡ።' : 'Select a document from the left to read peacefully.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ALL SLIDES GRID OVERVIEW MODAL                                     */}
      {/* ------------------------------------------------------------------ */}
      {showAllSlidesModal && viewingDoc && (
        <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-700 text-white p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">
                  {viewingDoc.title} • {isAm ? 'ሁሉም ስላይዶች' : 'All Slides Grid'} ({totalSlides})
                </h3>
              </div>
              <button
                onClick={() => setShowAllSlidesModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {parsedDocument.slides.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    setShowAllSlidesModal(false);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                    idx === safeActiveSlide
                      ? 'bg-emerald-950/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-emerald-400 font-bold">Slide {idx + 1}</span>
                    {idx === safeActiveSlide && <span className="text-[10px] text-emerald-400 font-bold">Active</span>}
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-3">
                    {s.bullets[0] || s.takeaway || ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DIRECT IN-LIBRARY UPLOAD MODAL                                     */}
      {/* ------------------------------------------------------------------ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-700" />
                <span>
                  {isAdmin 
                    ? (isAm ? 'የአስተዳዳሪ ይፋዊ ሰነድ መጫኛ' : 'Admin: Upload Official Material') 
                    : (isAm ? 'ሰነድ / ስላይድ ወደ ቤተ-መጽሐፍት ጫን' : 'Upload Document / Slides to Library')}
                </span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Upload Dropzone */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isAm ? 'ፋይል ከመሳሪያዎ ይምረጡ (PDF, Slides PPTX, Word, Text) *' : 'Select File (PDF, Slides PPTX, Word, Text) *'}
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                className="hidden"
                id="file-picker-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition space-y-2"
              >
                {uploadedFileObj ? (
                  <div className="flex items-center justify-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="truncate max-w-[240px]">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {uploadedFileName}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold font-mono">
                        {uploadedFileSize} • {isReadingFile ? (isAm ? 'እየተነበበ ነው...' : 'Reading...') : (isAm ? 'ዝግጁ ነው' : 'Ready')}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-emerald-700 font-bold underline">
                      {isAm ? 'ቀይር' : 'Change'}
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">
                      {isAm ? 'ፋይል ለመምረጥ እዚህ ይጫኑ' : 'Click to Browse File from Computer or Phone'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports PDF, PPTX, DOCX, TXT (All pages guaranteed readable)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAm ? 'የሰነዱ / የስላይዱ ርዕስ *' : 'Document / Slide Title *'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isAm ? 'ምሳሌ፦ Grade 12 Physics Mechanics Summary' : 'e.g. Grade 12 Physics Mechanics Summary'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAm ? 'የፈተና ደረጃ / ክፍል *' : 'Exam Level / Track *'}
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as ExamLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="grade_8">{isAm ? '8ኛ ክፍል ክልላዊ ፈተና (Grade 8)' : 'Grade 8 Ministry Exam'}</option>
                    <option value="grade_12_natural">{isAm ? '12ኛ ክፍል የተፈጥሮ ሳይንስ (ESSLCE)' : 'Grade 12 Natural Science (ESSLCE)'}</option>
                    <option value="grade_12_social">{isAm ? '12ኛ ክፍል ማህበራዊ ሳይንስ (ESSLCE)' : 'Grade 12 Social Science (ESSLCE)'}</option>
                    <option value="university_exit">{isAm ? 'የዩኒቨርሲቲ መውጫ ፈተና (Exit Exam)' : 'University Exit Exam'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAm ? 'የትምህርት ዓይነት' : 'Subject'}
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {uploadModalSubjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="General">General Curriculum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAm ? 'መደብ (Category)' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Teacher Summary">{isAm ? 'ማስታወሻ / ማጠቃለያ (Notes)' : 'Notes / Summary'}</option>
                    <option value="Ministry Past Papers">{isAm ? 'ያለፉ ፈተናዎች (Past Papers)' : 'Exams / Past Papers'}</option>
                    <option value="Exit Exam Guide">{isAm ? 'የዩኒቨርሲቲ መውጫ ፈተና (Exit Exam)' : 'Exit Exam Guide'}</option>
                    <option value="Formula Sheet">{isAm ? 'ቀመሮች (Formula Sheet)' : 'Formula Sheet'}</option>
                    <option value="Textbook">{isAm ? 'መማሪያ መጽሐፍ (Textbook)' : 'Textbook Chapter'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAm ? 'ቅርጸት (Format)' : 'Display Format'}
                  </label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium font-bold text-emerald-800"
                  >
                    <option value="PDF">Normal Document (ሰነድ)</option>
                    <option value="SLIDES">Slide Presentation (ስላይድ)</option>
                    <option value="DOCX">Word Document (ጽሑፍ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAm ? 'ምዕራፍ / ርዕስ' : 'Chapter / Topic'}
                  </label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="e.g. Chapter 3: Dynamics"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAm ? 'የገጾች ብዛት (Pages)' : 'Total Pages (e.g. 11)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={newPageCount}
                    onChange={(e) => setNewPageCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAm ? 'የሰነዱ ይዘት' : 'Document Content / Notes'}
                </label>
                <textarea
                  rows={4}
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder={isAm ? 'ማስታወሻ ወይም ጽሑፍ እዚህ መጻፍ ይችላሉ (አማራጭ)' : 'Paste or edit extracted document notes and formulas (optional).'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                {isAm ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                onClick={handlePublishDocument}
                disabled={!newTitle.trim() || isReadingFile}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                {isReadingFile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isAm ? 'ፋይሉን በማንበብ ላይ...' : 'Reading file...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isAm ? `ወደ ቤተ-መጽሐፍት መዝግብ (${newPageCount} ገጾች)` : `Save & Read All ${newPageCount} Pages`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
