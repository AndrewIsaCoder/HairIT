export type AppointmentStatus = 'available' | 'booked';

/** O programare, asa cum este returnata de API (structura aplatizata). */
export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  clientName: string;
  phone: string;
  email: string;
  notes: string;
  serviceId: number;
  service: string;
  category: string;
  durationMin: number;
  price: number;
  stylistId: number;
  stylist: string;
  stylistInitials: string;
}

export interface SalonService {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  durationMin: number;
  price: number;
}

export interface Stylist {
  id: number;
  name: string;
  role: string;
  initials: string;
}

export interface DaySummary {
  date: string;
  total: number;
  available: number;
  booked: number;
}

export interface SalonStats {
  total: number;
  booked: number;
  available: number;
  occupancy: number;
  revenue: number;
  topService: string | null;
  services: number;
  stylists: number;
}

/** Datele completate de client in formularul de rezervare. */
export interface ReservationRequest {
  clientName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string>;
}
