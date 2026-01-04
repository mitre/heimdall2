# Building Heimdall Images Locally with Docker Bake

This guide shows developers how to **build** Heimdall Server and Heimdall Lite Docker images from source using Docker Bake.

> **Note:** This is for developers who want to build custom images or test changes. If you just want to **run** Heimdall using pre-built images, see the [README's Docker setup instructions](README.md#heimdall-server---docker) and use `./setup-docker-env.sh` instead.


## Prerequisites

1. **Docker Desktop** (macOS) or **Docker Engine** (Linux)
   - Version 4.x or later (includes buildx)
   - Docker Desktop on Mac: [Download here](https://www.docker.com/products/docker-desktop)

2. **Verify buildx is available:**
   ```bash
   docker buildx version
   # Should output: github.com/docker/buildx v0.x.x
   ```

3. **Check available builders:**
   ```bash
   docker buildx ls
   ```

## Quick Start

### Build Heimdall Server (Full Stack)

```bash
# Build for your local architecture (Mac M1/M2 = arm64, Intel = amd64)
docker buildx bake server
```

### Build Heimdall Lite (Frontend Only)

```bash
# Build lite version for your local architecture
docker buildx bake lite
```

### Build Everything

```bash
# Build both server and lite
docker buildx bake default

# Or explicitly
docker buildx bake server lite
```

## Available Build Targets

| Target | What It Builds | Platforms | Use Case |
|--------|---------------|-----------|----------|
| `server` | Full Heimdall (backend + frontend) | Your machine only | Local development |
| `lite` | Frontend-only static site | Your machine only | Local development |
| `server-multiarch` | Full Heimdall | amd64 + arm64 | Testing multi-platform |
| `lite-multiarch` | Frontend-only | amd64 + arm64 | Testing multi-platform |
| `server-dev` | Development build | Your machine only | Development with NODE_ENV=development |
| `server-ci` | CI build with caching | amd64 + arm64 | Same as CI |
| `lite-ci` | CI lite with caching | amd64 + arm64 | Same as CI |

## Common Development Workflows

### 1. Quick Local Test (Fastest)

Build for your Mac's architecture only:

```bash
# For M1/M2 Macs (arm64)
docker buildx bake server

# Verify the image
docker images | grep heimdall2
```

**Build time:** ~5-10 minutes (native build, no emulation)

### 2. Test Multi-Platform Build (Before PR)

Verify your changes work on both Intel and ARM:

```bash
# Build for both amd64 and arm64
docker buildx bake server-multiarch

# Note: ARM build will be slower due to QEMU emulation
```

**Build time:** ~60 minutes (ARM uses emulation)

### 3. Development Mode Build

Build with development settings:

```bash
# Uses NODE_ENV=development
docker buildx bake server-dev
```

### 4. Build Both Server and Lite

```bash
# Build everything
docker buildx bake all

# This builds:
# - server-multiarch (amd64 + arm64)
# - lite-multiarch (amd64 + arm64)
```

### 5. Test the Exact CI Build

Replicate what runs in GitHub Actions:

```bash
# Set the version tag like CI does
export TAG_SUFFIX=$(git rev-parse HEAD)

# Build server like CI
docker buildx bake server-ci

# Build lite like CI
docker buildx bake lite-ci
```

## Advanced Usage

### Custom Base Container

Override the Red Hat UBI base image:

```bash
docker buildx bake server \
  --set "*.args.BASE_CONTAINER=node:22-alpine"
```

### Custom Yarn Mirror

Use a different npm registry (useful behind corporate firewalls):

```bash
docker buildx bake server \
  --set "*.args.YARNREPO_MIRROR=https://registry.your-company.com"
```

### Build with Custom Tags

```bash
# Custom tag prefix
docker buildx bake server \
  --set TAG_PREFIX=myname/heimdall2

# Results in: myname/heimdall2:latest
```

### Build and Push to Your Registry

```bash
# Login first
docker login

# Build and push
docker buildx bake server-multiarch --push

# Or to a custom registry
docker buildx bake server-multiarch \
  --set DOCKER_HUB_REPO=your-registry.com/heimdall2 \
  --push
```

### Inspect Build Configuration

See what will be built without actually building:

```bash
# Show full config for server target
docker buildx bake server --print

# Show all targets
docker buildx bake --print
```

## Using Docker Build Cloud (Fast Builds)

If you have access to the MITRE Docker Build Cloud:

### One-Time Setup

```bash
# Create a cloud builder
docker buildx create --driver cloud mitre/mitre-builder --name cloud

# Use it
docker buildx use cloud
```

### Build with Build Cloud

```bash
# Now all builds use native ARM in the cloud (fast!)
docker buildx bake server-multiarch

# Build time: ~10 minutes instead of 60
```

### Switch Back to Local

```bash
# Use default builder (QEMU emulation)
docker buildx use default

# Builds use local QEMU again
docker buildx bake server-multiarch
```

### One-Off Build Cloud Build

Without changing your default builder:

```bash
# Just for this build, use cloud
docker buildx bake --builder cloud server-multiarch
```

## Build Configuration File

All build targets are defined in `docker-bake.hcl` at the repository root. 