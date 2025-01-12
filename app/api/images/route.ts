import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getCachedData, setCachedData } from '@/lib/cache';

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

const CACHE_KEY = 'google_drive_images';

async function fetchPublicGoogleDriveImages(folderId: string, apiKey: string): Promise<ImageFile[]> {
  try {
    // Include thumbnailLink in the fields
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+(mimeType+contains+'image/')+and+trashed=false&fields=files(id,name,thumbnailLink)&key=${apiKey}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error('Failed to fetch folder contents');
    }

    const data = await response.json();

    const images = data.files.map((file: { id: string; name: string; thumbnailLink?: string }) => ({
      id: file.id,
      name: file.name,
      url: `https://lh3.googleusercontent.com/d/${file.id}=w2048`,
      thumbnailUrl: file.thumbnailLink || `https://lh3.googleusercontent.com/d/${file.id}=w200`,
    }));

    return images;
  } catch (error) {
    console.error('Error fetching from Google Drive:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Validate the request is from our UI
    const headersList = headers();
    const referer = headersList.get('referer');
    if (!referer || !referer.includes(process.env.NEXT_PUBLIC_SITE_URL || '')) {
      console.log(`Referer: ${referer}`);
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // Try to get cached data
    const cachedData = await getCachedData<ImageData>(CACHE_KEY);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!folderId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required configuration (GOOGLE_DRIVE_FOLDER_ID or GOOGLE_API_KEY)' },
        { status: 400 }
      );
    }

    const images = await fetchPublicGoogleDriveImages(folderId, apiKey);

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