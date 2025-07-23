import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  build :{
    outDir : 'dist'
  },
  define: {
    global: {}, // Define global to fix sockjs-client
  }
})



// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()], // ✅ only this needed
//   build: {
//     outDir: 'dist',
//   },
//   define: {
//     global: {}, // for sockjs-client etc.
//   },
// });
