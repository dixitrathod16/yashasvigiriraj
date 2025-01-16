import { NextResponse } from 'next/server';
import { getCachedData, setCachedData } from '@/lib/cache';

interface YouTubeItem {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
    resourceId: {
      videoId: string;
    };
  };
}

interface VideoData {
  videos: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
  }[];
  lastFetched: string;
}

const CACHE_KEY = 'youtube_feed';

export async function GET() {
  try {
    // Try to get cached data
    const cachedData = await getCachedData<VideoData>(CACHE_KEY);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    const YOUTUBE_PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

    if (!YOUTUBE_API_KEY || !YOUTUBE_PLAYLIST_ID) {
      return NextResponse.json(
        { error: 'Missing required configuration (YOUTUBE_API_KEY or YOUTUBE_PLAYLIST_ID)' },
        { status: 400 }
      );
    }

    const playListResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${YOUTUBE_PLAYLIST_ID}&maxResults=20&key=${YOUTUBE_API_KEY}`);

    if (!playListResponse.ok) {
      throw new Error('YouTube API request failed');
    }

    const videoData = await playListResponse.json();

    const videos = videoData.items.map((item: YouTubeItem) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
    }));

    // Prepare data with timestamp
    const responseData: VideoData = {
      videos,
      lastFetched: new Date().toISOString()
    };

    // Cache the response
    if (videos.length) {
      await setCachedData(CACHE_KEY, responseData, 7200);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({ error: 'Error fetching videos' }, { status: 500 });
  }
}