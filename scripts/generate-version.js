import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Get git commit hash
  let hash;
  try {
    hash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    // If git is not available, use timestamp
    hash = Date.now().toString(36);
  }

  const version = {
    version: process.env.npm_package_version || '1.0.0',
    buildTime: new Date().toISOString(),
    hash: hash
  };

  const outputPath = join(__dirname, '..', 'public', 'version.json');
  writeFileSync(outputPath, JSON.stringify(version, null, 2));
  
  console.log('✅ Version file generated:', version);
} catch (error) {
  console.error('❌ Failed to generate version file:', error);
  process.exit(1);
}
