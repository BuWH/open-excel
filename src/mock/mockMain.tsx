import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installGitHubProxy } from "../lib/provider/githubProxy";
import { MockWorkbenchPage } from "./MockWorkbenchPage";
import { installMockFetchInterceptor } from "./mockFetchInterceptor";
import "../styles/index.css";

installGitHubProxy();
installMockFetchInterceptor();

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
