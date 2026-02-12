# Docker Bake configuration for Heimdall2
# Build server and lite variants with multi-platform support

# Variables for customization
variable "TAG_PREFIX" {
  default = "heimdall2"
}

variable "DOCKER_HUB_REPO_SERVER" {
  default = "mitre/heimdall2"
}

variable "DOCKER_HUB_REPO_LITE" {
  default = "mitre/heimdall-lite"
}

variable "TAG_SUFFIXES" {
  default = "dev"
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


# Common configuration shared by all targets
target "_common" {
  dockerfile = "Dockerfile"
  tags = concat([for suffix in split(",", TAG_SUFFIXES) : "${DOCKER_HUB_REPO_SERVER}:${trimspace(suffix)}"])
  args = {
    BASE_CONTAINER = "${BASE_CONTAINER}"
    NODE_ENV = "${NODE_ENV}"
    YARNREPO_MIRROR = "${YARNREPO_MIRROR}"
  }
  labels = {
    "org.opencontainers.image.source" = "https://github.com/mitre/heimdall2"
    "org.opencontainers.image.licenses" = "Apache-2.0"
    "org.opencontainers.image.description" = "Heimdall - Security Automation Framework"
    "org.opencontainers.image.created" = "${timestamp()}"
  }
}

# Common configuration for Lite variant
target "_common_lite" {
  dockerfile = "Dockerfile.lite"
  tags = concat([for suffix in split(",", TAG_SUFFIXES) : "${DOCKER_HUB_REPO_SERVER}:${trimspace(suffix)}"])
  args = {
    BUILD_CONTAINER = "${BASE_CONTAINER}"
    BASE_CONTAINER = "nginx:alpine"
    NODE_ENV = "${NODE_ENV}"
    YARNREPO_MIRROR = "${YARNREPO_MIRROR}"
  }
  labels = {
    "org.opencontainers.image.source" = "https://github.com/mitre/heimdall2"
    "org.opencontainers.image.licenses" = "Apache-2.0"
    "org.opencontainers.image.description" = "Heimdall Lite - Security Automation Framework"
    "org.opencontainers.image.created" = "${timestamp()}"
  }
}

# Group: Build all variants (multi-arch)
group "default" {
  targets = ["server", "lite"]
}

# Heimdall Server (full) - Multi-architecture (default)
target "server" {
  inherits = ["_common"]
  platforms = ["linux/amd64", "linux/arm64"]
}

# Heimdall Server (full) - AMD64 only
target "server-amd64" {
  inherits = ["_common"]
  platforms = ["linux/amd64"]
}

# Heimdall Server (full) - ARM64 only
target "server-arm64" {
  inherits = ["_common"]
  platforms = ["linux/arm64"]
}

# Heimdall Lite (frontend-only) - Multi-architecture (default)
target "lite" {
  inherits = ["_common_lite"]
  platforms = ["linux/amd64", "linux/arm64"]
}

# Heimdall Lite (frontend-only) - AMD64 only
target "lite-amd64" {
  inherits = ["_common_lite"]
  platforms = ["linux/amd64"]
}

# Heimdall Lite (frontend-only) - ARM64 only
target "lite-arm64" {
  inherits = ["_common_lite"]
  platforms = ["linux/arm64"]
}

