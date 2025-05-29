import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ScanResult from '@/models/ScanResult';
import { securityMiddleware } from '@/lib/securityMiddleware';
import { rateLimitMiddleware } from '@/lib/rateLimitMiddleware';
import { dbMiddleware } from '@/lib/dbMiddleware';

interface RouterContext {
    params: {
        id: string
    }
}

async function handler(req: NextRequest, context: RouterContext) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const resolvedParams = await context.params;
    const deleteId = resolvedParams.id;

    if (req.method === 'DELETE') {
        try {
            const scanResult = await ScanResult.findOneAndDelete({ _id: deleteId, userId: session.user.id });
            if (!scanResult) {
                return NextResponse.json({ message: 'Scan not found' }, { status: 404 });
            }
            return NextResponse.json({ message: 'Scan deleted successfully' }, { status: 200 });
        } catch{
            return NextResponse.json({ message: 'Failed to delete scan' }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export const DELETE = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)))