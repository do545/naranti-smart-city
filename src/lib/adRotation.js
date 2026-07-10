export const DEFAULT_AD_ROTATION_SECONDS = 10;
export const MIN_AD_ROTATION_SECONDS = 1;
export const MAX_AD_ROTATION_SECONDS = 120;

export const normalizeAdRotationSeconds = (value) => {
  const parsed = Number.parseInt(value ?? DEFAULT_AD_ROTATION_SECONDS, 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_AD_ROTATION_SECONDS;
  }

  return Math.min(MAX_AD_ROTATION_SECONDS, Math.max(MIN_AD_ROTATION_SECONDS, parsed));
};

export const getAdRotationMs = (value) => (
  normalizeAdRotationSeconds(value) * 1000
);