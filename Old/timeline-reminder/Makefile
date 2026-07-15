REGISTRY = codebuild.alfinac.com:4444
IMAGE_NAME = nguyentk/timeline-reminder
GIT_HASH = $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")
TAG = $(GIT_HASH)
IMAGE = $(REGISTRY)/$(IMAGE_NAME):$(TAG)
DOCKERFILE = Dockerfile.multiarch
CONTEXT = .

.PHONY: build push build-push tag-latest login
.PHONY: build-amd64 build-multiarch setup-qemu

build:
	docker build -t $(IMAGE) .
	@echo "Built: $(IMAGE)"

push:
	docker push $(IMAGE)
	@echo "Pushed: $(IMAGE)"

build-push: build push

tag-latest:
	docker tag $(IMAGE) $(REGISTRY)/$(IMAGE_NAME):latest
	docker push $(REGISTRY)/$(IMAGE_NAME):latest

login:
	docker login $(REGISTRY)

# Cross-platform: build AMD64 Linux from Apple Silicon Mac
build-amd64:
	docker buildx build \
		--platform linux/amd64 \
		-f $(DOCKERFILE) \
		-t $(IMAGE)-amd64 \
		--load \
		$(CONTEXT)
	@echo "Built AMD64: $(IMAGE)-amd64"

build-multiarch:
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-f $(DOCKERFILE) \
		-t $(IMAGE) \
		--push \
		$(CONTEXT)
	@echo "Built & pushed multiarch: $(IMAGE)"

setup-qemu:
	docker run --privileged --rm tonistiigi/binfmt --install all
	@echo "QEMU emulation installed"
