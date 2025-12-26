
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  qrCodeUrl?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface InAppMessage {
  id: string;
  customerName: string;
  productName?: string;
  productPrice?: number;
  type: 'order' | 'claim' | 'suggestion';
  content: string;
  date: string;
  status: 'pending' | 'responded';
}

export interface Vendor {
  id: string;
  name: string;
  puestoNumber: string;
  sector: string;
  category: string;
  description: string;
  image: string;
  schedule: string;
  phone: string;
  whatsapp: string;
  isActiveToday: boolean;
  acceptsCash: boolean;
  acceptsTransfer: boolean;
  alias?: string;
  dni?: string;
  accountName?: string;
  products: Product[];
  reviews: Review[];
  messages: InAppMessage[];
  // Estadísticas de rendimiento
  salesCount: number;
  viewCount: number;
  favoritedCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert';
  date: string;
}

export interface UserProfile {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: 'cliente' | 'vendedor';
  dni: string;
  phone: string;
  vendorId?: string;
  savedVendorIds: string[];
}

export type AppView = 'login' | 'register' | 'directory' | 'vendor' | 'scanner' | 'vendor-dashboard' | 'claims';
