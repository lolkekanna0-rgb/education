import { httpWithAuth } from "../http"

export type LogoutResponse = {
    success: boolean,
    data: null
}

export const logoutApi = (logout_other_devices: boolean = true) =>
    httpWithAuth<LogoutResponse>("/user/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logout_other_devices })
    })