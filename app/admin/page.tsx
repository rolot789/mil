"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Plus, Trash2, ArrowLeft, CheckCircle } from "lucide-react";

const ADMIN_AUTH_KEY = "mil_barcode_admin_auth";

interface ListEntry {
  id: string;
  serial: string;
}

// ─── Unauthorized View ───────────────────────────────────────────────────────

function UnauthorizedView() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10">
          <Shield className="w-7 h-7 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            접근 권한 없음
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            관리자 인증이 필요합니다
          </p>
        </div>
        <button
          onClick={() => router.replace("/")}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
        >
          처음으로 돌아가기
        </button>
      </div>
    </main>
  );
}

// ─── Admin Page Content ──────────────────────────────────────────────────────

function AdminContent() {
  const router = useRouter();
  const [entries, setEntries] = useState<ListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newId, setNewId] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [errors, setErrors] = useState<{ id?: string; serial?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load initial data from list.json
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/list.json");
        const data: ListEntry[] = await res.json();
        setEntries(data);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  function validateForm(): boolean {
    const newErrors: { id?: string; serial?: string } = {};

    if (!newId.trim()) {
      newErrors.id = "군번을 입력해주세요.";
    }

    if (!newSerial.trim()) {
      newErrors.serial = "시리얼번호를 입력해주세요.";
    } else if (!/^\d+$/.test(newSerial.trim())) {
      newErrors.serial = "시리얼번호는 숫자만 입력 가능합니다.";
    } else if (newSerial.trim().length !== 6) {
      newErrors.serial = "시리얼번호는 정확히 6자리여야 합니다.";
    }

    // Check for duplicate id
    if (newId.trim() && entries.some((e) => e.id === newId.trim())) {
      newErrors.id = "이미 등록된 군번입니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) return;

    const newEntry: ListEntry = {
      id: newId.trim(),
      serial: newSerial.trim(),
    };

    setEntries((prev) => [...prev, newEntry]);
    setNewId("");
    setNewSerial("");
    setErrors({});
    setSuccessMessage("새 항목이 추가되었습니다.");
  }

  function handleDeleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSuccessMessage("항목이 삭제되었습니다.");
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            로그아웃
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">관리자</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto flex flex-col gap-8">
        {/* Success Message */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-entry text-entry-foreground text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Add Entry Form */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            관리자 입력 폼
          </h2>
          <form onSubmit={handleAddEntry} className="flex flex-col gap-4">
            {/* ID Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newId" className="text-sm font-medium text-foreground">
                군번
              </label>
              <input
                id="newId"
                type="text"
                value={newId}
                onChange={(e) => {
                  setNewId(e.target.value);
                  if (errors.id) setErrors((prev) => ({ ...prev, id: undefined }));
                }}
                placeholder="예: 25-72000001"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                autoComplete="off"
              />
              {errors.id && (
                <p className="text-sm text-destructive">{errors.id}</p>
              )}
            </div>

            {/* Serial Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newSerial" className="text-sm font-medium text-foreground">
                시리얼번호
              </label>
              <input
                id="newSerial"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newSerial}
                onChange={(e) => {
                  // Allow only digits
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setNewSerial(val);
                  if (errors.serial) setErrors((prev) => ({ ...prev, serial: undefined }));
                }}
                placeholder="6자리 숫자"
                maxLength={6}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring tracking-widest"
                autoComplete="off"
              />
              {errors.serial && (
                <p className="text-sm text-destructive">{errors.serial}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              항목 추가
            </button>
          </form>
        </section>

        {/* Current List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              현재 등록된 목록
            </h2>
            <span className="text-sm text-muted-foreground">
              {entries.length}개
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              등록된 항목이 없습니다
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {entry.id}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {entry.serial}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    aria-label={`${entry.id} 삭제`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center px-4">
          변경사항은 현재 세션에만 반영됩니다.
          <br />
          영구 저장을 위해서는 백엔드 연동이 필요합니다.
        </p>
      </div>
    </main>
  );
}

// ─── Admin Page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem(ADMIN_AUTH_KEY);
    setIsAuthorized(adminAuth === "1");
  }, []);

  // Avoid flash
  if (isAuthorized === null) return null;

  if (!isAuthorized) {
    return <UnauthorizedView />;
  }

  return <AdminContent />;
}
