'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Subscription } from "rxjs";
import { addDays, parseISO } from "date-fns";
import { parseError } from "@/app/utils/parse-error";
import {
  userTransactionListApi,
  UserTransaction,
  UserTransactionListParams,
} from "@/app/api/transaction/list";

export type BalanceHistoryPoint = {
  date: string;
  daily_sum: number;
  cumulative_balance: number;
};

export type BalanceHistoryParams = {
  currency?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
};

export type UseBalanceHistoryState = {
  data: BalanceHistoryPoint[];
  currency: string;
  loading: boolean;
  error: string;
  refresh: () => void;
};

const DEFAULT_PARAMS: Required<Pick<BalanceHistoryParams, "currency" | "per_page" | "page">> = {
  currency: "kgs",
  per_page: 500,
  page: 1,
};

const paramsKey = (params?: BalanceHistoryParams): string => {
  if (!params) return "";
  return JSON.stringify({
    currency: params.currency ?? DEFAULT_PARAMS.currency,
    from: params.from ?? "",
    to: params.to ?? "",
    per_page: params.per_page ?? DEFAULT_PARAMS.per_page,
    page: params.page ?? DEFAULT_PARAMS.page,
  });
};

const normalizeAmount = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const extractTransactions = (response: unknown): UserTransaction[] => {
  if (!response || typeof response !== "object") return [];
  const raw = response as Record<string, unknown>;
  const candidates: unknown[] = [];

  if (Array.isArray(raw.transactions)) candidates.push(...raw.transactions);
  if (Array.isArray(raw.items)) candidates.push(...raw.items);

  if (raw.data && typeof raw.data === "object") {
    const data = raw.data as Record<string, unknown>;
    if (Array.isArray(data.transactions)) candidates.push(...data.transactions);
    if (Array.isArray(data.items)) candidates.push(...data.items);
  }

  return candidates.filter((item): item is UserTransaction => {
    return (
      item !== null &&
      typeof item === "object" &&
      "created_at" in item &&
      typeof (item as UserTransaction).created_at === "string"
    );
  });
};

const aggregateHistory = (
  transactions: UserTransaction[],
  params: BalanceHistoryParams
): { currency: string; points: BalanceHistoryPoint[] } => {
  const currencyCode = (params.currency ?? DEFAULT_PARAMS.currency).toUpperCase();
  const filtered = transactions.filter((transaction) => {
    const code = transaction.currency?.code?.toString().toUpperCase();
    if (currencyCode && code && code !== currencyCode) return false;
    return true;
  });

  const fromKey = params.from && params.from.length === 10 ? params.from : null;
  const toKey = params.to && params.to.length === 10 ? params.to : null;

  const map = new Map<string, number>();
  filtered.forEach((transaction) => {
    const createdAt = parseISO(transaction.created_at);
    const dateObj = Number.isFinite(createdAt.getTime()) ? createdAt : parseISO(`${transaction.created_at.slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(dateObj.getTime())) {
      return;
    }
    const dateKey = dateObj.toISOString().slice(0, 10);

    if (toKey && dateKey > toKey) {
      return;
    }

    const prev = map.get(dateKey) ?? 0;
    const amount = normalizeAmount(transaction.amount);
    map.set(dateKey, prev + amount);
  });

  const sortedDates = Array.from(map.keys()).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const baseline = fromKey
    ? sortedDates.reduce((acc, date) => {
        if (date >= fromKey) return acc;
        const daily = map.get(date) ?? 0;
        return acc + daily;
      }, 0)
    : 0;

  const startKey = fromKey ?? sortedDates[0] ?? toKey;
  const endKey = toKey ?? sortedDates[sortedDates.length - 1] ?? fromKey;

  if (!startKey || !endKey) {
    return {
      currency: currencyCode,
      points: [],
    };
  }

  const startDate = parseISO(startKey);
  const endDate = parseISO(endKey);

  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    return {
      currency: currencyCode,
      points: [],
    };
  }

  let cumulative = baseline;
  const points: BalanceHistoryPoint[] = [];

  for (let cursor = startDate; cursor.getTime() <= endDate.getTime(); cursor = addDays(cursor, 1)) {
    const key = cursor.toISOString().slice(0, 10);
    const daily = map.get(key) ?? 0;
    cumulative += daily;
    points.push({
      date: key,
      daily_sum: daily,
      cumulative_balance: cumulative,
    });
  }

  return {
    currency: currencyCode,
    points,
  };
};

export const useBalanceHistory = (params?: BalanceHistoryParams): UseBalanceHistoryState => {
  const currencyParam = params?.currency ?? DEFAULT_PARAMS.currency;
  const fromParam = params?.from;
  const toParam = params?.to;
  const perPageParam = params?.per_page ?? DEFAULT_PARAMS.per_page;
  const pageParam = params?.page ?? DEFAULT_PARAMS.page;

  const mergedParams = useMemo(
    () => ({
      currency: currencyParam,
      from: fromParam,
      to: toParam,
      per_page: perPageParam,
      page: pageParam,
    }),
    [currencyParam, fromParam, toParam, perPageParam, pageParam]
  );

  const [state, setState] = useState<{ data: BalanceHistoryPoint[]; currency: string }>({
    data: [],
    currency: mergedParams.currency?.toUpperCase() ?? DEFAULT_PARAMS.currency.toUpperCase(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const mergedParamsKey = useMemo(
    () =>
      paramsKey({
        currency: currencyParam,
        from: fromParam,
        to: toParam,
        per_page: perPageParam,
        page: pageParam,
      }),
    [currencyParam, fromParam, toParam, perPageParam, pageParam]
  );

  const paramsCache = useRef<string>(mergedParamsKey);
  const latestParams = useRef<BalanceHistoryParams>(mergedParams);

  useEffect(() => {
    if (paramsCache.current !== mergedParamsKey) {
      paramsCache.current = mergedParamsKey;
      latestParams.current = mergedParams;
      setRefreshToken((prev) => prev + 1);
    }
  }, [mergedParams, mergedParamsKey]);

  useEffect(() => {
    let active = true;
    const currentParams = latestParams.current;

    setLoading(true);
    setError("");

    const requestParams: UserTransactionListParams = {
      page: currentParams.page ?? DEFAULT_PARAMS.page,
      per_page: currentParams.per_page ?? DEFAULT_PARAMS.per_page,
    };

    const subscription: Subscription = userTransactionListApi(requestParams).subscribe({
      next: (result) => {
        if (!active) return;
        if (!result.success) {
          setState({
            data: [],
            currency: (currentParams.currency ?? DEFAULT_PARAMS.currency).toUpperCase(),
          });
          setError("Не удалось загрузить историю баланса");
          setLoading(false);
          return;
        }

        const transactions = extractTransactions(result);
        const aggregated = aggregateHistory(transactions, currentParams);
        setState({ data: aggregated.points, currency: aggregated.currency });
        setError("");
        setLoading(false);
      },
      error: (err: Error) => {
        if (!active) return;
        const message = parseError(err);
        setState({
          data: [],
          currency: (currentParams.currency ?? DEFAULT_PARAMS.currency).toUpperCase(),
        });
        setError(message && message !== "Unknown error" ? message : "Не удалось загрузить историю баланса");
        setLoading(false);
      },
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshToken, mergedParamsKey]);

  const refresh = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  const normalizedData = useMemo(() => {
    return state.data.map((item) => ({
      ...item,
      daily_sum: Number.isFinite(item.daily_sum) ? item.daily_sum : 0,
      cumulative_balance: Number.isFinite(item.cumulative_balance) ? item.cumulative_balance : 0,
    }));
  }, [state.data]);

  return {
    data: normalizedData,
    currency: state.currency,
    loading,
    error,
    refresh,
  };
};
