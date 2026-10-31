import React, { useState } from 'react';
import { Building2, CheckCircle2, AlertTriangle, ArrowRight } from '../components/Icons';
import { api } from '../services/api';

interface HospitalApplyPageProps {
  onSuccess: () => void;
}

export const HospitalApplyPage: React.FC<HospitalApplyPageProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    licence_number: '',
    address: '',
    pin_code: '',
    city: 'New Delhi',
    state: 'Delhi',
    latitude: 28.5355,
    longitude: 77.2410,
    contact_phone: '',
    contact_email: '',
    emergency_helpline: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await api.applyHospital(formData);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit hospital application.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: `Medanta The Medicity Transfusion Center #${rand}`,
      licence_number: `HR-BB-2023-00${rand}`,
      address: 'CH Bakhtawar Singh Road, Sector 38',
      pin_code: '122001',
      city: 'Gurugram',
      state: 'Haryana',
      latitude: 28.4394,
      longitude: 77.0423,
      contact_phone: '+91-124-4141414',
      contact_email: `transfusion@medanta${rand}.org`,
      emergency_helpline: '1068',
    });
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Application Submitted!</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
          Your hospital blood bank application is now queued under <strong className="text-amber-600">PENDING</strong> review.
          A Super Admin will review your licence credentials before approving inventory publishing.
        </p>
        <button
          onClick={onSuccess}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hospital Blood Bank Onboarding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register your verified hospital facility to manage blood inventory and receive reservations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadTemplate}
          className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition shrink-0"
        >
          Load Facility Template
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hospital / Blood Bank Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apollo City Blood Centre"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State Blood Bank Licence No.</label>
            <input
              type="text"
              required
              value={formData.licence_number}
              onChange={(e) => setFormData({ ...formData, licence_number: e.target.value })}
              placeholder="e.g. LIC-DEL-2024-001"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PIN Code</label>
            <input
              type="text"
              required
              value={formData.pin_code}
              onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
              placeholder="110001"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Physical Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, Area, Landmark"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State</label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
            <input
              type="tel"
              required
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+91-11-26925858"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Email</label>
            <input
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="bloodbank@hospital.org"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-200 transition disabled:opacity-50 text-center"
          >
            {loading ? 'Submitting Application...' : 'Submit Hospital Application'}
          </button>
        </div>
      </form>
    </div>
  );
};
