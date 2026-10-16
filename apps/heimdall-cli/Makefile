MODULE   := github.com/mitre/heimdall2/apps/heimdall-cli
BIN      := heimdall-cli
VERSION  ?= $(shell git describe --tags --dirty 2>/dev/null || echo 0.9.0-dev)
COMMIT   ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo none)
DATE     ?= $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
LDFLAGS  := -s -w \
	-X $(MODULE)/internal/version.Version=$(VERSION) \
	-X $(MODULE)/internal/version.Commit=$(COMMIT) \
	-X $(MODULE)/internal/version.Date=$(DATE)

.PHONY: build build-fips build-linux-amd64 build-linux-arm64 test test-functional test-integration test-e2e test-all lint clean snapshot man completions release-prep

build:
	CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BIN) ./cmd/heimdall-cli

build-fips:
	GOEXPERIMENT=boringcrypto CGO_ENABLED=1 go build -ldflags "$(LDFLAGS)" -o $(BIN)-fips ./cmd/heimdall-cli

build-linux-amd64:
	GOOS=linux GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(BIN)-linux-amd64 ./cmd/heimdall-cli

build-linux-arm64:
	GOOS=linux GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(BIN)-linux-arm64 ./cmd/heimdall-cli

test:
	go test ./...

test-functional:
	go test -tags functional -v ./internal/cmd/

test-integration:
	go test -tags integration -v ./internal/cmd/

test-e2e:
	E2E_VM=$(or $(VM),oracle) go test -tags e2e -v -run TestE2E ./internal/cmd/

test-all: test test-functional

lint:
	golangci-lint run ./...

snapshot:
	goreleaser release --snapshot --clean

coverage:
	go test -coverprofile=coverage.out ./internal/cmd/
	go tool cover -func=coverage.out | tail -1
	@echo "Open coverage report: go tool cover -html=coverage.out"

man:
	@mkdir -p man/man1
	go run ./cmd/gen-manpages man/man1

completions:
	@mkdir -p completions
	go run ./cmd/heimdall-cli completion bash > completions/heimdall-cli.bash
	go run ./cmd/heimdall-cli completion zsh  > completions/heimdall-cli.zsh
	go run ./cmd/heimdall-cli completion fish > completions/heimdall-cli.fish

# Stage everything goreleaser packages into the RPM (man pages + completions).
# Invoked by goreleaser's before: hooks; safe to run standalone.
release-prep: man completions

clean:
	rm -f $(BIN) $(BIN)-fips $(BIN)-linux-*
	rm -rf man/ completions/ dist/
