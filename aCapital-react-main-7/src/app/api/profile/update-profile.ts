import { httpWithAuth } from "../http"
import { CurrentUser, CurrentUserProfile } from "../user/get-me"

export type UpdateProfileResponse = {
    success: boolean,
    data: {
        user: CurrentUser
    }
}

export const updateProfileApi = (profile: CurrentUserProfile) =>
    httpWithAuth<UpdateProfileResponse>("/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
    })