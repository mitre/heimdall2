# Building Heimdall Images Locally with Docker Bake

This guide shows developers how to **build** Heimdall Server and Heimdall Lite Docker images from source using Docker Bake.

> **Note:** This is for developers who want to build custom images or test changes. If you just want to **run** Heimdall using pre-built images, see the [README's Docker setup instructions](README.md#heimdall-server---docker) and use `./setup-docker-env.sh` instead.


## Prerequisites

1. **Docker Desktop** (macOS/Windows) or **Docker Engine** (Linux)
   - Version 4.x or later (includes buildx)
   - Docker Desktop: [Download for macOS/Windows](https://www.docker.com/products/docker-desktop)
   - Docker Engine for Linux: [Installation guide](https://docs.docker.com/engine/install/)

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
# Build for both amd64 and arm64 architectures
docker buildx bake server
```

### Build Heimdall Lite (Frontend Only)

```bash
# Build for both amd64 and arm64 architectures
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
| `server` | Full Heimdall (backend + frontend) | amd64 + arm64 | Multi-platform build (default) |
| `lite` | Frontend-only static site | amd64 + arm64 | Multi-platform build (default) |
| `server-amd64` | Full Heimdall | amd64 only | Single-architecture build |
| `server-arm64` | Full Heimdall | arm64 only | Single-architecture build |
| `lite-amd64` | Frontend-only | amd64 only | Single-architecture build |
| `lite-arm64` | Frontend-only | arm64 only | Single-architecture build |

## Common Development Workflows

### 1. Local Build - Single Architecture

Build for a specific architecture (faster, no emulation):

```bash
# Build for AMD64 (Intel/AMD processors)
docker buildx bake server-amd64

# Build for ARM64 (Apple Silicon, AWS Graviton)
docker buildx bake server-arm64

# Verify the image
docker images | grep heimdall2
```

**Build time:** ~5-10 minutes (native build, no emulation)

### 2. Local Build - Multi-Platform

Build for both amd64 and arm64 (default):

```bash
# Build for both architectures
docker buildx bake server

# Note: Non-native architecture will use QEMU emulation (slower)
```

**Build time:** ~60 minutes (non-native architecture uses emulation)

### 3. Build All Variants

```bash
# Build both server and lite (multi-arch)
docker buildx bake default

# This builds:
# - server (amd64 + arm64)
# - lite (amd64 + arm64)
```

## Advanced Usage

### Custom Image Tags

Control the tags applied to built images:

```bash
# Add a custom tag suffix (e.g., git commit SHA)
export TAG_SUFFIX=$(git rev-parse HEAD)
docker buildx bake server
# Results in: mitre/heimdall2:latest AND mitre/heimdall2:<commit-sha>

# If TAG_SUFFIX is not set, only :latest is used
docker buildx bake server
# Results in: mitre/heimdall2:latest

# You can set TAG_SUFFIX to any value
export TAG_SUFFIX=v2.0.0-beta
docker buildx bake server
# Results in: mitre/heimdall2:latest AND mitre/heimdall2:v2.0.0-beta
```

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

### Build and Push to Your Registry

```bash
# Login first
docker login

# Build and push multi-platform image
docker buildx bake server --push

# Or to a custom registry
docker buildx bake server \
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
docker buildx bake server

# Build time: ~10 minutes instead of 60
```

### Switch Back to Local

```bash
# Use default builder (QEMU emulation)
docker buildx use default

# Builds use local QEMU again
docker buildx bake server
```

### One-Off Build Cloud Build

Without changing your default builder:

```bash
# Just for this build, use cloud
docker buildx bake --builder cloud server
```

## Build Configuration File

All build targets are defined in `docker-bake.hcl` at the repository root. 