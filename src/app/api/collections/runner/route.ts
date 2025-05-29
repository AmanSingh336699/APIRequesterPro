import { NextRequest, NextResponse } from "next/server";
import { parseRequest } from "@/utils/requestUtils";
import { securityMiddleware } from "@/lib/securityMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { dbMiddleware } from "@/lib/dbMiddleware";
import Environment from "@/models/Environment";
import { makeRequest } from "@/lib/axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AxiosError } from "axios";

async function handler(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (req.method !== "POST") {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { method, url, headers, body, environment } = await req.json();

        if (!method || !url || !environment) {
            return NextResponse.json(
                { error: "Method, URL, and environment are required" },
                { status: 400 }
            );
        }
        if (!["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)) {
            return NextResponse.json({ error: "Invalid HTTP method" }, { status: 400 });
        }
        if (typeof environment !== "string") {
            return NextResponse.json({ error: "Environment must be a string" }, { status: 400 });
        }

        const env = await Environment.findOne({ userId: session.user.id, name: environment });
        if (!env) {
            return NextResponse.json(
                { error: `Environment '${environment}' not found for the user` },
                { status: 404 }
            );
        }

        const parsedRequest = parseRequest(
            {
                method,
                url,
                headers: headers || [],
                body,
            },
            env.variables || []
        );

        try {
            new URL(parsedRequest.url);
            if (parsedRequest.body) JSON.parse(parsedRequest.body);
        } catch (parseValidationError) {
            let errorMessage = "Invalid request data";
            if (parseValidationError instanceof Error) {
                errorMessage = `Invalid request data: ${parseValidationError.message}`;
            }
            return NextResponse.json(
                { error: errorMessage },
                { status: 400 }
            );
        }

        const startTime = Date.now();
        try {
            const res = await makeRequest({
                method: parsedRequest.method,
                url: parsedRequest.url,
                headers: parsedRequest.headers?.reduce((acc: Record<string, string>, h: { key: string; value: string }) => ({ ...acc, [h.key]: h.value }), {}) || {},
                data: parsedRequest.body ? JSON.parse(parsedRequest.body) : undefined,
            });

            return NextResponse.json({
                success: true,
                data: res.data,
                status: res.status,
                headers: Object.fromEntries(
                    Object.entries(res.headers).map(([k, v]) => [k, v?.toString() ?? ""])
                ),
                time: Date.now() - startTime,
            });
        } catch (requestError) {
            let errorMessage = "Request failed";
            let errorStatus = 0;

            if (requestError instanceof AxiosError) {
                if (requestError.response) {
                    errorMessage = requestError.response.data?.message || requestError.message;
                    errorStatus = requestError.response.status;
                } else if (requestError.request) {
                    errorMessage = "No response received from target server";
                    errorStatus = 503;
                } else {
                    errorMessage = requestError.message;
                    errorStatus = 500;
                }
            } else if (requestError instanceof Error) {
                errorMessage = requestError.message;
                errorStatus = 500;
            } else {
                errorMessage = String(requestError);
                errorStatus = 500;
            }

            return NextResponse.json({
                success: false,
                error: errorMessage,
                status: errorStatus,
                time: Date.now() - startTime,
            });
        }
    } catch (initialError) {
        let errorMessage = "Failed to run request";
        if (initialError instanceof Error) {
            errorMessage = `Failed to run request: ${initialError.message}`;
        } else {
            errorMessage = `Failed to run request: ${String(initialError)}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));
