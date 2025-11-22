import { NextResponse } from 'next/server';
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

const TABLE_NAME = 'pilgrimage_coordinators';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const result = await dynamoDb.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { username }
        }));

        const coordinator = result.Item;

        if (!coordinator || coordinator.password !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate coordinator token
        const token = await encrypt({
            client: 'coordinator-app',
            role: 'coordinator',
            username: coordinator.username,
            name: coordinator.name
        });

        // Set coordinator cookie
        cookies().set('coordinator-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400 // 24 hours
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging in coordinator:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}

export async function DELETE() {
    // Logout
    cookies().set('coordinator-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
    });

    return NextResponse.json({ success: true });
}
