# Docker Bake Usage Guide for Heimdall2

Docker Bake provides a modern, declarative way to build Heimdall images consistently across local development and CI.

## Quick Start

```bash
# Build server image for local testing (your platform only)
docker buildx bake server

# Build lite image for local testing
docker buildx bake lite

# Build multi-platform server image (amd64 + arm64)
docker buildx bake server-multiarch

# Build all variants (server + lite)
docker buildx bake all
```

## Available Targets

| Target | Description | Platforms | Tags |
|--------|-------------|-----------|------|
| `server` | Full Heimdall (backend + frontend) | Your platform | `:latest`, `:server` |
| `server-multiarch` | Full Heimdall (multi-arch) | amd64, arm64 | `:latest`, `:${TAG_SUFFIX}` |
| `lite` | Heimdall Lite (frontend-only) | Your platform | `:lite`, `:lite-latest` |
| `lite-multiarch` | Heimdall Lite (multi-arch) | amd64, arm64 | `:latest`, `:${TAG_SUFFIX}` |
| `server-dev` | Development build | Your platform | `:dev` |
| `server-ci` | CI build with cache | amd64, arm64 | CI tags |
| `lite-ci` | CI lite build with cache | amd64, arm64 | CI tags |

## Groups

```bash
# Build all variants (local platform)
docker buildx bake default

# Build all variants (multi-arch)
docker buildx bake all
```

## Local Development

### Test Changes Quickly
```bash
# Build server for your Mac (arm64) or Linux (amd64)
docker buildx bake server

# Run it
docker run -p 3000:3000 heimdall2:latest
```

### Test Multi-Platform Build
```bash
# Build for both amd64 and arm64 (slower, uses QEMU)
docker buildx bake server-multiarch --load
```

### Development Mode
```bash
# Build with NODE_ENV=development
docker buildx bake server-dev
```

## Customization

Override variables using `--set`:

```bash
# Use different base container
docker buildx bake --set "*.args.BASE_CONTAINER=node:22-alpine" server

# Use custom yarn mirror
docker buildx bake --set "*.args.YARNREPO_MIRROR=https://custom-mirror.com" server

# Build with custom tag
docker buildx bake --set TAG_PREFIX=myregistry/heimdall2 server

# Development build with custom tag
docker buildx bake --set TAG_PREFIX=test server-dev
```

## Push to Registry

```bash
# Build and push server image
docker buildx bake --push server-multiarch

# Build and push all variants
docker buildx bake --push all
```

## CI Integration

GitHub Actions uses the same `docker-bake.hcl` with Docker Build Cloud for fast builds:

```yaml
- uses: docker/bake-action@v5
  env:
    TAG_SUFFIX: ${{ github.sha }}
  with:
    files: docker-bake.hcl
    targets: server-ci
    push: true
```

This ensures your local builds match CI exactly.

## Testing the Exact CI Build

Replicate what CI runs (requires Docker Build Cloud access):

```bash
export TAG_SUFFIX=$(git rev-parse HEAD)
docker buildx bake server-ci --push
```

Or test locally without Build Cloud:

```bash
export TAG_SUFFIX=$(git rev-parse HEAD)
docker buildx bake server-multiarch
```

## Advantages over Previous Workflow

| Feature | Old (3-job workflow) | Docker Bake |
|---------|---------------------|-------------|
| Multi-platform | Separate jobs + manual merge | **Single command** ✅ |
| Build time | 60+ min (QEMU) | **5-10 min (Build Cloud)** ✅ |
| Local/CI parity | Different approaches | **Same config** ✅ |
| Configuration | Scattered in YAML | **Single HCL file** ✅ |
| Maintainability | 3 jobs to manage | **1 job** ✅ |

## Requirements

- Docker Desktop 4.x+ (includes buildx)
- OR Docker Engine with buildx plugin

Check if available:
```bash
docker buildx version
```

## Troubleshooting

### Multi-platform builds are slow
If you don't have Docker Build Cloud access, multi-platform builds use QEMU emulation which is slow. Build for your local platform only:

```bash
docker buildx bake server
```

### Can't push to registry
Make sure you're logged in:

```bash
docker login
```

### Need to force rebuild
Clear BuildKit cache:

```bash
docker buildx prune -af
```

## See Also

- `docker-bake.hcl` - Build configuration
- [Docker Bake Documentation](https://docs.docker.com/build/bake/)
- [Docker Build Cloud](https://docs.docker.com/build/cloud/)
