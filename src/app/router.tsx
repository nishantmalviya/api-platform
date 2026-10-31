import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { HistoryPage } from "@/features/history/pages/HistoryPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { EnvironmentManagerPage } from "@/features/environments/pages/EnvironmentManagerPage";
import { OpenApiExplorerPage } from "@/features/openapi/pages/OpenApiExplorerPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
  },
  {
    path: "/history",
    element: <HistoryPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/environments",
    element: <EnvironmentManagerPage />,
  },
  {
    path: "/openapi",
    element: <OpenApiExplorerPage />,
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
