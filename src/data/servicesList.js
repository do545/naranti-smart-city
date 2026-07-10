const SHOW_ONLY_OOAPAS = true;

/**
 * servicesList defines all available services in the kiosk.
 */
export const servicesList = [
  {
    section: "Servicios de Agua",
    items: [
      {
        id: "ooapas-payment",
        title: "Pago OOAPAS",
        cta: "Pagar recibo de agua",
        description: "Consulta y paga tu recibo de agua de forma segura.",
        image: "https://www.ooapas.gob.mx/wp-content/uploads/2025/02/OOAPAS_LOGO_azul_texto-1024x576.png",
        url: "https://pagoenlinea.ooapas.gob.mx/index_pago_express.php",
        embedAllowed: true,
        visible: true
      },
      {
        id: "ooapas-report",
        title: "Reporte de Fuga",
        description: "Reporta fugas de agua en tu colonia.",
        image: "https://i.imgur.com/U2t9f1S.png",
        url: "https://www.ooapas.gob.mx/contacto/",
        visible: false
      }
    ]
  },
  {
    section: "Servicios Municipales",
    items: [
      {
        id: "predial-payment",
        title: "Pago de Predial",
        description: "Paga el impuesto predial de Morelia.",
        image: "https://i.imgur.com/GqRlv1Z.png",
        url: "https://pagostramites.morelia.gob.mx/tramitespagos/login.php",
        visible: false
      }
    ]
  },
  {
    section: "Energía (CFE)",
    items: [
      {
        id: "cfe-payment",
        title: "Recibo de Luz",
        description: "Consulta o paga tu recibo de energía eléctrica.",
        image: "https://i.imgur.com/hlv6F6Z.png",
        url: "https://app.cfe.mx/Aplicaciones/CCFE/MiEspacio/login.aspx",
        visible: false
      },
      {
        id: "cfe-report",
        title: "Reporte de Falla",
        description: "Reporta cortes o fallas de luz.",
        image: "https://i.imgur.com/V3kXW8i.png",
        url: "https://app.cfe.mx/aplicaciones/CCFE/SolicitudesCFE/Solicitudes/AvisoDeFallaGmx",
        visible: false
      }
    ]
  },
  {
    section: "Vehicular",
    items: [
      {
        id: "vehicular-refrendo",
        title: "Refrendo Vehicular",
        description: "Consulta y paga tu refrendo vehicular.",
        image: "https://i.imgur.com/JDF10pZ.png",
        url: "https://refrendodigital.michoacan.gob.mx/",
        visible: false
      }
    ]
  }
];

/**
 * visibleServicesList filters the main list based on the configuration flag and item visibility.
 */
export const visibleServicesList = SHOW_ONLY_OOAPAS 
  ? servicesList.map(section => ({
      ...section,
      items: section.items.filter(item => item.id === "ooapas-payment" && item.visible)
    })).filter(section => section.items.length > 0)
  : servicesList.map(section => ({
      ...section,
      items: section.items.filter(item => item.visible)
    })).filter(section => section.items.length > 0);