'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Subscription } from "rxjs";
import { parseISO } from "date-fns";
import {
  userTransactionListApi,
  UserTransaction,
  UserTransactionListParams,
  UserTransactionListResponse,
} from "@/app/api/transaction/list";
import { parseError } from "@/app/utils/parse-error";

export type NormalizedTransaction = {
  id: string;
  createdAt: string;
  createdAtLabel: string;
  amount: number;
  currencyCode: string;
  currencySymbol: string;
  raw: UserTransaction;
  operationType: string;
};

export type UseUserTransactionsState = {
  transactions: NormalizedTransaction[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
  loading: boolean;
  error: string;
  refresh: () => void;
};

const RESPONSE_KEYS = ["transactions", "items"] as const;

const extractTransactions = (response: UserTransactionListResponse): UserTransaction[] => {
  const candidates: UserTransaction[] = [];

  RESPONSE_KEYS.forEach((key) => {
    const levelTop = (response as Record<string, unknown>)[key];
    if (Array.isArray(levelTop)) {
      candidates.push(...(levelTop as UserTransaction[]));
    }
  });

  if (response.data && typeof response.data === "object") {
    RESPONSE_KEYS.forEach((key) => {
      const nested = (response.data as Record<string, unknown>)[key];
      if (Array.isArray(nested)) {
        candidates.push(...(nested as UserTransaction[]));
      }
    });
  }

  return candidates;
};

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  RUB: "₽",
  RUR: "₽",
  USD: "$",
  EUR: "€",
  KGS: "сом",
  KZT: "₸",
  KZT2: "₸",
  CNY: "¥",
  EUR2: "€",
  GBP: "£",
  BYN: "Br",
  UAH: "₴",
  AED: "د.إ",
  TRY: "₺",
  CHF: "₣",
};

const getCurrencySymbol = (code: string): string => {
  if (!code) return code;
  return CURRENCY_SYMBOL_MAP[code] ?? code;
};

const formatDate = (value: string): { iso: string; label: string } => {
  if (!value) {
    return { iso: "", label: "" };
  }
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) {
    return { iso: value, label: value };
  }
  return {
    iso: date.toISOString(),
    label: `${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
  };
};

const normalizeTransaction = (transaction: UserTransaction): NormalizedTransaction => {
  const createdAt = formatDate(transaction.created_at);
  const amount = typeof transaction.amount === "number" ? transaction.amount : Number(transaction.amount ?? 0);
  const code = transaction.currency?.code?.toString().toUpperCase() ?? "";
  const operationType = transaction.operation?.type ?? transaction.type ?? "unknown";

  return {
    id: String(transaction.id ?? createdAt.iso ?? Math.random()),
    createdAt: createdAt.iso,
    createdAtLabel: createdAt.label,
    amount: Number.isFinite(amount) ? amount : 0,
    currencyCode: code,
    currencySymbol: getCurrencySymbol(code),
    raw: transaction,
    operationType,
  };
};

export const useUserTransactions = ({
  page: pageParam = 1,
  per_page: perPageParam = 10,
}: UserTransactionListParams = {}): UseUserTransactionsState => {
  const [state, setState] = useState<{
    transactions: NormalizedTransaction[];
    total: number;
    pages: number;
    page: number;
    perPage: number;
  }>({
    transactions: [],
    total: 0,
    pages: 1,
    page: pageParam,
    perPage: perPageParam,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const latestParams = useRef<UserTransactionListParams>({
    page: pageParam,
    per_page: perPageParam,
  });

  useEffect(() => {
    latestParams.current = { page: pageParam, per_page: perPageParam };
    setRefreshToken((prev) => prev + 1);
  }, [pageParam, perPageParam]);

  useEffect(() => {
    let active = true;
    const currentParams = latestParams.current;
    setLoading(true);
    setError("");

    const subscription: Subscription = userTransactionListApi(currentParams).subscribe({
      next: (result) => {
        if (!active) return;
        if (!result.success) {
          setState((prev) => ({
            ...prev,
            transactions: [],
            total: 0,
          }));
          setError("Не удалось загрузить операции");
          setLoading(false);
          return;
        }

        const transactions = extractTransactions(result).map(normalizeTransaction);
        const total =
          (typeof result.data?.total === "number" && Number.isFinite(result.data.total) && result.data.total >= 0
            ? result.data.total
            : typeof result.total === "number"
              ? result.total
              : transactions.length) ?? transactions.length;

        const perPage =
          typeof result.data?.per_page === "number"
            ? result.data.per_page
            : currentParams.per_page ?? perPageParam ?? 10;
        const page =
          typeof result.data?.page === "number"
            ? result.data.page
            : currentParams.page ?? pageParam ?? 1;
        const pages =
          typeof result.data?.pages === "number"
            ? result.data.pages
            : perPage > 0
              ? Math.max(1, Math.ceil(total / perPage))
              : 1;

        setState({
          transactions,
          total,
          page,
          perPage,
          pages,
        });
        setLoading(false);
      },
      error: (err: Error) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          transactions: [],
        }));
        const message = parseError(err);
        setError(message && message !== "Unknown error" ? message : "Не удалось загрузить операции");
        setLoading(false);
      },
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshToken, pageParam, perPageParam]);

  const refresh = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  const transactions = useMemo(() => state.transactions, [state.transactions]);

  return {
    transactions,
    total: state.total,
    page: state.page,
    perPage: state.perPage,
    pages: state.pages,
    loading,
    error,
    refresh,
  };
};
