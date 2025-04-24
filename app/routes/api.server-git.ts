import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import ignore from 'ignore';

const execAsync = promisify(exec);

// Define ignore patterns for repository files
const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yaml',
];

const MAX_FILE_SIZE = 100 * 1024; // 100KB limit per file
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total limit

export async function action({ request }: ActionFunctionArgs) {
  const { repoUrl } = await request.json();
  
  if (!repoUrl) {
    return json({ error: 'Repository URL is required' }, { status: 400 });
  }
  
  try {
    // Create a unique temporary directory
    const tempDir = path.join(process.cwd(), 'tmp', Date.now().toString());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Clone the repository
    const gitToken = process.env.GITHUB_ACCESS_TOKEN;
    let cloneUrl = repoUrl;
    
    // Add token to URL if it's a GitHub repository
    if (gitToken && repoUrl.includes('github.com')) {
      const urlObj = new URL(repoUrl);
      urlObj.username = gitToken;
      cloneUrl = urlObj.toString();
    }
    
    await execAsync(`git clone --depth 1 ${cloneUrl} ${tempDir}`);
    
    // Read repository files
    const ig = ignore().add(IGNORE_PATTERNS);
    const files = [];
    let totalSize = 0;
    const skippedFiles = [];
    
    // Walk through the directory and collect files
    const walkDir = (dir, baseDir = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(baseDir, entry.name);
        
        // Skip ignored files
        if (ig.ignores(relativePath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else {
          try {
            const stats = fs.statSync(fullPath);
            
            // Skip large files
            if (stats.size > MAX_FILE_SIZE) {
              skippedFiles.push(`${relativePath} (too large: ${Math.round(stats.size / 1024)}KB)`);
              continue;
            }
            
            // Check total size limit
            if (totalSize + stats.size > MAX_TOTAL_SIZE) {
              skippedFiles.push(`${relativePath} (would exceed total size limit)`);
              continue;
            }
            
            // Read file content
            const content = fs.readFileSync(fullPath, 'utf8');
            totalSize += stats.size;
            
            files.push({
              path: relativePath,
              content,
              size: stats.size
            });
          } catch (error) {
            skippedFiles.push(`${relativePath} (error: ${error.message})`);
          }
        }
      }
    };
    
    walkDir(tempDir);
    
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    return json({
      success: true,
      files,
      skippedFiles,
      totalSize,
      repoUrl
    });
  } catch (error) {
    console.error('Git clone error:', error);
    return json({
      error: 'Failed to clone repository',
      message: error.message
    }, { status: 500 });
  }
}