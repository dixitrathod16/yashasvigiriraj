import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the image key from URL parameters
    const imageKey = request.nextUrl.searchParams.get('key');
    
    if (!imageKey) {
      return NextResponse.json({ error: 'Image key is required' }, { status: 400 });
    }

    // Construct the CloudFront URL
    const cloudFrontUrl = `https://d3b13419yglo3r.cloudfront.net/${imageKey}`;
    
    // Fetch the image
    const response = await fetch(cloudFrontUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
} 