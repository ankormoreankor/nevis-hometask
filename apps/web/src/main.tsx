/**
 * TASK: mount the router
 *
 * Goal
 *   Render the route table instead of the placeholder App.
 *
 * Contract
 *   import { RouterProvider } from "react-router";
 *   import { router } from "./router";
 *   Keep the root-element guard and the StrictMode wrapper. Swap <App /> for
 *   <RouterProvider router={router} /> and drop the App import.
 *
 * Acceptance
 *   - /dashboard renders the page.
 *   - / redirects to /dashboard in one history entry.
 *
 * Delete this comment when the code is in place.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root is missing from index.html");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
