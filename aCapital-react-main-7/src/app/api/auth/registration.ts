import { BehaviorSubject } from "rxjs";
import { http } from "../http"

export type RegistrationResponse = {
    success: boolean,
    data: {
        token: string
    }
}

export type RegistationDto = {
    email: string;
    phone: string;
    password: string;
    code_id: string;
    code: string;
    first_name: string;
    last_name: string;
}

export type RegistationData = Omit<RegistationDto, "code">

export const registrationData$ = new BehaviorSubject<RegistationData | null>(null)

export const registrationApi = (payload: RegistationDto) =>
    http<RegistrationResponse>("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
