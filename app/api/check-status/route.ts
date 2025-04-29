import { NextResponse } from 'next/server';
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const USER_TABLE = 'user_registrations';

export async function POST(request: Request) {
  try {
    const { aadharNumber } = await request.json();

    if (!aadharNumber) {
      return NextResponse.json(
        { error: 'Aadhar number is required' },
        { status: 400 }
      );
    }

    // Query all registrations for the given aadhar number using GSI
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: USER_TABLE,
        IndexName: 'IdIndex',
        KeyConditionExpression: 'aadharNumber = :aadharNumber',
        ExpressionAttributeValues: {
          ':aadharNumber': Number(aadharNumber),
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json(
        { error: 'No registrations found for this Aadhar number' },
        { status: 404 }
      );
    }

    // Return complete registration details
    const registrations = result.Items.map(item => ({
      ...item,
      registrationId: item.id,
      lastUpdated: item.updatedAt || item.createdAt,
    }));

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
} 