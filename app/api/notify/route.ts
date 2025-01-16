import { NextResponse } from 'next/server';
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const TABLE_NAME = 'registration_notifications';
const RECORD_TYPE = 'notification';

interface DynamoDBError extends Error {
  name: string;
}

export async function POST(req: Request) {
  try {
    const { phoneNumber, fullName, hasConsent } = await req.json();
    
    // Validate inputs
    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name' },
        { status: 400 }
      );
    }

    if (hasConsent !== true) {
      return NextResponse.json(
        { error: 'Consent is required to proceed' },
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

    // Store user details in DynamoDB
    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          recordType: RECORD_TYPE,
          phoneNumber,
          fullName: fullName.trim(),
          createdAt: new Date().toISOString(),
          status: 'pending',
          hasConsent: true,
          consentTimestamp: new Date().toISOString(),
        },
        // Add a condition to prevent race conditions
        ConditionExpression: 'attribute_not_exists(phoneNumber)',
      })
    );

    return NextResponse.json(
      { message: 'Registration successful' },
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

    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
} 