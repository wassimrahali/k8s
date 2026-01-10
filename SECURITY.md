# Security Best Practices

## IMPORTANT: Secrets Management

⚠️ **WARNING**: The file `k8s/secret.yaml` contains base64-encoded secrets that are checked into version control. This is NOT secure!

### Current Issue
The secrets in `k8s/secret.yaml` are merely base64-encoded (not encrypted) and are visible to anyone with repository access.

### Recommended Solutions

1. **Sealed Secrets** (Recommended for most use cases)
   - Install: https://github.com/bitnami-labs/sealed-secrets
   - Encrypt secrets before committing to git
   - Only the cluster can decrypt them

2. **External Secrets Operator**
   - Sync secrets from external secret managers (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, HashiCorp Vault)
   - Keep secrets in a centralized, secure location

3. **Cloud Provider Secret Management**
   - AWS: Use AWS Secrets Manager with EKS
   - Azure: Use Azure Key Vault with AKS
   - GCP: Use Secret Manager with GKE

4. **For Development Only**
   - Keep `secret.yaml` out of git (add to .gitignore)
   - Create secrets manually in the cluster
   - Document required secrets in a separate file

### Migration Steps

1. Delete `k8s/secret.yaml` from the repository
2. Add `k8s/secret.yaml` to `.gitignore`
3. Create a `k8s/secret.yaml.example` with dummy values
4. Choose one of the recommended solutions above
5. Update deployment documentation

### Immediate Action Required

If this repository is public or has been public in the past:
1. Assume all secrets are compromised
2. Rotate all passwords immediately
3. Change database credentials
4. Review access logs for unauthorized access

## Additional Security Recommendations

### 1. Enable Network Policies
Create network policies to restrict traffic between pods and namespaces.

### 2. Use Non-Root User in Containers
Add to Dockerfile:
```dockerfile
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nodejs -G nodejs
USER nodejs
```

### 3. Scan Docker Images
- Use `docker scan` or Trivy to scan for vulnerabilities
- Keep base images updated

### 4. Enable Pod Security Standards
Add to namespace:
```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

### 5. Implement Rate Limiting
Consider using express-rate-limit in the backend:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### 6. Use HTTPS/TLS
- Configure TLS termination at ingress
- Use cert-manager for automatic certificate management
