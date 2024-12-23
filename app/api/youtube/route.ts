import { NextResponse } from 'next/server';

export async function GET() {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=9&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({ error: 'Error fetching videos' }, { status: 500 });
  }
}