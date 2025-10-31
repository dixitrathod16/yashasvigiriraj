import { NextResponse } from 'next/server';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const USER_TABLE = 'user_registrations';

export async function POST(request: Request) {
  try {
    const { formType, aadharNumber, returnDate, busTime } = await request.json();

    if (!formType || !aadharNumber) {
      return NextResponse.json(
        { error: 'Form type and Aadhar number are required' },
        { status: 400 }
      );
    }

    if (!returnDate || !busTime) {
      return NextResponse.json(
        { error: 'Return date and bus timing must be provided' },
        { status: 400 }
      );
    }

    // Validate formType is SAN or CHA
    if (formType !== 'SAN' && formType !== 'CHA') {
      return NextResponse.json(
        { error: 'Return bus service is only available for SAN and CHA registrations' },
        { status: 400 }
      );
    }

    // Update the registration with return details
    await dynamoDb.send(
      new UpdateCommand({
        TableName: USER_TABLE,
        Key: {
          formType,
          aadharNumber: Number(aadharNumber),
        },
        UpdateExpression: 'SET returnDate = :returnDate, busTime = :busTime, returnDetailsSubmittedAt = :submittedAt',
        ExpressionAttributeValues: {
          ':returnDate': returnDate,
          ':busTime': busTime,
          ':submittedAt': new Date().toISOString(),
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Return details submitted successfully',
    });
  } catch (error) {
    console.error('Error updating return details:', error);
    return NextResponse.json(
      { error: 'Failed to update return details' },
      { status: 500 }
    );
  }
}
