import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import ScanResult from '@/models/ScanResult';
import { authOptions } from '@/lib/auth';
import { z } from "zod";

const getQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['url', 'timestamp', 'status']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsedParams = getQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!parsedParams.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsedParams.error.errors }, { status: 400 });
    }
    const { page, limit, search, sortBy, sortOrder } = parsedParams.data;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (search) {
      query.url = { $regex: search, $options: 'i' };
    }

    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const scans = await ScanResult.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ScanResult.countDocuments(query);

    return NextResponse.json(
      {
        scans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch{
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ScanResult.deleteMany({ userId })
    return NextResponse.json({ message: 'All scan history deleted' }, { status: 200 });
  } catch{
    return NextResponse.json({ message: 'Failed to delete history' }, { status: 500 });
  }
}