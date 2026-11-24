import { type Company, companySchema, formatIssues, isFiscalYear } from "@nevis/shared";
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

export function useDashboard(year: string): {
  company: Company | undefined;
  error: unknown;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => Promise<Company | undefined>;
} {
  // A year the route already rejected never reaches the server: the page
  // renders the not-found route for it, and the request would only earn a 400.
  const key = isFiscalYear(year) ? `/api/dashboard/${year}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher, {
    shouldRetryOnError: isTransient,
    errorRetryCount: 2,
  });

  return {
    company: data,
    error,
    isLoading,
    isValidating,
    mutate: () => mutate(),
  };
}
