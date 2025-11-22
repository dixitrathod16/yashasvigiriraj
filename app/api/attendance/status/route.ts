import { NextResponse } from 'next/server';
import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const USER_TABLE = 'user_registrations';
const ATTENDANCE_TABLE = 'pilgrimage_attendance';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const destinationId = searchParams.get('destinationId');

        if (!destinationId) {
            return NextResponse.json({ error: 'Destination ID is required' }, { status: 400 });
        }

        // 1. Get all attendance records for this destination
        const attendanceResult = await dynamoDb.send(new QueryCommand({
            TableName: ATTENDANCE_TABLE,
            KeyConditionExpression: 'destinationId = :did',
            ExpressionAttributeValues: {
                ':did': destinationId
            }
        }));

        const arrivedIds = new Set(attendanceResult.Items?.map(item => item.registrationId) || []);
        const arrivedUsers = attendanceResult.Items || [];

        // 2. Get all APPROVED SAN/CHA users
        // Note: Scanning the whole table might be slow if there are many users. 
        // Ideally we'd have a GSI on status or type, but for now we'll scan and filter.
        // 2. Get all APPROVED SAN/CHA users using Query (optimized)
        const fetchUsersByType = async (type: string) => {
            let users: any[] = [];
            let lastEvaluatedKey = undefined;

            do {
                const params: any = {
                    TableName: USER_TABLE,
                    KeyConditionExpression: 'formType = :type',
                    FilterExpression: '#status = :status',
                    ExpressionAttributeNames: {
                        '#status': 'status'
                    },
                    ExpressionAttributeValues: {
                        ':type': type,
                        ':status': 'APPROVED'
                    }
                };

                if (lastEvaluatedKey) {
                    params.ExclusiveStartKey = lastEvaluatedKey;
                }

                const result = await dynamoDb.send(new QueryCommand(params));
                if (result.Items) {
                    users = [...users, ...result.Items];
                }
                lastEvaluatedKey = result.LastEvaluatedKey;
            } while (lastEvaluatedKey);

            return users;
        };

        const [sanUsers, chaUsers] = await Promise.all([
            fetchUsersByType('SAN'),
            fetchUsersByType('CHA')
        ]);

        const targetUsers = [...sanUsers, ...chaUsers];

        // 3. Create a map of target users for easy lookup
        const userMap = new Map(targetUsers.map(u => [u.id, u]));

        // 4. Enrich arrived users with latest details (like phone)
        const enrichedArrivedUsers = arrivedUsers.map(att => {
            const userDetails = userMap.get(att.registrationId);
            return {
                ...att,
                phone: userDetails?.mobileNumber || userDetails?.phone || userDetails?.phoneNumber || att.phone || '',
                userName: userDetails?.fullName || userDetails?.name || att.userName
            };
        });

        // 5. Calculate pending
        const pendingUsers = targetUsers.filter(u => !arrivedIds.has(u.id)).map(u => ({
            id: u.id,
            name: u.fullName || u.name,
            phone: u.mobileNumber || u.phone || u.phoneNumber,
            type: u.id.startsWith('SAN') ? 'SAN' : 'CHA'
        }));

        return NextResponse.json({
            arrived: enrichedArrivedUsers,
            pending: pendingUsers,
            stats: {
                total: targetUsers.length,
                arrived: enrichedArrivedUsers.length,
                pending: pendingUsers.length
            }
        });

    } catch (error) {
        console.error('Error fetching attendance status:', error);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}
