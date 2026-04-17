"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

function FonepayReturnContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const ps    = searchParams.get("PS")    ?? "";
  const prn   = searchParams.get("PRN")   ?? "";
  const pAmt  = searchParams.get("P_AMT") ?? "";
  const dv    = searchParams.get("DV")    ?? "";
  const rc    = searchParams.get("RC")    ?? "";
  const uid   = searchParams.get("UID")   ?? "";
  const bc    = searchParams.get("BC")    ?? "";
  const rAmt  = searchParams.get("R_AMT") ?? "";

  const isOk = ps === "true";

  const [verifying, setVerifying] = useState(isOk);
  const [verified,  setVerified]  = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!isOk || !prn) return;

    api.post("/fonepay/verify", { PRN: prn, PS: ps, P_AMT: pAmt, DV: dv, RC: rc, UID: uid, BC: bc, R_AMT: rAmt })
      .then(() => setVerified(true))
      .catch((e: { message?: string }) => setError(e?.message ?? "Verification failed"))
      .finally(() => setVerifying(false));
  }, [isOk, prn, ps, pAmt, dv, rc, uid, bc, rAmt]);

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
            <div style={{ fontSize: 14, color: "#6B7280" }}>Your Fonepay payment has been confirmed.</div>
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
            {ps === "false" ? "Payment Failed" : "Payment Cancelled"}
          </div>
          <div style={{ fontSize: 14, color: "#6B7280" }}>
            Status: <strong>{ps || "Unknown"}</strong>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>You can close this window.</div>
        </>
      )}
    </div>
  );
}

export default function FonepayReturnPage() {
  return (
    <Suspense>
      <FonepayReturnContent />
    </Suspense>
  );
}
