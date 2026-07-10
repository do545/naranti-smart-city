import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

const AuthContext = createContext();

const KNOWN_ROLES = ['admin', 'kiosk', 'screen'];
const ROLE_CACHE_PREFIX = 'naranti_role_cache_v1:';
const LAST_DEVICE_SESSION_KEY = 'naranti_last_device_session_v1';

class AuthorizationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'AuthorizationError';
		this.isAuthorizationError = true;
	}
}

function getRoleCacheKey(email) {
	return `${ROLE_CACHE_PREFIX}${String(email || '').trim().toLowerCase()}`;
}

function readCachedRole(email) {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(getRoleCacheKey(email));
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		const role = parsed?.role;
		if (!KNOWN_ROLES.includes(role)) return null;
		return role;
	} catch (error) {
		return null;
	}
}

function writeCachedRole(email, role) {
	if (typeof window === 'undefined') return;
	if (!KNOWN_ROLES.includes(role)) return;
	try {
		localStorage.setItem(getRoleCacheKey(email), JSON.stringify({
			role,
			updatedAt: Date.now()
		}));
	} catch (error) {
		// Ignore storage errors (quota/private mode).
	}
}

function clearCachedRole(email) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(getRoleCacheKey(email));
	} catch (error) {
		// Ignore.
	}
}

function isDeviceRoute() {
	if (typeof window === 'undefined') return false;
	const path = window.location.pathname;
	return (
		path === '/smartcity/display' ||
		path === '/smartcity/screen' ||
		['/noticias', '/fitness', '/empleo', '/arcade', '/spotlight'].includes(path)
	);
}

function writeLastDeviceSession(user, role) {
	if (typeof window === 'undefined') return;
	if (!['kiosk', 'screen'].includes(role)) return;

	try {
		localStorage.setItem(LAST_DEVICE_SESSION_KEY, JSON.stringify({
			email: user.email.toLowerCase(),
			displayName: user.displayName || '',
			role,
			updatedAt: Date.now()
		}));
	} catch {
		// Ignore storage errors.
	}
}

function readLastDeviceSession() {
	if (typeof window === 'undefined') return null;

	try {
		const raw = localStorage.getItem(LAST_DEVICE_SESSION_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed?.email || !['kiosk', 'screen'].includes(parsed?.role)) return null;
		return parsed;
	} catch {
		return null;
	}
}

function clearLastDeviceSession() {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(LAST_DEVICE_SESSION_KEY);
	} catch {
		// Ignore.
	}
}

function clearDeviceAuthCache(email) {
	clearCachedRole(email);
	clearLastDeviceSession();
}

function createOfflineDeviceUser(session) {
	return {
		email: session.email,
		displayName: session.displayName || session.email,
		isOfflineDeviceSession: true
	};
}

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }) {
	const [currentUser, setCurrentUser] = useState(null);
	const [userRole, setUserRole] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// 🔐 Lógica Maestra de Roles
	const checkUserRole = async (user) => {
		if (!user) {
			const cachedDeviceSession = readLastDeviceSession();
			const canUseOfflineDeviceSession =
				cachedDeviceSession &&
				isDeviceRoute() &&
				typeof navigator !== 'undefined' &&
				navigator.onLine === false;

			if (canUseOfflineDeviceSession) {
				console.warn(`⚠️ Usando sesión offline de dispositivo: ${cachedDeviceSession.email}`);
				setCurrentUser(createOfflineDeviceUser(cachedDeviceSession));
				setUserRole(cachedDeviceSession.role);
				setIsLoading(false);
				return cachedDeviceSession.role;
			}

			setUserRole(null);
			setCurrentUser(null);
			setIsLoading(false);
			return null;
		}

		const email = user.email.toLowerCase();
		// Keep Firebase user available even if Firestore is offline — needed for offline ads cache keys.
		setCurrentUser(user);

		try {
			// 1. Buscamos el usuario en la colección 'users'
			const userDocRef = doc(db, 'users', email);
			const userDoc = await getDoc(userDocRef);

			if (userDoc.exists()) {
				const userData = userDoc.data();
				const role = userData?.role;

				if (!KNOWN_ROLES.includes(role)) {
					console.error("⛔ Rol inválido o faltante para usuario:", email);
					await signOut(auth);
					setUserRole(null);
					setCurrentUser(null);
					setIsLoading(false);
					clearDeviceAuthCache(email);
					throw new AuthorizationError("Acceso no autorizado: rol inválido.");
				}

				console.log(`✅ Usuario encontrado en BD: ${role}`);
				setUserRole(role);
				writeCachedRole(email, role);
				writeLastDeviceSession(user, role);
				// Actualizamos lastAccess sin bloquear el login (best-effort)
				setDoc(userDocRef, { lastAccess: serverTimestamp() }, { merge: true }).catch(() => { });
				setIsLoading(false);
				return role;
			}

			// 🚫 No registrado en `users` -> Bloqueado.
			// El primer admin se crea manualmente en la consola de Firebase;
			// las reglas de seguridad no permiten bootstrap desde el cliente.
			console.error("⛔ Usuario no registrado en la whitelist");
			await signOut(auth);
			setUserRole(null);
			setCurrentUser(null);
			setIsLoading(false);
			clearDeviceAuthCache(email);
			throw new AuthorizationError("Acceso no autorizado: Tu correo no está registrado en el sistema.");

		} catch (error) {
			console.error("Error verificando rol:", error);
			if (error?.isAuthorizationError) {
				throw error;
			}

			// Offline/temporary Firestore errors: fall back to last known role so kiosk/screen can keep running.
			const cachedRole = readCachedRole(email);
			if (cachedRole) {
				console.warn(`⚠️ Usando rol cacheado para ${email}: ${cachedRole}`);
				setUserRole(cachedRole);
				writeLastDeviceSession(user, cachedRole);
				setIsLoading(false);
				return cachedRole;
			}
			setIsLoading(false);
			return null;
		}
	};

	const login = async (email, password) => {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		return await checkUserRole(userCredential.user);
	};

	const logout = async () => {
		setIsLoading(true);
		const email = currentUser?.email?.toLowerCase();
		await signOut(auth);
		if (email) clearCachedRole(email);
		clearLastDeviceSession();
		setCurrentUser(null);
		setUserRole(null);
		setIsLoading(false);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			checkUserRole(user).catch(() => setIsLoading(false));
		});
		return unsubscribe;
	}, []);

	// 🔒 Modo tótem: en sesiones de dispositivo (kiosk/screen) bloqueamos el
	// menú contextual (clic derecho / dejar presionado en touch) y la selección
	// de texto, para que nadie pueda salir de pantalla completa ni manipular el
	// navegador desde la calle. El panel admin no se ve afectado.
	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!['kiosk', 'screen'].includes(userRole)) return;

		const blockContextMenu = (e) => e.preventDefault();
		window.addEventListener('contextmenu', blockContextMenu);
		document.documentElement.classList.add('kiosk-lock');

		return () => {
			window.removeEventListener('contextmenu', blockContextMenu);
			document.documentElement.classList.remove('kiosk-lock');
		};
	}, [userRole]);

	// 📺 Escala global para tótems físicos: cuando la sesión es de un kiosco
	// en una pantalla alta, subimos el tamaño base (rem) para que TODA la
	// interfaz (home + módulos) se vea grande y uniforme. Tailwind usa rem,
	// así que textos, íconos, tarjetas y espacios crecen proporcionalmente.
	// El panel admin (rol 'admin') no se ve afectado. Ajusta KIOSK_FONT_SCALE
	// para hacer todo más grande o más chico de una sola vez.
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const KIOSK_FONT_SCALE = '135%';
		const root = document.documentElement;
		const isTallScreen = window.matchMedia('(min-height: 1000px)').matches;

		if (userRole === 'kiosk' && isTallScreen) {
			root.style.fontSize = KIOSK_FONT_SCALE;
		} else {
			root.style.fontSize = '';
		}

		return () => { root.style.fontSize = ''; };
	}, [userRole]);

	const value = {
		currentUser,
		userRole,
		isLoading,
		login,
		logout
	};

	return (
		<AuthContext.Provider value={value}>
			{!isLoading && children}
		</AuthContext.Provider>
	);
}