.DEFAULT_GOAL := build

MODULE := github.com/mitre/heimdall2/apps/heimdall-cli
BIN := heimdall-cli
override VERSION := $(shell sed 's/^v//' VERSION)
COMMIT ?= development
DATE ?= unknown
OUTPUT ?= $(BIN)
LDFLAGS := -s -w \
	-X $(MODULE)/internal/version.Version=$(VERSION) \
	-X $(MODULE)/internal/version.Commit=$(COMMIT) \
	-X $(MODULE)/internal/version.Date=$(DATE)

.PHONY: build build-fips build-linux-amd64 build-linux-arm64 test test-functional test-integration test-e2e test-all lint clean man completions

.PHONY: check-version
check-version:
	@test "$$(wc -l < VERSION)" -eq 1
	@LC_ALL=C grep -E '^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$$' VERSION | cmp -s VERSION -

build: check-version
	@mkdir -p "$$(dirname "$(OUTPUT)")"
	CGO_ENABLED=0 go build -mod=readonly -trimpath -buildvcs=false \
	  -ldflags "$(LDFLAGS)" -o "$(OUTPUT)" ./cmd/heimdall-cli

build-linux-amd64:
	$(MAKE) build GOOS=linux GOARCH=amd64 OUTPUT=$(BIN)-linux-amd64

build-linux-arm64:
	$(MAKE) build GOOS=linux GOARCH=arm64 OUTPUT=$(BIN)-linux-arm64

build-fips: check-version
	GOEXPERIMENT=boringcrypto CGO_ENABLED=1 go build -mod=readonly \
	  -trimpath -buildvcs=false -ldflags "$(LDFLAGS)" \
	  -o $(BIN)-fips ./cmd/heimdall-cli

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

clean:
	rm -f $(BIN) $(BIN)-fips $(BIN)-linux-*
	rm -rf man/ completions/ dist/
