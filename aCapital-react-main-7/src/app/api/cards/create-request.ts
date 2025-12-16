import { httpWithAuth } from "../http";

export type CreateCardRequestResponse = {
  success: boolean;
  data?: { request_id?: number };
};

export type CreateCardRequestPayload = {
  type?: "card_issue" | "withdrawal";
  amount?: number;
  comment?: string;
};

export const createCardRequestApi = (payload: CreateCardRequestPayload = {}) =>
  httpWithAuth<CreateCardRequestResponse>("/user/card_request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
