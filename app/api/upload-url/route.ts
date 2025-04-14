import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const { files } = await request.json();
    
    // Validate all files are images
    for (const file of files) {
      if (!file.fileType.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        );
      }
    }

    // Generate pre-signed URLs for all files in parallel
    const uploadUrls = await Promise.all(
      files.map(async (file: { fileType: string; uploadType: string }) => {
        const prefix = file.uploadType === 'aadhar' ? 'aadhar/' : 'photos/';
        const key = `${prefix}${uuidv4()}.${file.fileType.split('/')[1]}`;
        
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          ContentType: file.fileType,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return { url, key, uploadType: file.uploadType };
      })
    );

    return NextResponse.json({ uploadUrls });
  } catch (error) {
    console.error('Error generating upload URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 }
    );
  }
}