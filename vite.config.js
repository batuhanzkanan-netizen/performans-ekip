import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
 base:'/performans-ekip/',
 build:{rollupOptions:{output:{manualChunks(id){if(id.includes('firebase/firestore'))return 'firestore';if(id.includes('node_modules'))return 'vendor';}}}},
 plugins:[VitePWA({registerType:'prompt', manifestFilename:'manifest.json', includeAssets:['icons/*.png'], manifest:{id:'/performans-ekip/',name:'Performans Academy — Ekip Görev Takibi',short_name:'PA Ekip',lang:'tr',description:'Ekip görevlerini canlı takip edin.',start_url:'/performans-ekip/',scope:'/performans-ekip/',display:'fullscreen',display_override:['fullscreen','standalone'],background_color:'#FFFFFF',theme_color:'#F26B1D',icons:[{src:'icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'icons/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},workbox:{globPatterns:['**/*.{html,js,css,png,woff,woff2}'],navigateFallback:'index.html',cleanupOutdatedCaches:true}})]
});
