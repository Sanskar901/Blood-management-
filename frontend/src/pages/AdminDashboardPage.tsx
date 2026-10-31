import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  AlertTriangle,
  RefreshCw,
  Users,
  Database,
  Lock,
  PauseCircle,
  PlayCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Eye,
  X,
  Search,
  CheckCircle2
} from '../components/Icons';
import { Hospital, AdminMetrics, AuditLog, HospitalStatus } from '../types';
import { api } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Hospital filter & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected hospital for full inspector modal
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [mRes, hRes, logRes] = await Promise.all([
        api.getAdminMetrics(),
        api.listHospitals(),
        api.getAuditLogs(),
      ]);
      setMetrics(mRes);
      setHospitals(hRes);
      setAuditLogs(logRes);
    } catch (err: any) {
      console.error('Admin data fetch error:', err);
      setErrorMsg(err.message || 'Error loading administration data. Please check connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    setErrorMsg('');
    try {
      const blob = await api.exportInventoryCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bloodconnect_inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMsg('Inventory CSV exported successfully.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export inventory CSV. Ensure you are signed in as Super Admin.');
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: HospitalStatus, reason?: string) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.updateHospitalStatus(
        id,
        status,
        reason || `Super Admin regulatory update to ${status}`
      );
      setSuccessMsg(`Hospital status successfully updated to ${status}.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      
      // Update local state if inspector is open
      if (selectedHospital && selectedHospital.id === id) {
        setSelectedHospital({ ...selectedHospital, approval_status: status });
      }
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update hospital status');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered hospitals list
  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.licence_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.contact_phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'ALL' || h.approval_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              Super Admin Operations Center
            </span>
            <span className="text-xs text-slate-400 font-mono">Platform v2.4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hospital Verification & Platform Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Privileged regulatory oversight: inspect full hospital facility details, approve new blood bank applications, monitor cross-hospital inventory, and review immutable audit ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            title="Download full inventory CSV across all hospitals"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting CSV...' : 'Export Inventory CSV'}
          </button>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            className="text-rose-700 hover:text-rose-950 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Hospitals</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.total_hospitals}</p>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
              {metrics.active_hospitals} Active & Verified
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approvals</span>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{metrics.pending_approvals}</p>
            <span className="text-xs text-slate-500 mt-1 block">Awaiting regulatory review</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Global Inventory</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.total_units_in_stock}</p>
            <span className="text-xs text-slate-500 mt-1 block">Total units across all blood banks</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Shortage Alerts</span>
            <p className="text-3xl font-extrabold text-rose-600 mt-1">{metrics.critical_shortages_count}</p>
            <span className="text-xs text-slate-500 mt-1 block">Products with &le; 2 units</span>
          </div>
        </div>
      )}

      {/* Hospital Blood Bank Applications & Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar & Search */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hospital Blood Bank Applications & Verification</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click "View Details" on any facility to inspect full registration credentials, GPS, contact information, and audit controls.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, city, licence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Statuses ({hospitals.length})</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved Only</option>
              <option value="SUSPENDED">Suspended Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Hospital Name</th>
                <th className="px-6 py-3">Licence Number</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{h.name}</p>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {h.id.substring(0, 8)}...</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700 font-medium">{h.licence_number}</td>
                  <td className="px-6 py-4 text-xs">
                    <p className="font-medium text-slate-800">{h.city}, {h.state}</p>
                    <span className="text-slate-400 text-[11px]">PIN {h.pin_code}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">
                    <p>{h.contact_phone}</p>
                    <p className="text-[11px] text-slate-400">{h.contact_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      h.approval_status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : h.approval_status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        : h.approval_status === 'SUSPENDED'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {h.approval_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <button
                      onClick={() => setSelectedHospital(h)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>

                    {h.approval_status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(h.id, 'APPROVED')}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(h.id, 'REJECTED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition disabled:opacity-50 border border-rose-200"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {h.approval_status === 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(h.id, 'SUSPENDED')}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg transition disabled:opacity-50 border border-amber-200"
                      >
                        Suspend
                      </button>
                    )}

                    {h.approval_status === 'SUSPENDED' && (
                      <button
                        onClick={() => handleUpdateStatus(h.id, 'APPROVED')}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition disabled:opacity-50 border border-emerald-200"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredHospitals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No hospitals found matching the current search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (Prevent horizontal scroll) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredHospitals.map((h) => (
            <div key={h.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{h.name}</h4>
                  <p className="text-xs text-slate-500">{h.city}, {h.state} • PIN {h.pin_code}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  h.approval_status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : h.approval_status === 'PENDING'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {h.approval_status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Licence:</span>
                  <span className="font-bold text-slate-800">{h.licence_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Phone:</span>
                  <span>{h.contact_phone}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedHospital(h)}
                  className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Details
                </button>

                {h.approval_status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(h.id, 'APPROVED')}
                      disabled={actionLoading}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(h.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="py-1.5 px-3 bg-rose-50 text-rose-700 font-bold text-xs rounded-lg transition disabled:opacity-50 border border-rose-200"
                    >
                      Reject
                    </button>
                  </>
                )}

                {h.approval_status === 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(h.id, 'SUSPENDED')}
                    disabled={actionLoading}
                    className="py-1.5 px-3 bg-amber-50 text-amber-800 font-bold text-xs rounded-lg transition disabled:opacity-50 border border-amber-200"
                  >
                    Suspend
                  </button>
                )}

                {h.approval_status === 'SUSPENDED' && (
                  <button
                    onClick={() => handleUpdateStatus(h.id, 'APPROVED')}
                    disabled={actionLoading}
                    className="py-1.5 px-3 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-lg transition disabled:opacity-50 border border-emerald-200"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredHospitals.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hospitals match search.
            </div>
          )}
        </div>
      </div>

      {/* Hospital Full Inspector Modal: Admin can see ALL hospital details */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    Facility Inspector
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedHospital.approval_status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedHospital.approval_status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {selectedHospital.approval_status}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{selectedHospital.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">UUID: {selectedHospital.id}</p>
              </div>

              <button
                onClick={() => setSelectedHospital(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comprehensive Hospital Details Grid */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                Statutory Registration & Licence Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">State Blood Bank Licence No.</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedHospital.licence_number}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Registration Timestamp</span>
                  <span className="font-mono text-slate-800">
                    {new Date(selectedHospital.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Platform Operational Status</span>
                  <span className="font-semibold text-slate-800">
                    {selectedHospital.is_active ? 'Active on Grid (Transacting)' : 'Deactivated'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Verification Status</span>
                  <span className="font-bold text-slate-900">{selectedHospital.approval_status}</span>
                </div>
              </div>

              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 pt-2">
                Physical Location & Geo-Coordinates
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Physical Facility Address:</span>
                  <p className="font-medium text-slate-800">{selectedHospital.address}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block">City:</span>
                    <span className="font-bold text-slate-800">{selectedHospital.city}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">State:</span>
                    <span className="font-bold text-slate-800">{selectedHospital.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Postal PIN:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedHospital.pin_code}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono text-[11px] text-slate-600">
                    Coordinates: Lat {selectedHospital.latitude.toFixed(4)}, Lng {selectedHospital.longitude.toFixed(4)}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedHospital.latitude},${selectedHospital.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 pt-2">
                Contact & Emergency Helplines
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Primary Transfusion Desk:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedHospital.contact_phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Accredited Blood Center Email:</span>
                    <span className="font-mono text-slate-900 break-all">{selectedHospital.contact_email}</span>
                  </div>
                </div>

                {selectedHospital.emergency_helpline && (
                  <div className="sm:col-span-2 bg-rose-50/70 p-3 rounded-xl border border-rose-200 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-rose-800 font-bold block">24/7 Dedicated Emergency Helpline:</span>
                      <span className="font-mono font-extrabold text-rose-900 text-sm">
                        {selectedHospital.emergency_helpline}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Regulatory Action Controls inside modal */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Action will be permanently recorded in immutable audit ledger.
              </span>
              <div className="flex items-center gap-2">
                {selectedHospital.approval_status !== 'APPROVED' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedHospital.id, 'APPROVED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    Approve Facility
                  </button>
                )}

                {selectedHospital.approval_status === 'APPROVED' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedHospital.id, 'SUSPENDED')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    Suspend Inventory
                  </button>
                )}

                {selectedHospital.approval_status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedHospital.id, 'REJECTED')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedHospital(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">System Regulatory Audit Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable security record of privileged actions, hospital status changes, and critical stock events.
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
            Append-Only
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Timestamp (UTC)</th>
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Target Entity</th>
                <th className="px-6 py-3">Event Details</th>
                <th className="px-6 py-3">Actor ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 font-bold text-xs">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {log.target_type} {log.target_id ? `(${log.target_id.substring(0, 8)}...)` : ''}
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-600 max-w-md">{log.details || 'N/A'}</td>
                  <td className="px-6 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                    {log.actor_id ? `${log.actor_id.substring(0, 8)}...` : 'System'}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No audit events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
