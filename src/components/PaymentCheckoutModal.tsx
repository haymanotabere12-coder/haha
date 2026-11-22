import React, { useState } from 'react';
import {
  X,
  Lock,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Building2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Language } from '../types';

export type PaymentPurpose = 'video_upgrade' | 'tutor_access';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  purpose: PaymentPurpose;
  amountBirr: number;
  title: string;
  description: string;
  onConfirmPayment: (details: {
    paymentMethod: string;
    paymentRef: string;
  }) => Promise<void>;
  language?: Language;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  purpose,
  amountBirr,
  title,
  description,
  onConfirmPayment,
  language = 'en',
}) => {
  const isAm = language === 'am';
  const [paymentMethod, setPaymentMethod] = useState<'Telebirr' | 'CBE Birr' | 'Bank Transfer'>('Telebirr');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const merchantHint =
    paymentMethod === 'Telebirr'
      ? 'Telebirr Merchant: 0911-00-22-33 (EthioExam Prep)'
      : paymentMethod === 'CBE Birr'
        ? 'CBE Birr Paybill: 889911 (EthioExam Prep)'
        : 'CBE Account: 1000-4455-88990 (EthioExam Education PLC)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanRef = paymentRef.trim();
    if (cleanRef.length < 4) {
      setError(
        isAm
          ? 'እባክዎ ትክክለኛ የክፍያ ማረጋገጫ ቁጥር (Transaction ID ወይም ስልክ ቁጥር) ያስገቡ።'
          : 'Please enter a valid transaction reference ID or Telebirr/CBE phone number (at least 4 characters).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmPayment({
        paymentMethod,
        paymentRef: cleanRef,
      });
      setPaymentRef('');
      onClose();
    } catch (err: any) {
      setError(err?.message || (isAm ? 'ክፍያውን ማረጋገጥ አልተቻለም።' : 'Could not verify payment. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Lock className="w-3.5 h-3.5" />
            <span>
              {purpose === 'video_upgrade'
                ? isAm
                  ? 'የቪዲዮ ትምህርት አባልነት ማሻሻያ'
                  : 'Unlimited Video Access Upgrade'
                : isAm
                  ? 'የግል አስጠኚ ክፍያ'
                  : 'Personal Tutor Enrollment Payment'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        </div>

        {/* Amount Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {isAm ? 'የሚከፈለው መጠን' : 'Total Fee'}
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {amountBirr.toLocaleString()} ETB
            </div>
          </div>
          <div className="text-right text-xs text-purple-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAm ? 'የአድሚን ማረጋገጫ' : 'Admin Approval'}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              {isAm ? 'የክፍያ ዘዴ ይምረጡ' : 'Select Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Telebirr')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'Telebirr'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Telebirr</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CBE Birr')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'CBE Birr'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>CBE Birr</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Bank Transfer')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'Bank Transfer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Bank</span>
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium space-y-1">
            <div className="font-mono text-[11px]">{merchantHint}</div>
            <p className="text-[11px] text-amber-800">
              {isAm
                ? 'ክፍያውን ከፈጸሙ በኋላ የTransaction መለያ ቁጥሩን ያስገቡ፤ አድሚኑ (Admin) Approve እንዳደረገው ወዲያውኑ ይከፈታል።'
                : 'Transfer the amount above and submit your reference ID. Access unlocks as soon as Admin approves it.'}
            </p>
          </div>

          {/* Reference Input */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {isAm ? 'የክፍያ ማረጋገጫ ቁጥር (Transaction ID / Phone)' : 'Transaction Reference / Sender Phone'}
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. TXN948201 or 0911223344"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              {isAm ? 'ተመለስ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isAm
                    ? 'በማረጋገጥ ላይ...'
                    : 'Verifying...'
                  : isAm
                    ? `ክፍያ ፈጽም (${amountBirr} ብር)`
                    : `Confirm & Pay ${amountBirr} ETB`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
