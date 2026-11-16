/**
 * TASK: the HTTP surface
 *
 * Goal
 *   One data route, a health check, and the two handlers that turn a bad path or
 *   a thrown error into JSON, so the client has a real loading, data and error
 *   state to render.
 *
 * Contract
 *   GET /api/health      200  {"ok":true}
 *   GET /api/dashboard   200  the company object from getData(), unmodified
 *   ?simulate=slow       the same response after about 1.5s
 *   ?simulate=error      500  {"error":"Simulated failure"}
 *   other paths          404  {"error":"Not found","path":"<req.path>"}
 *   thrown error         500  {"error":"Internal server error"}
 *   PORT                 process.env.PORT, default 3000
 *
 * Steps
 *   1. import express from "express"; const app = express(); then
 *      app.disable("x-powered-by") so the response headers stop advertising it.
 *   2. Register GET /api/health.
 *   3. Write the simulate middleware once: read req.query.simulate. For
 *      "error", respond 500 {"error":"Simulated failure"} and return without
 *      calling next. For "slow", call next after about 1.5s. Otherwise call
 *      next at once. Attach it to /api/dashboard only, app.get(path, simulate,
 *      handler), so the health check stays instant; a delayed health check makes
 *      the Render probe time out. The middleware ends the response itself
 *      instead of throwing, so the generic error handler stays generic.
 *   4. Register GET /api/dashboard. The body is
 *      companySchema.parse(getData()). Parsing the response is the point: a
 *      payload that drifted from the contract fails here instead of in the
 *      browser.
 *   5. After the route, a catch-all 404: app.use((req, res) => ...), no path
 *      argument. This becomes the SPA fallback once the built client is served
 *      from this process, so it stays after /api.
 *   6. After the 404, the error handler: (err, req, res, _next) => .... It needs
 *      all four parameters, or Express treats it as ordinary middleware and it
 *      never runs. The unused fourth is named _next because noUnusedParameters
 *      is on. Log err, respond 500.
 *   7. Read the port, call app.listen, log the URL.
 *
 *   One route, not one per level. The tree is small and the chart can be
 *   remapped to any node the user selects, so the client needs the whole tree in
 *   memory. A per-node endpoint would add a second loading state per row and a
 *   second contract, and buy nothing at this size.
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
 *   - curl -s localhost:3000/api/dashboard | jq -r '.branches[0].name' -> Branch 1
 *   - curl -s localhost:3000/api/dashboard | jq '.branches[1] | has("employees")' -> false
 *   - curl -s localhost:3000/api/dashboard | jq '.branches[0].employees[0].channels | length' -> 3
 *   - curl -s -o /dev/null -w '%{http_code}' 'localhost:3000/api/dashboard?simulate=error' -> 500
 *   - curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/nodes/anything -> 404
 *   - npm run build at the root, then npm run start -w @nevis/api: the same
 *     responses from dist/index.js.
 *
 * Edge cases
 *   - PORT arrives as a string. Number() it, and refuse to listen on NaN rather
 *     than letting Node pick a port nobody expects.
 *   - ?simulate takes an arbitrary string. Anything other than "slow" or
 *     "error" is ignored, not rejected.
 *
 * Tests
 *   none yet. Supertest arrives with the route tests.
 *
 * Delete this comment when the code is in place.
 */
export {};
