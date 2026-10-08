import React, { useEffect } from 'react';
import { Radio, Users, ChevronRight, X, Sparkles, Volume2 } from 'lucide-react';
import { ActiveBroadcastInfo } from '../utils/liveStreamService';

interface LiveTeacherNotificationProps {
  broadcast: ActiveBroadcastInfo;
  onJoin: () => void;
  onDismiss: () => void;
}

export const LiveTeacherNotification: React.FC<LiveTeacherNotificationProps> = ({
  broadcast,
  onJoin,
  onDismiss,
}) => {
  // Soft pleasant audio chime on notification popup
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.42);
      }
    } catch {}
  }, [broadcast.roomId]);

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-slate-950/95 text-white p-4 rounded-2xl shadow-2xl border border-red-500/60 backdrop-blur-md relative overflow-hidden ring-4 ring-red-500/20">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-3">
          {/* Pulsing Beacon Avatar */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-600/40">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-ping" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>

          {/* Notification Details */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                ቀጥታ ስርጭት (LIVE)
              </span>
              <span className="text-[11px] font-bold text-slate-400 truncate">
                {broadcast.subject || 'National Exam Prep'}
              </span>
            </div>

            <h4 className="text-sm font-extrabold text-white leading-snug truncate">
              መምህር {broadcast.teacherName} በቀጥታ እያስተማሩ ነው!
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">
              {broadcast.topic || 'የፈተና ክለሳ እና የቀጥታ ጥያቄና መልስ ክፍለ-ጊዜ'}
            </p>

            {/* Quick Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onJoin}
                className="flex-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>አሁን ተቀላቀል (Join Now)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                ቆይቼ
              </button>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            title="ዝጋ (Dismiss)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
