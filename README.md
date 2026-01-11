# Kubernetes Notes Application

A full-stack notes application backed by MySQL and deployed to Kubernetes. This README centralizes all of the work in the repo: backend service, containerization, Kubernetes manifests, CI/CD, security guidance, and review artifacts.

## Table of Contents
- [Overview](#-overview)
- [Repository Structure](#-repository-structure)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Local Development with Docker Compose](#local-development-with-docker-compose)
  - [Local Backend Development without Docker](#local-backend-development-without-docker)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Data Model](#-data-model)
- [Kubernetes Deployment](#-kubernetes-deployment)
  - [Verify Deployment](#verify-deployment)
  - [Resource Limits](#resource-limits)
  - [Horizontal Pod Autoscaling](#horizontal-pod-autoscaling)
- [CI/CD](#-cicd)
- [Security](#-security)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Known Issues](#-known-issues)
- [Next Steps](#-next-steps)
- [License](#-license)

## 📋 Overview
The stack includes:
- **Backend**: Node.js/Express REST API that persists notes to MySQL and exposes health/readiness probes.
- **Database**: MySQL 8.0 with schema bootstrapped on startup.
- **Infrastructure**: Kubernetes manifests for backend, MySQL, optional frontend, ingress, HPA, and namespace.
- **Local Development**: Docker Compose to run backend + MySQL together, or run the backend directly.
- **CI/CD**: GitHub Actions workflows for building images, pushing to Docker Hub, and deploying to Kubernetes; a Kind-based smoke test workflow is also provided.
- **Documentation**: Code review findings, summaries, and security guidance tracked in dedicated docs.

## 🗂️ Repository Structure
- `backend/` - Node.js API (`server.js`), schema bootstrap (`init_db.sql`), and API Dockerfile.
- `k8s/` - Kubernetes manifests:
  - `backend-deployment.yaml`, `backend-service.yaml`
  - `mysql-deployment.yaml`, `mysql-pvc.yaml`
  - `frontend-deployment.yaml`, `frontend-service.yaml` (for an optional Angular UI)
  - `ingress.yaml`, `hpa.yaml`, `namespace.yaml`, `secret.yaml`
- `docker-compose.yml` - Local stack for backend + MySQL.
- `Dockerfile` - Builds the Angular frontend image from the Angular workspace configuration (source code not committed; see Known Issues).
- `angular.json`, `tsconfig*.json`, `package.json` - Angular workspace configuration.
- `.github/workflows/ci-cd.yml` - Build/push/deploy pipeline. `.github/workflows/kind-e2e.yml` - Cost-free Kind smoke test in CI.
- `CODE_REVIEW_FINDINGS.md`, `REVIEW_SUMMARY.md`, `SECURITY.md` - Review artifacts and security guidance.

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

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose (for local development)
- Kubernetes cluster and `kubectl` (for production deployment)
- Node.js 18+ (for local backend development without Docker)

### Local Development with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```
Services:
- Backend API: http://localhost:3000
- Frontend: http://localhost:8080 (if the Angular build artifacts are provided)

### Local Backend Development without Docker
```bash
# Install dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start MySQL (if you do not have a local instance)
docker run -d -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=mydb \
  mysql:8.0

# Start the backend
npm start
```

## 🔧 Configuration
Environment variables (see `backend/.env.example`):
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database user (default: root)
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (default: mydb)
- `PORT`: Server port (default: 3000)

## 📊 API Endpoints
### Health Checks
- `GET /health` - Basic health check
- `GET /ready` - Readiness probe (checks database connection)

### Notes API
- `GET /api/notes` - List all notes (limit 100, newest first)
- `POST /api/notes` - Create a new note
  ```json
  {
    "text": "Your note text here"
  }
  ```

## 🗄️ Data Model
The backend initializes the schema if needed:
- `notes` table with columns:
  - `id` (INT, auto-increment primary key)
  - `text` (VARCHAR(255), required)
  - `created_at` (TIMESTAMP, defaults to current time)

## 🚢 Kubernetes Deployment

### Prerequisites
1. Kubernetes cluster running
2. `kubectl` configured
3. Secrets configured (see Security section)

### Deploy to Kubernetes
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Configure secrets (see SECURITY.md)
kubectl apply -f k8s/secret.yaml  # ⚠️ Base64 only; replace with your own secrets

# Deploy MySQL
kubectl apply -f k8s/mysql-pvc.yaml
kubectl apply -f k8s/mysql-deployment.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Optional: Deploy frontend + ingress + autoscaling
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

### Verify Deployment
```bash
# Check pods
kubectl get pods -n myapp

# Check services
kubectl get svc -n myapp

# View backend logs
kubectl logs -n myapp -l app=backend -f
```

### Resource Limits
**Backend**
- Requests: 128Mi RAM, 0.1 CPU
- Limits: 256Mi RAM, 0.5 CPU

**MySQL**
- Requests: 256Mi RAM, 0.25 CPU
- Limits: 512Mi RAM, 1.0 CPU

### Horizontal Pod Autoscaling
Configured for the backend (`k8s/hpa.yaml`):
- Min replicas: 2
- Max replicas: 6
- Target CPU: 50%

## 🚨 CI/CD
GitHub Actions workflow (`.github/workflows/ci-cd.yml`) handles:
1. Building Docker images
2. Pushing to Docker Hub
3. Deploying to Kubernetes cluster

**Configuration Required**:
- GitHub Secrets:
  - `DOCKER_USERNAME`
  - `DOCKER_PASSWORD`
  - `KUBE_CONFIG` (base64 encoded or raw YAML)
- Optional: `KUBE_API_SERVER` if your kubeconfig needs the real API endpoint substituted for localhost entries

### Why kubectl points to localhost:8080 in CI
When kubectl cannot load a kubeconfig (missing `KUBECONFIG`, no `~/.kube/config`, or an empty file), it falls back to the compiled-in default context (`http://localhost:8080`). GitHub-hosted runners do not run a Kubernetes API server on localhost, so any `kubectl` call without a real kubeconfig fails with `The connection to the server localhost:8080 was refused`.

### 100% free CI-only Kubernetes test (Kind)
Use `.github/workflows/kind-e2e.yml` to spin up an ephemeral Kind cluster **inside GitHub Actions** with no external cloud costs or secrets:
1. Trigger via **pull_request** or **workflow_dispatch**.
2. The workflow installs kubectl, creates a Kind cluster, deploys an `nginx` sample app, waits for rollout, and shows pod/service state.
3. No kubeconfig secrets are needed; the Kind action wires `KUBECONFIG` automatically.

## 🔒 Security
⚠️ **IMPORTANT**: Review `SECURITY.md` before production deployment.

Key considerations:
- Secrets in `k8s/secret.yaml` are **not encrypted** (only base64 encoded). Use Sealed Secrets, External Secrets Operator, or a cloud secret manager.
- Rotate credentials before production and configure TLS/HTTPS at the ingress level.
- Restrict database/network access and enable resource limits/HPA as provided.

## 📚 Documentation
- `CODE_REVIEW_FINDINGS.md` - Detailed code review with all issues found
- `REVIEW_SUMMARY.md` - Summary of improvements and next steps
- `SECURITY.md` - Security best practices and warnings
- `backend/.env.example` - Environment configuration template

## 🤝 Contributing
1. Review `CODE_REVIEW_FINDINGS.md` for code standards
2. Follow the existing code style
3. Add tests for new features
4. Update documentation as needed

## ⚠️ Known Issues
See `CODE_REVIEW_FINDINGS.md` for the full list. Major items:
1. Secrets management needs improvement (use Sealed Secrets or similar)
2. Frontend source code is not included in the repository; Dockerfile assumes built Angular assets
3. MySQL runs as single replica (no high availability)
4. Rate limiting not implemented

## 🎯 Next Steps
See `REVIEW_SUMMARY.md` section "Recommendations for Next Steps" for prioritized improvements.

## 📄 License
ISC
