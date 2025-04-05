#!/bin/bash

# Configuration
INSTANCES=${1:-200}
GITHUB_TOKEN=${GITHUB_TOKEN:-""}
DATACENTER=${DATACENTER:-"dc1"}

# Check if Nomad is installed
if ! command -v nomad &> /dev/null; then
    echo "Nomad is not installed. Please install Nomad first."
    exit 1
fi

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Warning: GITHUB_TOKEN not set. Git functionality may be limited."
fi

# Check if Vault is installed and store secrets
if command -v vault &> /dev/null; then
    echo "Storing secrets in Vault..."
    vault kv put secret/bolt-diy \
        github_token="$GITHUB_TOKEN" \
        openai_key="${OPENAI_API_KEY:-""}" \
        anthropic_key="${ANTHROPIC_API_KEY:-""}"
else
    echo "Vault not found. Secrets will be passed directly to Nomad."
fi

# Create a temporary Nomad job file with the correct instance count
TMP_JOB_FILE=$(mktemp)
cat nomad/bolt.nomad.hcl | sed "s/count = 200/count = $INSTANCES/" | sed "s/datacenters = \[\"dc1\"\]/datacenters = \[\"$DATACENTER\"\]/" > $TMP_JOB_FILE

# Deploy to Nomad
echo "Deploying $INSTANCES instances to Nomad..."
nomad job run $TMP_JOB_FILE

# Clean up
rm $TMP_JOB_FILE

echo "Deployment initiated. Check status with: nomad job status bolt-diy"