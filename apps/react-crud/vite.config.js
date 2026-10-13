import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'/react-crud/',build:{outDir:'../dist/react-crud',emptyOutDir:true},server:{proxy:{'/api':'http://localhost:3000'}}});
