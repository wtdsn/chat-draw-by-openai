import { resolve } from 'path'

// vite.config.js
export default {
  // 配置选项
  base: './',
  resolve: {
    alias: {
      "@": resolve(__dirname, './src'),
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, './index.html'),
        login: resolve(__dirname, './login.html'),
        draw: resolve(__dirname, './draw.html'),
      },
    },
  },
}