import axios from "axios";
import ProviderRegistry from "../models/ProviderRegistry.js";
import { sanitizeScrapedHtml } from "./adaptiveExtractor.js";

const COMMON_ENDPOINTS = [
  "/sitemap.xml",
  "/feed",
  "/rss",
  "/wp-json/wp/v2/posts?per_page=1",
  "/wp-json",
  "/search/?s=test",
  "/?s=test"
];

const normalizeBaseUrl = (url = "") => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
};

const probeEndpoint = async (baseUrl, path) => {
  try {
    const response = await axios.get(`${baseUrl}${path}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 12000
    });
    const contentType = response.headers["content-type"] || "";
    const body = typeof response.data === "string" ? response.data : JSON.stringify(response.data || {});
    const html = /html|xml|json/i.test(contentType) ? body : "";
    const sanitized = html ? sanitizeScrapedHtml(html) : "";
    const text = sanitized || body;
    const lyricsSignals = /lyrics|verse|chorus|song/i.test(text);
    const jsonLdSignals = /"@type"\s*:\s*"Song"|MusicComposition/i.test(text);
    return {
      ok: true,
      status: response.status,
      contentType,
      lyricsSignals,
      jsonLdSignals,
      sampleLength: text.length
    };
  } catch (err) {
    return {
      ok: false,
      status: err?.response?.status || 0,
      error: err.message
    };
  }
};

export const classifyProviderCandidate = (candidate = {}) => {
  const baseUrl = normalizeBaseUrl(candidate.baseUrl || candidate.url || candidate.domain || "");
  const domain = (() => {
    try {
      return baseUrl ? new URL(baseUrl).hostname.replace(/^www\./, "").toLowerCase() : "";
    } catch {
      return "";
    }
  })();

  const signals = candidate.discoverySignals || [];
  const type = /wp-json|wordpress|wp-content/.test(signals.join(" ")) ? "wordpress" : /rss|feed/.test(signals.join(" ")) ? "rss" : /sitemap/.test(signals.join(" ")) ? "sitemap" : "html";

  return {
    name: candidate.name || domain || "Unknown Provider",
    domain,
    baseUrl,
    type,
    status: "disabled",
    discoverySignals: signals,
    parserHints: candidate.parserHints || {},
    benchmark: candidate.benchmark || {},
    healthScore: candidate.healthScore || 0,
    reliabilityBand: candidate.reliabilityBand || "Unknown",
    selectorVersion: candidate.selectorVersion || "v1",
    successRate: candidate.successRate || 0,
    fallbackCount: candidate.fallbackCount || 0,
    extractionConfidence: candidate.extractionConfidence || 0
  };
};

export const discoverProviderCandidates = async (seedUrls = []) => {
  const candidates = [];
  for (const seedUrl of seedUrls) {
    const baseUrl = normalizeBaseUrl(seedUrl);
    if (!baseUrl) continue;

    const discovered = new Set();
    const probeSignals = [];

    for (const endpoint of COMMON_ENDPOINTS) {
      const result = await probeEndpoint(baseUrl, endpoint);
      if (result.ok) {
        probeSignals.push(endpoint);
        if (result.lyricsSignals) discovered.add("lyrics-signals");
        if (result.jsonLdSignals) discovered.add("json-ld");
      }
    }

    if (probeSignals.length > 0) {
      candidates.push(classifyProviderCandidate({
        name: new URL(baseUrl).hostname.replace(/^www\./, ""),
        baseUrl,
        discoverySignals: probeSignals,
        parserHints: {
          discoveredSignals: Array.from(discovered)
        },
        benchmark: {
          endpointsTried: COMMON_ENDPOINTS.length,
          endpointsResponded: probeSignals.length
        },
        extractionConfidence: Math.min(100, probeSignals.length * 18 + discovered.size * 15)
      }));
    }
  }

  return candidates;
};

export const upsertDiscoveredProvider = async (candidate = {}) => {
  const baseUrl = normalizeBaseUrl(candidate.baseUrl || "");
  if (!baseUrl) return null;
  const parsed = classifyProviderCandidate({ ...candidate, baseUrl });
  const updated = await ProviderRegistry.findOneAndUpdate(
    { baseUrl },
    {
      $set: {
        name: parsed.name,
        domain: parsed.domain,
        type: parsed.type,
        discoverySignals: parsed.discoverySignals,
        parserHints: parsed.parserHints,
        benchmark: parsed.benchmark,
        healthScore: parsed.healthScore,
        reliabilityBand: parsed.reliabilityBand,
        selectorVersion: parsed.selectorVersion,
        successRate: parsed.successRate,
        fallbackCount: parsed.fallbackCount,
        extractionConfidence: parsed.extractionConfidence,
        lastSeenAt: new Date()
      },
      $setOnInsert: {
        status: "disabled",
        discoveredAt: new Date()
      }
    },
    { upsert: true, returnDocument: "after" }
  );

  return updated?.toObject ? updated.toObject() : updated;
};

export const benchmarkProviderCandidate = async (candidate = {}) => {
  const baseUrl = normalizeBaseUrl(candidate.baseUrl || "");
  if (!baseUrl) return null;

  const probeResults = [];
  for (const endpoint of COMMON_ENDPOINTS) {
    probeResults.push(await probeEndpoint(baseUrl, endpoint));
  }

  const successCount = probeResults.filter((result) => result.ok).length;
  const lyricsCount = probeResults.filter((result) => result.lyricsSignals).length;
  const confidence = Math.round(((successCount * 20) + (lyricsCount * 12)) / COMMON_ENDPOINTS.length);

  return {
    ...candidate,
    baseUrl,
    benchmark: {
      probeResults,
      successCount,
      lyricsCount
    },
    extractionConfidence: Math.min(100, confidence)
  };
};
