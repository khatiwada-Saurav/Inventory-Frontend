"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

// ── Inner component ────────────────────────────────────────────────────────────

function KhaltiReturnContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const status  = searchParams.get("status")  ?? "";
  const pidx    = searchParams.get("pidx")    ?? "";
  const isOk    = status === "Completed";

  const [verifying, setVerifying] = useState(isOk);
  const [verified,  setVerified]  = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!isOk || !pidx) return;

    api.post("/khalti/verify", { pidx })
      .then(() => setVerified(true))
      .catch((e: { message?: string }) => setError(e?.message ?? "Verification failed"))
      .finally(() => setVerifying(false));
  }, [isOk, pidx]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", fontFamily: "system-ui, sans-serif",
      gap: 16, padding: 24, textAlign: "center",
    }}>
      {isOk ? (
        verifying ? (
          <>
            <div style={{ fontSize: 40 }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Confirming payment…</div>
          </>
        ) : verified ? (
          <>
            <div style={{ fontSize: 56 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Payment Successful!</div>
            <div style={{ fontSize: 14, color: "#6B7280" }}>Your Khalti payment has been confirmed.</div>
            <button
              onClick={() => router.push("/sales")}
              style={{ marginTop: 8, padding: "10px 24px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
            >
              Back to Sales
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Payment received but verification failed</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>{error}</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>The cashier screen will update automatically.</div>
          </>
        )
      ) : (
        <>
          <div style={{ fontSize: 56 }}>❌</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
            {status === "User canceled" ? "Payment Cancelled" : "Payment Failed"}
          </div>
          <div style={{ fontSize: 14, color: "#6B7280" }}>
            Status: <strong>{status || "Unknown"}</strong>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>You can close this window.</div>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KhaltiReturnPage() {
  return (
    <Suspense>
      <KhaltiReturnContent />
    </Suspense>
  );
}
