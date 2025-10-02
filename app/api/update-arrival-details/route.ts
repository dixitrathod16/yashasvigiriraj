import { NextResponse } from 'next/server';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const USER_TABLE = 'user_registrations';

export async function POST(request: Request) {
  try {
    const { formType, aadharNumber, arrivalDate, arrivalPlace, idPhotoKey } = await request.json();

    if (!formType || !aadharNumber) {
      return NextResponse.json(
        { error: 'Form type and Aadhar number are required' },
        { status: 400 }
      );
    }

    if (!arrivalDate || !arrivalPlace || !idPhotoKey) {
      return NextResponse.json(
        { error: 'All travel details are required' },
        { status: 400 }
      );
    }

    // Update the registration with travel details
    await dynamoDb.send(
      new UpdateCommand({
        TableName: USER_TABLE,
        Key: {
          formType,
          aadharNumber: Number(aadharNumber),
        },
        UpdateExpression: 'SET arrivalDate = :arrivalDate, arrivalPlace = :arrivalPlace, idPhotoKey = :idPhotoKey, travelDetailsSubmittedAt = :submittedAt',
        ExpressionAttributeValues: {
          ':arrivalDate': arrivalDate,
          ':arrivalPlace': arrivalPlace,
          ':idPhotoKey': idPhotoKey,
          ':submittedAt': new Date().toISOString(),
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Arrival details submitted successfully',
    });
  } catch (error) {
    console.error('Error updating arrival details:', error);
    return NextResponse.json(
      { error: 'Failed to update arrival details' },
      { status: 500 }
    );
  }
}
