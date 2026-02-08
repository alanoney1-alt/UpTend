import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { registerServiceWorker } from "./lib/pwa";
import { initializeCapacitor, isNative } from "./lib/capacitor";

if (!isNative) {
  registerServiceWorker();
}

initializeCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
