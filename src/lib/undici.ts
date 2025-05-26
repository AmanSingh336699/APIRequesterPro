import { Pool } from "undici";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { CookieJar } from "tough-cookie";

const rateLimiter = new RateLimiterMemory({
    points: 100, 
    duration: 10,
});

const cookieJar = new CookieJar();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status: number): boolean => {
    return status >= 500 || status === 429;
};

interface MakeRequestOptions {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    retryCount?: number;
    retryDelay?: number;
    withCredentials?: boolean;
}

const pools: Map<string, Pool> = new Map();
function getPool(origin: string): Pool {
    if (!pools.has(origin)) {
        pools.set(
            origin,
            new Pool(origin, {
                connections: 100, 
                keepAliveTimeout: 60_000,
                pipelining: 10,
            })
        );
    }
    return pools.get(origin)!;
}

export const makeRequest = async ({
    method,
    url,
    headers = {},
    body,
    retryCount = 3,
    retryDelay = 1000,
    withCredentials = false,
}: MakeRequestOptions): Promise<{ status: number; data: any }> => {
    let attempt = 0;

    const ip = typeof window !== "undefined" ? window.location.hostname : "server";
    await rateLimiter.consume(ip).catch(() => {
        throw new Error("Rate limit exceeded");
    });

    const parsedUrl = new URL(url.startsWith("http") ? url : `${url}`);
    const pool = getPool(parsedUrl.origin);

    while (attempt <= retryCount) {
        try {
            if (withCredentials) {
                const cookieString = await cookieJar.getCookieString(parsedUrl.href);
                if (cookieString) {
                    headers["Cookie"] = cookieString;
                }
            }

            const res = await pool.request({
                method,
                path: parsedUrl.pathname + parsedUrl.search,
                headers: {
                    "Content-Type": "application/json",
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
                maxRedirections: 0,
                signal: AbortSignal.timeout(10000),
            });

            if (withCredentials) {
                const setCookieHeaders = res.headers["set-cookie"];
                if (setCookieHeaders) {
                    for (const cookie of setCookieHeaders) {
                        await cookieJar.setCookie(cookie, parsedUrl.href);
                    }
                }
            }

            const contentType = res.headers["content-type"];
            const responseBody = contentType?.includes("application/json")
                ? await res.body.json()
                : await res.body.text();

            return {
                status: res.statusCode,
                data: responseBody,
            };
        } catch (err: any) {
            if (
                attempt === retryCount ||
                (err.statusCode && !isRetryableStatus(err.statusCode)) ||
                err.name === "AbortError"
            ) {
                const msg = err?.body?.message || err?.message || "Request failed (Undici)";
                throw new Error(msg);
            }

            const delay = retryDelay * Math.pow(2, attempt) + Math.random() * 300;
            console.warn(`Retry attempt ${attempt + 1}/${retryCount} in ${Math.round(delay)}ms`);
            await sleep(delay);
            attempt++;
        }
    }

    throw new Error("All retry attempts failed");
};

process.on("SIGTERM", () => {
    pools.forEach((pool) => pool.close());
});
