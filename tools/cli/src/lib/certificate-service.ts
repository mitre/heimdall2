import * as fs from 'fs-extra';
import * as path from 'path';
import { DockerService } from './docker-service';
import { execa } from 'execa';

/**
 * Certificate management service for handling both:
 * 1. Proxy SSL certificates (for HTTPS access to the proxy)
 * 2. CA certificates (for trusting external connections within containers)
 */
export class CertificateService {
  private projectDir: string;
  private certsDir: string;
  private nginxCertsDir: string;

  /**
   * Create a new CertificateService
   * 
   * @param docker Docker service for container operations
   * @param projectDir Optional project directory path (defaults to current directory)
   */
  constructor(
    private docker: DockerService,
    projectDir?: string
  ) {
    this.projectDir = projectDir || process.cwd();
    this.certsDir = path.join(this.projectDir, 'certs');
    this.nginxCertsDir = path.join(this.projectDir, 'data', 'nginx', 'certs');
  }

  /**
   * Check the status of proxy SSL certificates
   * 
   * @returns Certificate status information
   */
  async checkProxyCertStatus() {
    const nginxCertPath = path.join(this.nginxCertsDir, 'ssl_certificate.crt');
    const nginxKeyPath = path.join(this.nginxCertsDir, 'ssl_certificate_key.key');
    
    const hasCerts = fs.existsSync(nginxCertPath) && fs.existsSync(nginxKeyPath);
    
    // Get certificate info if available
    let certInfo = null;
    if (hasCerts) {
      try {
        const { stdout } = await execa('openssl', [
          'x509', '-noout', '-subject', '-issuer', '-enddate',
          '-in', nginxCertPath
        ]);
        certInfo = stdout;
      } catch (error) {
        // Handle openssl not available or other errors
        console.error('Error getting certificate info:', error);
      }
    }
    
    return {
      hasCerts,
      certInfo,
      nginxCertPath,
      nginxKeyPath
    };
  }
  
  /**
   * Check the status of custom CA certificates
   * 
   * @returns CA certificates status information
   */
  async checkCACertStatus() {
    // Ensure the directory exists
    await fs.ensureDir(this.certsDir);
    
    // Find all certificate files
    const certs = await fs.readdir(this.certsDir).catch(() => []);
    const certFiles = certs.filter(file => 
      file.endsWith('.crt') || 
      file.endsWith('.pem') || 
      file.endsWith('.cert')
    );
    
    // Get certificate info for each certificate
    const certDetails = [];
    for (const cert of certFiles) {
      const certPath = path.join(this.certsDir, cert);
      try {
        const { stdout } = await execa('openssl', [
          'x509', '-noout', '-subject', '-issuer', '-enddate',
          '-in', certPath
        ]);
        
        certDetails.push({
          filename: cert,
          path: certPath,
          info: stdout
        });
      } catch (error) {
        certDetails.push({
          filename: cert,
          path: certPath,
          info: null,
          error: error.message
        });
      }
    }
    
    // Check if SSL_CERT_FILE environment variable is set
    const sslCertFile = process.env.SSL_CERT_FILE || null;
    
    return {
      certCount: certFiles.length,
      certFiles,
      certDetails,
      certsDir: this.certsDir,
      sslCertFile
    };
  }
  
  /**
   * Generate self-signed SSL certificates for the proxy
   * 
   * @returns True if certificates were generated successfully
   * @throws Error if certificate generation fails
   */
  async generateProxyCertificates(): Promise<boolean> {
    // Ensure directories exist
    await fs.ensureDir(this.nginxCertsDir);
    
    const certPath = path.join(this.nginxCertsDir, 'ssl_certificate.crt');
    const keyPath = path.join(this.nginxCertsDir, 'ssl_certificate_key.key');
    
    // Generate self-signed certificate
    try {
      await execa('openssl', [
        'req', '-x509', '-nodes', '-days', '365', '-newkey', 'rsa:2048',
        '-keyout', keyPath,
        '-out', certPath,
        '-subj', '/C=US/ST=Localhost/L=Localhost/O=Heimdall Development/CN=localhost',
        '-addext', 'subjectAltName = DNS:localhost,IP:127.0.0.1'
      ]);
      
      // Set proper permissions
      await fs.chmod(certPath, 0o644);
      await fs.chmod(keyPath, 0o600);
      
      // Create a README file if it doesn't exist
      const readmePath = path.join(this.nginxCertsDir, 'README.md');
      if (!fs.existsSync(readmePath)) {
        await fs.writeFile(readmePath, `# Nginx SSL Certificates Directory

Place your SSL certificate and private key files in this directory to enable HTTPS.

## Required Files

1. \`ssl_certificate.crt\` - Your SSL certificate (or bundle)
2. \`ssl_certificate_key.key\` - Your private key file

## SSL Certificate Types

You can use:
- Self-signed certificates (for development)
- Organization certificates (internal CA)
- Commercial certificates (public CA)

## Generating Self-Signed Certificates

For development, you can generate self-signed certificates using:
\`\`\`bash
heimdall cert generate
\`\`\`

## Security Notes

1. Protect your private key file
2. For production, use proper certificates
3. Never commit sensitive keys to version control
`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to generate certificates: ${error.message}`);
    }
  }
  
  /**
   * Install custom CA certificates into containers
   * 
   * @param containerNames Container names to install certificates into
   * @returns Result of the installation operation
   */
  async installCAcerts(containerNames: string[] = []): Promise<{
    success: boolean;
    containersUpdated: string[];
    errors: any[];
  }> {
    const results = {
      success: true,
      containersUpdated: [],
      errors: []
    };
    
    // If no specific containers, update all running containers
    if (containerNames.length === 0) {
      containerNames = ['heimdall-app', 'heimdall-db', 'heimdall-proxy'];
    }
    
    // Check if we have any certificates to install
    const caStatus = await this.checkCACertStatus();
    if (caStatus.certCount === 0) {
      throw new Error('No CA certificates found in certs directory. Add .crt or .pem files first.');
    }
    
    // For each container, copy and install certificates
    for (const containerName of containerNames) {
      try {
        // Check if container exists and is running
        const containerStatus = await this.docker.getContainerStatus(containerName);
        if (containerStatus !== 'running') {
          results.errors.push({
            container: containerName,
            error: `Container is not running (status: ${containerStatus})`
          });
          results.success = false;
          continue;
        }
        
        // Create a temp directory to store certificates for copying to container
        const tempDir = path.join(this.projectDir, '.temp-certs');
        await fs.ensureDir(tempDir);
        
        // Copy all certificates to the temp directory
        for (const cert of caStatus.certFiles) {
          await fs.copy(
            path.join(this.certsDir, cert),
            path.join(tempDir, cert)
          );
        }
        
        // Determine container type and platform
        // This is a simplified version - in a real implementation, you'd check the OS type
        const { output: osOutput } = await this.docker.execCommand(containerName, ['cat', '/etc/os-release']);
        const isDebian = osOutput.includes('debian') || osOutput.includes('ubuntu');
        const isRHEL = osOutput.includes('rhel') || osOutput.includes('centos') || osOutput.includes('fedora');
        
        let installCmd;
        if (isDebian) {
          installCmd = 'mkdir -p /usr/local/share/ca-certificates && cp /*.crt /usr/local/share/ca-certificates/ && update-ca-certificates';
        } else if (isRHEL) {
          installCmd = 'mkdir -p /etc/pki/ca-trust/source/anchors && cp /*.crt /etc/pki/ca-trust/source/anchors/ && update-ca-trust';
        } else {
          // Default to copying to multiple locations to maximize compatibility
          installCmd = 'mkdir -p /usr/local/share/ca-certificates /etc/pki/ca-trust/source/anchors && ' +
                      'cp /*.crt /usr/local/share/ca-certificates/ 2>/dev/null || true && ' +
                      'cp /*.crt /etc/pki/ca-trust/source/anchors/ 2>/dev/null || true && ' +
                      'update-ca-certificates 2>/dev/null || update-ca-trust 2>/dev/null || echo "No certificate update command found"';
        }
        
        // Execute the certificate installation command
        const { exitCode } = await this.docker.execCommand(containerName, ['bash', '-c', installCmd]);
        
        if (exitCode === 0) {
          results.containersUpdated.push(containerName);
        } else {
          results.errors.push({
            container: containerName,
            error: 'Failed to update CA certificates'
          });
          results.success = false;
        }
        
        // Clean up temp directory
        await fs.remove(tempDir);
      } catch (error) {
        results.errors.push({
          container: containerName,
          error: error.message
        });
        results.success = false;
      }
    }
    
    return results;
  }
  
  /**
   * Create directory structure for nginx certs
   */
  async createProxyCertDirs() {
    await fs.ensureDir(this.nginxCertsDir);
    
    // Ensure proper symlinks (for backward compatibility)
    const nginxDir = path.join(this.projectDir, 'nginx');
    await fs.ensureDir(nginxDir);
    
    // Create symlink for certs directory
    const nginxCertsSymlink = path.join(nginxDir, 'certs');
    const nginxConfSymlink = path.join(nginxDir, 'conf');
    
    // Remove existing and create symlinks
    if (fs.existsSync(nginxCertsSymlink) && !fs.lstatSync(nginxCertsSymlink).isSymbolicLink()) {
      await fs.remove(nginxCertsSymlink);
    }
    
    if (!fs.existsSync(nginxCertsSymlink)) {
      try {
        await fs.symlink(this.nginxCertsDir, nginxCertsSymlink);
      } catch (error) {
        console.error('Failed to create symlink:', error);
      }
    }
    
    // Create conf directory symlink
    const nginxConfDir = path.join(this.projectDir, 'data', 'nginx', 'conf');
    await fs.ensureDir(nginxConfDir);
    
    if (fs.existsSync(nginxConfSymlink) && !fs.lstatSync(nginxConfSymlink).isSymbolicLink()) {
      // Copy existing files before removing
      if (fs.existsSync(nginxConfSymlink)) {
        const files = fs.readdirSync(nginxConfSymlink);
        for (const file of files) {
          await fs.copy(
            path.join(nginxConfSymlink, file),
            path.join(nginxConfDir, file),
            { overwrite: false }
          );
        }
      }
      await fs.remove(nginxConfSymlink);
    }
    
    if (!fs.existsSync(nginxConfSymlink)) {
      try {
        await fs.symlink(nginxConfDir, nginxConfSymlink);
      } catch (error) {
        console.error('Failed to create symlink:', error);
      }
    }
    
    // Set directory permissions
    await fs.chmod(nginxConfDir, 0o755);
    await fs.chmod(this.nginxCertsDir, 0o755);
  }
}