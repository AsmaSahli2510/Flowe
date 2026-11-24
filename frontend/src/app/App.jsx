import AppProviders from "./AppProviders";
import AppRoutes from "./routes";
import "../features/dashboard/Dashboard.css";

export default function App() {
  return <AppProviders><AppRoutes /></AppProviders>;
}
