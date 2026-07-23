import { BaseWorker } from "./BaseWorker.js";
import ProviderHealth from "../models/ProviderHealth.js";
import { providers } from "../services/songSources/adapterManager.js";

export class ProviderHealthProbeWorker extends BaseWorker {
    constructor() {
        super("provider_health_probe", 1800000); // Run every 30 minutes
    }

    async doWork() {
        // Find providers with health < 40
        const unhealthy = await ProviderHealth.find({ healthScore: { $lt: 40 } });
        
        for (const record of unhealthy) {
            console.log(`[HealthProbe] Probing unhealthy provider: ${record.provider} (Score: ${record.healthScore})`);
            
            const providerDef = providers.find(p => p.name === record.provider);
            if (!providerDef) continue;
            
            try {
                // Perform a simple search for "Jesus" to test if the provider is up
                const results = await providerDef.provider.search("Jesus");
                if (results && results.length > 0) {
                    console.log(`[HealthProbe] Provider ${record.provider} recovered!`);
                    
                    // Artificially inject successful samples to bump the health score above 40
                    record.successCount += 10;
                    record.totalSamples += 10;
                    record.healthScore = Math.max(45, record.healthScore + 20);
                    record.reliabilityBand = "Watch";
                    await record.save();
                } else {
                    console.log(`[HealthProbe] Provider ${record.provider} returned 0 results.`);
                }
            } catch (err) {
                console.log(`[HealthProbe] Provider ${record.provider} still failing: ${err.message}`);
                // Add a failure sample
                record.failureCount += 1;
                record.totalSamples += 1;
                await record.save();
            }
        }
    }
}
