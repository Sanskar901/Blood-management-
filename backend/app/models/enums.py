import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    HOSPITAL_STAFF = "HOSPITAL_STAFF"
    PUBLIC_REQUESTER = "PUBLIC_REQUESTER"

class HospitalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"

class BloodGroup(str, enum.Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"

class BloodComponent(str, enum.Enum):
    WHOLE_BLOOD = "Whole Blood"
    RED_BLOOD_CELLS = "Packed Red Blood Cells (PRBC)"
    PLATELETS = "Platelets (PRP/SDP)"
    PLASMA = "Fresh Frozen Plasma (FFP)"
    CRYOPRECIPITATE = "Cryoprecipitate"

class RequestUrgency(str, enum.Enum):
    CRITICAL_EMERGENCY = "CRITICAL_EMERGENCY" # Immediate need within 1-2 hours
    URGENT = "URGENT"                         # Need within 6 hours
    STANDARD = "STANDARD"                     # Routine / Scheduled surgery

class RequestStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESERVED = "RESERVED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    FULFILLED = "FULFILLED"

class ReservationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CONFIRMED = "CONFIRMED"
    RELEASED = "RELEASED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class TransactionType(str, enum.Enum):
    DONATION_INFLOW = "DONATION_INFLOW"
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT"
    RESERVATION_HOLD = "RESERVATION_HOLD"
    RESERVATION_RELEASE = "RESERVATION_RELEASE"
    ISSUE_FULFILMENT = "ISSUE_FULFILMENT"
    DISPOSAL_EXPIRED = "DISPOSAL_EXPIRED"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
