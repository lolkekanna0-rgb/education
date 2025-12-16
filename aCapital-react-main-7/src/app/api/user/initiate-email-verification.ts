import { httpWithAuth } from "../http";

export type InitiateEmailVerificationResponse = {
  success: boolean;
  data: {
    code_id: string;
  };
};

export const initiateEmailVerificationApi = () =>
  httpWithAuth<InitiateEmailVerificationResponse>("/user/initiate_email_verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
