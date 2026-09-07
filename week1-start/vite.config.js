import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 설정 파일입니다. 1회차에서는 이 파일을 건드리지 않습니다.
export default defineConfig({
  plugins: [react()],
})
