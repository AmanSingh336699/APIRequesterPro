import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import ScanResult from '@/models/ScanResult';
import { httpsCheck } from '@/lib/scanners/httpsCheck';
import { rateLimiterCheck } from '@/lib/scanners/rateLimiterCheck';
import { corsCheck } from '@/lib/scanners/corsCheck';
import { authCheck } from '@/lib/scanners/authCheck';
import { headerCheck } from '@/lib/scanners/headerCheck';
import { authOptions } from '@/lib/auth';
import { scanInputSchema } from '@/validators/scan.schema';
import { securityMiddleware } from '@/lib/securityMiddleware';
import { rateLimitMiddleware } from '@/lib/rateLimitMiddleware';
import { dbMiddleware } from '@/lib/dbMiddleware';

async function handler(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json()
            const parsed = scanInputSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
            }
            const { url, headers, body: requestBody } = parsed.data;
            const headersObj = JSON.parse(headers) || {};
            const bodyObj = JSON.parse(requestBody) || {};
            const scanners = [httpsCheck, rateLimiterCheck, corsCheck, authCheck, headerCheck];
            const scanPromises = scanners.map(async (scanner) => {
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        const data = await scanner(url, headersObj, bodyObj);
                        return data
                    } catch (error: any) {
                        if (attempt === 3) {
                            return {
                                name: scanner.name,
                                severity: 'error' as const,
                                description: `Failed after ${attempt} attempts: ${error.message}`,
                                recommendation: 'Check API availability or configuration.',
                                fix: '',
                                fixLanguage: 'javascript',
                            };
                        }
                        await new Promise((res) => setTimeout(res, 1000 * attempt));
                    }
                }
            });
            const results = await Promise.all(scanPromises);
            const scanResult = await ScanResult.create({
                url,
                results,
                timestamp: new Date(),
                userId: session.user.id,
            });
            return NextResponse.json({ scanId: scanResult._id }, { status: 201 });
        } catch (error: any) {
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)))