import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const AUTO_RELOAD_DELAY = 15000; // 15 seconds
const MAX_RELOADS_KEY = 'error_boundary_reload_count';
const MAX_RELOADS_TIME_KEY = 'error_boundary_reload_time';
const MAX_RELOADS = 5; // Max auto-reloads in a 5-minute window
const RELOAD_WINDOW = 5 * 60 * 1000; // 5 minutes

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, countdown: AUTO_RELOAD_DELAY / 1000 };
        this.timerRef = null;
        this.countdownRef = null;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('💥 ErrorBoundary capturó un error:', error, errorInfo);
        this.scheduleAutoReload();
    }

    canAutoReload() {
        try {
            const now = Date.now();
            const lastTime = parseInt(localStorage.getItem(MAX_RELOADS_TIME_KEY) || '0', 10);
            let count = parseInt(localStorage.getItem(MAX_RELOADS_KEY) || '0', 10);

            // Reset counter if outside the reload window
            if (now - lastTime > RELOAD_WINDOW) {
                count = 0;
            }

            return count < MAX_RELOADS;
        } catch {
            return true;
        }
    }

    trackReload() {
        try {
            const now = Date.now();
            const lastTime = parseInt(localStorage.getItem(MAX_RELOADS_TIME_KEY) || '0', 10);
            let count = parseInt(localStorage.getItem(MAX_RELOADS_KEY) || '0', 10);

            if (now - lastTime > RELOAD_WINDOW) {
                count = 0;
            }

            localStorage.setItem(MAX_RELOADS_KEY, String(count + 1));
            localStorage.setItem(MAX_RELOADS_TIME_KEY, String(now));
        } catch {
            // ignore
        }
    }

    scheduleAutoReload() {
        if (!this.canAutoReload()) {
            console.warn('⚠️ Límite de auto-recargas alcanzado. Se requiere recarga manual.');
            return;
        }

        let seconds = AUTO_RELOAD_DELAY / 1000;
        this.setState({ countdown: seconds });

        this.countdownRef = setInterval(() => {
            seconds -= 1;
            this.setState({ countdown: Math.max(0, seconds) });
        }, 1000);

        this.timerRef = setTimeout(() => {
            this.trackReload();
            window.location.reload();
        }, AUTO_RELOAD_DELAY);
    }

    componentWillUnmount() {
        if (this.timerRef) clearTimeout(this.timerRef);
        if (this.countdownRef) clearInterval(this.countdownRef);
    }

    handleManualReload = () => {
        if (this.timerRef) clearTimeout(this.timerRef);
        if (this.countdownRef) clearInterval(this.countdownRef);
        this.trackReload();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const canReload = this.canAutoReload();

            return (
                <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center text-white p-10" style={{ cursor: 'default' }}>
                    <AlertTriangle size={80} className="text-[#F36F21] mb-6" />
                    <h1 className="text-3xl font-bold mb-2">Error en la aplicación</h1>
                    <p className="text-white/50 text-center max-w-md mb-8">
                        {canReload
                            ? `Recargando automáticamente en ${this.state.countdown} segundos...`
                            : 'Se alcanzó el límite de recargas automáticas. Por favor recarga manualmente.'}
                    </p>
                    <button
                        onClick={this.handleManualReload}
                        className="flex items-center gap-2 px-6 py-3 bg-[#F36F21] hover:bg-[#F36F21]/80 rounded-lg text-white font-semibold transition-colors"
                    >
                        <RefreshCw size={20} />
                        Recargar ahora
                    </button>
                    {this.state.error && (
                        <p className="text-white/20 text-xs mt-6 font-mono max-w-lg text-center break-all">
                            {this.state.error.toString()}
                        </p>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;