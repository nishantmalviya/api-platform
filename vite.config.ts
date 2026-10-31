/// <reference types="vitest" />
import { fileURLToPath } from "node:url";
import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const config: UserConfig = {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^@\/(.+)/, replacement: `${fileURLToPath(new URL("./src", import.meta.url))}/$1` },
      ],
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
  };

  if (mode === "test") {
    config.resolve = {
      alias: [
        { find: /^@\/(.+)/, replacement: `${fileURLToPath(new URL("./src", import.meta.url))}/$1` },
        { find: /^monaco-editor$/, replacement: fileURLToPath(new URL("./src/test/mocks/monaco-editor.ts", import.meta.url)) },
        { find: /^@monaco-editor\/react$/, replacement: fileURLToPath(new URL("./src/test/mocks/monaco-editor-react.tsx", import.meta.url)) },
      ],
    };
  }

  return config;
});
