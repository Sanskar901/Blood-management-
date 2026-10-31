import {
  User,
  Hospital,
  BloodProduct,
  InventoryBalance,
  InventoryLot,
  InventoryTransaction,
  SearchResponse,
  BloodRequest,
  Reservation,
  AdminMetrics,
  AuditLog,
  BloodGroup,
  BloodComponent,
  HospitalStatus,
  RequestUrgency,
  RequestStatus,
} from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('bloodconnect_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData: any = null;
    let message = `Request failed with status ${response.status}`;
    try {
      errorData = await response.json();
      if (typeof errorData?.detail === 'string') {
        message = errorData.detail;
      } else if (errorData?.detail?.message) {
        message = errorData.detail.message;
      }
    } catch {
      // not json
    }
    throw new ApiError(response.status, message, errorData?.detail || errorData);
  }

  // Handle empty bodies
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  async login(username: string, password: string):Promise<{ access_token: string; role: string; user_id: string; full_name: string; hospital_id?: string }> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.detail || 'Invalid email or password');
    }
    return res.json();
  },

  async register(data: { email: string; password: string; full_name: string; phone_number?: string }): Promise<User> {
    return request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  // Public Search
  async searchInventory(params: {
    blood_group: BloodGroup;
    component_type: BloodComponent;
    quantity: number;
    lat?: number;
    lng?: number;
    pin_code?: string;
    max_radius_km?: number;
  }): Promise<SearchResponse> {
    const query = new URLSearchParams();
    query.set('blood_group', params.blood_group);
    query.set('component_type', params.component_type);
    query.set('quantity', params.quantity.toString());
    if (params.lat !== undefined && params.lng !== undefined) {
      query.set('lat', params.lat.toString());
      query.set('lng', params.lng.toString());
    }
    if (params.pin_code) query.set('pin_code', params.pin_code);
    if (params.max_radius_km) query.set('max_radius_km', params.max_radius_km.toString());

    return request<SearchResponse>(`/search?${query.toString()}`);
  },

  // Hospitals
  async listHospitals(statusFilter?: HospitalStatus): Promise<Hospital[]> {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    return request<Hospital[]>(`/hospitals${q}`);
  },

  async getHospital(id: string): Promise<Hospital> {
    return request<Hospital>(`/hospitals/${id}`);
  },

  async applyHospital(data: Omit<Hospital, 'id' | 'approval_status' | 'is_active' | 'created_at'>): Promise<Hospital> {
    return request<Hospital>('/hospitals/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateHospitalStatus(id: string, approval_status: HospitalStatus, reason?: string): Promise<Hospital> {
    return request<Hospital>(`/hospitals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ approval_status, reason }),
    });
  },

  // Inventory
  async listProducts(): Promise<BloodProduct[]> {
    return request<BloodProduct[]>('/inventory/products');
  },

  async getBalances(hospital_id?: string): Promise<InventoryBalance[]> {
    const q = hospital_id ? `?hospital_id=${hospital_id}` : '';
    return request<InventoryBalance[]>(`/inventory/balances${q}`);
  },

  async getLots(hospital_id?: string): Promise<InventoryLot[]> {
    const q = hospital_id ? `?hospital_id=${hospital_id}` : '';
    return request<InventoryLot[]>(`/inventory/lots${q}`);
  },

  async addLot(data: {
    product_id: string;
    batch_number: string;
    quantity: number;
    donation_date: string;
    expiry_date: string;
  }): Promise<InventoryLot> {
    return request<InventoryLot>('/inventory/lots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adjustStock(data: {
    product_id: string;
    lot_id?: string;
    quantity_delta: number;
    reason: string;
  }): Promise<InventoryBalance> {
    return request<InventoryBalance>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTransactions(hospital_id?: string): Promise<InventoryTransaction[]> {
    const q = hospital_id ? `?hospital_id=${hospital_id}` : '';
    return request<InventoryTransaction[]>(`/inventory/transactions${q}`);
  },

  // Requests
  async createRequest(data: {
    hospital_id: string;
    product_id: string;
    units_requested: number;
    urgency_level: RequestUrgency;
    patient_reference_code: string;
    notes?: string;
  }): Promise<BloodRequest> {
    return request<BloodRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async trackRequest(token: string): Promise<BloodRequest> {
    return request<BloodRequest>(`/requests/track/${token}`);
  },

  async getHospitalRequests(hospital_id?: string): Promise<BloodRequest[]> {
    const q = hospital_id ? `?hospital_id=${hospital_id}` : '';
    return request<BloodRequest[]>(`/requests/hospital${q}`);
  },

  async updateRequestStatus(id: string, status: RequestStatus, reason?: string): Promise<BloodRequest> {
    return request<BloodRequest>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  // Reservations
  async createReservation(request_id: string, idempotency_key: string): Promise<Reservation> {
    return request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify({ request_id, idempotency_key }),
    });
  },

  async cancelReservation(id: string, reason?: string): Promise<Reservation> {
    return request<Reservation>(`/reservations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async fulfilReservation(id: string): Promise<Reservation> {
    return request<Reservation>(`/reservations/${id}/fulfil`, {
      method: 'POST',
    });
  },

  // Admin
  async getAdminMetrics(): Promise<AdminMetrics> {
    return request<AdminMetrics>('/admin/dashboard');
  },

  async getAuditLogs(action?: string, target_type?: string): Promise<AuditLog[]> {
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (target_type) q.set('target_type', target_type);
    return request<AuditLog[]>(`/admin/audit-logs?${q.toString()}`);
  },

  async exportInventoryCsv(): Promise<Blob> {
    const token = localStorage.getItem('bloodconnect_token');
    const res = await fetch(`${API_BASE}/admin/export/inventory`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to export inventory CSV. Ensure you are signed in as Super Admin.');
    }
    return res.blob();
  },

  getExportUrl(): string {
    return `${API_BASE}/admin/export/inventory`;
  },
};
