import React from 'react';
import { useTotem } from '@/contexts/TotemContext';
import { motion, AnimatePresence } from 'framer-motion';
import { isVideoMedia } from '@/lib/media';

const FullscreenIdleAd = ({ ad, ads = [] }) => {
	const {
		showFullscreenAd,
		setShowFullscreenAd,
		setIsIdle,
		globalAds,
		currentAdIndex,
		handleNextAd,
		adRotationMs
	} = useTotem();

	const activeAds = ads.length > 0 ? ads : globalAds;
	const currentAd = ad || activeAds[currentAdIndex % Math.max(activeAds.length, 1)];
	const isParentControlled = Boolean(ad) || ads.length > 0;

	const handleWake = () => {
		setShowFullscreenAd(false);
		setIsIdle(false);
	};

	// Si el archivo del anuncio no carga (URL rota, video no cacheado offline,
	// archivo corrupto), NO dejamos un cuadro negro/roto en pantalla los
	// segundos de rotación: saltamos de inmediato al siguiente anuncio.
	// El contador evita un ciclo infinito de saltos si TODOS fallan a la vez
	// (p. ej. sin internet y sin caché): tras una vuelta completa deja de
	// saltar y la rotación normal por tiempo sigue reintentando.
	const consecutiveErrorsRef = React.useRef(0);
	const handleMediaLoaded = () => {
		consecutiveErrorsRef.current = 0;
	};
	const handleMediaError = (e) => {
		console.error("Error al cargar media del anuncio:", e?.target?.src);
		consecutiveErrorsRef.current += 1;
		if (activeAds.length > 1 && consecutiveErrorsRef.current < activeAds.length) {
			handleNextAd();
		}
	};

	React.useEffect(() => {
		if ((showFullscreenAd || isParentControlled) && currentAd && activeAds.length > 1) {
			const timer = setTimeout(() => {
				handleNextAd();
			}, adRotationMs);
			return () => clearTimeout(timer);
		}
	}, [activeAds.length, adRotationMs, currentAd, handleNextAd, isParentControlled, showFullscreenAd]);

	if ((!showFullscreenAd && !isParentControlled) || !currentAd) return null;

	const mediaSrc = currentAd.verticalUrl || currentAd.mediaUrl || currentAd.imageUrl;

	if (!mediaSrc) return null;

	// El tipo se decide por el ARCHIVO a mostrar (una campaña puede mezclar
	// video vertical con imagen horizontal, etc.), no por el campo global.
	const isVideo = isVideoMedia(mediaSrc, currentAd.mediaType);

	return (
		<div
			className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
			onClick={handleWake}
			onTouchStart={handleWake}
		>
			<AnimatePresence mode='wait'>
				<motion.div
					key={currentAd.id + currentAdIndex}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
					className="absolute inset-0 w-full h-full"
				>
					{isVideo ? (
						<video
							key={mediaSrc}
							src={mediaSrc}
							className="w-full h-full object-cover"
							autoPlay
							muted
							playsInline
							loop={activeAds.length <= 1}
							onEnded={handleNextAd}
							onLoadedData={handleMediaLoaded}
							onError={handleMediaError}
						/>
					) : (
						<img
							key={mediaSrc}
							src={mediaSrc}
							alt={currentAd.name || "Advertisement"}
							className="w-full h-full object-cover"
							onLoad={handleMediaLoaded}
							onError={handleMediaError}
						/>
					)}

					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.5, duration: 0.5 }}
							className="absolute bottom-4 left-4"
						>
							<div className="text-white text-sm font-semibold animate-pulse bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
								Toca para interactuar
							</div>
						</motion.div>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
};

export default FullscreenIdleAd;