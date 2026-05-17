import type { Customer, QueueItem, DailyMetrics, WeeklyData, AIInsight, Appointment, LavaJato, Transaction, DayClosing, Expense } from '@/types'

// ── Lava-Jato ────────────────────────────────────────────────
export const lavaJato: LavaJato = {
  id: 'lj-001',
  name: 'Lava-Jato do Marcos',
  ownerName: 'Marcos Ferreira',
  phone: '(11) 99999-8888',
  address: 'Rua das Palmeiras, 142 — Vila Mariana, SP',
  plan: 'pro',
  employees: 8,
  openAt: '07:00',
  closeAt: '19:00',
}

// ── Customers ────────────────────────────────────────────────
export const customers: Customer[] = [
  {
    id: 'c-001',
    name: 'João Carlos Silva',
    phone: '(11) 98765-4321',
    email: 'joao.carlos@gmail.com',
    plate: 'ABC-1234',
    carModel: 'Honda Civic',
    carColor: 'Prata',
    totalVisits: 24,
    totalSpent: 2880,
    lastVisit: '2026-05-14',
    loyaltyPoints: 288,
    createdAt: '2025-08-10',
  },
  {
    id: 'c-002',
    name: 'Renata Silva',
    phone: '(11) 97654-3210',
    plate: 'XYZ-5678',
    carModel: 'Hyundai HB20',
    carColor: 'Branco',
    totalVisits: 12,
    totalSpent: 960,
    lastVisit: '2026-05-13',
    loyaltyPoints: 96,
    createdAt: '2025-11-20',
  },
  {
    id: 'c-003',
    name: 'Marcos Pereira',
    phone: '(11) 96543-2109',
    plate: 'DEF-9012',
    carModel: 'Toyota Corolla',
    carColor: 'Preto',
    totalVisits: 31,
    totalSpent: 5270,
    lastVisit: '2026-05-15',
    loyaltyPoints: 527,
    createdAt: '2025-06-05',
  },
  {
    id: 'c-004',
    name: 'Lúcia Pinto',
    phone: '(11) 95432-1098',
    plate: 'GHI-3456',
    carModel: 'VW Gol',
    carColor: 'Vermelho',
    totalVisits: 8,
    totalSpent: 560,
    lastVisit: '2026-05-15',
    loyaltyPoints: 56,
    createdAt: '2026-01-15',
  },
  {
    id: 'c-005',
    name: 'Bruno Lima',
    phone: '(11) 94321-0987',
    plate: 'JKL-7890',
    carModel: 'Nissan Kicks',
    carColor: 'Cinza',
    totalVisits: 19,
    totalSpent: 3230,
    lastVisit: '2026-05-15',
    loyaltyPoints: 323,
    createdAt: '2025-09-22',
  },
  {
    id: 'c-006',
    name: 'Fernanda Costa',
    phone: '(11) 93210-9876',
    email: 'fernanda@hotmail.com',
    plate: 'MNO-2345',
    carModel: 'Chevrolet Onix',
    carColor: 'Azul',
    totalVisits: 6,
    totalSpent: 420,
    lastVisit: '2026-05-10',
    loyaltyPoints: 42,
    createdAt: '2026-02-28',
  },
  {
    id: 'c-007',
    name: 'Rafael Souza',
    phone: '(11) 92109-8765',
    plate: 'PQR-6789',
    carModel: 'Ford Ka',
    carColor: 'Branco',
    totalVisits: 15,
    totalSpent: 1350,
    lastVisit: '2026-05-12',
    loyaltyPoints: 135,
    createdAt: '2025-10-08',
  },
  {
    id: 'c-008',
    name: 'Amanda Rodrigues',
    phone: '(11) 91098-7654',
    email: 'amanda.r@gmail.com',
    plate: 'STU-0123',
    carModel: 'Jeep Renegade',
    carColor: 'Laranja',
    totalVisits: 9,
    totalSpent: 1800,
    lastVisit: '2026-05-08',
    loyaltyPoints: 180,
    createdAt: '2025-12-01',
  },
]

// ── Queue ────────────────────────────────────────────────────
export const queue: QueueItem[] = [
  {
    id: 'q-001',
    customer: customers[0],
    service: 'Lavagem Completa',
    status: 'in_progress',
    price: 80,
    arrivedAt: '13:42',
    startedAt: '13:50',
    estimatedMinutes: 25,
    assignedTo: 'Diego',
    notified: false,
  },
  {
    id: 'q-002',
    customer: customers[1],
    service: 'Lavagem Simples',
    status: 'in_progress',
    price: 40,
    arrivedAt: '13:55',
    startedAt: '14:05',
    estimatedMinutes: 15,
    assignedTo: 'Paulo',
    notified: false,
  },
  {
    id: 'q-003',
    customer: customers[2],
    service: 'Higienização Interna',
    status: 'waiting',
    price: 120,
    arrivedAt: '14:10',
    estimatedMinutes: 45,
    notified: false,
  },
  {
    id: 'q-004',
    customer: customers[3],
    service: 'Lavagem Completa',
    status: 'waiting',
    price: 80,
    arrivedAt: '14:20',
    estimatedMinutes: 55,
    notified: false,
  },
  {
    id: 'q-005',
    customer: customers[4],
    service: 'Lavagem + Cera',
    status: 'done',
    price: 110,
    arrivedAt: '12:30',
    startedAt: '12:40',
    finishedAt: '13:35',
    estimatedMinutes: 50,
    assignedTo: 'Carlos',
    notified: true,
  },
  {
    id: 'q-006',
    customer: customers[5],
    service: 'Polimento',
    status: 'waiting',
    price: 180,
    arrivedAt: '14:30',
    estimatedMinutes: 90,
    notified: false,
  },
]

// ── Today Metrics ────────────────────────────────────────────
export const todayMetrics = {
  totalCars: 23,
  revenue: 1840,
  waiting: 3,
  inProgress: 2,
  done: 18,
  newCustomers: 2,
  avgTicket: 80,
  vsYesterday: {
    cars: +4,
    revenue: +12.5,
    avgTicket: +5,
  },
}

// ── Weekly Data (Recharts) ───────────────────────────────────
export const weeklyData: WeeklyData[] = [
  { day: 'Seg',  cars: 18, revenue: 1440 },
  { day: 'Ter',  cars: 22, revenue: 1760 },
  { day: 'Qua',  cars: 15, revenue: 1200 },
  { day: 'Qui',  cars: 27, revenue: 2160 },
  { day: 'Sex',  cars: 31, revenue: 2480 },
  { day: 'Sáb',  cars: 38, revenue: 3040 },
  { day: 'Dom',  cars: 12, revenue: 960  },
]

// ── Monthly Data (last 6 months) ─────────────────────────────
export const monthlyData: DailyMetrics[] = [
  { date: 'Dez', totalCars: 420, revenue: 33600, newCustomers: 28, avgTicket: 80 },
  { date: 'Jan', totalCars: 389, revenue: 31120, newCustomers: 22, avgTicket: 80 },
  { date: 'Fev', totalCars: 445, revenue: 35600, newCustomers: 35, avgTicket: 80 },
  { date: 'Mar', totalCars: 502, revenue: 40160, newCustomers: 41, avgTicket: 80 },
  { date: 'Abr', totalCars: 478, revenue: 38240, newCustomers: 29, avgTicket: 80 },
  { date: 'Mai', totalCars: 310, revenue: 24800, newCustomers: 18, avgTicket: 80 },
]

// ── AI Insights ──────────────────────────────────────────────
export const aiInsights: AIInsight[] = [
  {
    id: 'ai-001',
    type: 'peak',
    message: 'Pico previsto às 16h30 baseado no histórico de sextas-feiras. Considere acionar 1 funcionário extra.',
    action: 'Ver previsão completa',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ai-002',
    type: 'customer',
    message: 'Fernanda Costa não vem há 5 dias. Ela costuma vir toda semana. Enviar mensagem de retorno?',
    action: 'Enviar WhatsApp',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ai-003',
    type: 'revenue',
    message: 'Sua receita esta semana já superou a semana passada em R$320. No ritmo atual, maio será seu melhor mês.',
    createdAt: new Date().toISOString(),
  },
]

// ── Appointments ─────────────────────────────────────────────
export const appointments: Appointment[] = [
  {
    id: 'ap-001',
    customer: customers[6],
    service: 'Lavagem Completa',
    scheduledAt: '2026-05-15T15:00:00',
    status: 'confirmed',
    price: 80,
  },
  {
    id: 'ap-002',
    customer: customers[7],
    service: 'Polimento',
    scheduledAt: '2026-05-15T16:30:00',
    status: 'confirmed',
    price: 180,
  },
  {
    id: 'ap-003',
    customer: customers[0],
    service: 'Cristalização',
    scheduledAt: '2026-05-16T09:00:00',
    status: 'pending',
    price: 250,
  },
  {
    id: 'ap-004',
    customer: customers[2],
    service: 'Lavagem Completa',
    scheduledAt: '2026-05-16T10:30:00',
    status: 'confirmed',
    price: 80,
  },
]

// ── Available Slots ──────────────────────────────────────────
export const availableSlots = [
  { time: '14:00', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: false },
  { time: '15:30', available: true },
  { time: '16:00', available: true },
  { time: '16:30', available: false },
  { time: '17:00', available: true },
  { time: '17:30', available: true },
  { time: '18:00', available: true },
]

// ── Services with prices ──────────────────────────────────────
export const services = [
  { name: 'Lavagem Simples',      price: 40,  duration: 20, icon: '🚿' },
  { name: 'Lavagem Completa',     price: 80,  duration: 35, icon: '✨' },
  { name: 'Lavagem + Cera',       price: 110, duration: 50, icon: '💎' },
  { name: 'Polimento',            price: 180, duration: 90, icon: '🌟' },
  { name: 'Higienização Interna', price: 120, duration: 60, icon: '🧹' },
  { name: 'Lavagem + Polimento',  price: 240, duration: 110,icon: '🏆' },
  { name: 'Cristalização',        price: 250, duration: 120,icon: '💠' },
  { name: 'Limpeza de Motor',     price: 90,  duration: 45, icon: '⚙️' },
]

// ── Transactions (today) ─────────────────────────────────────
export const todayTransactions: Transaction[] = [
  { id: 'tx-001', customerId: 'c-001', customerName: 'João Carlos Silva',   customerPlate: 'ABC-1234', service: 'Lavagem Completa',     price: 80,  paymentMethod: 'pix',            employee: 'Carlos',  completedAt: '07:42' },
  { id: 'tx-002', customerId: 'c-002', customerName: 'Renata Silva',         customerPlate: 'XYZ-5678', service: 'Lavagem Simples',       price: 40,  paymentMethod: 'dinheiro',       employee: 'Ana',     completedAt: '08:15' },
  { id: 'tx-003', customerId: 'c-003', customerName: 'Marcos Pereira',       customerPlate: 'DEF-9012', service: 'Polimento',             price: 180, paymentMethod: 'cartao_credito', employee: 'Carlos',  completedAt: '09:30', discount: 10 },
  { id: 'tx-004', customerId: 'c-004', customerName: 'Lúcia Pinto',          customerPlate: 'GHI-3456', service: 'Higienização Interna',  price: 120, paymentMethod: 'pix',            employee: 'Pedro',   completedAt: '10:05' },
  { id: 'tx-005', customerId: 'c-005', customerName: 'Bruno Lima',           customerPlate: 'JKL-7890', service: 'Lavagem + Cera',        price: 110, paymentMethod: 'cartao_debito',  employee: 'Ana',     completedAt: '10:50' },
  { id: 'tx-006', customerId: 'c-006', customerName: 'Fernanda Costa',       customerPlate: 'MNO-1234', service: 'Lavagem Completa',      price: 80,  paymentMethod: 'pix',            employee: 'Carlos',  completedAt: '11:20' },
  { id: 'tx-007', customerId: 'c-007', customerName: 'Rafael Souza',         customerPlate: 'PQR-5678', service: 'Cristalização',         price: 250, paymentMethod: 'cartao_credito', employee: 'Pedro',   completedAt: '12:10', discount: 25 },
  { id: 'tx-008', customerId: 'c-008', customerName: 'Amanda Rodrigues',     customerPlate: 'STU-9012', service: 'Lavagem Simples',       price: 40,  paymentMethod: 'dinheiro',       employee: 'Ana',     completedAt: '13:05' },
  { id: 'tx-009', customerId: 'c-001', customerName: 'Fábio Mendes',         customerPlate: 'VWX-3456', service: 'Limpeza de Motor',      price: 90,  paymentMethod: 'pix',            employee: 'Carlos',  completedAt: '13:45' },
  { id: 'tx-010', customerId: 'c-002', customerName: 'Carla Borges',         customerPlate: 'YZA-7890', service: 'Lavagem + Cera',        price: 110, paymentMethod: 'cartao_debito',  employee: 'Pedro',   completedAt: '14:30' },
  { id: 'tx-011', customerId: 'c-003', customerName: 'Diego Rocha',          customerPlate: 'BCD-1234', service: 'Lavagem Completa',      price: 80,  paymentMethod: 'pix',            employee: 'Ana',     completedAt: '15:15' },
  { id: 'tx-012', customerId: 'c-004', customerName: 'Patrícia Alves',       customerPlate: 'EFG-5678', service: 'Lavagem Simples',       price: 40,  paymentMethod: 'dinheiro',       employee: 'Carlos',  completedAt: '16:00' },
]

// ── Expenses (today) ─────────────────────────────────────────
export const todayExpenses: Expense[] = [
  { id: 'ex-001', description: 'Shampoo automotivo 5L',    amount: 85,  category: 'produto',    date: '2026-05-16' },
  { id: 'ex-002', description: 'Cera líquida premium',     amount: 120, category: 'produto',    date: '2026-05-16' },
  { id: 'ex-003', description: 'Folha de pagto — Carlos',  amount: 180, category: 'funcionario', date: '2026-05-16' },
  { id: 'ex-004', description: 'Folha de pagto — Ana',     amount: 160, category: 'funcionario', date: '2026-05-16' },
  { id: 'ex-005', description: 'Folha de pagto — Pedro',   amount: 160, category: 'funcionario', date: '2026-05-16' },
  { id: 'ex-006', description: 'Energia elétrica parcial', amount: 95,  category: 'energia',    date: '2026-05-16' },
]

// ── Day Closings (last 7 days) ───────────────────────────────
export const dayClosings: DayClosing[] = [
  { date: '2026-05-15', totalRevenue: 1840, totalExpenses: 780, netProfit: 1060, totalTransactions: 23, totalCars: 23, avgTicket: 80,  closedBy: 'Marcos', closedAt: '19:05' },
  { date: '2026-05-14', totalRevenue: 2210, totalExpenses: 840, netProfit: 1370, totalTransactions: 28, totalCars: 28, avgTicket: 78,  closedBy: 'Marcos', closedAt: '19:02' },
  { date: '2026-05-13', totalRevenue: 1520, totalExpenses: 720, netProfit: 800,  totalTransactions: 19, totalCars: 19, avgTicket: 80,  closedBy: 'Marcos', closedAt: '19:00' },
  { date: '2026-05-12', totalRevenue: 2640, totalExpenses: 890, netProfit: 1750, totalTransactions: 33, totalCars: 33, avgTicket: 80,  closedBy: 'Marcos', closedAt: '19:08' },
  { date: '2026-05-11', totalRevenue: 3120, totalExpenses: 950, netProfit: 2170, totalTransactions: 39, totalCars: 39, avgTicket: 80,  closedBy: 'Marcos', closedAt: '19:12' },
  { date: '2026-05-10', totalRevenue: 960,  totalExpenses: 680, netProfit: 280,  totalTransactions: 12, totalCars: 12, avgTicket: 80,  closedBy: 'Marcos', closedAt: '19:01' },
  { date: '2026-05-09', totalRevenue: 1760, totalExpenses: 790, netProfit: 970,  totalTransactions: 22, totalCars: 22, avgTicket: 80,  closedBy: 'Marcos', closedAt: '19:04' },
]
