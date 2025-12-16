import { http } from "../http";

export type GetRegistrationCodeResponse = {
    success: boolean,
    data: {
        code_id: string
    }
}

export const getRegistrationCodeApi = (email: string, phone: string) =>
    http<GetRegistrationCodeResponse>("/auth/get_registration_code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
    })
