import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    {
      name: "google-site-verification",
      transformIndexHtml(html) {
        const verification = process.env.VITE_GOOGLE_SITE_VERIFICATION;
        const tag = verification
          ? `<meta name="google-site-verification" content="${verification.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" />`
          : "";
        return html.replace("%GOOGLE_SITE_VERIFICATION%", tag);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor libraries into their own chunks
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "vendor-react";
          if (id.includes("node_modules/@supabase/")) return "vendor-supabase";
          if (id.includes("node_modules/@tanstack/")) return "vendor-tanstack";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("node_modules/react-router")) return "vendor-router";
          if (id.includes("node_modules/framer-motion")) return "vendor-animation";
          if (id.includes("node_modules/recharts")) return "vendor-charts";
          if (id.includes("node_modules/date-fns")) return "vendor-date";
          if (id.includes("node_modules/sonner")) return "vendor-toast";
          if (id.includes("node_modules/vaul") || id.includes("node_modules/cmdk") || id.includes("node_modules/input-otp")) return "vendor-aria";
          if (id.includes("node_modules/@hookform") || id.includes("node_modules/zod")) return "vendor-forms";
          if (id.includes("node_modules/embla-carousel") || id.includes("node_modules/react-day-picker") || id.includes("node_modules/react-resizable-panels")) return "vendor-utils";
        },
      },
    },
  },
}));
