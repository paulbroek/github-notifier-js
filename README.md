# github-notifier-js
Notifies users when he/she didn't commit for the day

## 1.0 How to run

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
