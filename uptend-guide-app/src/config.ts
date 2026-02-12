// API configuration
// In dev (__DEV__), use localhost; in production, use the real backend.
const API_BASE_URL = __DEV__ ? 'http://localhost:5000' : 'https://uptendapp.com';

export default {
  API_BASE_URL,
};
