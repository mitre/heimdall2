import React from 'react';
import { render, Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import prompts from 'prompts';
import { writeFileSync } from 'fs';
import { randomBytes } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupCommand(options: any) {
  console.log('🔧 Heimdall Development Environment Setup\n');

  let config: any;

  if (options.nonInteractive) {
    // Use CLI flags or defaults
    config = {
      database_host: options.host,
      database_port: options.port,
      database_name: 'heimdall-server-dev',
      database_username: 'postgres',
      database_password: options.password,
      jwt_expire_time: '1d',
      nginx_host: 'localhost'
    };
  } else {
    // Interactive prompts
    config = await prompts([
      {
        type: 'text',
        name: 'database_host',
        message: 'Database host',
        initial: 'localhost'
      },
      {
        type: 'number',
        name: 'database_port',
        message: 'Database port',
        initial: 5433
      },
      {
        type: 'text',
        name: 'database_name',
        message: 'Database name',
        initial: 'heimdall-server-dev'
      },
      {
        type: 'text',
        name: 'database_username',
        message: 'Database username',
        initial: 'postgres'
      },
      {
        type: 'password',
        name: 'database_password',
        message: 'Database password',
        initial: 'postgres'
      },
      {
        type: 'text',
        name: 'jwt_expire_time',
        message: 'JWT expiration time',
        initial: '1d'
      },
      {
        type: 'text',
        name: 'nginx_host',
        message: 'NGINX host',
        initial: 'localhost'
      }
    ]);
  }

  // Generate secrets
  const jwtSecret = randomBytes(64).toString('hex');
  const apiKeySecret = randomBytes(33).toString('hex');

  // Create .env content
  const envContent = `# Node Environment
NODE_ENV=development

# Database Configuration (used by Docker Compose and Backend)
DATABASE_HOST=${config.database_host}
DATABASE_PORT=${config.database_port}
DATABASE_NAME=${config.database_name}
DATABASE_USERNAME=${config.database_username}
DATABASE_PASSWORD=${config.database_password}

# Backend Security Secrets
JWT_EXPIRE_TIME=${config.jwt_expire_time}
JWT_SECRET=${jwtSecret}
API_KEY_SECRET=${apiKeySecret}

# Docker Compose
NGINX_HOST=${config.nginx_host}
`;

  // Write to apps/backend/.env
  const envPath = path.resolve(__dirname, '../../../backend/.env');
  writeFileSync(envPath, envContent);

  console.log('\n✅ Created apps/backend/.env');
  console.log('📝 Generated JWT_SECRET and API_KEY_SECRET');
  console.log('\n📋 Next steps:');
  console.log('  1. heimdall db:init    # Create and seed database');
  console.log('  2. heimdall dev        # Start development servers');
}
