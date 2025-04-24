#!/bin/bash

# Configuration
INSTANCES=${1:-200}
GITHUB_TOKEN=${GITHUB_TOKEN:-""}
NAMESPACE=${NAMESPACE:-"default"}
RELEASE_NAME=${RELEASE_NAME:-"bolt-diy"}
DOMAIN=${DOMAIN:-"bolt.example.com"}

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo "Helm is not installed. Please install Helm first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Warning: GITHUB_TOKEN not set. Git functionality may be limited."
fi

# Create values file
TMP_VALUES_FILE=$(mktemp)
cat > $TMP_VALUES_FILE << EOF
replicaCount: $INSTANCES

ingress:
  enabled: true
  hosts:
    - host: $DOMAIN
      paths:
        - path: /
          pathType: Prefix

secretEnv:
  GITHUB_ACCESS_TOKEN: "$GITHUB_TOKEN"
  VITE_GITHUB_ACCESS_TOKEN: "$GITHUB_TOKEN"
  OPENAI_API_KEY: "${OPENAI_API_KEY:-""}"
  ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY:-""}"
EOF

# Deploy using Helm
echo "Deploying $INSTANCES instances using Helm..."
helm upgrade --install $RELEASE_NAME ./helm/bolt-diy \
  --namespace $NAMESPACE \
  --create-namespace \
  -f $TMP_VALUES_FILE

# Clean up
rm $TMP_VALUES_FILE

echo "Deployment initiated. Check status with: helm status $RELEASE_NAME -n $NAMESPACE"