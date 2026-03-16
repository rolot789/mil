"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { findEntryById } from "@/lib/barcode-data";
import { ArrowRight, ScanBarcode, Lock } from "lucide-react";

const CORRECT_PASSWORD = "7136";
const AUTH_KEY = "mil_barcode_auth";

// ─── Password Gate ───────────────────────────────────────────────────────────

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, "1");
        onSuccess();
      } else {
        setError("비밀번호가 올바르지 않습니다.");
        setPassword("");
        setLoading(false);
      }
    }, 300);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-sm">
            <Lock className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              접근 제한
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              비밀번호를 입력하세요
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="비밀번호"
            aria-label="비밀번호 입력"
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring text-center tracking-[0.4em]"
            autoFocus
            autoComplete="off"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive text-center px-1">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || password.length === 0}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-40 shadow-sm"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              "확인"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Main Input Page ─────────────────────────────────────────────────────────

function MainPage() {
  const router = useRouter();
  const [militaryId, setMilitaryId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!militaryId.trim()) {
      setError("군번을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const entry = await findEntryById(militaryId);

      if (!entry) {
        setError("등록되지 않은 군번입니다.");
        setLoading(false);
        return;
      }

      router.push(
        `/barcode?id=${encodeURIComponent(entry.id)}&serial=${encodeURIComponent(entry.serial)}`
      );
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-sm">
            <ScanBarcode className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              군 입/퇴영 바코드 발급
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              군번을 입력하면 바코드가 생성됩니다
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={militaryId}
              onChange={(e) => {
                setMilitaryId(e.target.value);
                if (error) setError("");
              }}
              placeholder="군번 입력 (예: 25-72000001)"
              aria-label="군번 입력"
              className="w-full rounded-2xl border border-border bg-card px-5 py-4 pr-14 text-base text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
              autoComplete="off"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="바코드 발급"
              className="absolute right-3 flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive px-1">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    setAuthed(stored === "1");
  }, []);

  // Avoid flash: render nothing until auth state is known
  if (authed === null) return null;

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  return <MainPage />;
}
