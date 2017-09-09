NAME=r.cfcr.io/anthonykgross/anthonykgross/sharinvideo

build:
	docker build --file="Dockerfile" --tag="$(NAME):master" .

install:
	docker-compose run sharinvideo install

debug:
	docker-compose run sharinvideo bash

run:
	docker-compose up
