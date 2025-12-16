import { httpWithAuth } from "../http"

export type InitiateTwoFactorDisableResponse = {
    success: boolean,
    data: {
        code_id: string
    }
}

export const initiateTwoFactorDisableApi = () =>
    httpWithAuth<InitiateTwoFactorDisableResponse>("/user/initiate_two_factor_disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    })