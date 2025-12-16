import { http } from "../http";

export type VerifyEmailResponse = {
  success: boolean;
  data: {
    user?: {
      email_is_verified?: boolean;
      [key: string]: unknown;
    };
  } | null;
};

export const verifyEmailApi = (code_id: string, code: string | number) =>
  http<VerifyEmailResponse>("/auth/verify_email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code_id, code: typeof code === "number" ? code : Number(code) }),
  });
