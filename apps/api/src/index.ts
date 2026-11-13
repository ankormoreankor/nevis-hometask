/**
 * TASK: the HTTP surface
 *
 * Goal
 *   Two read routes and the two handlers that turn a bad path or a thrown error
 *   into JSON, so the client has a real loading, data and error state to render.
 *
 * Contract
 *   GET /api/health   200  {"ok":true}
 *   GET /api/data     200  the document from getData(), unmodified
 *   other paths       404  {"error":"Not found","path":"<req.path>"}
 *   thrown error      500  {"error":"Internal server error"}
 *   PORT              process.env.PORT, default 3000, the port Vite proxies to
 *
 * Steps
 *   1. import express from "express"; const app = express(); then
 *      app.disable("x-powered-by") so the response headers stop advertising it.
 *   2. Register GET /api/health.
 *   3. Register GET /api/data. The body is res.json(getData()). Import it as
 *      "./data", no extension: esbuild bundles the module and Node never
 *      resolves it at runtime.
 *   4. After both routes, a catch-all 404: app.use((req, res) => ...), no path
 *      argument. This becomes the SPA fallback once the built client is served
 *      from this process, so it stays after /api.
 *   5. After the 404, the error handler: (err, req, res, _next) => .... It needs
 *      all four parameters, or Express treats it as ordinary middleware and it
 *      never runs. The unused fourth is named _next because noUnusedParameters
 *      is on. Log err, respond 500.
 *   6. Read the port, call app.listen, log the URL.
 *
 *   Express 5 forwards a rejected promise from an async handler to that error
 *   handler on its own. Later routes can await without a try/catch.
 *
 *   app.get("*", ...) throws at registration in Express 5: path-to-regexp 8
 *   rejects a bare star. app.use(fn) with no path is the catch-all.
 *
 *   express.json() is not added yet. Both routes are GET and nothing reads a
 *   body. It goes in with the first POST.
 *
 * Acceptance
 *   - curl -s localhost:3000/api/health -> {"ok":true}
 *   - curl -s localhost:3000/api/data | jq -r '.branches[0].name' -> Branch 1
 *   - curl -s localhost:3000/api/data | jq '.branches[1] | has("employees")' -> false
 *   - curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/nope -> 404
 *   - npm run build at the root, then npm run start -w @nevis/api: the same
 *     responses from dist/index.js.
 *
 * Edge cases
 *   - PORT arrives as a string. Number() it, and refuse to listen on NaN rather
 *     than letting Node pick a port nobody expects.
 *   - No query parameters in this task. ?simulate=slow|error comes next.
 *
 * Tests
 *   none. Supertest arrives with the query parameters.
 *
 * Delete this comment when the code is in place.
 */
export {};
