import React, { useEffect, useState } from 'react';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface SplashScreenProps {
  onFinish: () => void;
  language?: Language;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  language = 'en',
}) => {
  const isAm = language === 'am';
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 1750);

    const doneTimer = setTimeout(() => {
      onFinish();
    }, 2150);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  const handleDismiss = () => {
    setFadingOut(true);
    setTimeout(onFinish, 220);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white px-6 transition-opacity duration-400 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-label="EthioExam Prep Welcome"
    >
      {/* Subtle architectural gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[280px] h-[280px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        {/* Brand Emblem */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-950/60 border border-emerald-400/30 transform transition-transform duration-500 scale-100">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>

        {/* Display Title */}
        <div className="space-y-2">
          <h1 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ethio<span className="text-emerald-400">Exam</span> Prep
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            {isAm
              ? 'የኢትዮጵያ ብሔራዊ ፈተናዎች (8ኛ፣ 12ኛ ክፍል እና Exit Exam) የጥናት፣ የቪዲዮ እና የግል አስጠኚ መድረክ'
              : 'Ethiopian National Exams, Video Lessons & Personal Tutoring Platform'}
          </p>
        </div>

        {/* Curriculum Scope Summary */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
          <span>Grade 8 Ministry</span>
          <span aria-hidden="true">·</span>
          <span>Grade 12 ESSLCE</span>
          <span aria-hidden="true">·</span>
          <span>University Exit</span>
        </div>

        {/* Loading indicator bar */}
        <div className="max-w-xs mx-auto pt-2 space-y-4">
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 rounded-full transition-transform duration-1000 origin-left"
              style={{ animation: 'splashProgress 1.75s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            />
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer"
          >
            <span>{isAm ? 'ወደ መድረኩ ግባ' : 'Enter Platform'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes splashProgress {
          from { transform: scaleX(0.08); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};
