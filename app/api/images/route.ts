import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Initialize Google Drive API client
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  }),
})

export async function GET() {
  try {
    // Replace with your Google Drive folder ID
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, webViewLink)',
      orderBy: 'createdTime desc',
    })

    const images = response.data.files?.map((file) => ({
      id: file.id,
      // Convert the webViewLink to a direct download link
      url: `https://drive.google.com/uc?export=view&id=${file.id}`,
    })) || []

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
} 