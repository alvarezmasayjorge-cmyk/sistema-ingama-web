import { useState, useCallback } from "react";
import RecordList from "./components/RecordList";
import RecordForm from "./components/RecordForm";
import RecordDetail from "./components/RecordDetail";

export default function RCLD01({ records, setRecords, user, toast, personnel = [] }) {
  const [sub, setSub] = useState("list");
  const [sel, setSel] = useState(null);

  const openNew = useCallback(() => { setSel(null); setSub("form"); }, []);
  const openDetail = useCallback((r) => { setSel(r); setSub("detail"); }, []);
  const backToList = useCallback(() => setSub("list"), []);

  const handleSave = useCallback((r) => {
    setRecords((prev) => (sel ? prev.map((x) => (x.id === r.id ? r : x)) : [...prev, r]));
    setSub("list");
  }, [sel, setRecords]);

  const handleUpdate = useCallback((r) => {
    setRecords((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    setSub("list");
  }, [setRecords]);

  if (sub === "form") return <RecordForm record={sel} user={user} onSave={handleSave} onCancel={backToList} allRecords={records} personnel={personnel} toast={toast} />;
  if (sub === "detail" && sel) return <RecordDetail record={sel} user={user} onUpdate={handleUpdate} onBack={backToList} toast={toast} />;
  return <RecordList records={records} user={user} onNew={openNew} onDetail={openDetail} />;
}
