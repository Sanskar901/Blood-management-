import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Lock,
  ArrowRight
} from '../components/Icons';
import { BloodRequest, RequestStatus } from '../types';
import { api } from '../services/api';

interface RequestTrackingPageProps {
  initialToken?: string;
}

export const RequestTrackingPage: React.FC<RequestTrackingPageProps> = ({ initialToken = '' }) => {
  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [requestData, setRequestData] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>('29:59');

  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchRequest = async (token: string) => {
    if (!token.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await api.trackRequest(token.trim());
      setRequestData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not find request with this token.');
      setRequestData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      fetchRequest(initialToken);
    }
  }, [initialToken]);

  // Mock / real countdown timer for active hold
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const parts = prev.split(':').map(Number);
        let seconds = parts[0] * 60 + parts[1] - 1;
        if (seconds <= 0) return '00:00 (Hold Expired)';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancelHold = async () => {
    if (!requestData?.id) return;
    setCancelLoading(true);
    setErrorMsg('');
    try {
      await api.updateRequestStatus(requestData.id, 'CANCELLED', 'Requester released hold');
      setSuccessMsg('Emergency reservation hold has been released.');
      await fetchRequest(requestData.tracking_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel hold');
    } finally {
      setCancelLoading(false);
    }
  };

  const steps: { key: RequestStatus; label: string }[] = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'RESERVED', label: 'Inventory Locked (30m Hold)' },
    { key: 'APPROVED', label: 'Clinically Cross-Matched' },
    { key: 'FULFILLED', label: 'Units Issued & Collected' },
  ];

  const getStepIndex = (status: RequestStatus) => {
    if (status === 'SUBMITTED') return 0;
    if (status === 'RESERVED') return 1;
    if (status === 'APPROVED') return 2;
    if (status === 'FULFILLED') return 3;
    return -1;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Bar Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Request Status & Emergency Hold Tracker
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">
          Enter your unique tracking token to view real-time reservation status, countdown timer, and hospital issue instructions.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchRequest(tokenInput);
          }}
          className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Paste Tracking Token (e.g. 8d39f4a1-b847-4921-93c2-fa7a17bc6719)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 shrink-0"
          >
            {loading ? 'Tracking...' : 'Track Request'}
          </button>
        </form>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 p-1">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-950 p-1">✕</button>
        </div>
      )}

      {/* Request Details View */}
      {requestData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  {requestData.urgency_level.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Token: {requestData.tracking_token.substring(0, 13)}...
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {requestData.units_requested} Unit(s) of {requestData.product?.blood_group} {requestData.product?.component_type}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Patient Case Code: <strong className="text-slate-700">{requestData.patient_reference_code}</strong>
              </p>
            </div>

            {/* Hold Status Badge */}
            <div className="text-right sm:text-right">
              {requestData.status === 'RESERVED' && (
                <div className="inline-block bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Emergency Hold Active</span>
                  </div>
                  <p className="text-xl font-mono font-extrabold text-amber-900 mt-0.5">{timeLeft}</p>
                  <p className="text-[10px] text-amber-700">Units locked exclusively for you</p>
                </div>
              )}

              {requestData.status === 'FULFILLED' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Issue Completed & Fulfilled</span>
                </div>
              )}

              {requestData.status === 'CANCELLED' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-bold">
                  <XCircle className="w-5 h-5 text-slate-500" />
                  <span>Hold Released / Cancelled</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workflow Progression</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
              {steps.map((st, idx) => {
                const currentIdx = getStepIndex(requestData.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                return (
                  <div
                    key={st.key}
                    className={`p-3 rounded-xl border text-xs font-medium transition ${
                      isCurrent
                        ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                        : isPassed
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-white border-slate-100 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300 inline-block text-center text-[10px] leading-3.5">
                          {idx + 1}
                        </span>
                      )}
                      <span className="font-semibold">{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Next Steps for Requester / Hospital Representative</span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
              >
                <span>🖨️ Print Transfusion Requisition Slip</span>
              </button>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Proceed to the blood bank reception at the assigned hospital with the patient's blood sample for mandatory cross-match testing.</li>
              <li>Provide the hospital staff with your tracking token: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-800">{requestData.tracking_token}</code>.</li>
              <li>Final blood component issue is subject to clinical cross-match approval by hospital pathologist.</li>
            </ul>
          </div>

          {/* Action: Release Hold if no longer needed */}
          {requestData.status === 'RESERVED' && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                No longer need these units? Release the hold immediately so other emergency patients can reserve them.
              </p>
              <button
                type="button"
                onClick={handleCancelHold}
                disabled={cancelLoading}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition disabled:opacity-50"
              >
                {cancelLoading ? 'Releasing...' : 'Release Hold'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
