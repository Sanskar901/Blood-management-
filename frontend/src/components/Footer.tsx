import React, { useState } from 'react';
import { HeartHandshake, ShieldCheck, FileText, CheckCircle2, Phone, ExternalLink, X, Info } from './Icons';

interface FooterProps {
  onNavigate?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  const handleNav = (view: string) => {
    if (onNavigate) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onNavigate(view);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand & Overview */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => handleNav('landing')}
              className="flex items-center gap-2.5 mb-3 group focus:outline-none text-left"
              aria-label="BloodConnect Home"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-sm group-hover:bg-rose-500 transition">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight group-hover:text-rose-400 transition">
                Blood<span className="text-rose-500">Connect</span>
              </span>
            </button>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              India's National Multi-Hospital Blood Transfusion Grid. Connecting accredited hospital blood centers,
              ICU transfusion units, and emergency medical teams with sub-second atomic reservation.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> ISO 15189 & NABH Guidelines Compliant
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" /> Tamper-Evident Stock Audit Logs
              </span>
            </div>
          </div>

          {/* Column 2: Emergency Network Navigation */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3.5">
              Emergency Network
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => handleNav('search')}
                  className="hover:text-rose-400 text-left transition flex items-center gap-1.5 py-0.5"
                >
                  <span className="text-rose-500">›</span> Real-Time Blood Inventory Grid
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('track')}
                  className="hover:text-rose-400 text-left transition flex items-center gap-1.5 py-0.5"
                >
                  <span className="text-rose-500">›</span> Transfusion Hold Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('apply')}
                  className="hover:text-rose-400 text-left transition flex items-center gap-1.5 py-0.5"
                >
                  <span className="text-rose-500">›</span> Hospital Blood Bank Registration
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('login')}
                  className="hover:text-rose-400 text-left transition flex items-center gap-1.5 py-0.5"
                >
                  <span className="text-rose-500">›</span> Staff & Super Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Clinical Safety & Protocol */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3.5">
              Clinical Safety
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Regulated under the Drugs and Cosmetics Act, 1940 and National Blood Transfusion Council (NBTC) protocols.
              Mandatory testing for HIV I&II, HBV, HCV, Syphilis, and Malaria.
            </p>
            <button
              onClick={() => setShowGuidelinesModal(true)}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 transition underline underline-offset-2"
            >
              <span>View Clinical Transfusion Protocol</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Column 4: 24/7 Emergency Transfusion Desk */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3.5">
              National Emergency Desk
            </h4>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-rose-500">
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Toll-Free Helpline</span>
              </div>
              <p className="text-lg font-mono font-extrabold text-white">
                1800-11-BLOOD
              </p>
              <p className="text-[11px] text-slate-400">
                (1800-11-25663) • Available 24/7 across all states for critical ICU referrals.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Dynamic Copyright & Compliance */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p className="text-center sm:text-left">
            © {currentYear} BloodConnect National Transfusion Network. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <button
              onClick={() => setShowGuidelinesModal(true)}
              className="hover:text-slate-300 transition"
            >
              Regulatory Notice
            </button>
            <span>•</span>
            <button
              onClick={() => handleNav('search')}
              className="hover:text-slate-300 transition"
            >
              Cold-Chain Compliance
            </button>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> End-to-End Cryptographic Audit Ledger
            </span>
          </div>
        </div>
      </div>

      {/* Clinical Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">National Clinical Transfusion Guidelines</h3>
                  <p className="text-xs text-slate-500">NBTC & CDSCO Statutory Standards</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuidelinesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900">
                <strong>Mandatory Cross-Match Requirement:</strong> Reservations placed through BloodConnect reserve cold-chain inventory for exactly 30 minutes. Physical issuance is strictly contingent upon compatibility testing of the recipient's cross-match sample.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Cold-Chain Temperature Maintenance:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Packed Red Blood Cells (PRBC):</strong> +2°C to +6°C (Shelf life: 35–42 days)</li>
                  <li><strong>Fresh Frozen Plasma (FFP):</strong> -30°C or colder (Shelf life: 1 year)</li>
                  <li><strong>Platelets (PRP/SDP):</strong> +20°C to +24°C with continuous gentle agitation</li>
                  <li><strong>Cryoprecipitate:</strong> -30°C or colder</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Statutory Mandatory Screening:</h4>
                <p className="text-slate-600">
                  Under the Drugs and Cosmetics Rules, 1945 (Part XII-B), every blood unit is tested individually for Human Immunodeficiency Virus (HIV-1 & HIV-2), Hepatitis B Surface Antigen (HBsAg), Hepatitis C Virus (HCV), Syphilis (VDRL/RPR), and Malaria Parasite.
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowGuidelinesModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
                >
                  Understood & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
