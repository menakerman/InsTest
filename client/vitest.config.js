import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/contexts/**/*.{js,jsx}',
        'src/components/**/*.{js,jsx}',
        'src/pages/Login.jsx',
        'src/pages/ForgotPassword.jsx',
        'src/pages/ResetPassword.jsx',
        'src/pages/ManageUsers.jsx',
        'src/pages/NoAccess.jsx',
        'src/utils/api.js'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
});
