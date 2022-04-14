# github-notifier-js

Notifies user when he/she didn't commit for the day

## 1.0 How to run (locally)

Create `.env` file in root dir

```vim
NODE_ENV=development
SLACK_TOKEN=...
GITHUB_TOKEN=...
```

Run node app:

```bash
node -e 'require("./github_notifier/rest")'
```

## 1.1 How to run (containerized)

Create `.env` file in root dir

```bash
cd ~/repos/github-notifier-js
vim .env
# ... past code in .env file
```

Build image

```bash
docker-compose build
```

Run service

```bash
# short
docker-compose up -d

# build and run
docker-compose up --build -d

# run from any location
docker-compose -f ~/repos/github-notifier-js/docker-compose.yml up -d && docker logs github-notifier --tail 50 -f

# attach logs from root dir
docker-compose logs -f

# stop the service
docker-compose down
```
