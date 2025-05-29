import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import ScanResult from '@/models/ScanResult';
import { authOptions } from '@/lib/auth';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(context: RouteContext) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const resolvedParams = await context.params;
    const paramsId = resolvedParams.id;
    if (!paramsId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 });
    }

    const query = userId ? { _id: paramsId, userId } : { _id: paramsId };
    const scanResult = await ScanResult.findOne(query).lean();

    if (!scanResult) {
      return NextResponse.json({ error: 'Scan result not found' }, { status: 404 });
    }

    return NextResponse.json(scanResult, { status: 200 });
  } catch (error) {
    console.error('Fetch scan result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}