import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import DynamicBackground from '@/components/DynamicBackground';
import { Helmet } from 'react-helmet';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, ingresa tu correo y contraseña.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    try {
      const role = await login(email, password);
      toast({
        title: '¡Bienvenido de vuelta!',
        description: `Inicio de sesión exitoso como ${role}.`,
      });

      // Pequeño delay opcional para permitir que el contexto propague el rol
      // si react-router-dom es muy rápido
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/smartcity/admin');
        } else if (role === 'kiosk') {
          navigate('/smartcity/display');
        } else if (role === 'screen') {
          navigate('/smartcity/screen');
        }
        setLoading(false);
      }, 100);

    } catch (error) {
      const errorMessage = error.message.includes("Acceso no autorizado")
        ? "No tienes permiso para acceder."
        : "Credenciales incorrectas. Por favor, verifica tu usuario o contraseña.";

      toast({
        title: 'Error de inicio de sesión',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - Naranti Smart City</title>
        <meta name="description" content="Accede a tu panel de control o al modo kiosko." />
      </Helmet>
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4">
        <DynamicBackground />
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="relative z-10 w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20"
        >
          <div className="text-center">
            <img src="https://horizons-cdn.hostinger.com/c266100d-f187-42b8-979b-7d603f93c495/bf2a316b2876820b965e2c11cb65cc5c.png" alt="Naranti Logo" className="w-32 mx-auto mb-2" />
            <h1 className="text-3xl font-bold text-[var(--login-title-day)] dark:text-[var(--login-title-night)] tracking-tight">Smart City</h1>
            <p className="mt-2 text-[var(--login-text-day)] dark:text-[var(--login-text-night)]">Bienvenido al centro de control</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--login-text-day)] dark:text-[var(--login-text-night)]">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-[var(--login-text-day)] dark:text-[var(--login-text-night)] placeholder-[var(--login-placeholder-day)] focus:outline-none focus:ring-2 focus:ring-naranti-orange transition-all"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--login-text-day)] dark:text-[var(--login-text-night)]">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-[var(--login-text-day)] dark:text-[var(--login-text-night)] placeholder-[var(--login-placeholder-day)] focus:outline-none focus:ring-2 focus:ring-naranti-orange transition-all"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg font-bold bg-naranti-orange hover:bg-naranti-orange/90 text-white py-6 rounded-lg transition-transform transform hover:scale-105"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;