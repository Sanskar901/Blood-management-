import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Navigation
} from '../components/Icons';
import { BloodGroup, BloodComponent, SearchResultItem, RequestUrgency } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PublicSearchPageProps {
  initialBloodGroup?: BloodGroup;
  initialComponent?: BloodComponent;
  onNavigateToTrack: (trackingToken: string) => void;
  onNavigateToLogin: () => void;
}

export const PublicSearchPage: React.FC<PublicSearchPageProps> = ({
  initialBloodGroup = 'O+',
  initialComponent = 'Whole Blood',
  onNavigateToTrack,
  onNavigateToLogin
}) => {
  const { user } = useAuth();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(initialBloodGroup);
  const [component, setComponent] = useState<BloodComponent>(initialComponent);
  const [quantity, setQuantity] = useState<number>(2);
  const [pinCode, setPinCode] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Reservation Modal State
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [patientRef, setPatientRef] = useState<string>('EMERGENCY-ICU-' + Math.floor(100 + Math.random() * 900));
  const [urgency, setUrgency] = useState<RequestUrgency>('CRITICAL_EMERGENCY');
  const [reserveLoading, setReserveLoading] = useState<boolean>(false);
  const [reserveError, setReserveError] = useState<string>('');

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const components: BloodComponent[] = [
    'Whole Blood',
    'Packed Red Blood Cells (PRBC)',
    'Platelets (PRP/SDP)',
    'Plasma (FFP)',
    'Cryoprecipitate',
  ];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocationStatus('Acquiring GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus('GPS location acquired.');
      },
      (err) => {
        setLocationStatus('Location access denied or unavailable. You can enter PIN code.');
      }
    );
  };

  const executeSearch = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.searchInventory({
        blood_group: bloodGroup,
        component_type: component,
        quantity,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        pin_code: pinCode.trim() || undefined,
      });
      setResults(res.results);
      setSearched(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error conducting search');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, []);

  const handleOpenReserve = (item: SearchResultItem) => {
    setSelectedResult(item);
    setReserveError('');
  };

  const handleConfirmReservation = async () => {
    if (!selectedResult) return;
    setReserveLoading(true);
    setReserveError('');

    try {
      // 1. Create request
      const req = await api.createRequest({
        hospital_id: selectedResult.hospital.id,
        product_id: selectedResult.product_id,
        units_requested: quantity,
        urgency_level: urgency,
        patient_reference_code: patientRef.trim() || 'ANONYMIZED-REF',
      });

      // 2. Generate client-side idempotency key (prevent double click hold)
      const idempotencyKey = `req-hold-${req.id}-${Date.now()}`;

      // 3. Call atomic reservation
      await api.createReservation(req.id, idempotencyKey);

      // 4. Success -> Navigate to live tracking page
      setSelectedResult(null);
      onNavigateToTrack(req.tracking_token);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setReserveError(`Conflict: ${err.message}. Stock was reserved by another emergency requester.`);
      } else {
        setReserveError(err.message || 'Failed to place reservation hold.');
      }
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Blood Inventory Discovery & Reservation
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Search approved hospital blood banks. Ranking prioritizes complete fulfillment capability, followed by verified straight-line distance.
        </p>
      </div>

      {/* Search Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Component Type
            </label>
            <select
              value={component}
              onChange={(e) => setComponent(e.target.value as BloodComponent)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {components.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Units Required
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              PIN Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 110001"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Location & Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <button
              type="button"
              onClick={handleGetLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-600" />
              {userLocation ? 'Update GPS Location' : 'Use Current GPS'}
            </button>
            {locationStatus && <span className="text-slate-500 italic">{locationStatus}</span>}
          </div>

          <button
            type="button"
            onClick={executeSearch}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-md shadow-rose-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching Inventory...' : 'Search Inventory'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {searched ? `${results.length} Hospital(s) Found` : 'Search Results'}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Ordered by full capacity first, then proximity
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading available inventory...</div>
        ) : searched && results.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching hospital inventory found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              There is currently no verified available stock matching {bloodGroup} {component} in the requested area. Try expanding your search radius.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item) => (
              <div
                key={item.hospital.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Hospital
                        </span>
                        {item.distance_km !== null && item.distance_km !== undefined && (
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            ~{item.distance_km} km away
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5">{item.hospital.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.hospital.address}, PIN {item.hospital.pin_code}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-slate-900">
                        {item.available_units}
                      </span>
                      <span className="block text-[11px] uppercase font-bold text-slate-400">Units Avail</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.hospital.contact_phone}</span>
                      {item.hospital.emergency_helpline && (
                        <span className="text-rose-600 font-bold ml-1">
                          (Helpline: {item.hospital.emergency_helpline})
                        </span>
                      )}
                    </div>
                    {item.last_verified_at && (
                      <span className="text-slate-400">
                        Updated {new Date(item.last_verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  {item.can_fully_fulfil ? (
                    <button
                      onClick={() => handleOpenReserve(item)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 flex items-center justify-center gap-2 transition"
                    >
                      <Lock className="w-4 h-4" />
                      Hold & Reserve {quantity} Units (30 Min)
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Partial stock: Only {item.available_units} unit(s) available for full request of {quantity}.</span>
                      </div>
                      <button
                        onClick={() => handleOpenReserve(item)}
                        className="w-full py-2 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white transition flex items-center justify-center gap-2"
                      >
                        Reserve Partial Stock ({item.available_units} units)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Confirmation Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Pessimistic Hold Confirmation
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Reserve {quantity} Units at {selectedResult.hospital.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5 text-slate-700 border border-slate-200">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Blood Product:</span>
                <span className="font-bold text-slate-900">{bloodGroup} • {component}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Hold Duration:</span>
                <span className="font-bold text-rose-600">30 Minutes (Auto-Release)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Concurrency Policy:</span>
                <span className="font-semibold text-slate-700">Database Row-Lock Guaranteed</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Urgency Level
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as RequestUrgency)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="CRITICAL_EMERGENCY">CRITICAL EMERGENCY (Need within 1-2 hours)</option>
                  <option value="URGENT">URGENT (Need within 6 hours)</option>
                  <option value="STANDARD">STANDARD (Scheduled routine procedure)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Anonymized Patient Reference / ICU Code
                </label>
                <input
                  type="text"
                  value={patientRef}
                  onChange={(e) => setPatientRef(e.target.value)}
                  placeholder="e.g. ICU-BED-104 or HOSPITAL-CASE-99"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Minimal personal data is recorded. Do not enter confidential patient names.
                </p>
              </div>
            </div>

            {reserveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reserveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reserveLoading}
                onClick={handleConfirmReservation}
                className="px-6 py-2 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {reserveLoading ? 'Locking Stock...' : 'Confirm 30m Hold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
