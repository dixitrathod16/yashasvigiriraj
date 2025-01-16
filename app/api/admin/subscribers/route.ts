import { NextResponse } from 'next/server';
import { QueryCommand, QueryCommandOutput, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from '@/lib/dynamodb';

const TABLE_NAME = 'registration_notifications';

async function getAllSubscribers() {
  interface Subscriber {
    recordType: string;
    phoneNumber: string;
    fullName: string;
    createdAt: string;
    status: string;
  }

  let allItems: Subscriber[] = [];
  let lastEvaluatedKey = undefined;

  do {
    const result: QueryCommandOutput = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'recordType = :type',
        ExpressionAttributeValues: {
          ':type': 'notification'
        },
        ...( lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
      })
    );

    allItems = [...allItems, ...(result.Items as Subscriber[] || [])];
    lastEvaluatedKey = result.LastEvaluatedKey;

  } while (lastEvaluatedKey);

  return allItems;
}

export async function GET() {
  try {
    const subscribers = await getAllSubscribers();

    return NextResponse.json({
      subscribers,
      total: subscribers.length
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const headersList = headers();
    const adminToken = headersList.get('Cookie')?.includes('admin-token');

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { phoneNumber } = await request.json();

    await dynamoDb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          recordType: 'notification',
          phoneNumber: phoneNumber
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriber' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const headersList = headers();
    const adminToken = headersList.get('Cookie')?.includes('admin-token');

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { phoneNumber, fullName, status } = await request.json();

    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          recordType: 'notification',
          phoneNumber: phoneNumber
        },
        UpdateExpression: 'SET fullName = :fullName, #status = :status',
        ExpressionAttributeValues: {
          ':fullName': fullName,
          ':status': status
        },
        ExpressionAttributeNames: {
          '#status': 'status'
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to update subscriber' },
      { status: 500 }
    );
  }
} 