import { BehaviorSubject } from "rxjs";
import { CurrentUser } from "../api/user/get-me";

export const user$ = new BehaviorSubject<CurrentUser | null>(null)