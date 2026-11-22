import { type Company, companySchema, formatIssues } from "@nevis/shared";
import useSWR from "swr";
import { ApiError, isTransient, ResponseError } from "./http";

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
    throw new ResponseError("The server sent a response that is not JSON.");
  }

  const parsed = companySchema.safeParse(payload);

  if (!parsed.success) {
    throw new ResponseError(formatIssues(parsed.error));
  }

  return parsed.data;
};

export function useDashboard(year: number): {
  company: Company | undefined;
  error: unknown;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => Promise<Company | undefined>;
} {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/dashboard/${year}`,
    fetcher,
    {
      shouldRetryOnError: isTransient,
      errorRetryCount: 2,
    },
  );

  return {
    company: data,
    error,
    isLoading,
    isValidating,
    mutate: () => mutate(),
  };
}
