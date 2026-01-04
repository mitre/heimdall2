# Docker Bake configuration for Heimdall2
# Build server and lite variants with multi-platform support

# Variables for customization
variable "TAG_PREFIX" {
  default = "heimdall2"
}

variable "DOCKER_HUB_REPO" {
  default = "mitre/heimdall2"
}

variable "TAG_SUFFIX" {
  default = ""
}

variable "BASE_CONTAINER" {
  default = "registry.access.redhat.com/ubi9/nodejs-22-minimal:1"
}

variable "NODE_ENV" {
  default = "production"
}

variable "YARNREPO_MIRROR" {
  default = "https://registry.npmjs.org"
}

# Detect local platform (macOS needs linux override)
variable "LOCAL_PLATFORM" {
  default = regex_replace("${BAKE_LOCAL_PLATFORM}", "^(darwin)", "linux")
}

# Common configuration shared by all targets
target "_common" {
  dockerfile = "Dockerfile"
  args = {
    BASE_CONTAINER = "${BASE_CONTAINER}"
    NODE_ENV = "${NODE_ENV}"
    YARNREPO_MIRROR = "${YARNREPO_MIRROR}"
  }
  labels = {
    "org.opencontainers.image.source" = "https://github.com/mitre/heimdall2"
    "org.opencontainers.image.licenses" = "Apache-2.0"
    "org.opencontainers.image.description" = "Heimdall2 - Security Automation Framework"
    "org.opencontainers.image.created" = "${timestamp()}"
  }
}

# Common configuration for Lite variant
target "_common_lite" {
  dockerfile = "Dockerfile.lite"
  args = {
    BUILD_CONTAINER = "${BASE_CONTAINER}"
    BASE_CONTAINER = "nginx:alpine"
    NODE_ENV = "${NODE_ENV}"
    YARNREPO_MIRROR = "${YARNREPO_MIRROR}"
  }
  labels = {
    "org.opencontainers.image.source" = "https://github.com/mitre/heimdall2"
    "org.opencontainers.image.licenses" = "Apache-2.0"
    "org.opencontainers.image.description" = "Heimdall Lite - Security Automation Framework (Frontend Only)"
    "org.opencontainers.image.created" = "${timestamp()}"
  }
}

# Group: Build all variants (local platform)
group "default" {
  targets = ["server", "lite"]
}

# Group: Build all with multi-arch
group "all" {
  targets = ["server-multiarch", "lite-multiarch"]
}

# Heimdall Server (full) - Local platform only
target "server" {
  inherits = ["_common"]
  tags = [
    "${TAG_PREFIX}:latest",
    "${TAG_PREFIX}:server"
  ]
  platforms = ["${LOCAL_PLATFORM}"]
}

# Heimdall Server (full) - Multi-architecture
target "server-multiarch" {
  inherits = ["_common"]
  tags = concat(
    [
      "${DOCKER_HUB_REPO}:latest"
    ],
    TAG_SUFFIX != "" ? ["${DOCKER_HUB_REPO}:${TAG_SUFFIX}"] : []
  )
  platforms = ["linux/amd64", "linux/arm64"]
}

# Heimdall Lite (frontend-only) - Local platform only
target "lite" {
  inherits = ["_common_lite"]
  tags = [
    "${TAG_PREFIX}:lite",
    "${TAG_PREFIX}:lite-latest"
  ]
  platforms = ["${LOCAL_PLATFORM}"]
}

# Heimdall Lite (frontend-only) - Multi-architecture
target "lite-multiarch" {
  inherits = ["_common_lite"]
  tags = concat(
    [
      "mitre/heimdall-lite:latest"
    ],
    TAG_SUFFIX != "" ? ["mitre/heimdall-lite:${TAG_SUFFIX}"] : []
  )
  platforms = ["linux/amd64", "linux/arm64"]
}

# Development target with custom NODE_ENV
target "server-dev" {
  inherits = ["_common"]
  args = {
    NODE_ENV = "development"
  }
  tags = ["${TAG_PREFIX}:dev"]
  platforms = ["${LOCAL_PLATFORM}"]
}

# CI target for server with GitHub Actions cache
target "server-ci" {
  inherits = ["server-multiarch"]
  cache-from = ["type=gha,scope=server"]
  cache-to = ["type=gha,mode=max,scope=server"]
}

# CI target for lite with GitHub Actions cache
target "lite-ci" {
  inherits = ["lite-multiarch"]
  cache-from = ["type=gha,scope=lite"]
  cache-to = ["type=gha,mode=max,scope=lite"]
}
