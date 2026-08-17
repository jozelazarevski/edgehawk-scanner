import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

const IS_STATIC = process.env.VITE_STATIC === "1"

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves from /<repo>/ — the static build needs that base.
  base: IS_STATIC ? "/edgehawk-scanner/" : "/",
  plugins: [
    ...(IS_STATIC ? [] : [devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] })]),
    inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
