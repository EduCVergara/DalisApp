import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        registro: resolve(__dirname, "registro.html"),
        resumen: resolve(__dirname, "resumen.html"),
      },
    },
  },
});
