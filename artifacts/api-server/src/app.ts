import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadPage(name: string): string {
  const candidates = [
    path.join(__dirname, "pages", name),
    path.join(__dirname, "..", "src", "pages", name),
    path.join(process.cwd(), "src", "pages", name),
    path.join(process.cwd(), "artifacts", "api-server", "src", "pages", name),
  ];
  for (const p of candidates) {
    try {
      return fs.readFileSync(p, "utf-8");
    } catch {}
  }
  return `<html><body><p>Page not found</p></body></html>`;
}

const privacyHtml = loadPage("privacy.html");
const termsHtml = loadPage("terms.html");

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/privacy", (_req, res) => {
  res.type("html").send(privacyHtml);
});
app.get("/api/terms", (_req, res) => {
  res.type("html").send(termsHtml);
});

app.use(authMiddleware);

app.use("/api", router);

export default app;
