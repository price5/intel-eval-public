import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "child_process";
import { writeFileSync } from "fs";

// Plugin to generate version.json on build
const versionPlugin = () => ({
  name: "version-plugin",
  buildStart() {
    try {
      let hash;
      try {
        hash = execSync("git rev-parse --short HEAD").toString().trim();
      } catch (error) {
        hash = Date.now().toString(36);
      }

      const version = {
        version: "1.0.0",
        buildTime: new Date().toISOString(),
        hash: hash,
      };

      writeFileSync(
        path.resolve(__dirname, "public", "version.json"),
        JSON.stringify(version, null, 2),
      );

      console.log("✅ Version file generated:", version);
    } catch (error) {
      console.error("❌ Failed to generate version file:", error);
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    versionPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
