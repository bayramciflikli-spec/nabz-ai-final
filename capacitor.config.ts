import type { CapacitorConfig } from '@capacitor/cli';

// Local geliştirme: npm run dev çalışırken uygulama bu URL'den yüklenir
// Android emülatör: 10.0.2.2 | Fiziksel cihaz: CAPACITOR_SERVER_URL=http://BILGISAYAR_IP:3000
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000';

const config: CapacitorConfig = {
  appId: 'com.nowai.app',
  appName: 'Nabız',
  webDir: 'out',
  server: { url: serverUrl, cleartext: true },
};

export default config;
