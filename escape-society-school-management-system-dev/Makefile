
WEB_SERVICE=web
DB_SERVICE=database


up:
	sudo docker-compose up -d
up-build:
	sudo docker-compose up --build -d
logs:
	sudo docker-compose logs -f
logs-web:
	sudo docker-compose logs -f $(WEB_SERVICE)
logs-db:
	sudo docker-compose logs -f $(DB_SERVICE)
down:
	sudo docker-compose down
down-v:
	sudo docker-compose down -v

# Convenience target: rebuild, start, and follow FastAPI logs
run: up-build logs-web
