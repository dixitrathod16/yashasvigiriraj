import { NextResponse } from 'next/server';
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const TABLE_NAME = 'pilgrimage_destinations';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await dynamoDb.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id }
        }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting destination:', error);
        return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 });
    }
}
