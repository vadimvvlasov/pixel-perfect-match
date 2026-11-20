// What the backend can do, as long as it does not say so itself (plan step 2.4: the runner's heartbeat).

/**
 * The date interval needs a runner that searches a whole interval (plan step 4.3). Until then the "Интервал" mode
 * is shown but disabled; VITE_INTERVALS=on turns it on, and the mock understands intervals.
 */
export const INTERVALS_ENABLED = import.meta.env.VITE_INTERVALS === "on" || import.meta.env.VITE_API_MODE === "mock";
