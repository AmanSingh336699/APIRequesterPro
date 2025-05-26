// import { NextRequest, NextResponse } from "next/server";
// import LoadTestResult from "@/models/LoadTestResult";
// import { parseRequest } from "@/utils/requestUtils";
// import { securityMiddleware } from "@/lib/securityMiddleware";
// import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
// import { dbMiddleware } from "@/lib/dbMiddleware";
// import Collection from "@/models/Collection";
// import Environment from "@/models/Environment";
// import { makeRequest } from "@/lib/axios";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import Request from "@/models/Request";

// interface PerRequestMetric {
//     requestIndex: number;
//     method: string;
//     url: string;
//     totalRequests: number;
//     successfulRequests: number;
//     failedRequests: number;
//     avgResponseTime: number;
//     minResponseTime: number;
//     maxResponseTime: number;
//     errorRate: number;
// }

// interface RequestToTest {
//     method: string;
//     url: string;
//     headers?: any[];
//     body?: string;
//     index: number;
// }

// interface Result {
//     requestIndex: number;
//     status: number;
//     time: number;
//     error?: string;
// }

// async function handler(req: NextRequest) {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     if (req.method !== "POST") {
//         return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
//     }

//     try {
//         const { request, collectionId, concurrency, iterations, environment } = await req.json();

//         if (!request && !collectionId) {
//             return NextResponse.json({ error: "Either request or collectionId is required" }, { status: 400 });
//         }
//         if (request && collectionId) {
//             return NextResponse.json({ error: "Provide either request or collectionId, not both" }, { status: 400 });
//         }
//         if (concurrency < 1 || concurrency > 100) {
//             return NextResponse.json({ error: "Concurrency must be between 1 and 100" }, { status: 400 });
//         }
//         if (iterations < 1 || iterations > 50) {
//             return NextResponse.json({ error: "Iterations must be between 1 and 50" }, { status: 400 });
//         }
//         if (!environment || typeof environment !== "string") {
//             return NextResponse.json({ error: "Environment name is required" }, { status: 400 });
//         }

//         const env = await Environment.findOne({ userId: session.user.id, name: environment });
//         if (!env) {
//             return NextResponse.json(
//                 { error: `Environment '${environment}' not found for the user` },
//                 { status: 404 }
//             );
//         }

//         let requestsToTest = [];
//         if (collectionId) {
//             const collection = await Collection.findOne({
//                 _id: collectionId,
//                 userId: session.user.id,
//             });

//             if (!collection) {
//                 return NextResponse.json({ error: "Collection not found" }, { status: 404 });
//             }

//             const requests = await Request.find({ collectionId: collectionId, userId: session.user.id });
//             requestsToTest = requests.map((req: any, index: number) => {
//                 const parsed = parseRequest(
//                     {
//                         url: req.url,
//                         method: req.method,
//                         headers: req.headers,
//                         body: req.body,
//                     },
//                     env.variables || []
//                 );
//                 return { ...parsed, index };
//             });
//         } else {
//             const parsedRequest = parseRequest(request, env.variables || []);
//             requestsToTest = [{ ...parsedRequest, index: 0 }];
//         }

//         if (requestsToTest.length === 0) {
//             return NextResponse.json({ error: "No valid requests to test" }, { status: 400 });
//         }

//         for (const req of requestsToTest) {
//             try {
//                 new URL(req.url);
//                 if (req.body) JSON.parse(req.body);
//             } catch (error: any) {
//                 return NextResponse.json(
//                     { error: `Invalid request data for request at index ${req.index}: ${error.message}` },
//                     { status: 400 }
//                 );
//             }
//         }

//         const results: any[] = [];
//         let totalRequests = 0;
//         let failedRequests = 0;
//         let totalTime = 0;
//         const startTime = Date.now();

//         for (let i = 0; i < iterations; i++) {
//             const batchPromises = [];
//             for (const req of requestsToTest) {
//                 const requestPromises = Array(concurrency).fill(null).map(async () => {
//                     const reqStartTime = Date.now();
//                     try {
//                         const res = await makeRequest({
//                             method: req.method,
//                             url: req.url,
//                             headers: req.headers?.reduce((acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {}) || {},
//                             data: req.body ? JSON.parse(req.body) : undefined,
//                         });
//                         const time = Date.now() - reqStartTime;
//                         return { requestIndex: req.index, status: res.status, time };
//                     } catch (error: any) {
//                         const time = Date.now() - reqStartTime;
//                         return { requestIndex: req.index, status: error.response?.status || 0, time, error: error.message };
//                     }
//                 });
//                 batchPromises.push(...requestPromises);
//             }

//             const batchResults = await Promise.all(batchPromises);
//             results.push(...batchResults);
//             totalRequests += batchResults.length;
//             failedRequests += batchResults.filter((r) => r.status >= 400 || r.error).length;
//             totalTime += batchResults.reduce((sum, r) => sum + (r.time || 0), 0);
//         }

//         const duration = (Date.now() - startTime) / 1000;
//         const times = results.map((r) => r.time).filter((t) => t !== undefined);

//         const aggregatedMetrics = {
//             totalRequests,
//             successfulRequests: totalRequests - failedRequests,
//             failedRequests,
//             avgResponseTime: times.length ? times.reduce((sum, t) => sum + t, 0) / times.length : 0,
//             minResponseTime: times.length ? Math.min(...times) : 0,
//             maxResponseTime: times.length ? Math.max(...times) : 0,
//             errorRate: totalRequests ? (failedRequests / totalRequests) * 100 : 0,
//             throughput: duration ? totalRequests / duration : 0,
//         };

//         const perRequestMetrics: PerRequestMetric[] = requestsToTest.map((req: RequestToTest, index: number): PerRequestMetric => {
//             const requestResults: Result[] = results.filter((r: Result) => r.requestIndex === index);
//             const requestTimes: number[] = requestResults.map((r) => r.time).filter((t) => t !== undefined);
//             const requestFailed: number = requestResults.filter((r) => r.status >= 400 || r.error).length;
//             const requestTotal: number = requestResults.length;

//             return {
//                 requestIndex: index,
//                 method: req.method,
//                 url: req.url,
//                 totalRequests: requestTotal,
//                 successfulRequests: requestTotal - requestFailed,
//                 failedRequests: requestFailed,
//                 avgResponseTime: requestTimes.length ? requestTimes.reduce((sum, t) => sum + t, 0) / requestTimes.length : 0,
//                 minResponseTime: requestTimes.length ? Math.min(...requestTimes) : 0,
//                 maxResponseTime: requestTimes.length ? Math.max(...requestTimes) : 0,
//                 errorRate: requestTotal ? (requestFailed / requestTotal) * 100 : 0,
//             };
//         });

//         const loadTestResult = new LoadTestResult({
//             userId: session.user.id,
//             requestId: request ? request._id : undefined,
//             collectionId,
//             concurrency,
//             iterations,
//             results,
//             metrics: aggregatedMetrics,
//             perRequestMetrics,
//             createdAt: new Date(),
//         });
//         await loadTestResult.save();

//         return NextResponse.json({
//             results,
//             metrics: aggregatedMetrics,
//             perRequestMetrics,
//             id: loadTestResult._id,
//         });
//     } catch (error: any) {
//         console.error("Load test error:", error);
//         return NextResponse.json({ error: "Failed to run load test: " + error.message }, { status: 500 });
//     }
// }

// export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));

import { NextRequest, NextResponse } from "next/server";
import LoadTestResult from "@/models/LoadTestResult";
import { parseRequest } from "@/utils/requestUtils";
import { securityMiddleware } from "@/lib/securityMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { dbMiddleware } from "@/lib/dbMiddleware";
import Collection from "@/models/Collection";
import Environment from "@/models/Environment";
import { makeRequest } from "@/lib/undici";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Request from "@/models/Request";

interface PerRequestMetric {
  requestIndex: number;
  method: string;
  url: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
}

interface RequestToTest {
  method: string;
  url: string;
  headers?: { key: string; value: string }[];
  body?: string;
  index: number;
}

interface Result {
  requestIndex: number;
  status: number;
  time: number;
  error?: string;
}
function safeJsonParse(str: string | undefined): any | undefined {
  if (!str) return undefined;
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

async function runLoadTestBatch(
  requestsToTest: RequestToTest[],
  concurrency: number
): Promise<Result[]> {
  const results: Result[] = [];

  async function runSingleRequest(req: RequestToTest): Promise<Result> {
    const startTime = Date.now();
    try {
      const res = await makeRequest({
        method: req.method,
        url: req.url,
        headers: req.headers
          ? req.headers.reduce(
              (acc, h) => {
                if (h.key) acc[h.key] = h.value;
                return acc;
              },
              {} as Record<string, string>
            )
          : {},
        body: safeJsonParse(req.body),
      });
      const duration = Date.now() - startTime;
      return { requestIndex: req.index, status: res.status, time: duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        requestIndex: req.index,
        status: error.response?.status || 0,
        time: duration,
        error: error.message,
      };
    }
  }

  const pool: Promise<void>[] = [];
  const queue: (() => Promise<void>)[] = [];

  for (const req of requestsToTest) {
    for (let i = 0; i < concurrency; i++) {
      queue.push(async () => {
        const result = await runSingleRequest(req);
        results.push(result);
      });
    }
  }

  const runNext = async (): Promise<void> => {
    if (queue.length === 0) return;
    const fn = queue.shift()!;
    await fn();
    await runNext();
  };

  for (let i = 0; i < concurrency && i < queue.length; i++) {
    pool.push(runNext());
  }

  await Promise.all(pool);
  return results;
}

async function handler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
    console.log("loadtest body", body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { request, collectionId, concurrency, iterations, environment } = body;

  if (!request && !collectionId) {
    return NextResponse.json(
      { error: "Either 'request' or 'collectionId' is required" },
      { status: 400 }
    );
  }
  if (request && collectionId) {
    return NextResponse.json(
      { error: "Provide either 'request' or 'collectionId', not both" },
      { status: 400 }
    );
  }
  if (
    typeof concurrency !== "number" ||
    concurrency < 1 ||
    concurrency > 100
  ) {
    return NextResponse.json(
      { error: "Concurrency must be a number between 1 and 100" },
      { status: 400 }
    );
  }
  if (typeof iterations !== "number" || iterations < 1 || iterations > 50) {
    return NextResponse.json(
      { error: "Iterations must be a number between 1 and 50" },
      { status: 400 }
    );
  }
  if (!environment || typeof environment !== "string") {
    return NextResponse.json(
      { error: "Environment name (string) is required" },
      { status: 400 }
    );
  }

  const env = await Environment.findOne({
    userId: session.user.id,
    name: environment,
  });
  if (!env) {
    return NextResponse.json(
      { error: `Environment '${environment}' not found for the user` },
      { status: 404 }
    );
  }

  let requestsToTest: RequestToTest[] = [];

  if (collectionId) {
    const collection = await Collection.findOne({
      _id: collectionId,
      userId: session.user.id,
    });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const requests = await Request.find({ collectionId, userId: session.user.id });
    if (!requests.length) {
      return NextResponse.json({ error: "No requests found in the collection" }, { status: 400 });
    }

    requestsToTest = requests.map((reqDoc, index) => {
      const parsed = parseRequest(
        {
          url: reqDoc.url,
          method: reqDoc.method,
          headers: reqDoc.headers,
          body: reqDoc.body,
        },
        env.variables || []
      );
      return { ...parsed, index };
    });
  } else {
    const parsedRequest = parseRequest(request, env.variables || []);
    requestsToTest = [{ ...parsedRequest, index: 0 }];
  }

  if (requestsToTest.length === 0) {
    return NextResponse.json({ error: "No valid requests to test" }, { status: 400 });
  }

  for (const reqItem of requestsToTest) {
    try {
      new URL(reqItem.url);
    } catch {
      return NextResponse.json(
        { error: `Invalid URL for request at index ${reqItem.index}` },
        { status: 400 }
      );
    }

    if (reqItem.body) {
      try {
        JSON.parse(reqItem.body);
      } catch {
        return NextResponse.json(
          { error: `Invalid JSON body for request at index ${reqItem.index}` },
          { status: 400 }
        );
      }
    }
  }

  const allResults: Result[] = [];
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const batchResults = await runLoadTestBatch(requestsToTest, concurrency);
    allResults.push(...batchResults);
  }

  const durationSec = (Date.now() - startTime) / 1000;

  const totalRequests = allResults.length;
  const failedRequests = allResults.filter((r) => r.status >= 400 || r.error).length;
  const times = allResults.map((r) => r.time).filter((t) => t !== undefined) as number[];
  const successfulRequests = totalRequests - failedRequests;

  const aggregatedMetrics = {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    minResponseTime: times.length ? Math.min(...times) : 0,
    maxResponseTime: times.length ? Math.max(...times) : 0,
    errorRate: totalRequests ? (failedRequests / totalRequests) * 100 : 0,
    throughput: durationSec ? totalRequests / durationSec : 0,
  };

  const perRequestMetrics: PerRequestMetric[] = requestsToTest.map((reqItem, index) => {
    const filteredResults = allResults.filter((r) => r.requestIndex === index);
    const reqTimes = filteredResults.map((r) => r.time).filter(Boolean) as number[];
    const reqFailed = filteredResults.filter((r) => r.status >= 400 || r.error).length;
    const reqTotal = filteredResults.length;

    return {
      requestIndex: index,
      method: reqItem.method,
      url: reqItem.url,
      totalRequests: reqTotal,
      successfulRequests: reqTotal - reqFailed,
      failedRequests: reqFailed,
      avgResponseTime: reqTimes.length ? reqTimes.reduce((a, b) => a + b, 0) / reqTimes.length : 0,
      minResponseTime: reqTimes.length ? Math.min(...reqTimes) : 0,
      maxResponseTime: reqTimes.length ? Math.max(...reqTimes) : 0,
      errorRate: reqTotal ? (reqFailed / reqTotal) * 100 : 0,
    };
  });

  const loadTestResult = new LoadTestResult({
    userId: session.user.id,
    requestId: request?._id,
    collectionId,
    concurrency,
    iterations,
    results: allResults,
    metrics: aggregatedMetrics,
    perRequestMetrics,
    createdAt: new Date(),
  });

  await loadTestResult.save();

  return NextResponse.json({
    results: allResults,
    metrics: aggregatedMetrics,
    perRequestMetrics,
    id: loadTestResult._id,
  });
}

export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));