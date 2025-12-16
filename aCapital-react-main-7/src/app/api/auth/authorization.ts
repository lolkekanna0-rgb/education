import { http } from "../http"

export type AuthorizationResponse = {
    success: boolean,
    data: {
        token: string
    }
}

export type AuthorizationNeed2FAResponse = {
    success: boolean,
    data: {
        code_id: string,
        provider: string,
        available_providers?: string[]
    }
}

export const authorizationApi = (phone: string, password: string, two_factor_provider?: string) =>
    http<AuthorizationResponse | AuthorizationNeed2FAResponse>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone,
            password,
            ...(two_factor_provider ? { two_factor_provider } : {})
        })
    })
