import type { SVGProps } from 'react';

/**
 * Iconos lineales propios (trazo blanco en las tarjetas, `currentColor`).
 * Dibujados para esta interfaz; sin emojis ni librerías externas.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, 'stroke' | 'ref'> & { size?: number; stroke?: number };

function Svg({ size = 48, stroke = 2.4, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Marcador de ubicación. */
export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M24 43s-13-12.4-13-23a13 13 0 0 1 26 0c0 10.6-13 23-13 23Z" />
      <circle cx="24" cy="20" r="4.6" />
    </Svg>
  );
}

/** Fotograma: tira de película con perforaciones. */
export function FilmIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="7" y="8" width="34" height="32" rx="2.5" />
      <path d="M14 8v32M34 8v32M14 24h20" />
      <path d="M7 14.5h7M7 21h7M7 27h7M7 33.5h7M34 14.5h7M34 21h7M34 27h7M34 33.5h7" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11 24h26M28 15l9 9-9 9" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M37 24H11M20 15l-9 9 9 9" />
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 22 24 9l16 13" />
      <path d="M12 19v20h9V29h6v10h9V19" />
    </Svg>
  );
}

export function WifiOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 18a26 26 0 0 1 9-5.4M21 11.2A26 26 0 0 1 42 18M12 25a16 16 0 0 1 7.5-4M28.5 21A16 16 0 0 1 36 25M18 31.5a8 8 0 0 1 12 0" />
      <circle cx="24" cy="37.5" r="1.2" fill="currentColor" />
      <path d="M8 8l32 32" />
    </Svg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <rect x="28" y="8" width="12" height="12" rx="1.5" />
      <rect x="8" y="28" width="12" height="12" rx="1.5" />
      <path d="M28 28h5v5h-5zM35 35h5v5h-5zM28 37v3M37 28h3" />
    </Svg>
  );
}

export function iconFor(name: 'pin' | 'film') {
  return name === 'pin' ? PinIcon : FilmIcon;
}
