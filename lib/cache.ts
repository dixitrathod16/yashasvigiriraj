import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from './dynamodb';

const TABLE_NAME = 'registration_notifications';
const CACHE_RECORD_TYPE = 'google_api_cache';
const CACHE_TTL = 3600; // 1 hour in seconds

interface CacheItem<T> {
  recordType: string;
  phoneNumber: string;
  data: T;
  ttl: number;
  createdAt: string;
}

export async function getCachedData<T>(cacheKey: string): Promise<T | null> {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          recordType: CACHE_RECORD_TYPE,
          phoneNumber: cacheKey,
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    const cacheItem = result.Item as CacheItem<T>;
    
    // Check if cache is expired
    if (cacheItem.ttl < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function setCachedData<T>(
  cacheKey: string,
  data: T,
  ttlInSeconds: number = CACHE_TTL
): Promise<void> {
  try {
    const now = new Date();
    const ttl = Math.floor(now.getTime() / 1000) + ttlInSeconds;

    const cacheItem: CacheItem<T> = {
      recordType: CACHE_RECORD_TYPE,
      phoneNumber: cacheKey,
      data,
      ttl,
      createdAt: now.toISOString(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: cacheItem,
      })
    );
  } catch (error) {
    console.error('Cache write error:', error);
  }
} 