import axios from 'axios';
import * as cheerio from 'cheerio';
import { resilientFetch } from './resilientFetch.js';

export const searchSiteWithDuckDuckGo = async (domain, query) => {
    try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=site:${domain}+${encodeURIComponent(query)}`;
        const res = await axios.get(ddgUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Referer": "https://duckduckgo.com/"
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(res.data);
        let bestUrl = null;
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !bestUrl) {
                if (href.includes('uddg=')) {
                    const uddgMatch = href.match(/uddg=([^&]+)/);
                    if (uddgMatch && uddgMatch[1]) {
                        const decoded = decodeURIComponent(uddgMatch[1]);
                        console.log("Decoded uddg:", decoded);
                        if (decoded.includes(domain) && !decoded.includes('/tag/') && !decoded.includes('index_new')) {
                            bestUrl = decoded;
                        }
                    }
                } else if (href.startsWith('http') && href.includes(domain)) {
                    if (!href.includes('/tag/') && !href.includes('index_new')) {
                        bestUrl = href;
                    }
                }
            }
        });
        
        return bestUrl;
    } catch (error) {
        console.error(`[SearchFallback] Error searching ${domain} for "${query}":`, error.message);
        return null;
    }
};
