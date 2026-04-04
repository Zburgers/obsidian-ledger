import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { UsersPage } from "./features/users/UsersPage";
import { RecordsPage } from "./features/records/RecordsPage";
import { RecordForm } from "./features/records/RecordForm";
import { RecordDetailPage } from "./features/records/RecordDetailPage";
import { ProtectedRoute, AdminRoute } from "./router";
import { useState, useCallback } from "react";

export function App() {
  const [recordsView, setRecordsView] = useState<"list" | "create" | "detail">("list");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const handleViewRecord = useCallback((id: string) => {
    setSelectedRecordId(id);
    setRecordsView("detail");
  }, []);

  const handleCreateRecord = useCallback(() => {
    setRecordsView("create");
  }, []);

  const handleBackToList = useCallback(() => {
    setRecordsView("list");
    setSelectedRecordId(null);
  }, []);

  const handleRecordSuccess = useCallback(() => {
    setRecordsView("list");
    setSelectedRecordId(null);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        <Route path="/records" element={
          recordsView === "list" ? (
            <RecordsPage onCreate={handleCreateRecord} onView={handleViewRecord} />
          ) : recordsView === "create" ? (
            <RecordForm onSuccess={handleRecordSuccess} onCancel={handleBackToList} />
          ) : selectedRecordId ? (
            <RecordDetailPage recordId={selectedRecordId} onBack={handleBackToList} />
          ) : null
        } />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
