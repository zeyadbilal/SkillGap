# SkillGap Helm chart

This chart deploys the frontend, backend, and model service to Kubernetes. It
uses ClusterIP services internally and an AWS Application Load Balancer when
the AWS Load Balancer Controller is installed in the EKS cluster.

## Install

```bash
helm upgrade --install skillgap ./helm/skillgap \
  --namespace skillgap-production \
  --create-namespace \
  --set backend.image.repository=<aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com/skillgap-backend \
  --set backend.image.tag=<image-tag> \
  --set frontend.image.repository=<aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com/skillgap-frontend \
  --set frontend.image.tag=<image-tag> \
  --set model.image.repository=<aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com/skillgap-model \
  --set model.image.tag=<image-tag> \
  --set external.postgresUrl='postgres://user:password@postgres.railway.internal:5432/railway' \
  --set external.redisUrl='rediss://default:password@redis.railway.internal:6379' \
  --set secrets.jwtSecret='replace-with-a-long-random-secret' \
  --set namespace.environment=production \
  --set ingress.hosts[0].host=skillgap.example.com \
  --set ingress.enabled=true
```

Before installing, install the AWS Load Balancer Controller and configure its
IAM permissions through IRSA. The controller creates the ALB from the chart's
`alb` ingress class and annotations.

The model is deployed as an internal HTTP service. The backend receives its
URL from `MODEL_SERVICE_URL` and calls the model through the model ClusterIP
service.

Railway URLs should be copied from the Railway service variables or connection
details. Use `rediss://` when Railway requires TLS for Redis.