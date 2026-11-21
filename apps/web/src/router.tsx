import { createBrowserRouter, redirect } from "react-router";
import Dashboard from "./routes/Dashboard";
import NotFound from "./routes/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/dashboard/2024"),
  },
  {
    path: "/dashboard",
    loader: () => redirect("/dashboard/2024"),
  },
  {
    path: "/dashboard/:year",
    Component: Dashboard,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
