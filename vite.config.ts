import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

const mode = process.env.APP_ENV;


export default defineConfig({
  mode: mode,
  plugins: [react()],
  base: '/static/',
  root: path.resolve('./matchmaker/static/src'),
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    open: false,
    watch: {
      usePolling: true,
      disableGlobbing: false
    },
    hmr: {
      host: 'localhost',
      port: 3000,
      protocol: 'ws',
    },
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  build: {
    outDir: path.resolve('./matchmaker/static/dist'),
    assetsDir: 'assets',
    emptyOutDir: true,
    manifest: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        main: path.resolve('./matchmaker/static/src/js/main.tsx'),
      },
      output: {
        chunkFileNames: undefined,
      }
    },
  },
})