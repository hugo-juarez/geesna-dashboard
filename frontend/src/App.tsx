import { RiPieChart2Fill } from "react-icons/ri";
import { IoCartOutline } from "react-icons/io5";
import { IoAlertCircleOutline } from "react-icons/io5";
import { PiGearLight } from "react-icons/pi";
import { CiLogout } from "react-icons/ci";

import DashboardPage from "./pages/DashboardPage";

function App() {

  return (
    <div id="dashboard" className="flex flex-row h-screen">
      <section id="menu" className="flex flex-col items-center justify-between gap-4 w-1/4 h-screen bg-gray-50 py-8 px-8 text-gray-700 max-w-80">
        <h1 className="text-2xl font-bold">GEESNA</h1>
        <div className="flex flex-col gap-8 w-full">
          <button className="py-2 px-4 bg-blue-500 text-white rounded-lg w-full flex items-center gap-4">
            <RiPieChart2Fill size={20} className="m-4" />
            <span>Dashboard</span>
          </button>
          <button className="py-2 px-4 w-full flex items-center gap-4">
            <IoCartOutline size={20} className="m-4" />
            <span>Orders</span>
          </button>
          <button className="py-2 px-4  rounded w-full flex items-center gap-4">
            <IoAlertCircleOutline size={20} className="m-4" />
            <span>Alerts</span>
          </button>
          <button className="py-2 px-4 rounded w-full flex items-center gap-4">
            <PiGearLight size={20} className="m-4" />
            <span>Settings</span>
          </button>
        </div>
        <button className="py-2 px-4 rounded w-full flex items-center gap-4">
          <CiLogout size={20} className="m-4" />
          <span>Sign Out</span>
        </button>
      </section>

      <div className="grow h-screen">
        <DashboardPage />
      </div>


    </div>
  )
}

export default App
