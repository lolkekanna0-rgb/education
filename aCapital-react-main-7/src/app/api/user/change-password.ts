import { httpWithAuth } from "../http"

export type ChangePasswordResponse = {
    success: boolean,
    data: null
}

export const changePasswordApi = (current_password: string, new_password: string) =>
    httpWithAuth<ChangePasswordResponse>("/user/change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password, new_password })
    })