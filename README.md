# Yashashvigiriraj Website

A Next.js-based website for managing event registrations and notifications, built with TypeScript, Tailwind CSS, and AWS services.

## Features

- 🎨 Modern UI with Tailwind CSS and Framer Motion animations
- 📱 Fully responsive design
- 🔐 Secure admin dashboard
- 📸 Image and video galleries with Google Drive integration
- 📝 User registration system
- 🔔 Notification management
- 💾 DynamoDB-based data persistence
- 🚀 Optimized for performance

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Database**: AWS DynamoDB
- **Authentication**: JWT with jose
- **Cloud Services**: AWS, Vercel
- **UI Components**: Radix UI, shadcn/ui
- **Media Storage**: Google Drive API

## Prerequisites

- Node.js 18.x or later
- AWS Account
- Google Cloud Project (for Drive API)
- npm or yarn or pnpm or bun

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/yashasvigiriraj.git
cd yashasvigiriraj
```

2. Install dependencies:
```bash
npm install
```

3. Generate API secret key and use it for API_SECRET_KEY in next step:
```bash
npm run generate-key
```

4. Environment Variables
Create a `.env.local` file in the root directory with the following variables:
```json
ACCESS_KEY_ID=<Replace with your_aws_access_key>
SECRET_ACCESS_KEY=<Replace with your_aws_secret_key>
REGION=<Replace with your_aws_region>
YOUTUBE_API_KEY=<Replace with your_google_api_key>
YOUTUBE_PLAYLIST_ID=<Replace with your youtube playlist id>
GOOGLE_DRIVE_FOLDER_ID=<Replace with your_drive_folder_id>
GOOGLE_API_KEY=<Replace with your_google_api_key>
API_SECRET_KEY=<Replace with your newly generated jwt_secret_key>
ADMIN_SECRET_KEY=<Replace with the password you want to use to login to admin dashboard>
NEXT_PUBLIC_SITE_URL=<http://localhost:3000 in local or your custom domain in production>
NEXT_DEVELOPMENT_SITE_URL=<http://localhost:3000 in local or your custom domain in production>
S3_BUCKET_NAME=<Replace with your bucket name>
CLOUDFRONT_DOMAIN=<Replace with your cloudfront domain name>
NEXT_PUBLIC_REGISTRATION_START_DATE=<Replace here with registration lauch date>
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## DynamoDB Setup

1. Install AWS CLI and configure with your credentials:
```bash
aws configure
```

2. Create the DynamoDB table:
```bash
aws dynamodb create-table \
  --table-name registration_notifications \
  --attribute-definitions \
    AttributeName=recordType,AttributeType=S \
    AttributeName=phoneNumber,AttributeType=S \
  --key-schema \
    AttributeName=recordType,KeyType=HASH \
    AttributeName=phoneNumber,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region your-region
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

#### Custom Domain on Vercel

1. Go to your project settings in Vercel dashboard
2. Navigate to "Domains" section
3. Add your domain and follow DNS configuration instructions
4. Wait for DNS propagation (usually 24-48 hours)

### AWS Amplify Deployment

1. Install Amplify CLI:
```bash
npm install -g @aws-amplify/cli
```

2. Configure Amplify:
```bash
amplify configure
```

3. Initialize Amplify in your project:
```bash
amplify init
```

4. Add hosting:
```bash
amplify add hosting
```

5. Push changes:
```bash
amplify push
```

6. Publish:
```bash
amplify publish
```

#### Custom Domain on Amplify

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Domain Management"
4. Click "Add Domain"
5. Follow the domain verification process
6. Update your domain's DNS settings as instructed

## Project Structure

- `/app`: Next.js app router pages and API routes
- `/components`: Reusable React components
- `/lib`: Utility functions and configurations
- `/public`: Static assets
- `/styles`: Global styles and Tailwind configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
