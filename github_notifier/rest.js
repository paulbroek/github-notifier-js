const dotenv = require('dotenv');
const {
    Octokit
} = require("@octokit/rest");

var SlackBot = require('slackbots');

// move tokens to .env
dotenv.config();

const slack_token = process.env.SLACK_TOKEN;
const github_auth = process.env.GITHUB_TOKEN;

// create a bot
var bot = new SlackBot({
    token: slack_token, // Add a bot https://my.slack.com/services/new/bot and put the token 
    name: 'Trading'
});

bot.on('start', function() {
    // more information about additional params https://api.slack.com/methods/chat.postMessage
    var params = {
        icon_emoji: ':cat:'
    };

    // define channel, where bot exist. You can adjust it there https://my.slack.com/services 
    console.log(`send message to slack`);
    bot.postMessageToChannel('notifications', 'meow!', params);
});

const octokit = new Octokit({
    auth: github_auth
});

// every hour run the job
setInterval(myTimer, 3 * 1000);

function myTimer() {
    const last_update_ago = [];
    promises = makePromises(last_update_ago);
    Promise.all(promises).then(() => {
        sort_log_updates(last_update_ago);
        console.log('ran again');
    });

    min_updated = updated_for_today(last_update_ago);
    const msg = `updated_for_today: ${min_updated}`;
    bot.postMessageToChannel('notifications', msg);
    console.log('ran myTimer')
}

// save last update in seconds by repository name (both private and public, those are separate API calls)

const sort_log_updates = (last_update_ago, ndisplay = 5) => {

    // sort by updated_ago
    last_update_ago.sort((a, b) => a.updated_ago - b.updated_ago);

    console.log(`last_update_ago: ${JSON.stringify(last_update_ago.slice(0, ndisplay), null, '\t')}`);
    console.log(`last_update_ago.length: ${last_update_ago.length}`);

    const repoNames = last_update_ago.map(x => x.name);
    const sortedRepoNames = repoNames.map(name => name.toLowerCase());
    sortedRepoNames.sort();
    console.log(`last_update_ago.keys: ${sortedRepoNames}`);
}
const updated_for_today = (last_update_ago) => {

    updated_agos = last_update_ago.map(x => x.updated_ago_hours);
    console.log(`updated_agos: ${JSON.stringify(updated_agos)}`);
    min_updated = Math.min(...updated_agos);
    console.log(`min_updated: ${min_updated}`);

    return min_updated;
};

const log_repo_names = function(data, last_update_ago) {
    const now = new Date();
    // const now_ts = Date.parse(now);

    // handle data
    // console.log(`some data: ${JSON.stringify(data)}`);
    console.log(`len data: ${data.length}`);
    // console.log(`data[0].keys: ${Object.keys(data[0])}`);
    // console.log(`data[0].name: ${data[0].name}`);
    // console.log(`data[0].pushed_at: ${data[0].pushed_at}`);
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
            log_repo_names(data, last_update_ago)
        });

    promises[1] =
        octokit.rest.repos
        .listForUser({
            username: "paulbroek",
        })
        .then(({
            data
        }) => {
            log_repo_names(data, last_update_ago)
        })

    return promises;
}

// Promise.all([getPublicRepos()]).then(() => {
const last_update_ago = [];
promises = makePromises(last_update_ago);
Promise.all(promises).then(() => {
    sort_log_updates(last_update_ago);

    // console.log(`promises resolved`);
    console.log(`last_update_ago.len: ${Object.keys(last_update_ago).length}`);

    // const repo = last_update_ago[0];
    // console.log(`${repo}: ${JSON.stringify(last_update_ago[repo])}`);

    min_updated = updated_for_today(last_update_ago);
    const msg = `updated_for_today: ${min_updated}`;
    bot.postMessageToChannel('notifications', msg);
});