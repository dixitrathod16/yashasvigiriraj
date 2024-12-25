import { randomBytes } from 'crypto';

// Generate a 64-byte (512-bit) random key and encode it as base64
const secretKey = randomBytes(64).toString('base64');

console.log('Generated API_SECRET_KEY:');
console.log(secretKey);
console.log('\nAdd this to your .env.local file as:');
console.log(`API_SECRET_KEY="${secretKey}"`);

// Also show how to use it in different environments
console.log('\nFor deployment, you can use:');
console.log('Vercel: Add to Environment Variables in project settings');
console.log('Docker: Add to docker-compose.yml or Dockerfile');
console.log('AWS: Add to Parameter Store or Secrets Manager'); 