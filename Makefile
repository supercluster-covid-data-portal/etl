# Run Docker-Compose to start all docker container dependencies
docker-start:
	docker-compose -f docker-compose/docker-compose.yaml up -d

# Stop all docker containers
docker-stop:
	docker-compose -f docker-compose/docker-compose.yaml down --remove-orphans 

# Stop all docker containers and remove all data volumes.
docker-nuke:
	docker-compose  -f docker-compose/docker-compose.yaml down --volumes --remove-orphans 
