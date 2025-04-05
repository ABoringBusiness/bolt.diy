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