import { NextResponse } from 'next/server';
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const USER_TABLE = 'user_registrations';

export async function POST(request: Request) {
  try {
    const { aadharNumber, registrationId } = await request.json();

    if (!aadharNumber || !registrationId) {
      return NextResponse.json(
        { error: 'Aadhar number and registration ID are required' },
        { status: 400 }
      );
    }

    // Find the registration with matching aadhar number and registration ID
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: USER_TABLE,
        Key: {
          formType: registrationId.substring(0, 3), // Extract form type from registration ID (e.g., 'CHA' from 'CHA1234')
          aadharNumber: Number(aadharNumber),
        },
      })
    );

    if (!result.Item) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Verify that the registration ID matches
    if (result.Item.id !== registrationId) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fullName: result.Item.fullName,
      status: result.Item.status,
      lastUpdated: result.Item.updatedAt || result.Item.createdAt,
      remarks: result.Item.remarks || '',
      formType: result.Item.formType,
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
} 