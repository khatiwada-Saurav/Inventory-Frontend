"use client";
import { useRouter } from "next/navigation";
import styled from "styled-components";

// ── Styles ────────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
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

const Icon = styled.div`
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
  margin: 0 0 32px;
  line-height: 1.6;
`;

const BtnRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Btn = styled.button<{ primary?: boolean }>`
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  border: ${({ primary }) => (primary ? "none" : "1px solid #e5e7eb")};
  background: ${({ primary }) => (primary ? "#ef4444" : "white")};
  color: ${({ primary }) => (primary ? "white" : "#374151")};
  &:hover {
    background: ${({ primary }) => (primary ? "#dc2626" : "#f9fafb")};
  }
`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentFailurePage() {
  const router = useRouter();

  return (
    <Page>
      <Card>
        <Icon>❌</Icon>
        <Title>Payment Cancelled</Title>
        <Subtitle>
          Your eSewa payment was not completed. No charges have been made.
          <br /><br />
          The sale record has been created with a <strong>pending</strong> status.
          You can delete it from the Sales page or try again with a different payment method.
        </Subtitle>

        <BtnRow>
          <Btn primary onClick={() => router.push("/sales")}>
            Go to Sales
          </Btn>
          <Btn onClick={() => router.back()}>
            Go Back
          </Btn>
        </BtnRow>
      </Card>
    </Page>
  );
}
