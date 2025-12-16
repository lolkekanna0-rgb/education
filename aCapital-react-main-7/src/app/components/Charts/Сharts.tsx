"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Area, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type LabelProps } from "recharts";
import Select, { SingleValue } from "react-select";
import { format, isValid, parseISO, subDays } from "date-fns";
import s from "./charts.module.scss";
import { useBalanceHistory } from "@/app/hooks/use-balance-history";
import { Loader } from "@/app/components/Loader";

type PeriodOption = {
  value: string;
  label: string;
  days: number;
};

type ChartPoint = {
  date: string;
  label: string;
  balance: number;
  daily: number;
};

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "7", label: "7 дней", days: 7 },
  { value: "30", label: "30 дней", days: 30 },
  { value: "90", label: "90 дней", days: 90 },
];

const DEFAULT_OPTION = PERIOD_OPTIONS[1];

const formatDateParam = (date: Date): string => date.toISOString().slice(0, 10);

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("ru-RU", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type CustomTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload?: ChartPoint }>;
  currencyLabel: string;
};

const CustomTooltip = ({ active, payload, label, currencyLabel }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as ChartPoint | undefined;

  if (!point) {
    return null;
  }

  const balanceText = `${numberFormatter.format(point.balance)} ${currencyLabel}`;
  const dailyPrefix = point.daily >= 0 ? "+" : "-";
  const dailyValue = numberFormatter.format(Math.abs(point.daily));
  const dailyText = `${dailyPrefix}${dailyValue} ${currencyLabel}`;

  return (
    <div className={s.tooltip}>
      <div className={s.tooltip__date}>Дата: {label}</div>
      <div>Баланс на конец дня: {balanceText}</div>
      <div>Изменение за день: {dailyText}</div>
    </div>
  );
};

export default function Charts() {
  const [period, setPeriod] = useState<PeriodOption>(DEFAULT_OPTION);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateMedia = () => setIsMobile(window.innerWidth <= 640);
    updateMedia();
    window.addEventListener("resize", updateMedia);
    return () => window.removeEventListener("resize", updateMedia);
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    const to = formatDateParam(now);
    const from = formatDateParam(subDays(now, period.days - 1));
    return { from, to };
  }, [period]);

  const { data, loading, error, currency } = useBalanceHistory({
    currency: "kgs",
    from: dateRange.from,
    to: dateRange.to,
  });

  const chartData = useMemo<ChartPoint[]>(() => {
    return data
      .slice()
      .sort((a, b) => {
        const aDate = parseISO(a.date);
        const bDate = parseISO(b.date);
        if (isValid(aDate) && isValid(bDate)) {
          return aDate.getTime() - bDate.getTime();
        }
        return a.date.localeCompare(b.date);
      })
      .map((point) => {
        const parsed = parseISO(point.date);
        const label = isValid(parsed) ? format(parsed, "dd.MM") : point.date;
        return {
          date: point.date,
          label,
          balance: toNumber(point.cumulative_balance),
          daily: toNumber(point.daily_sum),
        };
      });
  }, [data]);

  const yDomain = useMemo<[number, number | "auto"]>(() => {
    if (chartData.length === 0) {
      return [0, "auto"];
    }
    const maxValue = Math.max(...chartData.map((point) => point.balance));
    const padding = maxValue > 0 ? maxValue * 0.1 : 1;
    return [0, Math.ceil(maxValue + padding)];
  }, [chartData]);

  const statusMessage = useMemo<ReactNode>(() => {
    if (loading) return <Loader size={20} />;
    if (error) return error;
    if (chartData.length === 0) return "Нет данных за выбранный период.";
    return null;
  }, [loading, error, chartData.length]);

  const statusVariant = useMemo(() => {
    if (loading) return "loading";
    if (error) return "error";
    if (chartData.length === 0) return "empty";
    return "ready";
  }, [loading, error, chartData.length]);

  const currencyLabel = useMemo(() => {
    const code = currency?.toUpperCase?.() ?? "KGS";
    if (code === "KGS") return "сом";
    return code;
  }, [currency]);

  const yAxisLabel = useMemo<LabelProps | undefined>(
    () =>
      isMobile
        ? undefined
        : {
            value: `Баланс, ${currencyLabel}`,
            angle: -90,
            position: "left",
            offset: 0,
            fill: "var(--text-light-gray)",
            fontSize: 12,
          },
    [currencyLabel, isMobile],
  );

  const formatAxisTick = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
      return compactNumberFormatter.format(value);
    }
    if (abs >= 10_000) {
      return Math.round(value).toLocaleString("ru-RU");
    }
    return numberFormatter.format(Number(value));
  };

  return (
    <div className={s.charts}>
      <div className={s.charts__header}>
        <h2 className={s.charts__title}>Активы</h2>
        <Select
          value={period}
          options={PERIOD_OPTIONS}
          classNamePrefix="custom__select"
          placeholder="Период"
          onChange={(option: SingleValue<PeriodOption>) => {
            if (option) setPeriod(option);
          }}
          styles={{
            control: (base) => ({
              ...base,
              border: "1.5px solid var(--border-light-gray)",
              borderRadius: "6px",
              height: "52px",
              boxShadow: "none",
              "&:hover": { borderColor: "var(--border-light-gray)" },
            }),
            placeholder: (base) => ({
              ...base,
              color: "var(--text-light-gray)",
            }),
            singleValue: (base) => ({
              ...base,
              color: "var(--text-light-gray)",
            }),
          }}
        />
      </div>

      {statusMessage ? (
        <div
          className={`${s.statusMessage} ${statusVariant === "error" ? s.statusMessageError : ""} ${statusVariant === "loading" ? s.statusMessageLoading : ""}`}
        >
          {statusMessage}
        </div>
      ) : (
        <div className={s.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 16, left: isMobile ? 8 : 20, bottom: 8 }}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D4F" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FF4D4F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis
                width={isMobile ? 64 : 90}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatAxisTick(Number(value))}
                domain={yDomain}
                label={yAxisLabel}
              />
              <Tooltip content={<CustomTooltip currencyLabel={currencyLabel} />} />
              <Area type="monotone" dataKey="balance" stroke="#FF4D4F" fill="url(#balanceFill)" />
              <Line type="monotone" dataKey="balance" stroke="#FF4D4F" dot={{ r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
