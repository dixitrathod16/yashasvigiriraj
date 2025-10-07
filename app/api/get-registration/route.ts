import { NextResponse } from 'next/server';
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const USER_TABLE = 'user_registrations';

export async function POST(request: Request) {
  try {
    const { registrationId } = await request.json();

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Validate registration ID format (e.g., "SAN1501", "CHA1601", "NAV1301")
    const formTypeMatch = registrationId.match(/^(SAN|CHA|NAV)/i);
    if (!formTypeMatch) {
      return NextResponse.json(
        { error: 'Invalid Registration ID format' },
        { status: 400 }
      );
    }

    // Use Query with GSI on id field for efficient lookup
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: USER_TABLE,
        IndexName: 'RegistrationIdIndex', // GSI name - needs to be created in DynamoDB
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': registrationId.toUpperCase(),
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.log(`Registration ID ${registrationId} not found`);
      return NextResponse.json(
        { error: 'No registration found for this ID' },
        { status: 404 }
      );
    }

    const registration = result.Items[0];
    console.log(`Registration ID ${registrationId} found`);

    // Only return if status is APPROVED
    if (registration.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'This registration is not approved. Only approved applicants can submit travel details.' },
        { status: 403 }
      );
    }

    // Return registration details
    return NextResponse.json({ 
      registration: {
        ...registration,
        registrationId: registration.id,
      }
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration' },
      { status: 500 }
    );
  }
}
