import { ReactNode } from "react";

export type Role = 'client' | 'barber' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  password?: string; // only for mock API
  imageUrl?: string;
}

export interface Barber extends User {
  role: 'barber';
  specialties: string[];
  bio?: string;
  profitPercentage?: number;
  hireDate?: Date;
}

export interface Admin extends User {
    role: 'admin';
}

export interface Service {
  id:string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  barberId: string;
}

export enum AppointmentStatus {
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'No Show'
}

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface Client extends User {
  role: 'client';
  phone: string;
  preferences?: string;
  appointmentHistoryIds?: string[];
}

export type Locale = 'en' | 'es';

export type CurrentUser = (Client | Barber | Admin) & { role: Role };

export interface AuthContextType {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string, role: Role, rememberMe: boolean) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  initialAuthChecked: boolean;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export type BarberUpdateData = Partial<Omit<Barber, 'id' | 'role' | 'email'>> & { password?: string };

export interface DayHours {
  open: string; // "HH:MM" format
  close: string; // "HH:MM" format
  isClosed: boolean;
}

export type BusinessHours = Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', DayHours>;

export interface DiscountCode {
  id: string;
  code: string;
  discountPercentage: number;
  expiryDate: Date;
  isActive: boolean;
}

export interface AdminDashboardViewProps {
  appointments: Appointment[];
  clients: Client[];
  barbers: Barber[];
  services: Service[];
  language: Locale;
  onCreateBarber: (barberData: Omit<Barber, 'id' | 'role'> & { password: string }) => Promise<void>;
  onUpdateBarber: (barberId: string, barberData: BarberUpdateData) => Promise<void>;
  onDeleteBarber: (barberId: string) => Promise<void>;
  isLoading: boolean;
  businessHours: BusinessHours | null;
  onUpdateBusinessHours: (hours: BusinessHours) => Promise<void>;
  discountCodes: DiscountCode[];
  onCreateDiscountCode: (code: Omit<DiscountCode, 'id' | 'isActive'>) => Promise<void>;
  onDeleteDiscountCode: (codeId: string) => Promise<void>;
}

export interface BarberProfileViewProps {
  currentUser: Barber;
  onPasswordChange: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  language: Locale;
}