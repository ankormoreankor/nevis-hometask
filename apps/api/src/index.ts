/**
 * TASK: the HTTP surface
 *
 * Goal
 *   One data route keyed by fiscal year, a health check, and the two handlers
 *   that turn a bad path or a thrown error into JSON, so the client has a real
 *   loading, empty, data and error state to render.
 *
 * Contract
 *   GET /api/health             200  {"ok":true}
 *   GET /api/dashboard/:year    200  the company object for that year, unmodified
 *                               400  {"error":"Invalid year format"}
 *                               404  {"error":"Data not found for the given year"}
 *   ?simulate=slow              the same response after about 2s
 *   ?simulate=error             500  {"error":"Simulated failure"}
 *   other paths                 404  "Not Found", as text
 *   thrown error                500  {"error":"Internal Server Error"}
 *   PORT                        process.env.PORT, default 3000
 *
 * Steps
 *   1. import express from "express"; const app = express(); then
 *      app.disable("x-powered-by") so the response headers stop advertising it.
 *   2. Register GET /api/health.
 *   3. Write the simulate middleware once: read req.query.simulate. For
 *      "error", respond 500 {"error":"Simulated failure"} and return without
 *      calling next. For "slow", call next after about 2s. Otherwise call
 *      next at once. Attach it to the dashboard route only,
 *      app.get(path, simulate, handler), so the health check stays instant; a
 *      delayed health check makes the Render probe time out. The middleware ends
 *      the response itself instead of throwing, so the generic error handler
 *      stays generic.
 *   4. Register GET /api/dashboard/:year. Read req.params.year. A year is four
 *      digits: if (!/^\d{4}$/.test(raw)) respond 400 {"error":"Invalid year
 *      format"}. A malformed year and a year with no data are different
 *      problems, so they get different statuses: a bad parameter is 400 and a
 *      missing resource is 404. Number() the value, call getData(year), and
 *      answer 404 {"error":"Data not found for the given year"} when it returns
 *      nothing. The client never sees the 400: it checks the year in the route
 *      before it fetches.
 *   5. A found year responds with the object getData returned, unmodified. It
 *      was parsed once at module scope when the process booted, so the route
 *      does not parse again: that would re-check the same numbers on every
 *      request. The client parses the response anyway, so the second check
 *      already has a home.
 *   6. After the route, a catch-all 404: app.use((req, res) => ...), no path
 *      argument. The body is plain text. This becomes the SPA fallback once the
 *      built client is served from this process, so it stays after /api: a
 *      path that is not /api has to serve index.html, or a deep link such as
 *      /dashboard/2024 answers 404 instead of the app. Anything registered
 *      after this middleware never runs, so the static file serving and the
 *      fallback belong before it.
 *   7. After the 404, the error handler: (err, req, res, _next) => .... It needs
 *      all four parameters, or Express treats it as ordinary middleware and it
 *      never runs. The unused fourth is named _next because noUnusedParameters
 *      is on. Log err, respond 500.
 *   8. Read the port, call app.listen, log the URL.
 *
 *   One route, not one per level. The tree is small and the chart can be
 *   remapped to any node the user selects, so the client needs the whole year in
 *   memory. A per-node endpoint would add a second loading state per row and a
 *   second contract, and buy nothing at this size.
 *
 *   The year is a path segment, not a query parameter. It selects a different
 *   resource and it can be absent from the URL entirely, so /api/dashboard/:year
 *   is the honest shape; /api/dashboard?year= would make an absent value a state
 *   the handler has to reject.
 *
 *   Express 5 forwards a rejected promise from an async handler to that error
 *   handler on its own. The route can await without a try/catch.
 *
 *   app.get("*", ...) throws at registration in Express 5: path-to-regexp 8
 *   rejects a bare star. app.use(fn) with no path is the catch-all.
 *
 *   express.json() is not added yet. Every route is GET and nothing reads a
 *   body. It goes in with the first POST.
 *
 * Acceptance
 *   - curl -s localhost:3000/api/health -> {"ok":true}
 *   - curl -s localhost:3000/api/dashboard/2024 | jq -r '.branches[0].name'
 *     -> Branch 1
 *   - curl -s localhost:3000/api/dashboard/2024 | jq '.branches[1] | has("employees")'
 *     -> false
 *   - curl -s localhost:3000/api/dashboard/2024 | jq '.branches[0].employees[0].channels | length'
 *     -> 3
 *   - curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/dashboard/2025 -> 404
 *   - curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/dashboard/abc -> 400
 *   - curl -s -o /dev/null -w '%{http_code}' 'localhost:3000/api/dashboard/2024?simulate=error'
 *     -> 500
 *   - npm run api:check runs all of it in one command.
 *   - npm run build at the root, then npm run start -w @nevis/api: the same
 *     responses from dist/index.js.
 *
 * Edge cases
 *   - PORT arrives as a string. Number() it, and refuse to listen on NaN rather
 *     than letting Node pick a port nobody expects.
 *   - ?simulate takes an arbitrary string. Anything other than "slow" or
 *     "error" is ignored, not rejected.
 *   - /api/dashboard without a year is not this route. It falls through to the
 *     catch-all 404, which is correct: there is no default year on the API.
 *
 * Tests
 *   none yet. Supertest arrives with the route tests.
 *
 * Delete this comment when the code is in place.
 */

import express, { type Request, type Response, type NextFunction } from "express";
import { getData } from "./data";

const app = express()
app.disable("x-powered-by")
const port = Number(process.env.PORT ?? 3000)
if (Number.isNaN(port)) {
  throw new Error("PORT is not a number")
}

app.get("/api/health", (_, res: Response) => {
  res.status(200).json({ "ok": true })
})

app.use('/api/dashboard', (req: Request, res: Response, next: NextFunction) => {
  const { simulate } = req.query;

  if (simulate === "error") {
    res.status(500).json({ error: "Simulated failure" })
    return
  }

  if (simulate === "slow") {
    setTimeout(next, 2000)
    return
  }

  next()
})

app.get("/api/dashboard/:year", (req: Request, res: Response) => {
  const { year: rawYear } = req.params;
  if (typeof rawYear !== "string" || !/^\d{4}$/.test(rawYear)) {
    res.status(400).json({ error: "Invalid year format" })
    return
  }

  const year = Number(rawYear);
  const data = getData(year)

  if (!data) {
    res.status(404).json({ error: "Data not found for the given year" })
    return
  }

  res.send(data)
})

app.use((_, res: Response) => {
  res.status(404).send("Not Found")
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: "Internal Server Error" })
})

app.listen(port, () => console.log(`api listening on ${port}`))
