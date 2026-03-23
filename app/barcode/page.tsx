"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { getBarcodeValues } from "@/lib/barcode-data";
import Barcode from "@/components/barcode";
import { ArrowLeft, Download } from "lucide-react";

// ─── Barcode Content (reads query params) ─────────────────────────────────────

function BarcodeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");
  const serial = searchParams.get("serial");

  if (!id || !serial) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-muted-foreground text-sm text-center">
          잘못된 접근입니다.
        </p>
      </div>
    );
  }

  const { entry, exit } = getBarcodeValues(serial);

  return (
    <BarcodeOutputPage
      id={id}
      entry={entry}
      exit={exit}
      onBack={() => router.push("/")}
    />
  );
}

// ─── Barcode Output Page ──────────────────────────────────────────────────────

interface BarcodeOutputPageProps {
  id: string;
  entry: string;
  exit: string;
  onBack: () => void;
}

type Tab = "entry" | "exit";

function BarcodeOutputPage({ id, entry, exit, onBack }: BarcodeOutputPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("entry");
  const entrySvgRef = useRef<SVGSVGElement>(null);
  const exitSvgRef = useRef<SVGSVGElement>(null);

  // ── Canvas export helpers ─────────────────────────────────────────────────

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function svgToDataUrl(svg: SVGSVGElement): string {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const bbox = svg.getBoundingClientRect();
    clone.setAttribute("width", String(bbox.width || 280));
    clone.setAttribute("height", String(bbox.height || 80));
    const serialised = new XMLSerializer().serializeToString(clone);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serialised);
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Renders a single barcode to a canvas and returns its data URL.
   * Layout: white card, label row, barcode image. No serial shown.
   */
  async function renderBarcodeCanvas(
    svgEl: SVGSVGElement,
    label: string,
    badgeBg: string,
    badgeFg: string,
    borderColor: string
  ): Promise<string> {
    const DPR = 2;
    const W = 360;
    const PAD = 24;
    const BARCODE_W = W - PAD * 2;
    const BARCODE_H = 84;
    const BADGE_H = 24;
    const TOTAL_H = PAD + BADGE_H + 14 + BARCODE_H + PAD;

    const canvas = document.createElement("canvas");
    canvas.width = W * DPR;
    canvas.height = TOTAL_H * DPR;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // White background
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 0, 0, W, TOTAL_H, 16);
    ctx.fill();

    // Colored border (2px)
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, W - 2, TOTAL_H - 2, 15);
    ctx.stroke();

    // Badge pill
    ctx.font = "700 13px system-ui, sans-serif";
    const textW = ctx.measureText(label).width;
    const BADGE_PX = 12;
    const BADGE_W = textW + BADGE_PX * 2;

    ctx.fillStyle = badgeBg;
    roundRect(ctx, PAD, PAD, BADGE_W, BADGE_H, BADGE_H / 2);
    ctx.fill();

    ctx.fillStyle = badgeFg;
    ctx.fillText(label, PAD + BADGE_PX, PAD + BADGE_H / 2 + 5);

    // Barcode area
    const barcodeY = PAD + BADGE_H + 14;
    ctx.fillStyle = "#f9f9f9";
    roundRect(ctx, PAD, barcodeY, BARCODE_W, BARCODE_H, 10);
    ctx.fill();

    // Barcode image
    const dataUrl = svgToDataUrl(svgEl);
    const img = await loadImage(dataUrl);
    const drawW = Math.min(BARCODE_W - 16, (img.width / DPR));
    const drawH = BARCODE_H - 16;
    const drawX = PAD + (BARCODE_W - drawW) / 2;
    ctx.drawImage(img, drawX, barcodeY + 8, drawW, drawH);

    return canvas.toDataURL("image/png");
  }

  async function handleSaveImage() {
    const isEntry = activeTab === "entry";
    const svgEl = isEntry ? entrySvgRef.current : exitSvgRef.current;
    if (!svgEl) return;

    const dataUrl = await renderBarcodeCanvas(
      svgEl,
      isEntry ? "입영 바코드" : "퇴영 바코드",
      isEntry ? "#dbeafe" : "#fee2e2",
      isEntry ? "#1d4ed8" : "#b91c1c",
      isEntry ? "#2563eb" : "#dc2626"
    );

    const a = document.createElement("a");
    a.download = isEntry ? "입영-바코드.png" : "퇴영-바코드.png";
    a.href = dataUrl;
    a.click();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      {/* Back navigation */}
      <div className="w-full max-w-sm flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          aria-label="돌아가기"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>돌아가기</span>
        </button>
      </div>

      {/* Segmented toggle */}
      <div className="w-full max-w-sm mb-4">
        <div
          className="flex rounded-xl border border-border bg-muted/40 p-1 gap-1"
          role="tablist"
          aria-label="바코드 선택"
        >
          <button
            role="tab"
            aria-selected={activeTab === "entry"}
            onClick={() => setActiveTab("entry")}
            className={[
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              activeTab === "entry"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            입영
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "exit"}
            onClick={() => setActiveTab("exit")}
            className={[
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              activeTab === "exit"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            퇴영
          </button>
        </div>
      </div>

      {/* Barcode card — only one visible at a time */}
      <div className="w-full max-w-sm">
        {/* Entry — blue theme */}
        <div
          className={[
            "rounded-2xl shadow-sm overflow-hidden",
            activeTab === "entry" ? "block" : "hidden",
          ].join(" ")}
          style={{
            border: "2px solid #2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.03)",
          }}
          aria-hidden={activeTab !== "entry"}
        >
          <div
            className="px-5 pt-5 pb-4"
            style={{
              borderBottom: "1px solid rgba(37, 99, 235, 0.15)",
              backgroundColor: "rgba(37, 99, 235, 0.05)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
              >
                입영
              </span>
              <span className="text-sm font-medium text-foreground">
                입영 바코드
              </span>
            </div>
          </div>
          <div className="px-5 py-6 flex justify-center bg-white">
            <Barcode
              svgRef={entrySvgRef}
              value={entry}
              className="w-full max-w-[280px] h-auto"
            />
          </div>
        </div>

        {/* Exit — red theme */}
        <div
          className={[
            "rounded-2xl shadow-sm overflow-hidden",
            activeTab === "exit" ? "block" : "hidden",
          ].join(" ")}
          style={{
            border: "2px solid #dc2626",
            backgroundColor: "rgba(220, 38, 38, 0.03)",
          }}
          aria-hidden={activeTab !== "exit"}
        >
          <div
            className="px-5 pt-5 pb-4"
            style={{
              borderBottom: "1px solid rgba(220, 38, 38, 0.15)",
              backgroundColor: "rgba(220, 38, 38, 0.05)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
              >
                퇴영
              </span>
              <span className="text-sm font-medium text-foreground">
                퇴영 바코드
              </span>
            </div>
          </div>
          <div className="px-5 py-6 flex justify-center bg-white">
            <Barcode
              svgRef={exitSvgRef}
              value={exit}
              className="w-full max-w-[280px] h-auto"
            />
          </div>
        </div>
      </div>

      {/* Download button — downloads only the active barcode */}
      <button
        onClick={handleSaveImage}
        className="mt-6 w-full max-w-sm flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
      >
        <Download className="w-4 h-4" />
        {activeTab === "entry" ? "입영 바코드 저장" : "퇴영 바코드 저장"}
      </button>
    </main>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function BarcodePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BarcodeContent />
    </Suspense>
  );
}
