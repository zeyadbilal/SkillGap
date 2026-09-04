# Service layout

Backend services are grouped by domain:

- `analytics/`: market trend aggregation and analytics queries.
- `auth/`: authentication workflows.
- `cache/`: shared cache access and cache-key helpers.
- `cv/`: CV file-to-text extraction only.
- `model/`: HTTP communication with the Flask analysis service.
- `recommendation/`: recommendation orchestration and the separate logged-in-user/DB recommendation path.
- `token/`: token creation and verification.

Keep transport concerns in `model/`, file parsing in `cv/`, and recommendation orchestration in `recommendation/`. The Flask service remains the only analysis engine used by the public CV analysis endpoint.
