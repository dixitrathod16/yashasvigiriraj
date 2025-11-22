import { NextResponse } from 'next/server';
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = 'pilgrimage_destinations';

export async function GET() {
    try {
        const result = await dynamoDb.send(new ScanCommand({ TableName: TABLE_NAME }));
        // Sort by date if possible, or just return
        const destinations = result.Items || [];
        destinations.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({ destinations });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, date, description } = await request.json();

        if (!name || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = uuidv4();

        await dynamoDb.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                id,
                name,
                date,
                description,
                createdAt: new Date().toISOString(),
            }
        }));

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Error creating destination:', error);
        return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
    }
}
