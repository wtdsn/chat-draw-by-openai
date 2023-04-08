import { resolve } from 'path'

// vite.config.js
export default {
  // 配置选项
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
      },
    },
  },
}