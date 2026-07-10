import { Stethoscope, Trees, Scissors, ShoppingBag, Heart, AlertCircle } from 'lucide-react';

export const petCategories = [
  { id: 'all', name: 'Todos', icon: null },
  { id: 'health', name: 'Salud', icon: Stethoscope },
  { id: 'emergency', name: 'Urgencias', icon: AlertCircle },
  { id: 'parks', name: 'Parques', icon: Trees },
  { id: 'grooming', name: 'Estética', icon: Scissors },
  { id: 'adoption', name: 'Adopción', icon: Heart },
  { id: 'stores', name: 'Tiendas', icon: ShoppingBag },
];

export const petPlaces = [
  {
    id: 1,
    name: "Hospital Vet. Especialidades",
    category: "health",
    address: "Av. Camelinas 2300, Jardines del Cupatitzio",
    rating: 4.8,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    color: "bg-blue-100 text-blue-600",
    featured: true,
    description: "Atención especializada 24/7. Contamos con quirófano equipado, rayos X, y laboratorio clínico para tu mascota.",
    phone: "443 123 4567",
    hours: "Abierto 24 hrs"
  },
  {
    id: 2,
    name: "Bosque Cuauhtémoc",
    category: "parks",
    address: "Centro Histórico, Morelia",
    rating: 4.7,
    distance: "800 m",
    image: "https://images.unsplash.com/photo-1597633425046-08f5110420b5?auto=format&fit=crop&w=800&q=80",
    color: "bg-green-100 text-green-600",
    featured: true,
    description: "Amplias áreas verdes ideales para pasear con tu perro. Zona pet-friendly delimitada para que corran seguros.",
    phone: "N/A",
    hours: "06:00 - 18:00"
  },
  {
    id: 3,
    name: "Spa Canino Huellitas",
    category: "grooming",
    address: "Blvd. García de León 1540",
    rating: 4.9,
    distance: "2.5 km",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80",
    color: "bg-pink-100 text-pink-600",
    featured: false,
    description: "Servicio completo de baño, corte de pelo, limpieza dental y masajes relajantes para perros y gatos.",
    phone: "443 987 6543",
    hours: "09:00 - 19:00"
  },
  {
    id: 4,
    name: "Centro de Adopción 'Vida'",
    category: "adoption",
    address: "Salida a Salamanca km 5",
    rating: 4.9,
    distance: "5.2 km",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80",
    color: "bg-red-100 text-red-600",
    featured: true,
    description: "Encuentra a tu mejor amigo. Somos una asociación sin fines de lucro dedicada al rescate y adopción responsable.",
    phone: "443 555 0192",
    hours: "10:00 - 17:00"
  },
  {
    id: 5,
    name: "Urgencias Vet Morelia",
    category: "emergency",
    address: "Av. Ventura Puente 890",
    rating: 4.6,
    distance: "1.5 km",
    image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80",
    color: "bg-red-100 text-red-700",
    featured: true,
    description: "Atención inmediata para casos críticos. Médicos especialistas en guardia permanente.",
    phone: "443 111 2233",
    hours: "Abierto 24 hrs"
  },
  {
    id: 6,
    name: "Petco Las Américas",
    category: "stores",
    address: "Centro Comercial Las Américas",
    rating: 4.5,
    distance: "3.1 km",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
    color: "bg-orange-100 text-orange-600",
    featured: false,
    description: "Gran variedad de alimentos, juguetes y accesorios. Contamos con servicio de entrenamiento y adopción.",
    phone: "443 444 5566",
    hours: "09:00 - 21:00"
  },
  {
    id: 7,
    name: "Parque Lineal Solidaridad",
    category: "parks",
    address: "Av. Solidaridad s/n",
    rating: 4.5,
    distance: "1.8 km",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
    color: "bg-green-100 text-green-600",
    featured: false,
    description: "Sendero largo para caminar o trotar con tu mascota al aire libre.",
    phone: "N/A",
    hours: "Abierto 24 hrs"
  }
];