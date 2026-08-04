import { AsyncLocalStorage } from "async_hooks";

export const perfStorage = new AsyncLocalStorage();

export const withPerfTimer = async (stage, fn, isProvider = false) => {
  const store = perfStorage.getStore();
  if (!store) return fn();

  const start = process.hrtime.bigint();
  try {
    return await fn();
  } finally {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    if (isProvider) {
      store.providers = store.providers || {};
      store.providers[stage] = (store.providers[stage] || 0) + durationMs;
    } else {
      store[stage] = (store[stage] || 0) + durationMs;
    }
  }
};

export const recordPerf = (stage, durationMs, isProvider = false) => {
  const store = perfStorage.getStore();
  if (!store) return;

  if (isProvider) {
    store.providers = store.providers || {};
    store.providers[stage] = (store.providers[stage] || 0) + durationMs;
  } else {
    store[stage] = (store[stage] || 0) + durationMs;
  }
};

export const perfMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const reqPath = req.originalUrl || req.url;

  const store = {
    url: reqPath,
    startTime,
    routeStartTime: null,
    middlewareMs: 0,
    cacheMs: 0,
    mongoMs: 0,
    youtubeMs: 0,
    serializeMs: 0,
    responseMs: 0,
    totalMs: 0,
  };

  const labelPrefix = `[${req.method} ${reqPath}]`;
  console.time(`${labelPrefix} total`);
  console.time(`${labelPrefix} middleware`);

  perfStorage.run(store, () => {
    const originalJson = res.json;

    // Hook route handler start
    res.on("route", () => {
      if (!store.routeStartTime) {
        store.routeStartTime = process.hrtime.bigint();
        store.middlewareMs = Number(store.routeStartTime - store.startTime) / 1e6;
      }
    });

    res.json = function (body) {
      if (!store.routeStartTime) {
        store.routeStartTime = process.hrtime.bigint();
        store.middlewareMs = Number(store.routeStartTime - store.startTime) / 1e6;
      }
      try {
        console.timeEnd(`${labelPrefix} middleware`);
      } catch {}

      try {
        console.time(`${labelPrefix} serialize`);
      } catch {}
      const serializeStart = process.hrtime.bigint();
      const serialized = JSON.stringify(body);
      const serializeEnd = process.hrtime.bigint();
      store.serializeMs = Number(serializeEnd - serializeStart) / 1e6;
      try {
        console.timeEnd(`${labelPrefix} serialize`);
      } catch {}

      try {
        console.time(`${labelPrefix} response`);
      } catch {}
      const resSendStart = process.hrtime.bigint();

      res.on("finish", () => {
        const totalEnd = process.hrtime.bigint();
        store.responseMs = Number(totalEnd - resSendStart) / 1e6;
        store.totalMs = Number(totalEnd - store.startTime) / 1e6;

        try {
          console.timeEnd(`${labelPrefix} response`);
          console.timeEnd(`${labelPrefix} total`);
        } catch {}

        console.log(`\n==================================================`);
        console.log(`📊 PERF LOG: ${labelPrefix}`);
        console.log(`  total:      ${store.totalMs.toFixed(2)} ms`);
        console.log(`  middleware: ${store.middlewareMs.toFixed(2)} ms`);
        console.log(`  cache:      ${store.cacheMs.toFixed(2)} ms`);
        console.log(`  mongodb:    ${store.mongoMs.toFixed(2)} ms`);
        console.log(`  youtube:    ${store.youtubeMs.toFixed(2)} ms`);
        console.log(`  serialize:  ${store.serializeMs.toFixed(2)} ms`);
        console.log(`  response:   ${store.responseMs.toFixed(2)} ms`);
        console.log(`==================================================\n`);
      });

      res.setHeader("Content-Type", "application/json");
      return res.send(serialized);
    };

    next();
  });
};
