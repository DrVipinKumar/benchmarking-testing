import { defineConfig } from 'vite'; import vue from '@vitejs/plugin-vue';
export default defineConfig({plugins:[vue()],base:'/vue-crud/',build:{outDir:'../dist/vue-crud',emptyOutDir:true},server:{proxy:{'/api':'http://localhost:3000'}}});
