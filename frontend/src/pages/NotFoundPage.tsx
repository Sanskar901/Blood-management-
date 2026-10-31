import React from 'react';
import { AlertTriangle, Search, Activity, HeartHandshake, ArrowRight } from '../components/Icons';

interface NotFoundPageProps {
  onNavigate: (view: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-lg shadow-rose-100/50">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <span className="absolute -top-2 -right-2 px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-full shadow">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Transfusion Route Not Found
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            The page or resource you are looking for does not exist or has been relocated within the National Blood Exchange grid.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-md mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Emergency Destinations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold">
            <button
              onClick={() => onNavigate('search')}
              className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Search className="w-4 h-4" />
              Find Blood Stock
            </button>
            <button
              onClick={() => onNavigate('track')}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2 transition"
            >
              <Activity className="w-4 h-4" />
              Track Requisition
            </button>
          </div>
          <button
            onClick={() => onNavigate('landing')}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <span>Return to National Portal Home</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-2 text-xs text-slate-400">
          <span>Need immediate critical assistance? Call </span>
          <strong className="text-slate-700 font-mono">1800-11-BLOOD (25663)</strong>
        </div>
      </div>
    </div>
  );
};
