
import { Vendor, Announcement } from './types';

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'Lo de Doña Rosa',
    puestoNumber: '12-A',
    sector: 'Pasillo Norte - Sector A',
    category: 'Comida',
    description: 'Empanadas tucumanas auténticas y pasteles caseros. Todo hecho a mano con amor.',
    image: 'https://images.unsplash.com/photo-1541518763669-27f70451fce0?w=600&h=400&fit=crop',
    schedule: 'Martes y Sábados 8:00 - 14:00',
    phone: '+54 11 1234 5678',
    whatsapp: '5491112345678',
    isActiveToday: true,
    acceptsCash: true,
    acceptsTransfer: true,
    salesCount: 124,
    viewCount: 450,
    favoritedCount: 89,
    products: [
      { 
        id: 'p1', 
        name: 'Empanada de Carne (Docena)', 
        description: 'Carne cortada a cuchillo, aceitunas y el secreto de la casa.',
        price: 8500, 
        image: 'https://images.unsplash.com/photo-1628102420743-306915f6068d?w=200&h=200&fit=crop', 
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=p1-empanada' 
      },
      { 
        id: 'p2', 
        name: 'Pastel de Batata', 
        description: 'Dulce de batata artesanal con masa hojaldrada.',
        price: 1200, 
        image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=200&h=200&fit=crop', 
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=p2-pastel' 
      }
    ],
    reviews: [
      { id: 'r1', userName: 'Carlos G.', rating: 5, comment: 'Las mejores empanadas del barrio, sin dudas.', date: '2023-10-25' },
      { id: 'r2', userName: 'Marta R.', rating: 4, comment: 'Muy ricas, aunque a veces hay mucha fila.', date: '2023-11-02' }
    ],
    messages: []
  },
  {
    id: 'v2',
    name: 'Huerta Juan',
    puestoNumber: '05',
    sector: 'Entrada Principal',
    category: 'Verdulería',
    description: 'Frutas y verduras directo del productor.',
    image: 'https://images.unsplash.com/photo-1488459711635-0c0028974444?w=600&h=400&fit=crop',
    schedule: 'Sábados 7:30 - 13:00',
    phone: '+54 11 8765 4321',
    whatsapp: '5491187654321',
    isActiveToday: false,
    acceptsCash: true,
    acceptsTransfer: false,
    salesCount: 342,
    viewCount: 1200,
    favoritedCount: 210,
    products: [],
    reviews: [],
    messages: []
  }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: '¡Feria Suspendida!',
    message: 'Hoy Martes 31 la feria se suspende por fuertes lluvias.',
    type: 'alert',
    date: 'Hoy 07:00'
  }
];

export const CATEGORIES = ['Todas', 'Verdulería', 'Panadería', 'Carnicería', 'Ropa', 'Comida', 'Otros'];
