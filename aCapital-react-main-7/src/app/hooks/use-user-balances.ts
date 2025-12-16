'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { Subscription } from "rxjs";
import { userGetBalancesApi, UserBalanceItem, UserGetBalancesResponse } from "@/app/api/user/get-balances";
import { parseError } from "@/app/utils/parse-error";

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: "₽",
  RUR: "₽",
  USD: "$",
  EUR: "€",
  GBP: "£",
  CNY: "¥",
  KZT: "₸",
  KGS: "сом",
  UAH: "₴",
  BYN: "Br",
  TRY: "₺",
  AED: "د.إ",
  CHF: "₣",
};

type AggregatedBalance = {
  key: string;
  code: string;
  label: string;
  symbol: string;
  amount: number;
};

export type FormattedUserBalance = AggregatedBalance & {
  formattedAmount: string;
  display: string;
};

const collectBalances = (response: UserGetBalancesResponse): UserBalanceItem[] => {
  const balances: UserBalanceItem[] = [];
  const visited = new Set<object>();
  const queue: object[] = [];

  const enqueue = (candidate: unknown) => {
    if (!candidate || typeof candidate !== "object") {
      return;
    }
    if (visited.has(candidate)) {
      return;
    }
    visited.add(candidate);
    queue.push(candidate);
  };

  enqueue(response.data ?? null);
  enqueue(response.balances ?? null);
  enqueue(response.items ?? null);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (Array.isArray(current)) {
      current.forEach((item) => enqueue(item));
      continue;
    }

    const record = current as Record<string, unknown>;

    const hasBalanceProps =
      "amount" in record ||
      "currency_id" in record ||
      "currency_code" in record ||
      "currency" in record ||
      "balance" in record;

    if (hasBalanceProps) {
      balances.push(record as unknown as UserBalanceItem);
    }

    Object.values(record).forEach((value) => {
      if (typeof value === "object" && value !== null) {
        enqueue(value);
      }
    });
  }

  return balances;
};

const resolveCurrencyKey = (item: UserBalanceItem): AggregatedBalance["key"] => {
  if (typeof item.currency_code === "string" && item.currency_code.trim().length > 0) {
    return item.currency_code.trim().toUpperCase();
  }

  if (typeof item.currency_id === "number" && Number.isFinite(item.currency_id)) {
    return `ID:${item.currency_id}`;
  }

  if (typeof item.currency === "string" && item.currency.trim().length > 0) {
    return item.currency.trim().toUpperCase();
  }

  return "UNKNOWN";
};

const resolveCurrencyCode = (item: UserBalanceItem, key: string): AggregatedBalance["code"] => {
  if (typeof item.currency_code === "string" && item.currency_code.trim().length > 0) {
    return item.currency_code.trim().toUpperCase();
  }
  if (typeof item.currency === "string" && item.currency.trim().length > 0) {
    return item.currency.trim().toUpperCase();
  }
  return key.startsWith("ID:") ? "" : key;
};

const resolveCurrencyLabel = (item: UserBalanceItem, key: string): AggregatedBalance["label"] => {
  if (typeof item.currency_code === "string" && item.currency_code.trim().length > 0) {
    return item.currency_code.trim().toUpperCase();
  }

  if (typeof item.currency === "string" && item.currency.trim().length > 0) {
    return item.currency.trim().toUpperCase();
  }

  if (typeof item.currency_id === "number" && Number.isFinite(item.currency_id)) {
    return `ID ${item.currency_id}`;
  }

  if (key.startsWith("ID:")) {
    return key.replace("ID:", "ID ");
  }

  return key || "—";
};

const resolveCurrencySymbol = (code: string, key: string): AggregatedBalance["symbol"] => {
  if (code && CURRENCY_SYMBOLS[code]) {
    return CURRENCY_SYMBOLS[code];
  }

  if (key.startsWith("ID:")) {
    return key.replace("ID:", "ID ");
  }

  return code || "—";
};

const aggregateBalances = (items: UserBalanceItem[]): AggregatedBalance[] => {
  const map = new Map<string, AggregatedBalance>();

  items.forEach((item) => {
    const key = resolveCurrencyKey(item);
    const code = resolveCurrencyCode(item, key);
    const label = resolveCurrencyLabel(item, key);
    const symbol = resolveCurrencySymbol(code, key);

    const rawAmount =
      typeof item.amount === "number"
        ? item.amount
        : typeof item.amount === "string"
          ? Number(item.amount)
          : typeof item.value === "number"
            ? item.value
            : typeof item.value === "string"
              ? Number(item.value)
              : typeof item.balance === "number"
                ? item.balance
                : typeof item.balance === "string"
                  ? Number(item.balance)
                  : null;

    if (rawAmount === null || Number.isNaN(rawAmount)) {
      return;
    }

    const existing = map.get(key);

    if (existing) {
      existing.amount += rawAmount;
    } else {
      map.set(key, {
        key,
        code,
        label,
        symbol,
        amount: rawAmount,
      });
    }
  });

  return Array.from(map.values());
};

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export type UseUserBalancesResult = {
  balances: UserBalanceItem[];
  formattedBalances: FormattedUserBalance[];
  loading: boolean;
  error: string;
  refresh: () => void;
};

export const useUserBalances = (): UseUserBalancesResult => {
  const [balances, setBalances] = useState<UserBalanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const subscription: Subscription = userGetBalancesApi().subscribe({
      next: (result) => {
        if (!active) return;

        if (!result.success) {
          setBalances([]);
          setError("Не удалось загрузить баланс");
          setLoading(false);
          return;
        }

        const items = collectBalances(result);
        setBalances(items);
        setError("");
        setLoading(false);
      },
      error: (err: Error) => {
        if (!active) return;
        setBalances([]);
        const message = parseError(err);
        setError(message && message !== "Unknown error" ? message : "Не удалось загрузить баланс");
        setLoading(false);
      },
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshCounter]);

  const formattedBalances = useMemo<FormattedUserBalance[]>(() => {
    const aggregated = aggregateBalances(balances);

    if (aggregated.length === 0) {
      const defaultSymbol = CURRENCY_SYMBOLS.KGS ?? "сом";
      return [
        {
          key: "KGS",
          code: "KGS",
          label: "KGS",
          symbol: defaultSymbol,
          amount: 0,
          formattedAmount: "0",
          display: `0 ${defaultSymbol}`.trim(),
        },
      ];
    }

    return aggregated.map((entry) => {
      const formattedAmount = formatAmount(entry.amount);
      return {
        ...entry,
        formattedAmount,
        display: `${formattedAmount} ${entry.symbol}`.trim(),
      };
    });
  }, [balances]);

  const refresh = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  return {
    balances,
    formattedBalances,
    loading,
    error,
    refresh,
  };
};
