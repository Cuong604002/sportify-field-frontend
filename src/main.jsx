import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#16a34a', // Tailwind green-600 to match hsl(142 76% 36%)
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          borderRadius: 8,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
