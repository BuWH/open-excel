import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MockWorkbenchPage } from "./MockWorkbenchPage";
import "../styles/index.css";

function renderApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Unable to find the application root element.");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <MockWorkbenchPage />
    </StrictMode>,
  );
}

renderApp();
