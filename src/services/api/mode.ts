export const API_MODE = import.meta.env["VITE_API_MODE"] ?? "mock";
export const isMock = () => API_MODE === "mock";
