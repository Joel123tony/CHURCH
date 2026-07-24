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
    if (!req.path.includes('/search') && !req.path.includes('/details') && !req.path.includes('/latest') && req.path !== '/') {
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
            
            const perfObj = {
                mongoLookup: Math.round(store.mongoLookup || 0),
                cacheLookup: Math.round(store.cacheLookup || 0),
                ...Object.keys(store.providers || {}).reduce((acc, k) => {
                    let kCamel = k.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
                    kCamel = kCamel.charAt(0).toLowerCase() + kCamel.slice(1);
                    acc[kCamel] = Math.round(store.providers[k]);
                    return acc;
                }, {}),
                htmlDownload: Math.round(store.htmlDownload || 0),
                parsing: Math.round(store.parsing || 0),
                cleaning: Math.round(store.cleaning || 0),
                validation: Math.round(store.validation || 0),
                merge: Math.round(store.merge || 0),
                save: Math.round(store.save || 0),
                response: Math.round(store.response || 0),
                total: Math.round(store.total || 0)
            };
            
            const query = req.query.search || req.query.q || req.query.title || req.query.slug || (req.path === '/' ? '' : req.path);
            
            console.log("\n========== PERFORMANCE ==========");
            console.log(`Query: ${query}`);
            console.log("");
            
            const logStage = (name, ms) => {
                if (ms > 0 || name === 'Total' || name === 'Mongo' || name === 'Cache') {
                    const paddedName = name.padEnd(24, '.');
                    console.log(`${paddedName}${ms} ms`);
                }
            };

            logStage("Mongo", perfObj.mongoLookup);
            logStage("Cache", perfObj.cacheLookup);
            
            for (const [providerName, ms] of Object.entries(store.providers || {})) {
                logStage(providerName, Math.round(ms));
            }
            
            logStage("HTML Download", perfObj.htmlDownload);
            logStage("Parsing", perfObj.parsing);
            logStage("Cleaning", perfObj.cleaning);
            logStage("Validation", perfObj.validation);
            logStage("Merge", perfObj.merge);
            logStage("Save", perfObj.save);
            logStage("Response", perfObj.response);
            
            console.log("");
            logStage("TOTAL", perfObj.total);
            console.log("================================\n");

            if (process.env.ENABLE_PERF_LOGS === 'true' && typeof body === 'object' && body !== null) {
                // Ensure performance block respects original format requested
                body.performance = {
                    mongoLookup: perfObj.mongoLookup,
                    cacheLookup: perfObj.cacheLookup,
                    ...Object.keys(store.providers || {}).reduce((acc, k) => {
                        let kCamel = k.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
                        kCamel = kCamel.charAt(0).toLowerCase() + kCamel.slice(1);
                        acc[kCamel] = Math.round(store.providers[k]);
                        return acc;
                    }, {}),
                    htmlDownload: perfObj.htmlDownload,
                    parsing: perfObj.parsing,
                    cleaning: perfObj.cleaning,
                    validation: perfObj.validation,
                    merge: perfObj.merge,
                    save: perfObj.save,
                    response: perfObj.response,
                    total: perfObj.total
                };
            }
            
            return originalJson.call(this, body);
        };
        next();
    });
};
