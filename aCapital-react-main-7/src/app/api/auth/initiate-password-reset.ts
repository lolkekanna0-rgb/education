import { http } from "../http";

export type InitiatePasswordResetResponse = {
    success: boolean,
    data: {
        code_id: string
    }
}

export const initiatePasswordResetApi = (phone: string) =>
    http<InitiatePasswordResetResponse>("/auth/initiate_password_reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
    })