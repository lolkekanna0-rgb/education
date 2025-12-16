import { httpWithAuth } from "../http";

export type PaymentCreateResponse = {
  success: boolean;
  data?: Record<string, unknown>;
  error?: {
    code?: string;
    messages?: string[];
  };
};

export const createPaymentApi = (amount: number) =>
  httpWithAuth<PaymentCreateResponse>("/payment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

