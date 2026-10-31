import type { Config } from "@react-router/dev/config";

export default {
  // Tillåter formulär från vår Render-adress bakom plattformens HTTPS-proxy.
  allowedActionOrigins: ["microservices-webshop-frontend.onrender.com"],
  ssr: true,
} satisfies Config;
