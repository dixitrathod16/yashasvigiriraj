/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

/**
 * List all users from ApprovedRegistrations.json
 * Useful for finding user IDs to test with
 */

const DATA_FILE = './ApprovedRegistrations.json';

try {
  const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  console.log(`\nTotal users: ${users.length}\n`);
  
  // Show first 20 users
  console.log('First 20 users:');
  console.log('─'.repeat(80));
  console.log('ID'.padEnd(15) + 'Name'.padEnd(35) + 'Age'.padEnd(5) + 'Gender'.padEnd(8) + 'Photo');
  console.log('─'.repeat(80));
  
  users.slice(0, 20).forEach(user => {
    const hasIdPhoto = user.idPhotoKey ? '✓ idPhoto' : '';
    const hasPhoto = user.photoKey ? '✓ photo' : '';
    const photoStatus = hasIdPhoto || hasPhoto || '✗ no photo';
    
    console.log(
      user.id.padEnd(15) +
      (user.fullName || '').substring(0, 33).padEnd(35) +
      (user.age || '').padEnd(5) +
      (user.gender || '').padEnd(8) +
      photoStatus
    );
  });
  
  console.log('─'.repeat(80));
  console.log(`\nShowing 20 of ${users.length} users`);
  
  // Statistics
  const withIdPhoto = users.filter(u => u.idPhotoKey && u.idPhotoKey.trim() !== '').length;
  const withPhoto = users.filter(u => u.photoKey && u.photoKey.trim() !== '').length;
  const withEitherPhoto = users.filter(u => 
    (u.idPhotoKey && u.idPhotoKey.trim() !== '') || 
    (u.photoKey && u.photoKey.trim() !== '')
  ).length;
  
  console.log('\nPhoto Statistics:');
  console.log(`  Users with idPhotoKey: ${withIdPhoto}`);
  console.log(`  Users with photoKey: ${withPhoto}`);
  console.log(`  Users with any photo: ${withEitherPhoto}`);
  console.log(`  Users without photo: ${users.length - withEitherPhoto}`);
  
  // Sample IDs for testing
  console.log('\nSample IDs for testing:');
  const samplesWithIdPhoto = users.filter(u => u.idPhotoKey).slice(0, 3);
  const samplesWithPhoto = users.filter(u => u.photoKey && !u.idPhotoKey).slice(0, 2);
  
  console.log('\n  With idPhotoKey:');
  samplesWithIdPhoto.forEach(u => {
    console.log(`    npm run generate-single ${u.id}  # ${u.fullName}`);
  });
  
  if (samplesWithPhoto.length > 0) {
    console.log('\n  With photoKey only:');
    samplesWithPhoto.forEach(u => {
      console.log(`    npm run generate-single ${u.id}  # ${u.fullName}`);
    });
  }
  
  console.log('\n');
  
} catch (err) {
  console.error('Error reading user data:', err.message);
  process.exit(1);
}
