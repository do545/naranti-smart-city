# Preparación para el centro de control Naranti SmartCity

> **Solo arquitectura.** Esta entrega no se conecta al centro de control, a SmartCity ni a Firebase, y no crea servicios remotos. La integración real la hará el equipo de Naranti.

## Capacidades previstas y dónde viven

| Capacidad | Ya disponible en local | Archivo |
|---|---|---|
| Configurar URL de inicio y enlaces | `orion.config.json` + parámetros de URL | `src/config/` |
| Activar / desactivar la experiencia | `experience.enabled` · comando `setEnabled` | `src/App.tsx` |
| Consultar estado | `window.ORION.status()` · `adapter.reportStatus()` cada 30 s y en cada cambio | `src/integration/` |
| Regresar a la pantalla inicial | `window.ORION.goHome()` · comando `goHome` | `src/App.tsx` |
| Configurar tiempo de inactividad | `idle.timeoutSeconds` · comando `setIdleTimeout` | `src/kiosk/useIdleReset.ts` |
| Registrar errores | Registro circular (memoria + localStorage) · `adapter.logError()` | `src/integration/logger.ts` |
| Recuperar la interfaz ante fallas | ErrorBoundary con recarga automática · comando `reload` | `src/components/ErrorBoundary.tsx` |
| Habilitar por fechas | `schedule` (desactivado) | `src/kiosk/schedule.ts` |

## Contrato

```ts
// src/integration/ControlCenterAdapter.ts
interface ControlCenterAdapter {
  readonly name: string;
  init(config: OrionConfig): void | Promise<void>;
  reportStatus(status: OrionStatus): void;
  logError(entry: LogEntry): void;
  onCommand(handler: (command: OrionCommand) => void): () => void;
  dispose?(): void;
}

type OrionCommand =
  | { type: 'goHome' }
  | { type: 'reload' }
  | { type: 'setEnabled'; enabled: boolean }
  | { type: 'setIdleTimeout'; seconds: number }
  | { type: 'setConfig'; patch: Partial<OrionConfig> };
```

`OrionStatus` incluye: `app`, `version`, `view`, `online`, `enabled`, `withinSchedule`, `startedAt`, `uptimeSeconds`, `lastInteractionAt`, `lastError` y `viewport` (ancho, alto y escala).

## Adaptadores incluidos

- **`NoopAdapter`** (por defecto): no hace nada.
- **`LocalSimulationAdapter`** (solo con `?debug=1`): recibe comandos y emite el estado dentro del mismo navegador, por `BroadcastChannel('orion-ficm-2026')` y `window.postMessage`. Sin red.

Ejemplo de prueba local desde otra pestaña del mismo origen, con ORION abierto con `?debug=1`:

```js
const ch = new BroadcastChannel('orion-ficm-2026');
ch.onmessage = (e) => console.log(e.data);        // { kind: 'status' | 'log', ... }
ch.postMessage({ type: 'goHome' });
ch.postMessage({ type: 'setIdleTimeout', seconds: 30 });
```

O directamente en la consola de la página de ORION:

```js
window.ORION.status();
window.ORION.command({ type: 'setEnabled', enabled: false });
window.ORION.goHome();
window.ORION.log();
```

## Cómo conectar un adaptador real (futuro)

1. Crear `src/integration/SmartCityAdapter.ts` que implemente `ControlCenterAdapter` con el mecanismo que defina Naranti (canal del agente del kiosco, endpoint propio, etc.).
2. Elegirlo en `createAdapter()` de `src/integration/index.ts`, por ejemplo según una clave nueva de configuración.
3. No incluir credenciales en el código. Si fueran necesarias, las aporta el entorno del kiosco o del servidor.
