import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getCachedData, setCachedData } from '@/lib/cache';

const CACHE_KEY = 's3_images';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
});

interface ImageFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
}

interface ImageData {
  images: ImageFile[];
  lastFetched: string;
}

async function fetchS3Images(bucketName: string): Promise<ImageFile[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'images/', // Assuming images are stored in an 'images' folder
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    const images = response.Contents
      .filter(item => item.Key?.endsWith('.webp') || item.Key?.endsWith('.jpg') || item.Key?.endsWith('.jpeg') || item.Key?.endsWith('.png'))
      .map(item => ({
        id: item.Key || '',
        name: item.Key?.split('/').pop() || '',
        url: `https://${process.env.CLOUDFRONT_DOMAIN}/${item.Key}`,
        thumbnailUrl: `https://${process.env.CLOUDFRONT_DOMAIN}/${item.Key}?width=200`, // Using CloudFront image optimization
      }));

    return images;
  } catch (error) {
    console.error('Error fetching from S3:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Try to get cached data
    const cachedData = await getCachedData<ImageData>(CACHE_KEY);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const bucketName = process.env.S3_BUCKET_NAME;

    if (!bucketName) {
      return NextResponse.json(
        { error: 'Missing required configuration (S3_BUCKET_NAME)' },
        { status: 400 }
      );
    }

    const images = await fetchS3Images(bucketName);

    // Prepare data with timestamp
    const responseData: ImageData = {
      images,
      lastFetched: new Date().toISOString()
    };

    // Cache the response for 2 hours (7200 seconds)
    if (images.length) {
      await setCachedData(CACHE_KEY, responseData, 7200);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
} 