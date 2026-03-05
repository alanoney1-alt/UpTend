import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve uploaded job photos
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // For business landing page, inject different OG meta tags
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const isBusiness = req.originalUrl === "/" && (req.hostname === "uptendapp.business" || req.hostname === "www.uptendapp.business");
    const isBusinessPath = req.originalUrl.startsWith("/business");

    if (isBusiness || isBusinessPath) {
      let html = fs.readFileSync(indexPath, "utf-8");
      html = html.replace(
        /<meta property="og:title" content="[^"]*">/,
        '<meta property="og:title" content="UpTend | Business Intelligence">'
      );
      html = html.replace(
        /<meta property="og:description" content="[^"]*">/,
        '<meta property="og:description" content="One platform. Problems solved. Whether you need more customers, fewer headaches, or both — we build the system around your business and have you live in 10 days.">'
      );
      html = html.replace(
        /<meta name="twitter:title" content="[^"]*">/,
        '<meta name="twitter:title" content="UpTend | Business Intelligence">'
      );
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*">/,
        '<meta name="twitter:description" content="One platform. Problems solved. We build the system around your business and have you live in 10 days.">'
      );
      html = html.replace(
        /<title>[^<]*<\/title>/,
        '<title>UpTend | Business Intelligence — One Platform. Problems Solved.</title>'
      );
      html = html.replace(
        /<meta name="description" content="[^"]*">/,
        '<meta name="description" content="UpTend Business Intelligence. One platform. Problems solved. HVAC, HOA, and property management solutions.">'
      );
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }

    res.sendFile(indexPath);
  });
}
