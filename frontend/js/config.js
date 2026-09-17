/**
 * Student Management System — Application Configuration
 *
 * Configure your production Render backend URL here.
 * When deployed on Vercel, the frontend will automatically use PROD_API_URL.
 * When running locally (localhost, 127.0.0.1, or file://), DEV_API_URL is used automatically.
 *
 * You can also temporarily override the API URL at runtime in the browser console with:
 *   localStorage.setItem('API_BASE_URL', 'https://<your-service>.onrender.com/api');
 */
window.APP_CONFIG = {
  // Render backend URL:
  PROD_API_URL: 'https://student-management-system-ge3z.onrender.com/api',

  // Local development endpoint:
  DEV_API_URL: 'http://127.0.0.1:8000/api',
};
