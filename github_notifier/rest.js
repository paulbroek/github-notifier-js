const os = require('os');
const assert = require('assert');
const dotenv = require('dotenv');
const {
  Octokit,
} = require('@octokit/rest');

const SlackBot = require('slackbots');

// move tokens to .env
dotenv.config();

const slack_token = process.env.SLACK_TOKEN;
const github_auth = process.env.GITHUB_TOKEN;
const MIN_PREC = 3;
const ALERT_FROM_HOUR = 21;
const RUN_EVERY_HOURS = 5;
const RUN_EVERY_SECS = 3600 * RUN_EVERY_HOURS;
const hostname = os.hostname();

// create a Slack bot
const bot = new SlackBot({
  token: slack_token, // Add a bot https://my.slack.com/services/new/bot and put the token 
  name: 'Trading'
});

bot.on('start', function() {
  // more information about additional params https://api.slack.com/methods/chat.postMessage
  const params = {
    icon_emoji: ':cat:',
  };

  // define channel, where bot exist. You can adjust it there https://my.slack.com/services 
  // console.log(`send message to slack`);
  const msg = `new session, connected from: ${hostname}`;
  bot.postMessageToChannel('notifications', msg, params);
});

const octokit = new Octokit({
  auth: github_auth
});

// every hour run the job
setInterval(myTimer, RUN_EVERY_SECS * 1000);

function main() {
  const last_update_ago = [];
  promises = makePromises(last_update_ago);
  Promise.all(promises).then(() => {
    sortLogUpdates(last_update_ago);
    const min_updated = updatedForToday(last_update_ago);
    // const msg = `updatedForToday: ${res}`;
    const now = new Date();
    const threshold_cond = now.getHours() >= ALERT_FROM_HOUR && min_updated > ALERT_FROM_HOUR;
    const notification = `You didn't commit for today. You have 3 hours to do so. ${min_updated.toFixed(MIN_PREC)}`;

    // send notification to slack bot
    if (threshold_cond) {
      bot.postMessageToChannel('notifications', notification);
    }
  });
};

function myTimer() {
  main()

  console.log('ran myTimer')
}

// save last update in seconds by repository name (both private and public, those are separate API calls)
const sortLogUpdates = (last_update_ago, ndisplay = 5) => {

  // sort by updated_ago
  last_update_ago.sort((a, b) => a.updated_ago - b.updated_ago);

  console.log(`last_update_ago: ${JSON.stringify(last_update_ago.slice(0, ndisplay), null, '\t')}`);
  console.log(`last_update_ago.length: ${last_update_ago.length}`);

  const repoNames = last_update_ago.map(x => x.name);
  const sortedRepoNames = repoNames.map(name => name.toLowerCase());
  sortedRepoNames.sort();
  console.log(`last_update_ago.keys: ${sortedRepoNames}`);
}
const updatedForToday = (last_update_ago) => {

  updated_agos = last_update_ago.map(x => x.updated_ago_hours);
  assert(last_update_ago.length > 0);
  console.log(`updated_agos: ${JSON.stringify(updated_agos)}`);
  min_updated = Math.min(...updated_agos);
  const base_msg = `min_updated: ${min_updated.toFixed(MIN_PREC)} `;
  const cond = min_updated < ALERT_FROM_HOUR;
  const msg = base_msg + (cond ? 'you commited for today' : "you didn't commit for today");
  console.log(msg);
  console.log('--------------------------------------------');

  return min_updated;
};

const logRepoNames = function(data, last_update_ago) {
  const now = new Date();

  // console.log(`some data: ${JSON.stringify(data)}`);
  // console.log(`data[0].keys: ${Object.keys(data[0])}`);
  // console.log(`data[0].name: ${data[0].name}`);
  // console.log(`data[0].pushed_at: ${data[0].pushed_at}`);

  // handle data
  console.log(`len data: ${data.length}`);
  data.forEach(el => {
    // console.log(`el.name=${el.name}`)
    const updated_ago = now - new Date(el.pushed_at);
    last_update_ago.push({
      'name': el.name,
      'updated_at': el.pushed_at,
      'updated_ago': updated_ago,
      'updated_ago_hours': updated_ago / (1000 * 3600)
    });
  })
};

// console.log(`octokit.rest.repos keys: ${Object.keys(octokit.rest.repos)}`);
const makePromises = (last_update_ago) => {
  const promises = [];
  promises[0] =
    octokit.rest.repos
    .listForAuthenticatedUser({
      username: "paulbroek",
    })
    .then(({
      data
    }) => {
      logRepoNames(data, last_update_ago)
    });

  promises[1] =
    octokit.rest.repos
    .listForUser({
      username: "paulbroek",
    })
    .then(({
      data
    }) => {
      logRepoNames(data, last_update_ago)
    })

  return promises;
}

main();