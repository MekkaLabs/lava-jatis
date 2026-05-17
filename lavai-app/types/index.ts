// ── Core Types ──────────────────────────────────────────────

export type ServiceStatus = 'waiting' | 'in_progress' | 'done' | 'cancelled'

export type ServiceType =
  | 'Lavagem Simples'
  | 'Lavagem Completa'
  | 'Polimento'
  | 'Higienização Interna'
  | 'Lavagem + Cera'
  | 'Lavagem + Polimento'
  | 'Cristalização'
  | 'Limpeza de Motor'

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  plate: string
  carModel: string
  carColor: string
  totalVisits: number
  totalSpent: number
  lastVisit: string
  loyaltyPoints: number
  createdAt: string
}

export interface QueueItem {
  id: string
  customer: Customer
  service: ServiceType
  status: ServiceStatus
  price: number
  arrivedAt: string
  startedAt?: string
  finishedAt?: string
  estimatedMinutes: number
  assignedTo?: string
  notes?: string
  notified: boolean
}

export interface DailyMetrics {
  date: string
  totalCars: number
  revenue: number
  newCustomers: number
  avgTicket: number
}

export interface WeeklyData {
  day: string
  cars: number
  revenue: number
}

export interface AIInsight {
  id: string
  type: 'peak' | 'customer' | 'revenue' | 'tip'
  message: string
  action?: string
  createdAt: string
}

export interface Appointment {
  id: string
  customer: Customer
  service: ServiceType
  scheduledAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
  price: number
}

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro'

export interface Transaction {
  id: string
  customerId: string
  customerName: string
  customerPlate: string
  service: ServiceType
  price: number
  paymentMethod: PaymentMethod
  employee: string
  completedAt: string
  discount?: number
}

export interface DayClosing {
  date: string
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  totalTransactions: number
  totalCars: number
  avgTicket: number
  closedBy: string
  closedAt: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: 'produto' | 'funcionario' | 'energia' | 'manutencao' | 'outro'
  date: string
}

export interface LavaJato {
  id: string
  name: string
  ownerName: string
  phone: string
  address: string
  plan: 'starter' | 'pro' | 'enterprise'
  employees: number
  openAt: string
  closeAt: string
  logoUrl?: string
}
