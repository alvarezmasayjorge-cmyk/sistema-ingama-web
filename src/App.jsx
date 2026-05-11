import { useState, useCallback } from "react";
import { INIT_RECORDS, INIT_PERSONNEL, INIT_SUPPLIES, INIT_RCMA9 } from "./data/initial";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/Toast";
import ToastContainer from "./components/Toast";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import RCLD01 from "./pages/RCLD01";
import RCLD02 from "./pages/RCLD02";
import RCLD03 from "./pages/RCLD03";
import DocsModule from "./pages/DocsModule";
import ConfigModule from "./pages/ConfigModule";
import RCMa9Module from "./pages/RCMa9Module";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [records, setRecords] = useLocalStorage("sgia_records", INIT_RECORDS, "records");
  const [personnel, setPersonnel] = useLocalStorage("sgia_personnel", INIT_PERSONNEL, "personnel");
  const [supplies, setSupplies] = useLocalStorage("sgia_supplies", INIT_SUPPLIES, "supplies");
  const [rcma9, setRcma9] = useLocalStorage("sgia_rcma9", INIT_RCMA9, "rcma9");
  const toast = useToast();

  const handleLogin = useCallback((u) => {
    setUser(u);
    setView("dashboard");
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setView("dashboard");
  }, []);

  if (!user) return <Login onLogin={handleLogin} />;

  const pages = {
    dashboard: <Dashboard records={records} personnel={personnel} supplies={supplies} rcma9={rcma9} setView={setView} />,
    rcld01: <RCLD01 records={records} setRecords={setRecords} user={user} toast={toast} personnel={personnel} />,
    rcld02: <RCLD02 personnel={personnel} setPersonnel={setPersonnel} user={user} toast={toast} />,
    rcld03: <RCLD03 supplies={supplies} setSupplies={setSupplies} user={user} toast={toast} />,
    rcma9: <RCMa9Module records={rcma9} setRecords={setRcma9} user={user} toast={toast} />,
    docs: <DocsModule records={records} rcma9={rcma9} />,
    config: <ConfigModule />,
  };

  return (
    <div className="app-layout">
      <Sidebar view={view} setView={setView} user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="app-main" key={view}>{pages[view] || pages.dashboard}</main>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
