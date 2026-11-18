export const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock';
export const INTERVALS_ENABLED = import.meta.env.VITE_INTERVALS === 'on' || API_MODE === 'mock';
