import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

console.log(`Environment Variable, ${JSON.stringify(process.env)}`);

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
  region: process.env.REGION || 'us-east-1',
});

export const dynamoDb = DynamoDBDocumentClient.from(client);