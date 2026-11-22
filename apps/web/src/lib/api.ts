import { type Company, companySchema, formatIssues } from "@nevis/shared";
import useSWR from "swr";
import { ApiError } from "./http";

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  const body = await res.text();

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error("The server sent a response that is not JSON.");
  }

  const parsed = companySchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(formatIssues(parsed.error));
  }

  return parsed.data;
};

export type Simulate = "slow" | "error";

export function useDashboard(
  year: number,
  simulate?: Simulate,
): {
  company: Company | undefined;
  error: unknown;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => Promise<Company | undefined>;
} {
  let url = `/api/dashboard/${year}`;

  if (simulate) {
    url += `?simulate=${simulate}`;
  }

  const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher, {
    shouldRetryOnError: false,
  });

  return {
    company: data,
    error,
    isLoading,
    isValidating,
    mutate: () => mutate(),
  };
}
