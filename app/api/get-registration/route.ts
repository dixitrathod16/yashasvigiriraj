import { NextResponse } from 'next/server';
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
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

    // Use Scan to find registration by id attribute
    // Note: In production, consider adding a GSI on id field for better performance
    
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: USER_TABLE,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': registrationId.toUpperCase(),
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json(
        { error: 'No registration found for this ID' },
        { status: 404 }
      );
    }

    const registration = result.Items[0];

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
