# Bolt.DIY Server Deployment

This guide provides quick instructions for deploying Bolt.DIY on a server to enable full Git functionality.

## Quick Start

### Single Server Deployment

```bash
# Clone the repository
git clone https://github.com/ABoringBusiness/bolt.diy.git
cd bolt.diy

# Set your GitHub token
export GITHUB_TOKEN=your_github_token

# Deploy a single instance
./deploy.sh 1
```

### Multiple Instances (Docker Swarm)

```bash
# Initialize Docker Swarm
docker swarm init

# Create environment file
echo "GITHUB_ACCESS_TOKEN=$GITHUB_TOKEN" > .env.local
echo "VITE_GITHUB_ACCESS_TOKEN=$GITHUB_TOKEN" >> .env.local

# Deploy the stack
docker stack deploy -c docker-stack.yml bolt

# Scale to desired number of instances
docker service scale bolt_bolt=10
```

### Large-Scale Deployment (Kubernetes)

```bash
# Create GitHub token secret
kubectl create secret generic bolt-secrets \
  --from-literal=github-token=$GITHUB_TOKEN

# Apply the deployment configuration
kubectl apply -f kubernetes/deployment.yaml
```

## Server-Side Git Implementation

This deployment includes a server-side Git implementation that enables proper Git functionality by:

1. Cloning repositories on the server using native Git
2. Processing repository files server-side
3. Returning only the necessary files to the client

This approach bypasses the browser environment limitations that prevent GitHub imports from working in browser-only environments like bolt.new.

## Scaling to 200 Instances

For large-scale deployments (200+ instances), we recommend:

1. Using Kubernetes with horizontal pod autoscaling
2. Implementing a proper load balancing strategy
3. Setting up centralized logging and monitoring
4. Using a distributed file system for shared storage

See the full [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Monitoring

Access the health endpoint to check instance status:

```
http://your-server:5173/health
```

This returns:
```json
{
  "status": "ok",
  "version": "0.0.7",
  "instanceId": "1",
  "uptime": 3600000,
  "timestamp": "2025-04-05T12:34:56.789Z"
}
```

## Security Considerations

1. Store GitHub tokens securely using environment variables or secrets
2. Implement proper rate limiting for the Git API
3. Use HTTPS for all traffic
4. Regularly rotate credentials

For more detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).