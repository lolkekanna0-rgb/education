import { http } from "../http"

export type Authorization2FAResponse = {
    success: boolean,
    data: {
        token: string
    }
}

export const authorization2FaApi = (phone: string, code_id: string, code: string) =>
    http<Authorization2FAResponse>("/auth/submit_two_factor_login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code_id, code })
    })