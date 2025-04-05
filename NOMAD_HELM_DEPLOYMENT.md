# Bolt.DIY Deployment with Nomad and Helm

This guide provides instructions for deploying Bolt.DIY using HashiCorp Nomad and Helm charts.

## Nomad Deployment

[HashiCorp Nomad](https://www.nomadproject.io/) is a flexible workload orchestrator that enables an organization to easily deploy and manage any containerized or legacy application using a single, unified workflow.

### Prerequisites

- Nomad cluster (version 1.4.0+)
- Consul for service discovery
- Docker for container runtime
- Vault for secrets management (optional but recommended)

### Deployment Steps

1. **Configure Vault for Secrets (Optional but Recommended)**

   ```bash
   # Store GitHub token and other sensitive data in Vault
   vault kv put secret/bolt-diy \
     github_token=your_github_token \
     openai_key=your_openai_key \
     anthropic_key=your_anthropic_key
   ```

2. **Deploy the Nomad Job**

   ```bash
   # Deploy the job
   nomad job run nomad/bolt.nomad.hcl
   
   # Verify the deployment
   nomad job status bolt-diy
   ```

3. **Scale the Deployment**

   ```bash
   # Scale to a specific count
   nomad job scale bolt-diy bolt-app 100
   ```

### Using Waypoint with Nomad

[Waypoint](https://www.waypointproject.io/) provides a consistent workflow to build, deploy, and release applications across any platform.

1. **Install Waypoint**

   ```bash
   curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
   sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
   sudo apt-get update && sudo apt-get install waypoint
   ```

2. **Initialize Waypoint**

   ```bash
   waypoint init
   ```

3. **Deploy with Waypoint**

   ```bash
   waypoint up
   ```

4. **View Deployment Status**

   ```bash
   waypoint status
   ```

## Helm Chart Deployment

[Helm](https://helm.sh/) is the package manager for Kubernetes that helps you define, install, and upgrade Kubernetes applications.

### Prerequisites

- Kubernetes cluster (version 1.19+)
- Helm (version 3.0+)
- kubectl configured to communicate with your cluster

### Deployment Steps

1. **Configure Values**

   Create a custom values file (`my-values.yaml`) to override default settings:

   ```yaml
   replicaCount: 50  # Start with 50 instances

   ingress:
     hosts:
       - host: bolt.yourdomain.com
         paths:
           - path: /
             pathType: Prefix

   secretEnv:
     GITHUB_ACCESS_TOKEN: "your_github_token"
     VITE_GITHUB_ACCESS_TOKEN: "your_github_token"
     OPENAI_API_KEY: "your_openai_key"
     ANTHROPIC_API_KEY: "your_anthropic_key"
   ```

2. **Install the Helm Chart**

   ```bash
   # Add the Helm repository (if hosted in a repository)
   # helm repo add bolt-repo https://your-helm-repo.example.com
   # helm repo update

   # Install from local chart
   helm install bolt-diy ./helm/bolt-diy -f my-values.yaml
   ```

3. **Verify the Deployment**

   ```bash
   # Check deployment status
   helm status bolt-diy
   
   # Check pods
   kubectl get pods -l app.kubernetes.io/name=bolt-diy
   ```

4. **Scale the Deployment**

   ```bash
   # Scale manually
   kubectl scale deployment bolt-diy --replicas=200
   
   # The HorizontalPodAutoscaler will automatically scale between 
   # minReplicas and maxReplicas based on CPU/memory usage
   ```

5. **Upgrade the Deployment**

   ```bash
   # Update values and upgrade
   helm upgrade bolt-diy ./helm/bolt-diy -f my-values.yaml
   ```

## Scaling to 200 Instances

Both Nomad and Kubernetes (with Helm) support scaling to 200 instances. Here are some considerations:

### Resource Planning

For 200 instances with the recommended resources:
- CPU: 200 × 0.5 cores = 100 CPU cores
- Memory: 200 × 512 MB = 100 GB RAM

Ensure your infrastructure can handle this load.

### Load Balancing

- **Nomad**: Uses Consul for service discovery and Nginx/Traefik for load balancing
- **Kubernetes**: Uses Service/Ingress resources for load balancing

### Monitoring

Set up proper monitoring for both platforms:

- **Nomad**: Prometheus + Grafana with Nomad exporters
- **Kubernetes**: Prometheus Operator + Grafana

### Autoscaling

Both platforms support autoscaling:

- **Nomad**: Uses the scaling stanza with Prometheus metrics
- **Kubernetes**: Uses HorizontalPodAutoscaler with CPU/memory metrics

## Troubleshooting

### Nomad

```bash
# Check job status
nomad job status bolt-diy

# View allocation logs
nomad alloc logs -f <allocation_id>

# Check Consul service health
consul catalog services
consul health service bolt-diy
```

### Kubernetes/Helm

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=bolt-diy

# View pod logs
kubectl logs -l app.kubernetes.io/name=bolt-diy

# Check service and ingress
kubectl get svc,ing -l app.kubernetes.io/name=bolt-diy
```

## Additional Resources

- [Nomad Documentation](https://www.nomadproject.io/docs)
- [Waypoint Documentation](https://www.waypointproject.io/docs)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)