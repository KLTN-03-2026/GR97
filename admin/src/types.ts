// API Response Types
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'admin';
  isActive: boolean;
}

export interface Doctor {
  _id: string;
  fullName: string;
  title: string;
  specialty: string;
  hospital: string;
  experienceYears: number;
  rating: number;
  bio: string;
  avatarUrl?: string;
  avatarColor: string;
  timeSlots: string[];
  account?: {
    username: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
}

export interface Appointment {
  _id: string;
  user: User;
  doctor: Doctor;
  appointmentAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  userName?: string;
  doctorName?: string;
}

export interface OverviewStats {
  cards: {
    appointmentsCount: number;
    doctorsCount: number;
    monthlyRevenue: number;
  };
  chartSeries: Array<{
    date: string;
    count: number;
  }>;
  statusCounts: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  topDoctors: Array<{
    doctorName: string;
    appointments: number;
    completed: number;
  }>;
  recentAppointments: Appointment[];
  paidCount: number;
}

export interface AIInsights {
  overallRating: string;
  ratingScore: number;
  summary: string;
  trends: string[];
  alerts: string[];
  recommendations: string[];
  prediction?: string;
}

// Form Types
export interface DoctorFormData {
  fullName: string;
  title: string;
  specialty: string;
  hospital: string;
  experienceYears: string;
  rating: string;
  bio: string;
  avatarUrl: string;
  avatarColor: string;
  timeSlots: string;
  username: string;
  email: string;
  phone: string;
  tempPassword: string;
}

// Component Props Types
export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export interface LoginFormProps {
  onLogin: (token: string, user: User) => void;
}
