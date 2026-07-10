export const mockKiosks = [
  { id: 'kiosko_morelia_01', city: 'Morelia', status: 'active', lastConnection: 'Hace 5 minutos' },
  { id: 'kiosko_gdl_01', city: 'Guadalajara', status: 'inactive', lastConnection: 'Hace 2 horas' },
  { id: 'kiosko_cdmx_01', city: 'CDMX', status: 'maintenance', lastConnection: 'Hace 15 minutos' },
  { id: 'kiosko_mty_01', city: 'Monterrey', status: 'active', lastConnection: 'Hace 1 minuto' },
];

export const mockCampaigns = [
  { id: 1, name: 'Campaña Bimbo Verano', kioskId: 'kiosko_morelia_01', duration: '15 días', type: 'Imagen', status: 'Activa' },
  { id: 2, name: 'Festival Internacional de Cine', kioskId: 'Todos', duration: '7 días', type: 'Video', status: 'Activa' },
  { id: 3, name: 'Anuncio Coca-Cola', kioskId: 'kiosko_gdl_01', duration: '30 días', type: 'Imagen', status: 'Inactiva' },
  { id: 4, name: 'Lanzamiento Naranti Phone', kioskId: 'Todos', duration: '1 mes', type: 'Video', status: 'Programada' },
];

export const mockUsers = [
  { id: 1, name: 'Francisco', email: 'do@naranti.com.mx', role: 'Admin', lastAccess: 'Hoy' },
  { id: 2, name: 'Kiosko Morelia', email: 'kiosko_morelia@narantismartcity.com', role: 'Kiosko', lastAccess: 'Hoy' },
  { id: 3, name: 'Jane Doe', email: 'jane.doe@example.com', role: 'Editor', lastAccess: 'Ayer' },
];

export const mockAds = [
  { id: 1, src: '/banner-kiosco.jpg', type: 'image' },
  { id: 2, src: '/publicidad-grande.jpg', type: 'image' }
];