import { httpWithAuth } from "../http"

export type TwoFactorDisableResponse = {
    success: boolean,
    data: null
}

export const twoFactorDisableApi = (code_id: string, code: string) =>
    httpWithAuth<TwoFactorDisableResponse>("/user/disable_two_factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code_id, code })
    })