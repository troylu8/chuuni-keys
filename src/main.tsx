import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// after app is rendered, remove the loading spinner in the corner
document.getElementById("initial-loading-spinner")?.remove();
