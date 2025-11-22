import { NextResponse } from 'next/server';
import { QueryCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const USER_TABLE = 'user_registrations';
const ATTENDANCE_TABLE = 'pilgrimage_attendance';

export async function POST(request: Request) {
    try {
        const { registrationId, destinationId } = await request.json();

        // Get coordinator info from cookie
        const cookieStore = cookies();
        const token = cookieStore.get('coordinator-token')?.value;
        let scannedBy = 'unknown';

        if (token) {
            const payload = await decrypt(token);
            if (payload && payload.username) {
                scannedBy = payload.username as string;
            }
        }

        if (!registrationId || !destinationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const regId = registrationId.toUpperCase();

        // 1. Validate format
        if (!/^(SAN|CHA)/i.test(regId)) {
            return NextResponse.json({ error: 'Invalid ID format. Only SAN and CHA allowed.' }, { status: 400 });
        }

        // 2. Check if already recorded
        const attendanceCheck = await dynamoDb.send(new GetCommand({
            TableName: ATTENDANCE_TABLE,
            Key: {
                destinationId,
                registrationId: regId
            }
        }));

        if (attendanceCheck.Item) {
            return NextResponse.json({
                error: 'Already recorded',
                alreadyRecorded: true,
                timestamp: attendanceCheck.Item.timestamp
            }, { status: 409 });
        }

        // 3. Find user
        // Using the same logic as get-registration API
        const userResult = await dynamoDb.send(
            new QueryCommand({
                TableName: USER_TABLE,
                IndexName: 'RegistrationIdIndex',
                KeyConditionExpression: 'id = :id',
                ExpressionAttributeValues: {
                    ':id': regId,
                },
            })
        );

        if (!userResult.Items || userResult.Items.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.Items[0];

        // 4. Validate User Status
        if (user.status !== 'APPROVED') {
            return NextResponse.json({ error: `User status is ${user.status}. Must be APPROVED.` }, { status: 403 });
        }

        // 5. Record Attendance
        const timestamp = new Date().toISOString();
        await dynamoDb.send(new PutCommand({
            TableName: ATTENDANCE_TABLE,
            Item: {
                destinationId,
                registrationId: regId,
                timestamp,
                scannedBy,
                userName: user.fullName || user.name || 'Unknown', // Store name for easier display
                userType: regId.substring(0, 3),
                phone: user.mobileNumber || user.phone || '',
            }
        }));

        return NextResponse.json({
            success: true,
            user: {
                name: user.fullName || user.name,
                id: regId
            }
        });

    } catch (error) {
        console.error('Error recording attendance:', error);
        return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
    }
}
