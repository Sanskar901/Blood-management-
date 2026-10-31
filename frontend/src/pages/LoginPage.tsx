import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Building2, User, CheckCircle2 } from '../components/Icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess: (targetView: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [portalType, setPortalType] = useState<'staff' | 'public'>('staff');

  // Sign in form state
  const [email, setEmail] = useState<string>('staff@apollo.local');
  const [password, setPassword] = useState<string>('Hospital@12345');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<boolean>(false);

  // Quick preset helper state
  const [showPresets, setShowPresets] = useState<boolean>(false);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    if (!targetEmail || !targetPass) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.login(targetEmail.trim(), targetPass);
      login(data.access_token, {
        id: data.user_id,
        email: targetEmail.trim(),
        full_name: data.full_name,
        role: data.role as any,
        hospital_id: data.hospital_id,
        is_active: true,
      });

      if (data.role === 'SUPER_ADMIN') {
        onSuccess('admin');
      } else if (data.role === 'HOSPITAL_STAFF') {
        onSuccess('hospital');
      } else {
        onSuccess('search');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      setErrorMsg('Please fill all required registration fields.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await api.register({
        email: regEmail.trim(),
        password: regPassword,
        full_name: regName.trim(),
        phone_number: regPhone.trim() || undefined,
      });
      setRegSuccess(true);
      // Auto login after registration
      setTimeout(() => {
        handleLogin(undefined, regEmail.trim(), regPassword);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (pEmail: string, pPass: string, type: 'staff' | 'public') => {
    setEmail(pEmail);
    setPassword(pPass);
    setPortalType(type);
    handleLogin(undefined, pEmail, pPass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">BloodConnect Portal</h2>
          <p className="text-xs text-slate-500">
            Secure multi-hospital transfusion authorization & discovery
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Citizen Registration
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {regSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Account created successfully! Signing you in...</span>
          </div>
        )}

        {activeTab === 'signin' ? (
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
                <span className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer">Forgot password?</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Legal Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Dr. Rajesh / Priya Verma"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="citizen@domain.com"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Helpline / Contact</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+91-9876543210"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Secure Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register Public Account'}
            </button>
          </form>
        )}

        {/* Directory Presets for Evaluation Convenience */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition flex items-center justify-center gap-1.5"
          >
            <span>{showPresets ? 'Hide Fast Evaluation Directory ▲' : 'Show Fast Evaluation Directory ▼'}</span>
          </button>

          {showPresets && (
            <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Click to load role credentials:
              </span>

              <button
                type="button"
                onClick={() => selectPreset('admin@bloodconnect.local', 'Admin@BloodConnect2026!', 'staff')}
                className="w-full text-left p-2.5 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">Regulatory Super Admin</span>
                  <span className="text-slate-400 font-mono text-[10px]">admin@bloodconnect.local</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => selectPreset('staff@apollo.local', 'Hospital@12345', 'staff')}
                className="w-full text-left p-2.5 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">Hospital Staff (Apollo Delhi)</span>
                  <span className="text-slate-400 font-mono text-[10px]">staff@apollo.local</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => selectPreset('requester@demo.local', 'Requester@12345', 'public')}
                className="w-full text-left p-2.5 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">Citizen / ICU Requester</span>
                  <span className="text-slate-400 font-mono text-[10px]">requester@demo.local</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
