REGISTRY = codebuild.alfinac.com:4444
IMAGE_NAME = nguyentk/timeline-reminder
GIT_HASH = $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")
TAG = $(GIT_HASH)
IMAGE = $(REGISTRY)/$(IMAGE_NAME):$(TAG)

.PHONY: build push build-push tag-latest

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
