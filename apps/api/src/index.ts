import express, { type Request, type Response, type NextFunction } from "express";
import { getData } from "./data";

const app = express()
app.disable("x-powered-by")
const port = Number(process.env.PORT ?? 3000)
if (Number.isNaN(port)) {
  throw new Error("PORT is not a number")
}

const simulate = (req: Request, res: Response, next: NextFunction) => {
  const { simulate: mode } = req.query;

  if (mode === "error") {
    res.status(500).json({ error: "Simulated failure" })
    return
  }

  if (mode === "slow") {
    setTimeout(next, 2000)
    return
  }

  next()
}

app.get("/api/health", (_, res: Response) => {
  res.status(200).json({ "ok": true })
})

app.get("/api/dashboard/:year", simulate, (req: Request, res: Response) => {
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
