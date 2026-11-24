import { createBrowserRouter, redirect } from "react-router";
import { DEFAULT_FISCAL_YEAR } from "@/lib/period";
import Dashboard from "./routes/Dashboard";
import NotFound from "./routes/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect(`/dashboard/${DEFAULT_FISCAL_YEAR}`),
  },
  {
    path: "/dashboard",
    loader: () => redirect(`/dashboard/${DEFAULT_FISCAL_YEAR}`),
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
