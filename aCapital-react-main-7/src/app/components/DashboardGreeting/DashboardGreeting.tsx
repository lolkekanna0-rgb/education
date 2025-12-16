"use client";

import { useEffect, useMemo, useState } from "react";
import { user$ } from "@/app/services/user";
import { CurrentUser } from "@/app/api/user/get-me";

type DashboardGreetingProps = {
  className?: string;
};

const formatUserName = (user: CurrentUser | null): string => {
  if (!user) return "пользователь";

  const profile = user.profile;

  if (profile) {
    const firstName = profile.first_name?.trim();
    const lastName = profile.last_name?.trim();
    if (firstName && lastName) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    if (firstName) {
      return firstName;
    }
    if (lastName) {
      return lastName;
    }
  }

  if (user.email) return user.email;
  if (user.phone) return user.phone;

  return "пользователь";
};

export default function DashboardGreeting({ className }: DashboardGreetingProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const subscription = user$.subscribe(setUser);
    return () => subscription.unsubscribe();
  }, []);

  const displayName = useMemo(() => formatUserName(user), [user]);

  return <h1 className={className}>Добро пожаловать, {displayName}!</h1>;
}
