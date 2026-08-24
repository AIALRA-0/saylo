import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 开发服务器把教练请求转发到本地后端，确保浏览器无法读取服务器密钥
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': process.env.SAYLO_DEV_API_TARGET || 'http://127.0.0.1:8787',
    },
  },
  build: {
    // 生产包不附带源码映射，避免把完整课程代码和内部注释发布到站点
    sourcemap: false,
  },
})
