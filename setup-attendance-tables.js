
const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const fs = require('fs');
const path = require('path');

// Load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                process.env[key] = value;
            }
        });
        console.log('Loaded .env.local');
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

const client = new DynamoDBClient({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
    region: process.env.REGION || 'us-east-1',
});

const tables = [
    {
        TableName: "pilgrimage_coordinators",
        KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "username", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
        TableName: "pilgrimage_destinations",
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
        TableName: "pilgrimage_attendance",
        KeySchema: [
            { AttributeName: "destinationId", KeyType: "HASH" },
            { AttributeName: "registrationId", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
            { AttributeName: "destinationId", AttributeType: "S" },
            { AttributeName: "registrationId", AttributeType: "S" },
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
    },
];

async function createTables() {
    for (const table of tables) {
        try {
            console.log(`Creating table ${table.TableName}...`);
            await client.send(new CreateTableCommand(table));
            console.log(`Table ${table.TableName} created successfully.`);
        } catch (error) {
            if (error.name === "ResourceInUseException") {
                console.log(`Table ${table.TableName} already exists.`);
            } else {
                console.error(`Error creating table ${table.TableName}: `, error);
            }
        }
    }
}

createTables();
