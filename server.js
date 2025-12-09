// ---------------------------------------------
// SERVER.JS – Saubere Version für SiteScout AI
// ---------------------------------------------

import express from "express";
import cors from "cors";
import Stripe from "stripe";

// Eigene Funktionen importieren
import { crawlSite } from "./src/utils/crawler.js";

const app = express();


// ----------------------------------------------------
// 1) STRIPE WEBHOOK (MUSS KORREKT VOR express.json()!)
// ----------------------------------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook verification failed:", err.message);
      return res.sendStatus(400);
    }

    console.log("➡️ Stripe Event empfangen:", event.type);

    // 👉 Checkout abgeschlossen
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("✅ Checkout abgeschlossen:", session.id);

      const userId = session.metadata?.userId;
      if (userId) {
        console.log("🎉 PRO aktiviert für User:", userId);
      }
    }

    // 👉 Kündigung oder Zahlungsproblem
    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "invoice.payment_failed"
    ) {
      const sub = event.data.object;
      console.log("⚠️ Abo beendet / fehlgeschlagen:", sub.id);
    }

    return res.sendStatus(200);
  }
);


// ----------------------------------------------------
// 2) JSON-PARSER & CORS (MUSS NACH DEM WEBHOOK STEHEN!)
// ----------------------------------------------------
app.use(express.json());
app.use(cors());


// ----------------------------------------------------
// 3) API – Website-Scan Route
// ----------------------------------------------------
app.post("/api/analyze", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Keine URL angegeben" });
    }

    const result = await crawlSite(url);
    return res.json({ success: true, data: result });

  } catch (err) {
    console.error("Fehler beim Analysieren:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});


// ----------------------------------------------------
// 4) SERVER STARTEN
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 SiteScout AI läuft auf Port ${PORT}`);
});