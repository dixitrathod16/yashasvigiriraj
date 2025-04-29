import { NextResponse } from 'next/server';
import { PutCommand, UpdateCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const TABLE_NAME = 'registration_notifications';
const USER_TABLE = 'user_registrations';
const COUNTER_RECORD_TYPE = 'counter';

enum RecordType {
  CHARIPALITH = 'CHA',
  NAVANU = 'NAV',
  SANGH = 'SAN',
}

// Different starting IDs for each category
const STARTING_IDS = {
  [RecordType.CHARIPALITH]: 1601,  // CHA1601 onwards
  [RecordType.NAVANU]: 1301,       // NAV1301 onwards
  [RecordType.SANGH]: 1501,        // SAN1501 onwards
};

/**
 * Get the next available ID for registration using atomic counter
 * Stores counter in the same table with different recordType
 */
async function getNextId(type: RecordType): Promise<number> {
  try {
    // Atomically increment the counter and get the new value
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          recordType: COUNTER_RECORD_TYPE,
          phoneNumber: type,
        },
        UpdateExpression: "SET currentValue = if_not_exists(currentValue, :start) + :increment",
        ExpressionAttributeValues: {
          ":start": STARTING_IDS[type] - 1, // Start - 1 so first increment gives exactly STARTING_ID
          ":increment": 1
        },
        ReturnValues: "UPDATED_NEW"
      })
    );

    // Return the new counter value
    return result.Attributes?.currentValue;
  } catch (error) {
    console.error("Error getting next ID:", error);
    throw error;
  }
}

/**
 * Check if a user with the same phone number and full name already exists
 */
async function checkForDuplicate(aadharNumber: number, formType: RecordType): Promise<boolean> {
  try {

    const formTypes = ['CHA', 'NAV', 'SAN'];
    const keysToGet = formTypes.map(type => ({
      formType: type,
      aadharNumber: Number(aadharNumber)
    }));

    const result = await dynamoDb.send(
      new BatchGetCommand({
        RequestItems: {
          [USER_TABLE]: {
            Keys: keysToGet
          }
        }
      })
    );

    const nonDuplicateCategories = ['CHA', 'SAN'];

    if (result.Responses?.[USER_TABLE]?.length) {
      for (const data of result.Responses?.[USER_TABLE]) {
        if ((formType === data.formType) || (Number(aadharNumber) !== Number('999999999999') && nonDuplicateCategories.includes(formType) && nonDuplicateCategories.includes(data.formType))) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking for duplicate registration:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Check for duplicate
    const isDuplicate = await checkForDuplicate(data.aadharNumber, data.formType);
    if (isDuplicate) {
      return NextResponse.json(
        {
          error: "A registration with this Aadhar Number already exists. Please check your details and try again."
        },
        { status: 409 }
      );
    }

    const nextId = await getNextId(data.formType as RecordType);
    const registrationId = `${data.formType}${nextId}`;

    // Save to DynamoDB
    await dynamoDb.send(
      new PutCommand({
        TableName: USER_TABLE,
        Item: {
          ...data,
          aadharNumber: Number(data.aadharNumber),
          id: registrationId.toString(), // Store as string for consistency
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          photoKey: data.photoKey,
          aadharKey: data.aadharKey,
        },
        ConditionExpression: "attribute_not_exists(id)",
      })
    );

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      registrationId
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "Failed to process registration" },
      { status: 500 }
    );
  }
}