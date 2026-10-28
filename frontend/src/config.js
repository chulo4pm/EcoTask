// Backend address. Set VITE_API_URL in Vercel (e.g. https://ecotask-backend.onrender.com).
// Falls back to your local backend when running `npm run dev`.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
