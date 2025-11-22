import { NextResponse } from 'next/server';
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const TABLE_NAME = 'pilgrimage_coordinators';

export async function DELETE(
    request: Request,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        await dynamoDb.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { username }
        }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting coordinator:', error);
        return NextResponse.json({ error: 'Failed to delete coordinator' }, { status: 500 });
    }
}
