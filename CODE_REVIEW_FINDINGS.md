# Code Review Findings

## Critical Issues

### 1. Missing Dependencies in backend/package.json
**File**: `backend/package.json`
**Issue**: The `server.js` file uses `express`, `mysql2`, `dotenv`, and `cors` but these dependencies are not listed in package.json.
**Severity**: High
**Impact**: Application will fail to start due to missing dependencies.

### 2. Hardcoded Placeholder in CI/CD Workflow
**File**: `.github/workflows/ci-cd.yml` (line 60)
**Issue**: Contains hardcoded placeholder URL `https://YOUR_REAL_K8S_API_SERVER:6443` that needs to be replaced.
**Severity**: High
**Impact**: CI/CD pipeline will fail when trying to connect to Kubernetes cluster.

### 3. Secrets Stored in Plain Text (Base64)
**File**: `k8s/secret.yaml`
**Issue**: Secrets are stored as base64-encoded values in version control. Base64 is encoding, not encryption.
**Severity**: Critical
**Impact**: Database credentials are exposed in the repository.
**Recommendation**: Use sealed-secrets, external secrets operator, or cloud provider secret management.

## Security Concerns

### 4. SQL Injection Vulnerability - PARTIALLY MITIGATED
**File**: `backend/server.js` (lines 50, 62)
**Status**: The code uses parameterized queries which DOES protect against SQL injection.
**Good Practice**: Using `?` placeholders with array of values is correct.
**Note**: Initial concern was incorrect - the code is actually secure in this regard.

### 5. No Rate Limiting
**File**: `backend/server.js`
**Issue**: API endpoints lack rate limiting protection.
**Severity**: Medium
**Impact**: Vulnerable to brute force and DoS attacks.

### 6. Insufficient Input Validation
**File**: `backend/server.js` (line 59-60)
**Issue**: Only checks if text exists, not if it's valid (length, content type, etc.).
**Severity**: Medium
**Impact**: Could accept malicious or overly long input.

## Configuration Issues

### 7. Duplicate Service Definitions
**Files**: `k8s/backend-deployment.yaml` and `k8s/backend-service.yaml`
**Issue**: Backend service is defined in two places (lines 54-66 in backend-deployment.yaml and in backend-service.yaml).
**Severity**: Low
**Impact**: Confusion and potential conflicts.

### 8. Missing Resource Limits
**File**: `k8s/backend-deployment.yaml` and `k8s/mysql-deployment.yaml`
**Issue**: No CPU/memory requests or limits defined for containers.
**Severity**: Medium
**Impact**: Pods can consume unlimited resources, affecting cluster stability.

### 9. MySQL Running as Single Replica
**File**: `k8s/mysql-deployment.yaml` (line 7)
**Issue**: MySQL deployment has only 1 replica and uses `clusterIP: None` (StatefulSet would be better).
**Severity**: Medium
**Impact**: No high availability, single point of failure.

### 10. Frontend Configuration Missing
**Files**: `k8s/frontend-*.yaml` exist but no frontend code in repository
**Issue**: Frontend deployment/service manifests reference missing frontend application.
**Severity**: Medium
**Impact**: Frontend deployment will fail.

## Best Practices

### 11. No Health Check in docker-compose
**File**: `docker-compose.yml` (line 18-30)
**Issue**: Backend service in docker-compose doesn't have a health check.
**Severity**: Low
**Impact**: No automatic recovery if backend fails.

### 12. Inconsistent Port Configuration
**File**: `docker-compose.yml` (line 33-37)
**Issue**: Frontend is configured to run on port 8080 in docker-compose but port 80 in Kubernetes.
**Severity**: Low
**Impact**: Confusion and potential issues during local development vs deployment.

### 13. Missing .dockerignore
**File**: Missing in `/backend`
**Issue**: No .dockerignore file to exclude unnecessary files from Docker image.
**Severity**: Low
**Impact**: Larger Docker image size with unnecessary files.

### 14. Unclear File Purpose
**File**: `o.json`
**Issue**: File named `o.json` with proxy configuration - unclear naming.
**Severity**: Low
**Impact**: Maintainability concern.

## Recommendations Priority

### Immediate Actions Required:
1. Add missing dependencies to backend/package.json
2. Fix CI/CD placeholder URL or document it as a required configuration
3. Remove secrets from version control and use proper secret management

### High Priority:
4. Add resource limits to Kubernetes deployments
5. Implement input validation and rate limiting
6. Consider using StatefulSet for MySQL

### Medium Priority:
7. Remove duplicate service definitions
8. Add .dockerignore file
9. Add health checks to docker-compose backend service
10. Clarify frontend setup or remove unused manifests

### Low Priority:
11. Rename o.json to something more descriptive (e.g., proxy.config.json)
12. Standardize port configurations across environments
