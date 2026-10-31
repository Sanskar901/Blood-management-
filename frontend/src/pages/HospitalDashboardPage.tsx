import React, { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  Calendar,
  X
} from '../components/Icons';
import {
  Hospital,
  InventoryBalance,
  InventoryLot,
  BloodRequest,
  InventoryTransaction,
  BloodProduct
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const HospitalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'ledger'>('inventory');

  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<BloodProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Modals
  const [showAddLotModal, setShowAddLotModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Fulfilment confirmation modal
  const [fulfilRequestItem, setFulfilRequestItem] = useState<BloodRequest | null>(null);

  // New lot form
  const [lotProduct, setLotProduct] = useState<string>('');
  const [lotBatch, setLotBatch] = useState<string>('LOT-2026-' + Math.floor(100 + Math.random() * 900));
  const [lotQty, setLotQty] = useState<number>(5);
  const [lotExpiry, setLotExpiry] = useState<string>(
    new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0]
  );

  // Adjust stock form
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Routine verification adjustment');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [balRes, lotRes, reqRes, txRes, prodRes] = await Promise.all([
        api.getBalances(),
        api.getLots(),
        api.getHospitalRequests(),
        api.getTransactions(),
        api.listProducts(),
      ]);
      setBalances(balRes);
      setLots(lotRes);
      setRequests(reqRes);
      setTransactions(txRes);
      setProducts(prodRes);
      if (prodRes.length > 0 && !lotProduct) {
        setLotProduct(prodRes[0].id);
        setSelectedProductId(prodRes[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading hospital data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.addLot({
        product_id: lotProduct,
        batch_number: lotBatch.trim(),
        quantity: lotQty,
        donation_date: new Date().toISOString().split('T')[0],
        expiry_date: lotExpiry,
      });
      setShowAddLotModal(false);
      setLotBatch('LOT-2026-' + Math.floor(100 + Math.random() * 900));
      setSuccessMsg(`Blood batch ${lotBatch} (${lotQty} units) recorded into stock & audit ledger successfully.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add batch lot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.adjustStock({
        product_id: selectedProductId,
        quantity_delta: adjustDelta,
        reason: adjustReason.trim(),
      });
      setShowAdjustModal(false);
      setSuccessMsg(`Stock adjustment of ${adjustDelta > 0 ? '+' : ''}${adjustDelta} units recorded to ledger.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to adjust stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmFulfil = async () => {
    if (!fulfilRequestItem) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.updateRequestStatus(
        fulfilRequestItem.id,
        'FULFILLED',
        'Clinically verified and issued by blood bank staff'
      );
      setSuccessMsg(`Requisition ${fulfilRequestItem.patient_reference_code} marked as fulfilled & units issued.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setFulfilRequestItem(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete issue');
    } finally {
      setActionLoading(false);
    }
  };

  const totalStock = balances.reduce((acc, b) => acc + b.total_units, 0);
  const totalReserved = balances.reduce((acc, b) => acc + b.reserved_units, 0);
  const totalAvailable = balances.reduce((acc, b) => acc + b.available_units, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hospital Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              Hospital Staff Portal
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
              Verified Blood Bank
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Request Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Signed in as: <strong className="text-slate-700">{user?.full_name}</strong> • Facility Isolation: {user?.hospital_id || 'Assigned Blood Center'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setShowAddLotModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Blood Batch
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units In Stock</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalStock}</p>
          <span className="text-xs text-slate-500 mt-1 block">Physical units currently in cold-chain storage</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Reserved (Active Holds)</span>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{totalReserved}</p>
          <span className="text-xs text-slate-500 mt-1 block">Under atomic 30-min hold for requesters</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Available for New Requests</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{totalAvailable}</p>
          <span className="text-xs text-slate-500 mt-1 block">Verified unreserved inventory</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          Stock & Batches ({balances.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Incoming Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Stock Ledger ({transactions.length})
        </button>
      </div>

      {/* Tab 1: Stock & Lots */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Balances Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Inventory Summary by Product</h3>
              <span className="text-xs text-slate-500 font-semibold">Available = Total - Reserved</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[500px]">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Blood Group</th>
                    <th className="px-6 py-3">Component Type</th>
                    <th className="px-6 py-3">Total Units</th>
                    <th className="px-6 py-3">Active Reserved</th>
                    <th className="px-6 py-3">Available Units</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balances.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-black text-slate-900 text-base">{b.product?.blood_group}</td>
                      <td className="px-6 py-4 font-medium">{b.product?.component_type}</td>
                      <td className="px-6 py-4 font-bold">{b.total_units}</td>
                      <td className="px-6 py-4 font-semibold text-amber-600">{b.reserved_units}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{b.available_units}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductId(b.product_id);
                            setShowAdjustModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                        >
                          Manual Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                  {balances.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No inventory balances recorded yet. Click "Add Blood Batch" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Lots Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Active Batches & Expiry Dates</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[500px]">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Batch Number</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Donation Date</th>
                    <th className="px-6 py-3">Expiry Date</th>
                    <th className="px-6 py-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lots.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">{l.batch_number}</td>
                      <td className="px-6 py-3">{l.product?.blood_group} • {l.product?.component_type}</td>
                      <td className="px-6 py-3 font-bold">{l.quantity} units</td>
                      <td className="px-6 py-3 text-slate-500">{l.donation_date}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{l.expiry_date}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {l.verification_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {lots.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No batch lots registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requests & Holds */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Incoming Blood Requests & Emergency Holds</h3>
            <span className="text-xs text-slate-500">Cross-match verification required before issue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 min-w-[600px]">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Case Code</th>
                  <th className="px-6 py-3">Requested Product</th>
                  <th className="px-6 py-3">Units</th>
                  <th className="px-6 py-3">Urgency</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tracking Token</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{r.patient_reference_code}</td>
                    <td className="px-6 py-4 font-medium">{r.product?.blood_group} • {r.product?.component_type}</td>
                    <td className="px-6 py-4 font-bold">{r.units_requested}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700">
                        {r.urgency_level.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        r.status === 'RESERVED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : r.status === 'FULFILLED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {r.tracking_token.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'RESERVED' && (
                        <button
                          onClick={() => setFulfilRequestItem(r)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                        >
                          Confirm Issue & Fulfil
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                      No incoming requests found for this hospital.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Immutable Inventory Transaction Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every stock addition, reservation hold, release, and issue creates a permanent delta record.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
              Tamper-Evident Audit Trail
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 min-w-[500px]">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Timestamp (UTC)</th>
                  <th className="px-6 py-3">Transaction Type</th>
                  <th className="px-6 py-3">Quantity Delta</th>
                  <th className="px-6 py-3">Reason / Reference</th>
                  <th className="px-6 py-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-bold text-xs">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-[11px]">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 font-extrabold ${tx.quantity_delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.quantity_delta > 0 ? `+${tx.quantity_delta}` : tx.quantity_delta} units
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">{tx.reason}</td>
                    <td className="px-6 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {tx.actor_id ? `${tx.actor_id.substring(0, 8)}...` : 'System'}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                      No ledger transactions logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clinical Cross-Match Issue */}
      {fulfilRequestItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Clinical Verification & Issue</h3>
              </div>
              <button
                onClick={() => setFulfilRequestItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 border border-slate-200 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Case Reference:</span>
                <span className="font-bold text-slate-900">{fulfilRequestItem.patient_reference_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Units Requested:</span>
                <span className="font-bold text-rose-600">{fulfilRequestItem.units_requested} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-800">
                  {fulfilRequestItem.product?.blood_group} • {fulfilRequestItem.product?.component_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking Token:</span>
                <span className="font-mono text-slate-600">{fulfilRequestItem.tracking_token.substring(0, 16)}...</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirming this requisition confirms that laboratory cross-matching has succeeded and the physical blood bags are being handed to the recipient representative.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFulfilRequestItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmFulfil}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? 'Issuing...' : 'Verify & Complete Issue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Lot */}
      {showAddLotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Receive New Blood Batch / Lot</h3>
              <button onClick={() => setShowAddLotModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Blood Product</label>
                <select
                  value={lotProduct}
                  onChange={(e) => setLotProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.blood_group} • {p.component_type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch / Donation Number</label>
                <input
                  type="text"
                  value={lotBatch}
                  onChange={(e) => setLotBatch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Units (Bags)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={lotQty}
                  onChange={(e) => setLotQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={lotExpiry}
                  onChange={(e) => setLotExpiry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddLotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md shadow-rose-200 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Add to Stock & Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manual Stock Adjustment */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Auditable Stock Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity Delta (+/- units)</label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Positive number adds stock, negative removes.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mandatory Auditable Justification</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory count correction, discarded due to hemolysation, etc."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
