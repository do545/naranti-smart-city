import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, Trophy } from 'lucide-react';
import { useTotem } from '@/contexts/TotemContext';
import HeaderAd from '@/components/HeaderAd';
import FullscreenIdleAd from '@/components/FullscreenIdleAd';
import useIdleReturnHome from '@/hooks/useIdleReturnHome';

const Arcade = () => {
  const navigate = useNavigate();
  useIdleReturnHome(); // vuelve al inicio tras 90s sin interaccion
  const canvasRef = useRef(null);

  // 0. CONEXIÓN AL CEREBRO
  const { globalAds, currentAdIndex } = useTotem();
  const currentAd = globalAds && globalAds.length > 0 ? globalAds[currentAdIndex] : null;
  const adsForHeader = currentAd ? [currentAd] : [];

  const [gameMode, setGameMode] = useState(null); // '1P' o '2P'
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  // Referencias del juego.
  // ⚠️ FÍSICA EN PX/SEGUNDO (no px/frame): la velocidad se multiplica por el
  // delta de tiempo real en cada frame, así el juego se siente IGUAL en el
  // tótem (pantalla grande, quizá 30fps) que en una laptop (60/120fps).
  // Los tamaños se calculan proporcionales al lienzo en resize().
  const gameState = useRef({
    ball: { x: 0, y: 0, dx: 0, dy: 0, size: 15 },
    p1: { x: 20, y: 0, width: 15, height: 100 }, // Izquierda (Jugador)
    p2: { x: 0, y: 0, width: 15, height: 100 },  // Derecha (CPU/P2)
    width: 0,
    height: 0,
    baseSpeed: 0 // px/s — se fija según el ancho de la cancha
  });

  // --- 1. PROTECTOR DE PANTALLA (20 SEGUNDOS) ---
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      // Si entra en inactividad, pausamos el juego también para ahorrar recursos
      timeout = setTimeout(() => {
        setIsIdle(true);
        setIsPlaying(false);
      }, 20000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('touchmove', resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('touchmove', resetTimer);
    };
  }, []);

  // --- 2. MOTOR DE JUEGO ---
  // IMPORTANTE: Este useEffect debe estar declarado ANTES de cualquier return condicional
  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Ajustar tamaño al contenedor real y ESCALAR el juego a la pantalla
    // (en el tótem la cancha es enorme; con tamaños fijos la paleta y la
    // bola quedaban diminutas y la velocidad se sentía lentísima).
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const state = gameState.current;
      state.width = canvas.width;
      state.height = canvas.height;

      // Elementos proporcionales a la cancha
      state.ball.size = Math.max(12, Math.round(state.width * 0.018));
      const paddleW = Math.max(14, Math.round(state.width * 0.016));
      const paddleH = Math.max(110, Math.round(state.height * 0.14));
      state.p1.width = paddleW;
      state.p2.width = paddleW;
      state.p1.height = paddleH;
      state.p2.height = paddleH;

      // Posición inicial Paletas (centradas verticalmente)
      state.p1.y = state.height / 2 - paddleH / 2;
      state.p2.y = state.height / 2 - paddleH / 2;

      // Posición X con margen proporcional
      const margin = Math.max(16, Math.round(state.width * 0.025));
      state.p1.x = margin;
      state.p2.x = state.width - margin - paddleW;

      // Velocidad base: la bola cruza el ancho de la cancha en ~1.8 s,
      // sin importar el tamaño de pantalla ni los fps del equipo.
      state.baseSpeed = state.width / 1.8;
    };

    resize();
    window.addEventListener('resize', resize);

    const resetBall = () => {
      const state = gameState.current;
      state.ball.x = state.width / 2;
      state.ball.y = state.height / 2;
      // Velocidad inicial en px/s (más horizontal que vertical)
      const directionX = Math.random() > 0.5 ? 1 : -1;
      const directionY = Math.random() > 0.5 ? 1 : -1;
      state.ball.dx = directionX * state.baseSpeed;
      state.ball.dy = directionY * state.baseSpeed * (0.3 + Math.random() * 0.35);
    };

    resetBall();

    const MAX_SPEED_FACTOR = 2.2; // tope de aceleración (2.2× la velocidad base)

    const update = (dt) => {
      const state = gameState.current;

      // Mover (velocidad en px/s × segundos transcurridos = independiente de fps)
      state.ball.x += state.ball.dx * dt;
      state.ball.y += state.ball.dy * dt;

      // Rebote Paredes SUPERIOR / INFERIOR (con corrección de posición para
      // que la bola no se quede "pegada" al borde en frames largos)
      if (state.ball.y + state.ball.size > state.height) {
        state.ball.y = state.height - state.ball.size;
        state.ball.dy = -Math.abs(state.ball.dy);
      } else if (state.ball.y - state.ball.size < 0) {
        state.ball.y = state.ball.size;
        state.ball.dy = Math.abs(state.ball.dy);
      }

      // IA (Modo 1 Jugador) - La CPU juega en la DERECHA (P2)
      if (gameMode === '1P') {
        // Objetivo: centro de la paleta alineado con la pelota
        const targetY = state.ball.y - state.p2.height / 2;
        const diff = targetY - state.p2.y;
        const cpuSpeed = state.height * 0.55; // px/s — dificultad de la CPU
        const step = cpuSpeed * dt;

        // Movimiento suavizado
        if (Math.abs(diff) > step) {
          state.p2.y += diff > 0 ? step : -step;
        }

        // Límites P2
        if (state.p2.y < 0) state.p2.y = 0;
        if (state.p2.y + state.p2.height > state.height) state.p2.y = state.height - state.p2.height;
      }

      const maxSpeed = state.baseSpeed * MAX_SPEED_FACTOR;

      // Colisiones Paletas
      // P1 (Izquierda)
      if (
        state.ball.x - state.ball.size <= state.p1.x + state.p1.width && // Toca lado derecho de P1
        state.ball.x > state.p1.x && // No ha pasado la paleta completamente (prevención glitch)
        state.ball.y >= state.p1.y &&
        state.ball.y <= state.p1.y + state.p1.height
      ) {
        state.ball.dx = Math.min(Math.abs(state.ball.dx * 1.06), maxSpeed); // Rebota hacia derecha, acelerando
        // Ángulo según dónde golpea (proporcional al tamaño de la paleta)
        const hitRatio = (state.ball.y - (state.p1.y + state.p1.height / 2)) / (state.p1.height / 2);
        state.ball.dy = hitRatio * Math.abs(state.ball.dx) * 0.8;
      }

      // P2 (Derecha)
      if (
        state.ball.x + state.ball.size >= state.p2.x && // Toca lado izquierdo de P2
        state.ball.x < state.p2.x + state.p2.width &&
        state.ball.y >= state.p2.y &&
        state.ball.y <= state.p2.y + state.p2.height
      ) {
        state.ball.dx = -Math.min(Math.abs(state.ball.dx * 1.06), maxSpeed); // Rebota hacia izquierda, acelerando
        const hitRatio = (state.ball.y - (state.p2.y + state.p2.height / 2)) / (state.p2.height / 2);
        state.ball.dy = hitRatio * Math.abs(state.ball.dx) * 0.8;
      }

      // Puntos
      if (state.ball.x > state.width) {
        // Punto para P1 (Izquierda)
        setScore(s => ({ ...s, p1: s.p1 + 1 }));
        resetBall();
      } else if (state.ball.x < 0) {
        // Punto para P2 (Derecha)
        setScore(s => ({ ...s, p2: s.p2 + 1 }));
        resetBall();
      }
    };

    const draw = () => {
      const state = gameState.current;
      ctx.clearRect(0, 0, state.width, state.height);

      // Campo
      ctx.fillStyle = '#FFFBF5';
      ctx.fillRect(0, 0, state.width, state.height);

      // Línea central (Vertical)
      ctx.beginPath();
      ctx.setLineDash([15, 15]);
      ctx.moveTo(state.width / 2, 0);
      ctx.lineTo(state.width / 2, state.height);
      ctx.strokeStyle = '#E5E5E5';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Paletas
      ctx.fillStyle = '#F36F21'; // Naranja Naranti
      // P1 Izquierda
      ctx.fillRect(state.p1.x, state.p1.y, state.p1.width, state.p1.height);

      // P2 Derecha
      ctx.fillStyle = gameMode === '1P' ? '#1A1A1A' : '#F36F21'; // CPU Negra, P2 Naranja
      ctx.fillRect(state.p2.x, state.p2.y, state.p2.width, state.p2.height);

      // Pelota
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.size, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();
      ctx.closePath();
    };

    // Bucle con delta de tiempo real: si el equipo del tótem corre a 30fps
    // la bola avanza el doble por frame y la velocidad PERCIBIDA es la misma.
    let lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // tope 50ms (pestaña dormida)
      lastTime = now;
      update(dt);
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying, gameMode]);

  // Ganador
  useEffect(() => {
    if (score.p1 >= 5) { setWinner('¡Jugador 1 Gana!'); setIsPlaying(false); }
    if (score.p2 >= 5) { setWinner(gameMode === '1P' ? '¡CPU Gana!' : '¡Jugador 2 Gana!'); setIsPlaying(false); }
  }, [score, gameMode]);

  // Touch Events (Horizontal Logic)
  const handleTouchMove = (e) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const state = gameState.current;

    Array.from(e.touches).forEach(touch => {
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      // Zona Izquierda (P1)
      if (touchX < state.width / 2) {
        let newY = touchY - state.p1.height / 2;
        // Límites P1
        if (newY < 0) newY = 0;
        if (newY + state.p1.height > state.height) newY = state.height - state.p1.height;
        state.p1.y = newY;
      }

      // Zona Derecha (P2) - Solo si es 2 Players
      if (gameMode === '2P' && touchX > state.width / 2) {
        let newY = touchY - state.p2.height / 2;
        // Límites P2
        if (newY < 0) newY = 0;
        if (newY + state.p2.height > state.height) newY = state.height - state.p2.height;
        state.p2.y = newY;
      }
    });
  };

  // RENDER CONDICIONAL (Después de todos los hooks)
  // Protector de pantalla: publicidad REAL del sistema (igual que los demás
  // módulos). Si no hay campañas cargadas, pantalla de descanso simple.
  if (isIdle) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black cursor-pointer animate-in fade-in"
        onClick={() => setIsIdle(false)}
        onTouchStart={() => setIsIdle(false)}
      >
        {globalAds && globalAds.length > 0 ? (
          <FullscreenIdleAd ads={globalAds} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-2xl font-bold animate-pulse">Toca para continuar 👆</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#FFFBF5] font-sans flex flex-col overflow-hidden fixed inset-0">

      {/* 1. PUBLICIDAD SUPERIOR (Solo visible en Menú) */}
      {!isPlaying && (
        <div className="px-4 pt-4 shrink-0 z-50">
          <HeaderAd ads={adsForHeader} />
        </div>
      )}

      {/* BOTÓN SALIR FLOTANTE (Durante juego) */}
      {isPlaying && (
        <button
          onClick={() => { setIsPlaying(false); setScore({ p1: 0, p2: 0 }); }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-3 bg-white/80 backdrop-blur rounded-full shadow-md text-gray-500 active:scale-95 flex items-center gap-2 text-sm font-bold border border-gray-200"
        >
          <ArrowLeft size={18} /> Salir
        </button>
      )}

      {/* ÁREA DE JUEGO (Ocupa todo el espacio restante) */}
      <div className="flex-1 relative w-full h-full">

        {/* MARCADOR EN EL FONDO (LADO A LADO) */}
        {isPlaying && (
          <>
            {/* P1 Score (Izquierda) */}
            <div className="absolute top-1/2 left-[25%] -translate-y-1/2 text-8xl font-black text-[#F36F21]/20 select-none pointer-events-none">
              {score.p1}
            </div>
            {/* P2 Score (Derecha) */}
            <div className="absolute top-1/2 right-[25%] -translate-y-1/2 text-8xl font-black text-gray-200 select-none pointer-events-none">
              {score.p2}
            </div>
          </>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none" // touch-none es vital
          onTouchMove={handleTouchMove}
          // Soporte básico mouse (Mapeado a P1 Vertical)
          onMouseMove={(e) => {
            if (!isPlaying || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const state = gameState.current;
            let newY = (e.clientY - rect.top) - state.p1.height / 2;
            if (newY < 0) newY = 0;
            if (newY + state.p1.height > state.height) newY = state.height - state.p1.height;
            state.p1.y = newY;
          }}
        />
      </div>

      {/* MENÚ DE INICIO (Overlay) */}
      {!isPlaying && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#FFFBF5]/95 backdrop-blur-sm">
          <div className="text-center w-80 mt-40"> {/* mt-40 para bajar el contenido y no chocar con el banner */}

            {winner ? (
              <div className="mb-8 animate-in zoom-in duration-300">
                <Trophy size={80} className="mx-auto text-yellow-400 mb-4 drop-shadow-lg" />
                <h2 className="text-3xl font-black text-[#1A1A1A] mb-2">{winner}</h2>
                <p className="text-gray-500 font-medium">Marcador Final: <span className="text-[#F36F21]">{score.p1}</span> - {score.p2}</p>
              </div>
            ) : (
              <div className="mb-10">
                <h1 className="text-4xl font-black text-[#F36F21] mb-2 uppercase tracking-tighter">Naranti Pong</h1>
                <p className="text-gray-500 font-medium">¡Desliza para jugar!</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => { setGameMode('1P'); setScore({ p1: 0, p2: 0 }); setWinner(null); setIsPlaying(true); }}
                className="w-full bg-[#1A1A1A] text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-xl"
              >
                <User size={24} /> 1 Jugador
              </button>

              <button
                onClick={() => { setGameMode('2P'); setScore({ p1: 0, p2: 0 }); setWinner(null); setIsPlaying(true); }}
                className="w-full bg-[#F36F21] text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-orange-200"
              >
                <Users size={24} /> 2 Jugadores
              </button>

              <button
                onClick={() => navigate('/smartcity/display')}
                className="mt-8 text-gray-400 font-medium text-sm flex items-center justify-center gap-2 w-full py-3"
              >
                <ArrowLeft size={16} /> Volver al Menú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Arcade;