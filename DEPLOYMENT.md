# Bolt.DIY Server Deployment Guide

This guide provides instructions for deploying Bolt.DIY on servers to enable full Git functionality and scale to multiple instances.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Single Server Deployment](#single-server-deployment)
- [Scaling to Multiple Instances](#scaling-to-multiple-instances)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Server-Side Git Implementation](#server-side-git-implementation)
- [Monitoring and Management](#monitoring-and-management)
- [Security Considerations](#security-considerations)

## Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (for multi-instance deployment)
- GitHub Personal Access Token with appropriate permissions
- Domain name and SSL certificates (for production)

## Single Server Deployment

### Option 1: Using Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/ABoringBusiness/bolt.diy.git
   cd bolt.diy
   ```

2. Create a `.env.local` file with required environment variables:
   ```bash
   # GitHub Authentication
   GITHUB_ACCESS_TOKEN=your_github_token
   VITE_GITHUB_ACCESS_TOKEN=your_github_token
   
   # Optional: LLM API Keys
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   # Add other API keys as needed
   ```

3. Build and start the container:
   ```bash
   docker-compose --profile production up -d
   ```

4. Access the application at `http://localhost:5173`

### Option 2: Direct Server Deployment

1. Install dependencies:
   ```bash
   # Install Node.js (v18+) and git
   apt-get update
   apt-get install -y nodejs npm git
   
   # Install pnpm
   npm install -g pnpm
   ```

2. Clone and set up the repository:
   ```bash
   git clone https://github.com/ABoringBusiness/bolt.diy.git
   cd bolt.diy
   
   # Create environment file
   echo "GITHUB_ACCESS_TOKEN=your_github_token" > .env.local
   echo "VITE_GITHUB_ACCESS_TOKEN=your_github_token" >> .env.local
   
   # Install dependencies
   pnpm install
   ```

3. Build and run the application:
   ```bash
   # Build the application
   pnpm run build
   
   # Start the server
   pnpm run start:unix
   ```

## Scaling to Multiple Instances

### Docker Swarm Deployment

Docker Swarm provides a simple way to scale to multiple instances:

1. Initialize a Docker Swarm:
   ```bash
   docker swarm init
   ```

2. Create a `docker-stack.yml` file:
   ```yaml
   version: '3.8'
   
   services:
     bolt:
       image: bolt-ai:production
       build:
         context: .
         dockerfile: Dockerfile
         target: bolt-ai-production
       ports:
         - "5173:5173"
       env_file: .env.local
       deploy:
         replicas: 5  # Adjust as needed
         update_config:
           parallelism: 2
           delay: 10s
         restart_policy:
           condition: on-failure
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:5173/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   
     nginx:
       image: nginx:latest
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf:ro
         - ./ssl:/etc/nginx/ssl:ro
       depends_on:
         - bolt
       deploy:
         replicas: 1
   ```

3. Create an Nginx configuration for load balancing:
   ```nginx
   # nginx.conf
   events {
     worker_connections 1024;
   }
   
   http {
     upstream bolt_servers {
       server bolt:5173;
     }
     
     server {
       listen 80;
       server_name your-domain.com;
       
       location / {
         proxy_pass http://bolt_servers;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
       }
     }
   }
   ```

4. Deploy the stack:
   ```bash
   docker stack deploy -c docker-stack.yml bolt
   ```

5. Scale the service:
   ```bash
   docker service scale bolt_bolt=10
   ```

## Kubernetes Deployment

For large-scale deployments (200+ instances), Kubernetes is recommended:

1. Create a `deployment.yaml` file:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: bolt-diy
   spec:
     replicas: 200  # Scale to 200 instances
     selector:
       matchLabels:
         app: bolt-diy
     template:
       metadata:
         labels:
           app: bolt-diy
       spec:
         containers:
         - name: bolt-diy
           image: bolt-ai:production
           ports:
           - containerPort: 5173
           env:
           - name: GITHUB_ACCESS_TOKEN
             valueFrom:
               secretKeyRef:
                 name: bolt-secrets
                 key: github-token
           # Add other environment variables as needed
           resources:
             limits:
               cpu: "1"
               memory: "1Gi"
             requests:
               cpu: "500m"
               memory: "512Mi"
           livenessProbe:
             httpGet:
               path: /health
               port: 5173
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /health
               port: 5173
             initialDelaySeconds: 5
             periodSeconds: 5
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: bolt-diy-service
   spec:
     selector:
       app: bolt-diy
     ports:
     - port: 80
       targetPort: 5173
     type: LoadBalancer
   ```

2. Create a secret for sensitive information:
   ```bash
   kubectl create secret generic bolt-secrets \
     --from-literal=github-token=your_github_token \
     --from-literal=openai-key=your_openai_key
   ```

3. Apply the configuration:
   ```bash
   kubectl apply -f deployment.yaml
   ```

4. Set up horizontal pod autoscaling:
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: bolt-diy-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: bolt-diy
     minReplicas: 50
     maxReplicas: 250
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
   ```

## Server-Side Git Implementation

To enable proper Git functionality, add a server-side Git API:

1. Create a new file `app/routes/api.server-git.ts`:

```typescript
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
```

2. Update the client-side code in `app/components/git/GitUrlImport.client.tsx`:

```typescript
// Modify the importRepo function
const importRepo = async (repoUrl?: string) => {
  if (!repoUrl) {
    return;
  }

  setLoading(true);

  try {
    // Use the server-side Git API
    const response = await fetch('/api/server-git', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to import repository');
    }
    
    const { files, skippedFiles, totalSize, repoUrl: clonedRepoUrl } = await response.json();
    
    if (importChat) {
      const fileContents = files.map(file => ({
        path: file.path,
        content: file.content
      }));
      
      const commands = await detectProjectCommands(fileContents);
      const commandsMessage = createCommandsMessage(commands);
      
      const filesMessage = {
        role: 'assistant',
        content: `Cloning the repo ${clonedRepoUrl}
${skippedFiles.length > 0 ? `\nSkipped files (${skippedFiles.length}):\n${skippedFiles.map(f => `- ${f}`).join('\n')}` : ''}

<boltArtifact id="imported-files" title="Git Cloned Files" type="bundled">
${fileContents.map(file => 
  `<boltAction type="file" filePath="${file.path}">
${escapeBoltTags(file.content)}
</boltAction>`).join('\n')}
</boltArtifact>`,
        id: generateId(),
        createdAt: new Date(),
      };
      
      const messages = [filesMessage];
      
      if (commandsMessage) {
        messages.push({
          role: 'user',
          id: generateId(),
          content: 'Setup the codebase and Start the application',
        });
        messages.push(commandsMessage);
      }
      
      await importChat(`Git Project:${clonedRepoUrl.split('/').slice(-1)[0]}`, messages, { gitUrl: clonedRepoUrl });
    }
  } catch (error) {
    console.error('Error during import:', error);
    toast.error(`Failed to import repository: ${error.message || 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};
```

## Monitoring and Management

For managing 200+ instances, implement proper monitoring:

1. **Prometheus and Grafana**:
   - Add a `/metrics` endpoint to the application
   - Deploy Prometheus to collect metrics
   - Set up Grafana dashboards for visualization

2. **Centralized Logging**:
   - Implement ELK stack (Elasticsearch, Logstash, Kibana)
   - Configure log forwarding from all instances

3. **Health Checks**:
   - Add a `/health` endpoint to the application
   - Implement both liveness and readiness probes

## Security Considerations

1. **GitHub Token Security**:
   - Use environment variables for tokens
   - Consider using GitHub Apps instead of personal access tokens
   - Implement token rotation

2. **Rate Limiting**:
   - Add rate limiting to the Git API endpoints
   - Implement IP-based rate limiting for public instances

3. **Resource Management**:
   - Set resource limits for containers
   - Implement auto-scaling based on resource usage

4. **Network Security**:
   - Use a private network for communication between instances
   - Implement a Web Application Firewall (WAF)
   - Use HTTPS for all traffic

## Automation Scripts

### Deployment Script

Create a `deploy.sh` script for easy deployment:

```bash
#!/bin/bash

# Configuration
INSTANCES=${1:-1}
BASE_PORT=5173
GITHUB_TOKEN=${GITHUB_TOKEN:-""}

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Warning: GITHUB_TOKEN not set. Git functionality may be limited."
fi

# Create .env.local file
cat > .env.local << EOF
GITHUB_ACCESS_TOKEN=$GITHUB_TOKEN
VITE_GITHUB_ACCESS_TOKEN=$GITHUB_TOKEN
EOF

# Build the Docker image
docker build -t bolt-ai:production --target bolt-ai-production .

# Deploy instances
for i in $(seq 1 $INSTANCES); do
  PORT=$((BASE_PORT + i - 1))
  CONTAINER_NAME="bolt-instance-$i"
  
  echo "Starting instance $i on port $PORT..."
  docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:5173 \
    --env-file .env.local \
    -e INSTANCE_ID=$i \
    bolt-ai:production
done

echo "Deployed $INSTANCES instances of Bolt.DIY"
echo "Access the first instance at http://localhost:$BASE_PORT"
```

Make the script executable:
```bash
chmod +x deploy.sh
```

Usage:
```bash
# Deploy 5 instances
./deploy.sh 5

# Deploy 200 instances (for large servers)
./deploy.sh 200
```