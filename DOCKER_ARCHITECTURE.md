# Hybrid Docker Architecture for GenomeHubs

## Overview

This architecture uses a **layered approach** where:

1. **Generic `genomehubs-ui:develop`** - Base UI image with just the application
2. **Site-specific images** (goat, boat, molluscdb) - Generic UI + site content from GitHub repos

## Build Flow

### Development Pipeline (feature/use-dhi branch)

```
Build generic UI assets
        ↓
build-and-push-ui: genomehubs/genomehubs-ui:develop
        ↓
build-and-push-goat: genomehubs/goat:develop
build-and-push-boat: genomehubs/boat:develop
build-and-push-molluscdb: genomehubs/molluscdb:develop
```

### Production Pipeline (git tags, excludes pre-releases with -)

```
Build generic UI assets + API + CLI + Linux wheel
        ↓
build-and-push-ui: genomehubs/genomehubs-ui:VERSION & :latest
        ↓
build-and-push-goat: genomehubs/goat:VERSION & :latest
build-and-push-boat: genomehubs/boat:VERSION & :latest
build-and-push-molluscdb: genomehubs/molluscdb:VERSION & :latest
build-and-push-test: genomehubs/genomehubs-test:VERSION & :latest
        ↓
merge-develop-to-main: Create PR from develop → main
```

## Dockerfile Strategy

### Generic UI (`src/docker/ui/Dockerfile`)

- Builds webpack assets
- Creates minimal Node.js SSR server image
- No site-specific content

### Site-specific (`src/docker/ui/Dockerfile.site`)

- Uses generic image as base (`FROM genomehubs/genomehubs-ui:develop`)
- Multi-stage build:
  - **Builder stage**: Clones site repo from GitHub
  - **Runtime stage**: Copies content from builder into `/content` volume mount point
- Sets site-specific environment variables

## Adding a New Site

1. Create a repo following naming convention: `github.com/genomehubs/SITENAME-ui`
2. Include structure in repo:

   ```
   SITENAME-ui/
   ├── static/          (site assets)
   ├── assets/          (images, documents)
   └── meta.json        (optional: meta tags)
   ```

3. Add to all three workflows (develop, production, archive):

   ```yaml
   build-and-push-newsite:
     runs-on: ubuntu-latest
     needs: build-and-push-ui
     steps:
       - uses: actions/checkout@v3
       - name: Login to Docker Hub
         uses: docker/login-action@v2
         with:
           username: ${{ secrets.DOCKER_HUB_USERNAME }}
           password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}
       - name: Build and push image
         uses: docker/build-push-action@v5
         with:
           context: .
           file: src/docker/ui/Dockerfile.site
           push: true
           build-args: |
             BASE_IMAGE=genomehubs/genomehubs-ui:develop  # or :VERSION or :ARCHIVE_VERSION
             SITE_REPO=genomehubs/newsite-ui
             SITE_BRANCH=main
             SITE_NAME=NewSite
             SITE_NAME_LONG=New Site Full Name
             GH_TAXONOMY=ncbi
             GH_API_URL=https://newsite.genomehubs.org/api/VERSION
           tags: genomehubs/newsite:develop # or :VERSION or :ARCHIVE_VERSION
   ```

   **Build args used across workflows:**
   - `BASE_IMAGE` - References the base UI image (tagged with :develop, :VERSION, or :ARCHIVE_VERSION)
   - `SITE_REPO` - GitHub repo containing site-specific content (must follow `genomehubs/SITENAME-ui` pattern)
   - `SITE_BRANCH` - Branch to clone from site repo (typically `main`)
   - `SITE_NAME` - Short name (e.g., `GoaT`, `BoaT`)
   - `SITE_NAME_LONG` - Full name (e.g., `Genomes on a Tree`)
   - `GH_TAXONOMY` - Taxonomy source (e.g., `ncbi`)
   - `GH_API_URL` - API endpoint URL (optional, for archive builds)
   - `GH_ARCHIVE` - Available archive versions (optional, for archive builds)
   - `GH_CITATION_URL` - Citation URL (optional, for GoaT)
   - `GH_SUGGESTED_TERM` - Default search term (optional, for GoaT)

## Deployment

### Generic UI (with mounted content)

```bash
docker run -p 8880:8880 \
  -v /path/to/content:/content \
  -e GH_SITENAME="My Hub" \
  -e GH_API_URL=http://localhost:3000/api/v2 \
  genomehubs/genomehubs-ui:develop
```

### Site-specific (self-contained)

```bash
docker run -p 8880:8880 \
  -e GH_API_URL=https://goat.genomehubs.org/api/v2 \
  genomehubs/goat:develop
```

## Benefits

- **Single UI build** - No need to rebuild UI for each site
- **Content versioning** - Each site repo controls its own content
- **Easy updates** - Update site content without rebuilding UI
- **Clear dependencies** - Build args make site configuration explicit
- **Scaling** - Add new sites by just adding a workflow job + repo
- **Rollback** - Tag images with commit hash for easy rollbacks
- **Independence** - Sites can be deployed/updated independently
