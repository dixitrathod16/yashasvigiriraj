import { NextResponse } from 'next/server';
import { dynamoDb } from '@/lib/dynamodb';
import { ScanCommand, UpdateCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = 'user_registrations';

export async function GET() {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 1000,
    });

    // eslint-disable-next-line prefer-const
    let { Items, LastEvaluatedKey } = await dynamoDb.send(command);
    const allItems = Items;
    // If there are more records (i.e., LastEvaluatedKey is not null), fetch them too
    while (LastEvaluatedKey) {
      const nextCommand = new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: LastEvaluatedKey,
        Limit: 1000,
      });
      const { Items: nextItems, LastEvaluatedKey: nextLastKey } = await dynamoDb.send(nextCommand);
      allItems!.push(...nextItems!);
      LastEvaluatedKey = nextLastKey;
    }

    return NextResponse.json(allItems);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    // Extract keys for DynamoDB
    const { formType, aadharNumber, ...fieldsToUpdate } = data;
    if (!formType || typeof aadharNumber === 'undefined') {
      return NextResponse.json(
        { error: 'Missing required keys (formType, aadharNumber)' },
        { status: 400 }
      );
    }
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );
    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    // Build UpdateExpression
    const updateExpr = [];
    const exprAttrNames: Record<string, string> = {};
    const exprAttrValues: Record<string, unknown> = {};
    let idx = 0;
    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      const nameKey = `#f${idx}`;
      const valueKey = `:v${idx}`;
      updateExpr.push(`${nameKey} = ${valueKey}`);
      exprAttrNames[nameKey] = key;
      exprAttrValues[valueKey] = value as unknown;
      idx++;
    }
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        formType,
        aadharNumber: Number(aadharNumber),
      },
      UpdateExpression: `SET ${updateExpr.join(', ')}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: 'ALL_NEW',
    });
    const result = await dynamoDb.send(command);
    return NextResponse.json({ success: true, updated: result.Attributes });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { formType, aadharNumber } = await request.json();
    if (!formType || typeof aadharNumber === 'undefined') {
      return NextResponse.json(
        { error: 'Missing required keys (formType, aadharNumber)' },
        { status: 400 }
      );
    }
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        formType,
        aadharNumber: Number(aadharNumber),
      },
    });
    await dynamoDb.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Require id, formType, aadharNumber
    const { id, formType, aadharNumber } = data;
    if (!id || !formType || typeof aadharNumber === 'undefined') {
      return NextResponse.json(
        { error: 'Missing required fields (id, formType, aadharNumber)' },
        { status: 400 }
      );
    }
    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...data,
          aadharNumber: Number(aadharNumber),
        },
      })
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating registration (admin):', error);
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}