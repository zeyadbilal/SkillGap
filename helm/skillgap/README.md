# SkillGap Helm chart

This chart deploys the frontend and backend. PostgreSQL and Redis are external
Railway services; the default images are local names, so override them with the
images pushed to your registry.

## Install

```bash
helm upgrade --install skillgap ./helm/skillgap \
  --set backend.image.repository=ghcr.io/example/skillgap-backend \
  --set backend.image.tag=latest \
  --set frontend.image.repository=ghcr.io/example/skillgap-frontend \
  --set frontend.image.tag=latest \
  --set external.postgresUrl='postgres://user:password@postgres.railway.internal:5432/railway' \
  --set external.redisUrl='rediss://default:password@redis.railway.internal:6379' \
  --set secrets.jwtSecret='replace-with-a-long-random-secret' \
  --set ingress.enabled=true
```

Enable an ingress with `--set ingress.enabled=true` and set the host with
`--set ingress.hosts[0].host=skillgap.example.com`.

The model image is not deployed by this chart because the current model is a
stdin/stdout CLI, not an HTTP service. The backend currently expects to run
the extractor as a local Python process and falls back to its JavaScript
extractor when Python is unavailable.

Railway URLs should be copied from the Railway service variables or connection
details. Use `rediss://` when Railway requires TLS for Redis.