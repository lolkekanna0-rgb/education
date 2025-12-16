import { BehaviorSubject } from "rxjs"
import { http } from "../http"

export type SetNewPasswordDto = {
    password: string,
    code_id: string,
    code: string
}

export type SetNewPasswordResponse = {
    success: boolean,
    data: {
        token: string
    }
}

export type SetNewPasswordData = Partial<SetNewPasswordDto & { phone: string }>

export const setNewPasswordData$ = new BehaviorSubject<SetNewPasswordData | null>(null)

export const setNewPasswordApi = (password: string, code_id: string, code: string) =>
    http<SetNewPasswordResponse>("/auth/set_new_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code_id, code })
    })