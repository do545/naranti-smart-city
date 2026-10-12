import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** Código QR generado en el propio navegador (sin servicios externos). */
export function QrCode({ value, size = 360 }: { value: string; size?: number }) {
  const { count, path } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
      }
    }
    return { count: n + 8, path: d };
  }, [value]);

  return (
    <svg
      className="qr"
      width={size}
      height={size}
      viewBox={`0 0 ${count} ${count}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Código QR: ${value}`}
    >
      <rect width={count} height={count} fill="#ffffff" />
      <path d={path} fill="#111111" />
    </svg>
  );
}
