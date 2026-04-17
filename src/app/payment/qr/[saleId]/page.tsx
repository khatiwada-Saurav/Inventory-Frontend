"use client";
import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ── Inner component (needs useSearchParams, so must be inside Suspense) ────────

function QrPaymentForm() {
  const searchParams = useSearchParams();
  const formRef      = useRef<HTMLFormElement>(null);

  // All params except payment_url are eSewa form fields
  const paymentUrl = searchParams.get("payment_url") ?? "";
  const fields     = [...searchParams.entries()].filter(([k]) => k !== "payment_url");

  // Auto-submit as soon as the page mounts — give React one tick to render the form
  useEffect(() => {
    const t = setTimeout(() => formRef.current?.submit(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
        flexDirection: "column",
        gap: 16,
        color: "#374151",
      }}
    >
      <div style={{ fontSize: 40 }}>💳</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Redirecting to eSewa…</div>
      <div style={{ fontSize: 13, color: "#9CA3AF" }}>Please wait</div>

      {/* Hidden form — auto-submitted by the useEffect above */}
      <form ref={formRef} method="POST" action={paymentUrl} style={{ display: "none" }}>
        {fields.map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QrPaymentPage() {
  return (
    <Suspense>
      <QrPaymentForm />
    </Suspense>
  );
}
