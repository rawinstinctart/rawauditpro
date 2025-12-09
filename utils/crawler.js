import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function crawlSite(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const $ = cheerio.load(html);

    const title = $("title").text() || "Kein Titel";
    const description = $('meta[name="description"]').attr("content") || "Keine Meta Description";
    const h1 = $("h1").first().text() || "Kein H1";

    return {
      title,
      description,
      h1,
      status: "Scan abgeschlossen"
    };

  } catch (err) {
    console.error(err);
    return { error: "Fehler beim Crawlen" };
  }
}