DOCKER="docker"
IMAGE_NAME="kiansheik/tupi-annotation-suite"
TAG_NAME="production"

REPOSITORY=""
FULL_IMAGE_NAME=${IMAGE_NAME}:${TAG_NAME}

lint:
	echo 'kiansheik.io' > public/CNAME

push:
	make lint
	git add .
	git commit
	git push origin HEAD

deploy:
	make push
	npm run deploy