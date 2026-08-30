export type UserRole = 'client' | 'owner';
export type AppointmentStatus = 'available' | 'booked' | 'completed' | 'cancelled';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

/** Salonul asa cum apare in listari si pe cardurile din pagina de căutare. */
export interface SalonCard {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  coverImage: string;
  rating: number;
  reviews: number;
  minPrice: number;
  serviceCount: number;
  freeSlots: number;
  isFavorite: boolean;
}

export interface SalonService {
  id: number;
  salonId: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  durationMin: number;
  price: number;
}

export interface StaffMember {
  id: number;
  salonId: number;
  name: string;
  role: string;
  initials: string;
  active: number;
}

export interface OpeningHours {
  weekday: number;
  opens: string;
  closes: string;
  closed: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  author: string;
}

export interface SalonDetail extends Omit<SalonCard, 'reviews'> {
  description: string;
  email: string;
  /** numarul total de recenzii */
  reviewCount: number;
  services: SalonService[];
  staff: StaffMember[];
  hours: OpeningHours[];
  reviews: Review[];
  myReview: { id: number; rating: number; comment: string } | null;
  canReview: boolean;
}

/** Un interval din agenda unui salon. */
export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  clientName: string;
  phone: string;
  email: string;
  notes: string;
  userId: number | null;
  salonId: number;
  salonSlug: string;
  salonName: string;
  salonCity: string;
  salonAddress: string;
  salonPhone: string;
  serviceId: number;
  service: string;
  category: string;
  durationMin: number;
  price: number;
  staffId: number;
  staff: string;
  staffInitials: string;
}

export interface DaySummary {
  date: string;
  total: number;
  available: number;
  booked: number;
}

export interface MyAppointments {
  upcoming: Appointment[];
  past: Appointment[];
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  appointmentId: number | null;
  isRead: number;
  createdAt: string;
}

export interface PlatformFilters {
  cities: Array<{ city: string; salons: number }>;
  categories: Array<{ category: string; salons: number }>;
  stats: {
    salons: number;
    services: number;
    specialists: number;
    freeSlots: number;
    users: number;
    bookings: number;
  };
}

export interface OwnerSalon extends SalonCard {
  services: SalonService[];
  staff: StaffMember[];
  stats: { total: number; booked: number; available: number; occupancy: number; revenue: number };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string>;
}

/** Datele trimise la rezervarea unui interval. */
export interface ReservationRequest {
  clientName: string;
  phone: string;
  email?: string;
  notes?: string;
}
