import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';

const rootDir = process.cwd();
const servicesDir = path.join(rootDir, 'services');
const buildDir = path.join(rootDir, 'build');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const services = fs.readdirSync(servicesDir).filter(file => {
  return fs.statSync(path.join(servicesDir, file)).isDirectory();
});

console.log(`====================================================`);
console.log(`📦 Packaging Lambda Microservices for Deployment`);
console.log(`====================================================`);
console.log(`Found ${services.length} services: ${services.join(', ')}\n`);

async function packageService(serviceName) {
  const servicePath = path.join(servicesDir, serviceName);
  const zipPath = path.join(buildDir, `${serviceName}.zip`);

  console.log(`Processing service: ${serviceName}...`);

  if (fs.existsSync(path.join(servicePath, 'package.json'))) {
    console.log(`  -> Installing production dependencies in ${serviceName}...`);
    try {
      execSync('npm ci --only=production --ignore-scripts', { cwd: servicePath, stdio: 'inherit' });
    } catch (e) {
      console.log(`  ⚠️ npm ci failed in ${serviceName}, falling back to npm install...`);
      execSync('npm install --only=production --ignore-scripts', { cwd: servicePath, stdio: 'inherit' });
    }
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`  ✅ Successfully created ${serviceName}.zip (${(archive.pointer() / 1024).toFixed(2)} KB)\n`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error(`  ❌ Error archiving ${serviceName}:`, err);
      reject(err);
    });

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: servicePath,
      ignore: ['node_modules/.bin/**', '*.test.js', '*.spec.js', '.git/**']
    });
    archive.finalize();
  });
}

async function run() {
  for (const service of services) {
    try {
      await packageService(service);
    } catch (err) {
      console.error(`  ❌ Failed to package ${service}:`, err.message);
      process.exit(1);
    }
  }
  console.log(`🎉 All ${services.length} services packaged successfully in ./build/`);
}

run();
