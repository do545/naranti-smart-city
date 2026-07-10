/**
 * Utility functions for managing kiosk brightness schedules.
 */

/**
 * Validates HH:MM format (00:00 to 23:59).
 * @param {string} time - The time string to validate.
 * @returns {boolean} True if the string is a valid 24h time format.
 */
export const isValid24hTime = (time) => {
  if (!time || typeof time !== 'string') return false;
  // Matches 00:00 to 23:59
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
};

/**
 * Converts HH:MM format to minutes since midnight.
 * Validates input first using isValid24hTime.
 * @param {string} time - The time string (HH:MM).
 * @returns {number} Minutes since midnight (0-1439), or -1 if invalid.
 */
export const parseTimeToMinutes = (time) => {
  if (!isValid24hTime(time)) {
    return -1;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};

/**
 * Clamps brightness value to 0-100 range.
 * @param {number} value - The input brightness value.
 * @returns {number} A number between 0 and 100.
 */
export const clampBrightness = (value) => {
  const num = Number(value);
  if (isNaN(num)) return 100; // Default to full brightness if invalid
  return Math.min(100, Math.max(0, num));
};

/**
 * Takes an array of schedule entries, validates them, sorts by time, and returns a normalized array.
 * Handles duplicate times by keeping the last occurrence.
 * 
 * @param {Array<{time: string, brightness: number}>} schedule - Array of schedule objects.
 * @returns {Array<{time: string, brightness: number, minutes: number}>} Sorted and validated schedule array.
 */
export const normalizeBrightnessSchedule = (schedule) => {
  if (!Array.isArray(schedule)) return [];

  const normalized = schedule
    // Filter out invalid entries
    .filter(entry => 
      entry && 
      typeof entry === 'object' && 
      isValid24hTime(entry.time) && 
      entry.brightness !== undefined
    )
    // Normalize values
    .map(entry => ({
      time: entry.time,
      brightness: clampBrightness(entry.brightness),
      minutes: parseTimeToMinutes(entry.time)
    }));

  // Sort by minutes
  normalized.sort((a, b) => a.minutes - b.minutes);

  return normalized;
};

/**
 * Determines the active brightness level based on the current time and schedule.
 * 
 * @param {Array<{time: string, brightness: number, minutes: number}>} schedule - The normalized schedule array.
 * @param {Date} date - The date object representing the current time.
 * @param {number} defaultBrightness - The fallback brightness value (0-100).
 * @returns {number} The calculated brightness value.
 */
export const getScheduledBrightness = (schedule, date, defaultBrightness) => {
  const safeDefault = clampBrightness(defaultBrightness);

  // Handle empty or invalid schedule
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return safeDefault;
  }

  // Calculate current minutes since midnight
  const currentMinutes = (date.getHours() * 60) + date.getMinutes();

  // Find the last schedule entry that occurred at or before the current time
  // Since the schedule is sorted by time (ascending), we can iterate backwards
  for (let i = schedule.length - 1; i >= 0; i--) {
    const entry = schedule[i];
    
    // Ensure we have minutes calculated (in case a non-normalized array was passed)
    const entryMinutes = entry.minutes !== undefined 
      ? entry.minutes 
      : parseTimeToMinutes(entry.time);

    if (entryMinutes <= currentMinutes) {
      return entry.brightness;
    }
  }

  // If no schedule entry is before current time (e.g., current time is 01:00 but first schedule is 08:00),
  // return the default brightness as per requirements.
  return safeDefault;
};