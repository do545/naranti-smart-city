import { Component, type ReactNode } from 'react';
import { logger, serializeError } from '../integration/logger';
import { StatusScreen } from './StatusScreen';

interface Props {
  reloadSeconds: number;
  children: ReactNode;
}

interface State {
  error: boolean;
  remaining: number;
}

/**
 * Recuperación visual ante errores: en lugar de una pantalla en blanco,
 * muestra un aviso con la identidad FICM y recarga la interfaz sola.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: false, remaining: 0 };
  private timer = 0;

  static getDerivedStateFromError(): Partial<State> {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    logger.error('render-error', serializeError(error));
    this.setState({ remaining: this.props.reloadSeconds });
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.setState(
        (s) => ({ remaining: s.remaining - 1 }),
        () => {
          if (this.state.remaining <= 0) {
            window.clearInterval(this.timer);
            window.location.reload();
          }
        },
      );
    }, 1000);
  }

  componentWillUnmount() {
    window.clearInterval(this.timer);
  }

  render() {
    if (this.state.error) {
      return (
        <StatusScreen
          title="Un momento"
          message="Estamos reiniciando la experiencia."
          detail={this.state.remaining > 0 ? `Volvemos en ${this.state.remaining} s` : undefined}
        />
      );
    }
    return this.props.children;
  }
}
