import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";

console.log("rendering at root..");
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
console.log("done w initial rendering.");

// after app is rendered, remove the loading spinner in the corner
document.getElementById("initial-loading-spinner")?.remove();
