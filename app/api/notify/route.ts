import { NextResponse } from 'next/server';
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';
import { headers } from 'next/headers';

const TABLE_NAME = 'registration_notifications';
const RECORD_TYPE = 'notification';

interface DynamoDBError extends Error {
  name: string;
}

export async function POST(req: Request) {
  try {
    // Validate the request is from our UI
    const headersList = headers();
    const referer = headersList.get('referer');
    if (!referer || !referer.includes(process.env.NEXT_PUBLIC_SITE_URL || '')) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    const { phoneNumber } = await req.json();
    
    // Validate phone number (basic validation)
    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingRecord = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          recordType: RECORD_TYPE,
          phoneNumber: phoneNumber,
        },
      })
    );

    if (existingRecord.Item) {
      return NextResponse.json(
        { message: 'Phone number already registered' },
        { status: 200 }
      );
    }

    // Store phone number in DynamoDB with new schema
    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          recordType: RECORD_TYPE,
          phoneNumber,
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
        // Add a condition to prevent race conditions
        ConditionExpression: 'attribute_not_exists(phoneNumber)',
      })
    );

    return NextResponse.json(
      { message: 'Phone number registered successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Check if error is due to condition check (duplicate record)
    if ((error as DynamoDBError).name === 'ConditionalCheckFailedException') {
      return NextResponse.json(
        { message: 'Phone number already registered' },
        { status: 200 }
      );
    }

    console.error('Error registering phone number:', error);
    return NextResponse.json(
      { error: 'Failed to register phone number' },
      { status: 500 }
    );
  }
} 