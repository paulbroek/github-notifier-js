# github-notifier-js

Notifies user when he/she didn't commit for the day

## 1. Configuration

### 1.1 Create `.env` file

Create `.env` file in root dir

```bash
cd ~/repos/github-notifier-js
vim .env
```

With contents:

```vim
NODE_ENV=development
SLACK_TOKEN=...
SLACK_CHANNEL=...
GITHUB_USER=...
GITHUB_TOKEN=...
```

### 1.2 Slack channel and keys

Create Slack account through your Google account.

Follow [this link](https://my.slack.com/services/new/bot) to create a Channel + API key.

More help on [generating API tokens](https://slack.com/help/articles/215770388-Create-and-regenerate-API-tokens)

## 2.1 Run locally

```bash
node -e 'require("./github_notifier/rest")'
```

## 2.2 Run containerized

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

# run from anywhere
docker-compose -f ~/repos/github-notifier-js/docker-compose.yml up -d && docker logs github-notifier --tail 50 -f

# attach logs from root dir
docker-compose logs -f

# stop the service
docker-compose down
```
