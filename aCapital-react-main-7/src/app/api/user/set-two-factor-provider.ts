import { httpWithAuth } from "../http"
import { CurrentUser } from "./get-me"

export type SetTwoFactorProviderResponse = {
    success: boolean,
    data: {
        user: CurrentUser
    }
}

export const setTwoFactorProviderApi = (provider: string) =>
    httpWithAuth<SetTwoFactorProviderResponse>("/user/set_two_factor_provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
    })