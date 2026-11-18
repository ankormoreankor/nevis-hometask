import { companySchema, type Company } from "@nevis/shared";

/**
 * TASK: the payload, keyed by fiscal year, behind getData(year)
 *
 * Goal
 *   One module owns the data. The route asks for a year and gets that year's
 *   tree or nothing. Moving to a database, or to a file read at boot, touches
 *   this file and nothing else.
 *
 * Contract
 *   export const payload2024   the JSON from docs/brief.md, copied unchanged
 *   export function getData(year: number): Company | null
 *
 * Steps
 *   1. The payload is already pasted below. Keep it exactly as it stands in the
 *      brief: same keys, same order, same numbers.
 *   2. Below it, a year map with one entry:
 *        const dataByYear = new Map<number, unknown>([[2024, payload2024]]);
 *      A Map, not an object literal. byYear[year] with a crafted string reaches
 *      the prototype ("constructor", "__proto__"); a Map has no prototype chain.
 *      The one entry is the honest state of a mock: the README says so, and the
 *      map is the seam a real data source replaces.
 *   3. Parse every entry once, at module scope:
 *        const parsedByYear = new Map<number, Company>(
 *          [...dataByYear].map(([year, raw]) => [year, companySchema.parse(raw)])
 *        );
 *      Import from "@nevis/shared" with `import { companySchema, type Company }`.
 *      The inline `type` matters, because verbatimModuleSyntax is on.
 *   4. getData(year) returns parsedByYear.get(year) ?? null. No arguments beyond
 *      the year, not async.
 *
 *   Parsing at module scope runs once, when the process boots, before listen().
 *   A payload that drifted from the schema then crashes the boot with a ZodError
 *   naming the path, instead of turning every request into a 500. Parsing per
 *   request re-checks the same numbers on every call.
 *
 * Acceptance
 *   - Importing the module throws if the payload stops matching the schema.
 *   - getData(2024).branches has 3 entries, Branch 1 has 5 employees, the first
 *     employee has 3 channels, every values array has 12 entries.
 *   - getData(2025) is null, getData(0) is null.
 *
 * Edge cases
 *   - Branch 2 and Branch 3 have no employees key, and four of the five
 *     advisors have no channels key. Leave them absent. The UI reads the
 *     absence as a leaf.
 *   - The data is copied, not corrected. The three arithmetic mismatches
 *     recorded in README.md stay in the response, on purpose: the query and
 *     filters behind the source figures are unknown, so any correction would be
 *     an invented number.
 *   - A year with no entry is null, not a throw. The route turns that into a 404.
 *
 * Tests
 *   none. Importing the module exercises the parse, and the route serves the
 *   parsed tree.
 *
 * Delete this comment when the code is in place.
 */
export const payload2024 = {
  id: "d6e00056-dce4-4ef4-b034-d6467db6187d",
  name: "Company",
  values: [250, 267, 284, 301, 317, 334, 350, 250, 250, 250, 250, 350],
  branches: [
    {
      id: "d6b668e1-89a4-4467-bdf6-c9ebaf2cea5f",
      name: "Branch 1",
      values: [147, 157, 166, 156, 188, 201, 214, 147, 147, 147, 147, 214],
      employees: [
        {
          id: "e3c4637b-2f21-4b7e-883e-b13ae1a6df6a",
          name: "Anna Blackwood",
          values: [25, 26, 28, 31, 32, 34, 38, 27, 27, 27, 27, 38],
          channels: [
            {
              id: "716e7c30-b7c3-45c5-aa64-cbcf483917e0",
              name: "Existing clients",
              values: [25, 25, 26, 28, 31, 32, 34, 25, 25, 25, 25, 34],
            },
            {
              id: "bc5cd63a-668b-4c37-854d-69c1bd5fcbcd",
              name: "New organic",
              values: [0, 1, 1, 1, 0, 2, 2, 1, 1, 1, 1, 2],
            },
            {
              id: "abbf873a-a0eb-46b8-b4cf-dc58e5f7a2d7",
              name: "New paid",
              values: [0, 0, 1, 1, 2, 1, 0, 2, 1, 1, 1, 2],
            },
          ],
        },
        {
          id: "afe9ebc0-6c35-4690-80b0-20e9bc0d8c7d",
          name: "James Walker",
          values: [12, 13, 14, 14, 15, 15, 16, 12, 12, 12, 12, 17],
        },
        {
          id: "bb012770-02d3-4999-aa08-c11a9065235d",
          name: "Maria Gutierrez",
          values: [36, 39, 41, 22, 46, 48, 51, 35, 35, 35, 35, 52],
        },
        {
          id: "61cd9425-2d8e-456f-b228-f7e7c6a76e5d",
          name: "Robert Chen",
          values: [42, 43, 46, 47, 51, 55, 58, 41, 41, 41, 41, 54],
        },
        {
          id: "3e4efd29-e7e4-4695-a1dc-6f3b0853c19d",
          name: "Sarah Smith",
          values: [32, 36, 37, 42, 44, 49, 53, 32, 32, 32, 32, 53],
        },
      ],
    },
    {
      id: "71da0b06-5785-4a60-9273-4df2be619ee4",
      name: "Branch 2",
      values: [76, 80, 84, 87, 90, 92, 94, 75, 75, 75, 75, 91],
    },
    {
      id: "63b01d42-922f-43ff-b0f8-2f3484e74c43",
      name: "Branch 3",
      values: [27, 30, 34, 36, 39, 41, 42, 28, 28, 28, 28, 45],
    },
  ],
};

const dataToYearMap = new Map<number, unknown>()
dataToYearMap.set(2024, payload2024)

const parsedDataMap = new Map<number, Company>([...dataToYearMap].map(([year, rawData]) => [year, companySchema.parse(rawData)]))

export const getData = (year: number): Company | undefined => parsedDataMap.get(year)
