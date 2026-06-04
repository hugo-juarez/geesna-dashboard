import { useState } from "react";
import { RiPieChart2Fill } from "react-icons/ri";
import { IoCartOutline } from "react-icons/io5";
import { IoAlertCircleOutline } from "react-icons/io5";
import { PiGearLight } from "react-icons/pi";
import { CiLogout } from "react-icons/ci";

import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import { OrdersProvider } from "./store/OrdersContext";

type Page = "dashboard" | "orders" | "alerts" | "settings";

function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const navCls = (p: Page) =>
    `py-2 px-4 rounded-lg w-full flex items-center gap-4 ${
      page === p ? "bg-blue-500 text-white" : "hover:bg-gray-100"
    }`;

  return (
    <OrdersProvider>
      <div id="dashboard" className="flex flex-row h-screen">
        <section
          id="menu"
          className="flex flex-col items-center justify-between gap-4 w-1/4 h-screen bg-gray-50 py-8 px-8 text-gray-700 max-w-80"
        >
          <h1 className="text-2xl font-bold">GEESNA</h1>
          <div className="flex flex-col gap-8 w-full">
            <button className={navCls("dashboard")} onClick={() => setPage("dashboard")}>
              <RiPieChart2Fill size={20} className="m-4" />
              <span>Dashboard</span>
            </button>
            <button className={navCls("orders")} onClick={() => setPage("orders")}>
              <IoCartOutline size={20} className="m-4" />
              <span>Ordenes</span>
            </button>
            <button className={navCls("alerts")} onClick={() => setPage("alerts")}>
              <IoAlertCircleOutline size={20} className="m-4" />
              <span>Alertas</span>
            </button>
            <button className={navCls("settings")} onClick={() => setPage("settings")}>
              <PiGearLight size={20} className="m-4" />
              <span>Configuracion</span>
            </button>
          </div>
          <button className="py-2 px-4 rounded w-full flex items-center gap-4 hover:bg-gray-100">
            <CiLogout size={20} className="m-4" />
            <span>Sign Out</span>
          </button>
        </section>

        <div className="grow h-screen">
          {page === "dashboard" && <DashboardPage />}
          {page === "orders" && <OrdersPage />}
          {(page === "alerts" || page === "settings") && (
            <div className="flex h-full items-center justify-center text-gray-400">
              Próximamente…
            </div>
          )}
        </div>
      </div>
    </OrdersProvider>
  );
}

export default App;
