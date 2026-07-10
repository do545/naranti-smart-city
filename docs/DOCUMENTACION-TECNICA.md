# Naranti Analytics Smart City — Documentación Técnica

> **Versión:** 1.0 · **Fecha:** 9 de julio de 2026 · **Clasificación:** Confidencial — Uso interno
> **Dirigido a:** Equipo de Tecnología de la Información (TI)
> **Proyecto Firebase:** `naranti-smartcity` (us-central1)
> **Producción:** https://naranti-smartcity.web.app · https://www.orbitasmartcities.com.mx

> Este archivo es la versión versionable (control de cambios) de la documentación técnica.
> El mismo contenido se entrega en formato Word: `Documentacion-Tecnica-Naranti-Smart-City-v1.0.docx`.

---

## 1. Resumen Ejecutivo

**Naranti Analytics Smart City** es una plataforma de publicidad exterior digital (DOOH, *Digital-Out-Of-Home*) que administra de forma centralizada una flota de dispositivos físicos: **kioscos interactivos** verticales (pantalla táctil ciudadana) y **pantallas pasivas** 16:9 (señalización tipo Novastar/TV). Desde un único Centro de Control web, el operador sube campañas, programa su pauta (fechas, días, horarios), segmenta por dispositivo y monitorea la flota en tiempo real.

La plataforma enriquece la experiencia con módulos de valor para el ciudadano (noticias locales, empleos, transporte, turismo, salud, servicios municipales), aumentando el tiempo de contacto y el valor publicitario del inventario.

**Características arquitectónicas clave:**

- **Serverless:** opera íntegramente sobre Google Firebase; no hay servidores de aplicación que administrar.
- **Cliente-directo-a-nube:** el frontend (SPA React) habla directo con Firebase; la seguridad se aplica en las reglas del backend, no en el cliente.
- **Tolerante a fallos de red:** los kioscos siguen mostrando publicidad y contenido sin internet (caché + Service Worker).
- **Operación remota:** recarga, limpieza de caché, captura y reinicio de fábrica por dispositivo desde el panel.

---

## 2. Stack Tecnológico

### 2.1 Frontend

| Componente | Tecnología | Propósito |
|---|---|---|
| Framework UI | React 18 | Interfaz basada en componentes |
| Build | Vite 7 | Compilación y bundling de producción |
| Lenguaje | JavaScript (JSX) | Sin capa TypeScript |
| Ruteo | react-router-dom 6 | Navegación SPA por rol y módulo |
| Estilos | Tailwind CSS + Radix / shadcn-ui | Sistema de diseño accesible |
| Animación | framer-motion 10 | Transiciones e interacciones |
| Gráficas | recharts 2 | Analíticas del Centro de Control |
| Mapas | Leaflet + react-leaflet | Rutas de transporte público |
| Códigos QR | qrcode.react | Enlaces "continúa en tu celular" |
| Iconografía | lucide-react | Iconos vectoriales |

### 2.2 Backend y plataforma

| Componente | Tecnología | Propósito |
|---|---|---|
| Autenticación | Firebase Authentication | Email/contraseña; whitelist por rol |
| Base de datos | Cloud Firestore | Datos en tiempo real |
| Almacenamiento | Cloud Storage | Arte de campañas y capturas |
| Funciones | Cloud Functions v2 (Node 20) | Tareas programadas y operaciones privilegiadas |
| Hospedaje | Firebase Hosting | CDN global con rewrites SPA |
| Secretos | Google Secret Manager | Claves de API de terceros |
| Protección API | Firebase App Check (reCAPTCHA v3) | Preparado; activable con site key |

> **Nota de arquitectura:** no existe backend monolítico ni servidores intermedios. El navegador del kiosco y el del administrador consumen directamente los SDK de Firebase. Toda la autorización vive en las reglas de seguridad y en las Cloud Functions, no en el cliente (que es público por naturaleza).

---

## 3. Arquitectura del Sistema

### 3.1 Roles

El rol se guarda en el documento del usuario en Firestore (colección `users`, id = correo en minúsculas) y determina el acceso en la app y en las reglas.

| Rol | Dispositivo / uso | Capacidades |
|---|---|---|
| **admin** | Centro de Control (panel web) | Administra toda la operación |
| **kiosk** | Kiosco interactivo vertical | Muestra publicidad y módulos; registra contactos; heartbeat y capturas |
| **screen** | Pantalla pasiva 16:9 | Reproduce el arte horizontal en bucle |

Existe un rol **mall** reservado en las reglas para un futuro modo "centro comercial"; hoy no está en uso.

### 3.2 Identidad de dispositivos

Cada dispositivo se identifica por el correo con el que inicia sesión, que es el id de su documento en la colección de dispositivos. Esto permite segmentar campañas y atribuir métricas, capturas y ubicación de forma unívoca.

### 3.3 Flujo de publicidad ("la antena")

1. El administrador crea la campaña y sube el arte (vertical de kiosco, banner horizontal, arte 16:9 de pantalla).
2. El arte va a Cloud Storage y los metadatos (fechas, días, horarios, segmentación) a Firestore.
3. Cada dispositivo consulta las campañas activas **cada 30 segundos** y aplica el filtrado programático local (fecha, día, franja horaria, segmentación).
4. El Service Worker precachea los medios; sin internet, sigue rotando lo ya descargado.
5. El dispositivo envía un **heartbeat cada 30 segundos** con estado, resolución, ubicación y campaña en pantalla.

### 3.4 Modos operativos del kiosco

- **Activo:** el ciudadano navega los módulos; banner publicitario arriba.
- **Protector de pantalla (idle):** tras 20 s sin interacción, publicidad a pantalla completa.
- **Regreso automático:** tras 90 s de inactividad dentro de un módulo, vuelve a la pantalla principal.
- **Emergencia / Mantenimiento:** estados globales que el admin activa remotamente.

---

## 4. Modelo de Datos (Cloud Firestore)

| Colección | Contenido | Lectura | Escritura |
|---|---|---|---|
| `users` | Whitelist de cuentas y rol (id = correo) | Admin / propio | Solo admin |
| `kiosks` | Flota: heartbeat, ubicación, capturas, comandos | Admin / propio | Admin / propio\* |
| `campaigns` | Campañas y pauta programática | Usuarios válidos | Solo admin |
| `settings` | Config global (rotación, emergencia, medios) | Usuarios válidos | Solo admin |
| `analytics` | Métricas diarias: contactos y toques | Solo admin | Solo dispositivos\*\* |
| `jobs` | Feed de vacantes por ciudad | Usuarios válidos | Solo backend |
| `jobs_local` | Vacantes locales curadas (vendible) | Usuarios válidos | Solo admin |
| `news` | Feed de noticias por ciudad (RSS) | Usuarios válidos | Solo backend |
| `spotlight` | Contenido de usuario (reservado) | Usuarios válidos | Solo admin |

\* El dispositivo actualiza su propio documento (heartbeat, ubicación, captura) pero **no** los campos de control que solo envía el admin (comandos, horario de brillo).
\*\* Restringido a documentos de dispositivo y a los campos de métricas conocidos; no se pueden inyectar campos arbitrarios.

> **Regla de oro — denegación por defecto:** las reglas terminan denegando toda lectura/escritura a cualquier ruta no declarada explícitamente.

---

## 5. Seguridad

La seguridad no depende de ocultar la clave de API del frontend (pública por diseño), sino de tres capas: autenticación, autorización por reglas y operaciones privilegiadas en el backend.

### 5.1 Autenticación y control de acceso

- **Whitelist obligatoria:** sin registro en `users` con rol válido, no hay acceso; se cierra la sesión automáticamente.
- **Registro público deshabilitado:** el self-signup está desactivado en Authentication. Ningún externo puede crearse cuenta aunque tenga la clave pública.
- **Alta/baja por backend:** creación y eliminación vía Cloud Functions que verifican rol admin. La baja **elimina la cuenta de Authentication** (revocación real e inmediata), no solo la whitelist.
- **Protección de administradores:** no se puede eliminar la propia cuenta en sesión ni al último admin.
- **Protección contra enumeración de correos** activada.
- **Contraseñas** solo en Firebase Authentication (hasheadas por Google); nunca en Firestore. Se purgó el residuo histórico.

### 5.2 Autorización por reglas

Versionadas en el repo (`firestore.rules`, `storage.rules`) y desplegadas a producción:

- Solo **admin** crea/modifica campañas y configuración, o envía comandos.
- **Noticias** y **empleos** solo los escribe el backend.
- Un dispositivo solo actualiza **su propio** documento y solo campos permitidos.
- Las capturas en Storage deben nombrarse con el correo del propio dispositivo.

### 5.3 Almacenamiento de archivos (Cloud Storage)

| Ruta | Escribe | Restricciones |
|---|---|---|
| `campaigns/` | Solo admin | Máx. 300 MB; solo imagen/video |
| `screenshots/` | Dispositivos | Máx. 10 MB; solo imagen; nombre = correo del dispositivo |
| `spotlight/` | Solo admin | Reservado a futuro (UGC moderado) |
| (otras) | — | Denegado por defecto |

### 5.4 Modo tótem (blindaje del navegador)

- Pantalla completa forzada y persistente entre módulos.
- Bloqueo de menú contextual y selección de texto.
- Wake Lock (la pantalla no se apaga).
- Cursor oculto durante la operación.

### 5.5 Verificaciones realizadas

- **Prueba de intrusión de registro:** alta externa contra la API de producción → `ADMIN_ONLY_OPERATION` (bloqueado).
- **Cotejo de reglas:** las reglas vivas coinciden byte a byte con el repositorio.

### 5.6 Pendientes de seguridad recomendados (no bloqueantes)

| Recomendación | Beneficio | Prioridad |
|---|---|---|
| Activar Firebase App Check (reCAPTCHA v3) | Bloquea consumo de API desde apps no autorizadas | **Alta** |
| Restringir la clave de Google Maps por dominio en GCP | Evita uso indebido de la clave | Media |
| Retirar scripts de depuración heredados del build de producción | Reduce superficie y ruido | Media |
| Habilitar MFA para la cuenta administradora | Segundo factor para el rol más privilegiado | Media |

---

## 6. Centro de Control (Panel de Administración)

Accesible solo para el rol `admin`.

| Vista | Ruta | Función |
|---|---|---|
| Dashboard | `/smartcity/admin` | Estado de la red, rendimiento semanal, campañas |
| Flota (Dispositivos) | `/smartcity/admin/kiosks` | Alta, estado en vivo, comandos y capturas |
| Modo Kiosco | `/smartcity/admin/kiosk-mode` | Editor visual de la interfaz |
| Campañas | `/smartcity/admin/campaigns` | Crear, editar, pausar, ordenar, segmentar |
| Spotlight | `/smartcity/admin/spotlight` | Moderación de UGC (reservado) |
| Empleos | `/smartcity/admin/jobs` | Vacantes locales y refresco del feed |
| Noticias | `/smartcity/admin/news` | Medios por ciudad y refresco del feed |
| Usuarios | `/smartcity/admin/users` | Alta/baja de cuentas y roles |
| Métricas | `/smartcity/admin/metrics` | Analíticas de contactos y toques (30 días) |
| Ajustes | `/smartcity/admin/settings` | Configuración global |

### 6.1 Gestión de campañas

Cada campaña admite: nombre y ejecutivo responsable; arte multiformato (vertical, banner horizontal, 16:9); rango de fechas; segmentación por tipo de dispositivo y por dispositivo específico; pauta por días y franjas horarias; ponderación de repetición ("pasos", 1–4); y orden en la lista. Se pueden crear, **editar por completo**, pausar/activar y eliminar. Extender la vigencia de una campaña vencida la reactiva automáticamente.

### 6.2 Control remoto de la flota

| Comando | Efecto |
|---|---|
| `RELOAD` | Recarga la app (toma la última versión publicada) |
| `CLEAR_CACHE` | Limpia caché de la app y recarga |
| `FACTORY_RESET` | Limpia caché, configuración y medios offline, y recarga |
| `SCREENSHOT` | Captura la pantalla y la sube como evidencia |

---

## 7. Analíticas y Métricas

Dos indicadores complementarios con definición precisa de contacto:

| Métrica | Definición |
|---|---|
| **Interacción (contacto real)** | Una persona que llega y usa el kiosco. Se cuenta **una vez por sesión**: el primer toque tras 60 s sin actividad abre un contacto; lo que siga tocando no suma. |
| **Toques en pantalla** | Profundidad de uso: total de toques deduplicados por gesto. Se registran en lotes para no generar costo excesivo. |

**Criterios de precisión:**

- Deduplicación de gesto (un toque táctil que el navegador expande en varios eventos cuenta una vez).
- Solo miden los kioscos físicos: panel, login y pantallas pasivas no ensucian la métrica.
- Atribución correcta al dispositivo real.
- Resistente a reinicios (marcador de contacto persistido localmente).

> **Nota histórica:** los datos anteriores a julio de 2026 están inflados (el modelo previo contaba cada toque, y hasta 3 veces por gesto, como interacción). A partir de esa fecha reflejan contactos reales.

---

## 8. Backend Serverless (Cloud Functions)

Región `us-central1`, Node.js 20 (Cloud Functions v2).

| Función | Tipo | Propósito |
|---|---|---|
| `refreshNews` | Programada (cada 3 h) | Ingesta de noticias RSS por ciudad |
| `refreshNewsNow` | Invocable (admin) | Refresco manual de noticias |
| `refreshJobs` | Programada (cada 12 h) | Ingesta de vacantes por ciudad (API Jooble) |
| `refreshJobsNow` | Invocable (admin) | Refresco manual de empleos |
| `createManagedUser` | Invocable (admin) | Alta con validación de rol y contraseña |
| `deleteManagedUser` | Invocable (admin) | Baja con revocación real de sesión (borra cuenta Auth) |

### 8.1 Ingesta de contenido

- **Noticias:** parseo de RSS de medios locales, extracción de imagen, deduplicación, tope de 20 notas/ciudad. Configuración de medios en `settings/news_feeds`, editable desde el panel. Si todos los feeds fallan, no se sobrescribe la caché válida.
- **Empleos:** consulta a Jooble por ciudad (manual, caché o geolocalización inversa del heartbeat). La clave vive en Secret Manager, nunca en el código.

> **Requisito de plan:** Cloud Functions y Secret Manager requieren el plan **Blaze** (pago por uso), ya activo. Costo proporcional al uso; el volumen actual es muy bajo.

---

## 9. Resiliencia y Operación sin Conexión

- **Service Worker de medios:** precachea imágenes y videos; soporta video por rangos (Range) desde caché.
- **Caché de campañas y configuración:** la última pauta descargada se reutiliza sin conexión.
- **Sesión offline de dispositivo:** el rol se cachea para arrancar aunque Firestore no responda.
- **Persistencia multipestaña de Firestore.**
- **Manejo de arte inválido:** si un anuncio falla, salta al siguiente (nunca deja la pantalla en negro).

---

## 10. Despliegue y Entornos

### 10.1 Entornos

| Entorno | URL |
|---|---|
| Producción (Firebase) | https://naranti-smartcity.web.app |
| Producción (dominio) | https://www.orbitasmartcities.com.mx |
| Proyecto Firebase | `naranti-smartcity` (us-central1) |

### 10.2 Proceso de despliegue

1. **Build:** compilación local con Vite → carpeta `dist/`.
2. **Hosting:** publicar `dist/` a Firebase Hosting (assets con hash cacheados agresivamente; `sw.js` sin caché para tomar updates de inmediato).
3. **Reglas:** desplegar `firestore.rules` y `storage.rules`.
4. **Funciones:** desplegar las Cloud Functions.
5. **Post-despliegue:** enviar `RELOAD` a los dispositivos.

> **Política de despliegue:** el hospedaje anterior en Hostinger/Horizons quedó descartado (copia desactualizada; su editor con IA eliminaba funcionalidad). Todo se despliega contra Firebase Hosting, de forma controlada y solo con autorización explícita del responsable del proyecto.

### 10.3 Variables de entorno del build

| Variable | Uso |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Clave de Google Maps (módulo restaurantes/lugares) |
| `VITE_FIREBASE_APPCHECK_SITE_KEY` | Site key de reCAPTCHA para App Check (opcional) |
| `JOOBLE_API_KEY` (Secret Manager) | Clave de la API de empleos (solo backend) |

---

## 11. Runbook Operativo

### 11.1 Alta de un nuevo dispositivo (kiosco o pantalla)

1. Panel → **Usuarios** → crear cuenta con el correo del dispositivo, contraseña (mín. 6 caracteres) y rol (kiosco/pantalla).
2. El sistema crea automáticamente el registro del dispositivo en la flota.
3. En el dispositivo, iniciar sesión con ese correo; conceder ubicación y activar pantalla completa al primer toque.
4. Opcional: asignar la ciudad en la vista de Flota para noticias y empleos locales correctos.

### 11.2 Publicar o editar una campaña

1. **Campañas** → "Nueva Campaña" o botón de edición (lápiz).
2. Cargar arte, definir fechas/días/horarios/segmentación, guardar.
3. Los dispositivos aplican el cambio en máx. 30 segundos.

### 11.3 Revocar el acceso de una cuenta

1. **Usuarios** → eliminar. Borra la cuenta de Authentication (corta sesiones) y la retira de la whitelist de inmediato.

### 11.4 Un kiosco no muestra publicidad

- Verificar en **Flota** que está en línea (heartbeat reciente).
- Confirmar que hay una campaña activa cuya segmentación (tipo, ID, fechas, días, horario) lo incluya en el momento actual.
- Enviar `RELOAD`; si persiste, `CLEAR_CACHE`.

### 11.5 Un kiosco muestra una versión antigua

- Enviar `RELOAD`. Si tenía la app en su Service Worker, enviar `CLEAR_CACHE`.

### 11.6 Activar aviso de emergencia o mantenimiento

- **Ajustes** → activar el estado; todos los dispositivos muestran el aviso a pantalla completa hasta desactivarlo.

---

## 12. Glosario

| Término | Definición |
|---|---|
| DOOH | *Digital-Out-Of-Home*: publicidad digital en espacios físicos |
| SPA | *Single Page Application* |
| Heartbeat | Pulso periódico de estado que envía un dispositivo |
| Service Worker | Script del navegador que habilita caché y modo offline |
| Pauta programática | Programación de cuándo se muestra una campaña (días/horarios) |
| Segmentación | Restricción de una campaña a ciertos dispositivos o tipos |
| Whitelist | Lista de cuentas autorizadas; sin registro no hay acceso |
| Reglas de seguridad | Políticas de Firebase que definen quién lee/escribe cada dato |
| App Check | Servicio que verifica que las peticiones vengan de la app legítima |
| Tótem | El kiosco físico vertical con pantalla táctil |

---

*Fin del documento — Naranti Analytics Smart City · Documentación Técnica v1.0*
