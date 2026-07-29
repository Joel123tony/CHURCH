import { AsyncLocalStorage } from 'async_hooks';

export const perfStorage = new AsyncLocalStorage();

export const withPerfTimer = async (stage, fn, isProvider = false) => {
    const store = perfStorage.getStore();
    if (!store) return fn();
    
    const start = process.hrtime.bigint();
    try {
        return await fn();
    } finally {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1000000;
        
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
    // Only trace API routes to avoid cluttering static file requests, if any
    if (!req.path.startsWith('/')) {
        return next();
    }
    
    const store = {
        start: process.hrtime.bigint(),
        mongoLookup: 0,
        cacheLookup: 0,
        providers: {},
        parsing: 0,
        cleaning: 0,
        validation: 0,
        merge: 0,
        save: 0,
        htmlDownload: 0,
        response: 0
    };
    
    perfStorage.run(store, () => {
        const originalJson = res.json;
        
        res.json = function (body) {
            const serializeStart = process.hrtime.bigint();
            
            const end = process.hrtime.bigint();
            store.total = Number(end - store.start) / 1000000;
            store.response = Number(end - serializeStart) / 1000000;
            
            const dbMs = Math.round((store.mongoLookup || 0) + (store.cacheLookup || 0));
            const responseMs = Math.round(store.response || 0);
            const totalMs = Math.round(store.total || 0);
            // Rough estimation for processing time
            const processingMs = Math.max(0, totalMs - dbMs - responseMs);
            
            console.log(`\nRequest Started`);
            console.log(`[${req.method} ${req.originalUrl || req.url}]`);
            console.log(`Database Query: ${dbMs} ms`);
            console.log(`Processing: ${processingMs} ms`);
            console.log(`Serialization: ${responseMs} ms`);
            console.log(`Response Sent: ${responseMs} ms`);
            console.log(`Total: ${totalMs} ms\n`);

            const shouldExposePerf = process.env.ENABLE_PERF_LOGS === 'true' || process.env.NODE_ENV === 'development';
            if (shouldExposePerf && typeof body === 'object' && body !== null) {
                // Ensure performance block respects original format requested
                body.performance = {
                    mongoLookup: store.mongoLookup,
                    cacheLookup: store.cacheLookup,
                    htmlDownload: store.htmlDownload,
                    parsing: store.parsing,
                    cleaning: store.cleaning,
                    validation: store.validation,
                    merge: store.merge,
                    save: store.save,
                    response: store.response,
                    total: store.total
                };
            }
            
            return originalJson.call(this, body);
        };
        next();
    });
};

