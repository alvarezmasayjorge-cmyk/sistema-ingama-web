import { useState, useCallback } from "react";
import { INIT_RECORDS, INIT_PERSONNEL, INIT_SUPPLIES } from "./data/initial";
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

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [records, setRecords] = useLocalStorage("sgia_records", INIT_RECORDS);
  const [personnel, setPersonnel] = useLocalStorage("sgia_personnel", INIT_PERSONNEL);
  const [supplies, setSupplies] = useLocalStorage("sgia_supplies", INIT_SUPPLIES);
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
    dashboard: <Dashboard records={records} personnel={personnel} supplies={supplies} setView={setView} />,
    rcld01: <RCLD01 records={records} setRecords={setRecords} user={user} toast={toast} />,
    rcld02: <RCLD02 personnel={personnel} setPersonnel={setPersonnel} user={user} toast={toast} />,
    rcld03: <RCLD03 supplies={supplies} setSupplies={setSupplies} user={user} toast={toast} />,
    docs: <DocsModule />,
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
