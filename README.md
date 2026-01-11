# Kubernetes Notes Application

A full-stack notes application deployed on Kubernetes with MySQL backend.

## 📋 Overview

This application consists of:
- **Backend**: Node.js/Express REST API
- **Database**: MySQL 8.0
- **Infrastructure**: Kubernetes manifests for deployment
- **CI/CD**: GitHub Actions workflow for automated deployment

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose (for local development)
- Kubernetes cluster (for production deployment)
- kubectl configured
- Node.js 18+ (for local development without Docker)

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Backend API: http://localhost:3000
- Frontend: http://localhost:8080 (if configured)

### Local Development without Docker

```bash
# Install dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start MySQL (requires MySQL installed locally)
# Or use docker for just MySQL:
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=mydb mysql:8.0

# Start the backend
npm start
```

## 🔧 Configuration

### Environment Variables

See `backend/.env.example` for all available configuration options:
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database user (default: root)
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (default: mydb)
- `PORT`: Server port (default: 3000)

## 🚢 Kubernetes Deployment

### Prerequisites
1. Kubernetes cluster running
2. kubectl configured
3. Secrets configured (see Security section)

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Configure secrets (see SECURITY.md)
kubectl apply -f k8s/secret.yaml  # ⚠️ See security notes below

# Deploy MySQL
kubectl apply -f k8s/mysql-pvc.yaml
kubectl apply -f k8s/mysql-deployment.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Optional: Configure ingress
kubectl apply -f k8s/ingress.yaml

# Optional: Enable autoscaling
kubectl apply -f k8s/hpa.yaml
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n myapp

# Check services
kubectl get svc -n myapp

# View logs
kubectl logs -n myapp -l app=backend -f
```

## 🔒 Security

⚠️ **IMPORTANT**: Please review `SECURITY.md` before deploying to production.

Key security considerations:
- Secrets in `k8s/secret.yaml` are NOT encrypted (only base64 encoded)
- Use Sealed Secrets, External Secrets Operator, or cloud provider secret management
- Rotate all credentials before production deployment
- Configure TLS/HTTPS at ingress level

## 📊 API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /ready` - Readiness probe (checks database connection)

### Notes API
- `GET /api/notes` - List all notes (limit 100, ordered by newest first)
- `POST /api/notes` - Create a new note
  ```json
  {
    "text": "Your note text here"
  }
  ```

## 🏗️ Architecture

```
┌─────────────┐
│   Ingress   │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐ ┌───▼────────┐
│   Backend   │ │  Frontend  │
│  (Node.js)  │ │  (Angular) │
└──────┬──────┘ └────────────┘
       │
┌──────▼──────┐
│    MySQL    │
│   Database  │
└─────────────┘
```

## 🔍 Code Review

This repository has been reviewed. See:
- `CODE_REVIEW_FINDINGS.md` - Detailed findings and recommendations
- `REVIEW_SUMMARY.md` - Summary of review and fixes applied
- `SECURITY.md` - Security best practices and warnings

## 🚨 CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`) handles:
1. Building Docker images
2. Pushing to Docker Hub
3. Deploying to Kubernetes cluster

**Configuration Required**:
- Set up GitHub Secrets:
  - `DOCKER_USERNAME`
  - `DOCKER_PASSWORD`
  - `KUBE_CONFIG` (base64 encoded or raw YAML)
- Optional: `KUBE_API_SERVER` if your kubeconfig needs the real API endpoint substituted for localhost entries

### Why kubectl points to localhost:8080 in CI

When kubectl cannot load a kubeconfig (missing `KUBECONFIG`, no `~/.kube/config`, or an empty file), it falls back to its compiled-in default context, which points to `http://localhost:8080`. GitHub-hosted runners do not run a Kubernetes API server on localhost, so any `kubectl` call without a real kubeconfig fails with `The connection to the server localhost:8080 was refused`. (The in-cluster service account path is only used when kubectl runs inside a pod.)

### 100% free CI-only Kubernetes test (Kind)

Use the provided workflow `.github/workflows/kind-e2e.yml` to spin up an ephemeral Kind cluster **inside GitHub Actions** with no external cloud costs or secrets:
1. Trigger the workflow via **pull_request** or **workflow_dispatch**.
2. The workflow installs kubectl, creates a Kind cluster, deploys an `nginx` sample app, waits for rollout, and shows pod/service state.
3. No kubeconfig secrets are needed; the Kind action wires KUBECONFIG automatically. If you previously added `KUBE_CONFIG`/`KUBE_API_SERVER` secrets for CI testing, you can remove them when using this workflow.

## 📝 Resource Limits

The application is configured with the following resource limits:

**Backend**:
- Requests: 128Mi RAM, 0.1 CPU
- Limits: 256Mi RAM, 0.5 CPU

**MySQL**:
- Requests: 256Mi RAM, 0.25 CPU
- Limits: 512Mi RAM, 1.0 CPU

Adjust these values in the deployment YAMLs based on your requirements.

## 🔄 Horizontal Pod Autoscaling

HPA is configured for the backend (`k8s/hpa.yaml`):
- Min replicas: 2
- Max replicas: 6
- Target CPU: 50%

## 📚 Documentation

- `CODE_REVIEW_FINDINGS.md` - Detailed code review with all issues found
- `SECURITY.md` - Security best practices and recommendations
- `REVIEW_SUMMARY.md` - Summary of improvements and next steps
- `backend/.env.example` - Environment configuration template

## 🤝 Contributing

1. Review `CODE_REVIEW_FINDINGS.md` for code standards
2. Follow the existing code style
3. Add tests for new features
4. Update documentation as needed

## 📄 License

ISC

## ⚠️ Known Issues

See `CODE_REVIEW_FINDINGS.md` for a complete list. Major items:
1. Secrets management needs improvement (use Sealed Secrets or similar)
2. Frontend code is not included in repository
3. MySQL runs as single replica (no high availability)
4. Rate limiting not implemented

## 🎯 Next Steps

See `REVIEW_SUMMARY.md` section "Recommendations for Next Steps" for prioritized improvements.
