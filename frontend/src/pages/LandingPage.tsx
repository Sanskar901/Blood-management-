import React, { useState } from 'react';
import {
  Heart,
  Search,
  ShieldCheck,
  Zap,
  Building2,
  Clock,
  ArrowRight,
  Database,
  MapPin,
  CheckCircle2,
  HeartHandshake,
  Activity,
  Phone
} from '../components/Icons';
import { BloodGroup, BloodComponent } from '../types';

interface LandingPageProps {
  onStartSearch: (bloodGroup: BloodGroup, component: BloodComponent) => void;
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartSearch, onNavigate }) => {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [component, setComponent] = useState<BloodComponent>('Whole Blood');

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const components: BloodComponent[] = [
    'Whole Blood',
    'Packed Red Blood Cells (PRBC)',
    'Platelets (PRP/SDP)',
    'Plasma (FFP)',
    'Cryoprecipitate',
  ];

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onStartSearch(bloodGroup, component);
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wide border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>National Digital Blood Grid & Transfusion Exchange</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Every Second Counts. <br />
            <span className="text-rose-600">Discover & Reserve Blood</span> Across Accredited Hospitals.
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            India's unified multi-hospital blood discovery and emergency hold network. Locate verified
            cold-chain stock in nearby licensed blood centers and secure guaranteed atomic reservations.
          </p>

          {/* Quick Search Widget */}
          <div className="mt-8 bg-white p-4 sm:p-6 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 max-w-2xl mx-auto">
            <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 text-left mb-1.5 uppercase">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 text-left mb-1.5 uppercase">
                  Blood Component
                </label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value as BloodComponent)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {components.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-md shadow-rose-300 flex items-center justify-center gap-2 transition"
                >
                  <Search className="w-4 h-4" />
                  Find Live Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Live Proof Metrics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg">
          <div className="text-center p-3 border-r border-slate-800">
            <p className="text-3xl font-extrabold text-emerald-400">100%</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Overbooking Prevention</p>
          </div>
          <div className="text-center p-3 md:border-r border-slate-800">
            <p className="text-3xl font-extrabold text-white">24 / 7</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Real-Time Exchange</p>
          </div>
          <div className="text-center p-3 border-r border-slate-800">
            <p className="text-3xl font-extrabold text-rose-400">30 Min</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Guaranteed ICU Hold</p>
          </div>
          <div className="text-center p-3">
            <p className="text-3xl font-extrabold text-sky-400">CDSCO</p>
            <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Regulatory Standard</p>
          </div>
        </div>
      </section>

      {/* The Core Protocol Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900">National Blood Exchange Architecture</h2>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">
            Eliminating emergency stockouts through transactional row-level verification, clinical cross-match workflows, and complete hospital tenant isolation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Atomic Reservation Locks</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              BloodConnect executes row-level isolation inside strict database transactions. Competing emergency orders are serialized instantaneously, ensuring zero overbooking during multi-hospital surges.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">30-Minute Transit Hold</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Units reserved by critical care teams are held exclusively for 30 minutes while the patient representative is in transit with cross-match blood samples.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Hospital Security</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Accredited blood banks operate in dedicated security partitions. Every batch addition, component separation, and unit issuance is logged to a tamper-evident audit ledger.
            </p>
          </div>
        </div>
      </section>

      {/* Hospital Network & Regulatory CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>For Licensed Blood Centers & Hospital Staff</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">Join the Unified Transfusion Grid</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Accredited private and government blood banks can register their facility to publish inventory, manage clinical requests, and coordinate emergency cross-hospital transfers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => onNavigate('search')}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-900/50 flex items-center gap-2 transition"
              >
                Search Live Stock
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('apply')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition"
              >
                Hospital Blood Bank Registration
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
