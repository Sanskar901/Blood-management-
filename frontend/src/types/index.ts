export type UserRole = 'SUPER_ADMIN' | 'HOSPITAL_STAFF' | 'PUBLIC_REQUESTER';

export type HospitalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponent =
  | 'Whole Blood'
  | 'Packed Red Blood Cells (PRBC)'
  | 'Platelets (PRP/SDP)'
  | 'Plasma (FFP)'
  | 'Cryoprecipitate';

export type RequestUrgency = 'CRITICAL_EMERGENCY' | 'URGENT' | 'STANDARD';

export type RequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'RESERVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FULFILLED';

export type ReservationStatus = 'ACTIVE' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  hospital_id?: string;
  is_active: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  licence_number: string;
  address: string;
  pin_code: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  contact_email: string;
  emergency_helpline?: string;
  approval_status: HospitalStatus;
  is_active: boolean;
  created_at: string;
}

export interface BloodProduct {
  id: string;
  blood_group: BloodGroup;
  component_type: BloodComponent;
  storage_temp_c: string;
  shelf_life_days: number;
  description?: string;
}

export interface InventoryBalance {
  id: string;
  hospital_id: string;
  product_id: string;
  total_units: number;
  reserved_units: number;
  available_units: number;
  updated_at: string;
  product?: BloodProduct;
}

export interface InventoryLot {
  id: string;
  hospital_id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  donation_date: string;
  expiry_date: string;
  verification_status: string;
  created_at: string;
  product?: BloodProduct;
}

export interface InventoryTransaction {
  id: string;
  hospital_id: string;
  product_id: string;
  lot_id?: string;
  transaction_type: string;
  quantity_delta: number;
  reason: string;
  actor_id?: string;
  created_at: string;
}

export interface SearchResultItem {
  hospital: Hospital;
  product_id: string;
  blood_group: BloodGroup;
  component_type: BloodComponent;
  available_units: number;
  requested_units: number;
  can_fully_fulfil: boolean;
  distance_km?: number;
  distance_label: string;
  last_verified_at?: string;
  disclaimer: string;
}

export interface SearchResponse {
  blood_group: BloodGroup;
  component_type: BloodComponent;
  requested_quantity: number;
  total_results: number;
  results: SearchResultItem[];
}

export interface BloodRequest {
  id: string;
  requester_id?: string;
  hospital_id: string;
  product_id: string;
  units_requested: number;
  urgency_level: RequestUrgency;
  patient_reference_code: string;
  notes?: string;
  status: RequestStatus;
  tracking_token: string;
  created_at: string;
  product?: BloodProduct;
}

export interface Reservation {
  id: string;
  request_id: string;
  hospital_id: string;
  product_id: string;
  units_reserved: number;
  idempotency_key: string;
  status: ReservationStatus;
  expires_at: string;
  created_at: string;
  confirmed_at?: string;
  released_at?: string;
}

export interface AdminMetrics {
  total_hospitals: number;
  pending_approvals: number;
  active_hospitals: number;
  total_units_in_stock: number;
  active_reservations: number;
  total_requests: number;
  critical_shortages_count: number;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
