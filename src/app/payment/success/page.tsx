"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styled from "styled-components";
import api from "@/lib/api";

// ── Styles ────────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0fdf4;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
`;

const Icon = styled.div<{ error?: boolean }>`
  font-size: 56px;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
`;

const InvoiceBox = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #374151;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  strong { color: #111827; }
`;

const Btn = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  &:hover { background: #059669; }
`;

const ErrorMsg = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin: 12px 0 0;
`;

// ── Inner component (uses useSearchParams) ────────────────────────────────────

interface Sale {
  id: string;
  invoice_number: string;
  total_amount: number;
  customer_name: string | null;
  payment_status: string;
}

function SuccessContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const data     = params.get("data");

  const [sale,    setSale]    = useState<Sale | null>(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data) {
      setError("No payment data received.");
      setLoading(false);
      return;
    }

    api
      .post("/esewa/verify", { data })
      .then((res: unknown) => {
        const r = res as { sale: Sale };
        setSale(r.sale);
      })
      .catch((err: unknown) => {
        const e = err as { message?: string };
        setError(e?.message || "Payment verification failed.");
      })
      .finally(() => setLoading(false));
  }, [data]);

  if (loading) {
    return (
      <Page>
        <Card>
          <Icon>⏳</Icon>
          <Title>Verifying payment…</Title>
          <Subtitle>Please wait while we confirm your eSewa payment.</Subtitle>
        </Card>
      </Page>
    );
  }

  if (error || !sale) {
    return (
      <Page style={{ background: "#fef2f2" }}>
        <Card>
          <Icon>❌</Icon>
          <Title>Verification Failed</Title>
          <Subtitle>We could not verify your payment with eSewa.</Subtitle>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Btn style={{ background: "#ef4444", marginTop: 24 }} onClick={() => router.push("/sales")}>
            Back to Sales
          </Btn>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <Icon>✅</Icon>
        <Title>Payment Successful!</Title>
        <Subtitle>Your eSewa payment has been verified and the sale is recorded.</Subtitle>

        <InvoiceBox>
          <Row><span>Invoice:</span> <strong>{sale.invoice_number}</strong></Row>
          <Row><span>Customer:</span> <strong>{sale.customer_name || "Walk-in"}</strong></Row>
          <Row>
            <span>Total Paid:</span>
            <strong>Rs. {sale.total_amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </Row>
          <Row><span>Status:</span> <strong style={{ color: "#10b981" }}>PAID via eSewa</strong></Row>
        </InvoiceBox>

        <Btn onClick={() => router.push("/sales")}>Back to Sales</Btn>
      </Card>
    </Page>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <Card>
            <Icon>⏳</Icon>
            <Title>Loading…</Title>
          </Card>
        </Page>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
