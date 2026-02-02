# Running genomehubs-api with Docker

This folder contains a Dockerfile and a docker-compose for running the API with Elasticsearch for development/test.

Build the image (from `src/genomehubs-api`):

```bash
# Build the image
docker build -t genomehubs-api:local .

# Run with docker-compose (starts ES + API)
docker compose up --build
```

The API will be available on port 3000. Environment variables are provided in `docker-compose.yml` (GH_NODE, GH_HUBNAME, GH_RELEASE).

Notes:

- The runtime image uses a distroless Node image for a smaller attack surface.
- For production deployments you may want to provide specific Elasticsearch credentials, mount config files, and tune JVM/ES settings.
