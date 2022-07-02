const os = require("os");
const assert = require("assert");
const dotenv = require("dotenv");
const lt = require("log-timestamp");
const { Octokit } = require("@octokit/rest");

const SlackBot = require("slackbots");

// load .env vars
dotenv.config();

const slack_token = process.env.SLACK_TOKEN;
const slack_channel = process.env.SLACK_CHANNEL;
const github_user = process.env.GITHUB_USER;
const github_auth = process.env.GITHUB_TOKEN;

const LINE = "--------------------------------------------";
const MIN_PREC = 2;
const config = {
  ALERT_FROM_HOUR: 20,
  RUN_EVERY_HOURS: 5,
  PER_PAGE: 100,
};
// per_page: number of items to fetch from github api
const RUN_EVERY_SECS = 3600 * config.RUN_EVERY_HOURS;
const hostname = os.hostname();

// create a Slack bot
// Add a bot https://my.slack.com/services/new/bot and put the token
const bot = new SlackBot({
  token: slack_token,
  name: slack_channel,
});

bot.on("start", function () {
  // more information about additional params https://api.slack.com/methods/chat.postMessage
  const params = {
    icon_emoji: ":cat:",
  };

  // define channel, where bot exist. You can adjust it there https://my.slack.com/services
  const msg = `new session, connected from: ${hostname}`;
  bot.postMessageToChannel("notifications", msg, params);
});

const octokit = new Octokit({
  auth: github_auth,
});

// run the job periodically
setInterval(myTimer, RUN_EVERY_SECS * 1000);

function main() {
  console.log(
    `\n${LINE}\n-------- running github-notifier-js --------\n${LINE}`
  );
  console.log(`config: \n${JSON.stringify(config, null, "\t")}`);

  const last_update_ago = [];
  promises = makePromises(last_update_ago);

  Promise.all(promises).then(() => {
    sortLogUpdates(last_update_ago);
    const min_updated = updatedForToday(last_update_ago);
    const now = new Date();
    const threshold_cond =
      now.getHours() >= config.ALERT_FROM_HOUR &&
      min_updated > config.ALERT_FROM_HOUR;
    const notification = `You didn't commit for today. You have 3 hours to do so. \n (last commit was ~${min_updated.toFixed(
      MIN_PREC
    )} hours ago)`;

    // send notification to slack bot
    if (threshold_cond) {
      bot.postMessageToChannel("notifications", notification);
    }
  });
}

function myTimer() {
  main();
}

// save last update in seconds by repository name (both private and public, those are separate API calls)
const sortLogUpdates = (last_update_ago, ndisplay = 5) => {
  // sort by updated_ago
  last_update_ago.sort((a, b) => a.updated_ago - b.updated_ago);

  console.log(
    `last ${ndisplay} updates ago: \n${JSON.stringify(
      last_update_ago.slice(0, ndisplay),
      null,
      "\t"
    )}`
  );
  console.log(`last_update_ago.length: ${last_update_ago.length}`);

  const repoNames = last_update_ago.map((x) => x.name);
  const sortedRepoNames = repoNames.map((name) => name.toLowerCase());
  sortedRepoNames.sort();
  // console.log(`last_update_ago.keys: ${sortedRepoNames}`);
};

const updatedForToday = (last_update_ago, ndisplay = 8) => {
  updated_agos = last_update_ago.map((x) => x.updated_ago_hours);
  assert(last_update_ago.length > 0);
  console.log(
    `last ${ndisplay} updated_agos: ${JSON.stringify(
      updated_agos.slice(0, ndisplay)
    )}`
  );
  min_updated = Math.min(...updated_agos);
  const min_hours_ago = ` (${min_updated.toFixed(MIN_PREC)} hours ago)`;
  const cond = min_updated < config.ALERT_FROM_HOUR;
  const msg =
    (cond ? "you commited for today" : "you didn't commit for today") +
    min_hours_ago;
  console.log(msg);
  console.log(LINE);

  return min_updated;
};

const logRepoNames = function (data, last_update_ago, visibility) {
  const now = new Date();

  // console.log(`some data: ${JSON.stringify(data)}`);
  // console.log(`data[0].keys: ${Object.keys(data[0])}`);
  // console.log(`data[0].name: ${data[0].name}`);
  // console.log(`data[0].pushed_at: ${data[0].pushed_at}`);

  // handle data
  console.log(`${visibility} repos: ${data.length}`);
  data.forEach((el) => {
    // console.log(`el=${JSON.stringify(el)}`);
    // console.log(`el.name=${el.name}`);
    const updated_ago = now - new Date(el.pushed_at);
    last_update_ago.push({
      name: el.name,
      updated_at: el.pushed_at,
      updated_ago: updated_ago,
      updated_ago_hours: updated_ago / (1000 * 3600),
    });
  });
};

// console.log(`octokit.rest.repos keys: ${Object.keys(octokit.rest.repos)}`);
const makePromises = (last_update_ago) => {
  const promises = [];
  promises[0] = octokit.rest.repos
    .listForAuthenticatedUser({
      username: github_user,
      per_page: config.PER_PAGE,
    })
    .then(({ data }) => {
      logRepoNames(data, last_update_ago, "private");
    });

  promises[1] = octokit.rest.repos
    .listForUser({
      username: github_user,
      per_page: config.PER_PAGE,
    })
    .then(({ data }) => {
      logRepoNames(data, last_update_ago, "public");
    });
  return promises;
};

main();
