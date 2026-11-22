import { type Company, companySchema } from "@nevis/shared";
import { payload2024 } from "@nevis/shared/payload";

const dataToYearMap = new Map<number, unknown>();
dataToYearMap.set(2024, payload2024);

const parsedDataMap = new Map<number, Company>(
  [...dataToYearMap].map(([year, rawData]) => [year, companySchema.parse(rawData)]),
);

export const getData = (year: number): Company | undefined => parsedDataMap.get(year);
