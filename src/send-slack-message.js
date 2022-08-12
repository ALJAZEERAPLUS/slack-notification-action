const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

const start_color     = '#C8F1F3';
const success_color   = '#32CD32';
const cancelled_color = '#FFA900';
const failure_color   = '#FF614E';

let githubActionsApiClient;

async function sendSlackMessage(ghaApiClient) {
    githubActionsApiClient = ghaApiClient;
    const message = await generateSlackMessage('Sending message');
    const slack_webhook_url = core.getInput("slack_webhook_url");
    
    if (!slack_webhook_url) {  
        throw new Error(`[Error] Missing Slack Incoming Webhooks URL
            Please configure "SLACK_WEBHOOK" as environment variable or
            specify the key called "slack_webhook_url" in "with" section`);
    }

    core.info('Sending slack message...');

    fetch(slack_webhook_url, {
        method: 'POST',
        body: JSON.stringify(message),
        headers: { 'Content-Type': 'application/json' },
    }).catch(console.error);

    core.info('Message sent.');
}

function getColor(status) {
    switch (status.toLowerCase()) {
        case 'success':
            return success_color;
        case 'cancelled':
            return cancelled_color;
        case 'failure':
            return failure_color;
        default:
            return start_color;
    }
}

function getText(status) {
    const actor = github.context.actor;
    const workflow = github.context.workflow;
    const notify_all = (core.getInput("notify_all") == "true" ? "<!here>" : "");
    const started = `<http://github.com/${actor}|${actor}>` + ' has *started* the "' + `${workflow}`  + '"' + ' workflow ';
    const succeeded = 'The workflow "*' + `${workflow}` + '*"' + ' was completed *successfully* by ' + `<http://github.com/${actor}|${actor}>`;
    const cancelled = ':warning: The workflow "*' + `${workflow}` + '*"' + ' was *cancelled* by ' + `<http://github.com/${actor}|${actor}>`;
    const failure = `${notify_all}`  + ' The workflow "*' + `${workflow}` + '*"' + ' *failed* by ' + `<http://github.com/${actor}|${actor}>`;
    
    switch (status.toLowerCase()) {
        case 'success':
            return succeeded;
        case 'cancelled':
            return cancelled;
        case 'failure':
            return failure;
        case 'started':
            return started;
        default:
            return `Status is not valid ${status}`;
    }
}

async function getWorkflowStatus(repo, run_id, owner) {
    core.info(`Fetching Workflow Jobs Statuses from Github Actions API for run id: ${run_id}...`);
    
    const response = await githubActionsApiClient.request("GET /repos/:owner/:repo/actions/runs/:run_id/jobs", {
        owner,
        type: "private",
        repo,
        run_id
    });

    let status = 'success';

    const jobs = response.data.jobs;

    for (let job of jobs) {
        if(job.conclusion === 'cancelled') {
            return job.conclusion
        } else if(job.conclusion === 'failure') {
            status = job.conclusion;
        }
    }

    core.info(`Workflow status is ${status}`);

    return status;
}

async function generateSlackMessage(text) {
    core.info('Generating message...');

    const { sha } = github.context;
    const { owner, repo } = github.context.repo;
    const runId = core.getInput("run_id");
    const ghaApiToken = core.getInput("gha_api_token");
    const status = ghaApiToken ? await getWorkflowStatus(repo, runId, owner) : core.getInput("status");
    const channel = core.getInput("slack_channel");
    const username = core.getInput("slack_username");
    const reportLink = (core.getInput("report_link") ? core.getInput("report_link") : "");

    attachments = [
        {
            fallback: text,
            color: getColor(status),
            ts: Math.floor(Date.now() / 1000),
            "fields": [
                {
                    "title": "Repository",
                    "value": `<https://github.com/${owner}/${repo}|${owner}/${repo}>`,
                    "short": true
                },      
                {
                    "title": "Ref",
                    "value": github.context.ref,
                    "short": true
                },                   
            ],
            "actions": [ 
                {
                    "type": "button",
                    "text": "Commit", 
                    "url": `https://github.com/${owner}/${repo}/commit/${sha}` 
                },
                {
                    "type": "button",
                    "text": "Action Details",
                    "url": `https://github.com/${owner}/${repo}/actions/runs/${runId}` 
                }
            ]               
        }
    ];

    if (reportLink) {
        core.info('Adding report link.');
        attachments[0].actions.push(
            {
                "type": "button",
                "text": "Report",
                "url": `${reportLink}` 
            }
        )
    };

    core.info(github.context.event_name);

    if (github.context.event_name === 'pull_request') {
        core.info('Adding pull request link.');
        attachments[0].actions.push(
            {
                "type": "button",
                "text": "Pull Request",
                "url": github.context.event.pull_request._links.html.href
            }
        )
    };

    core.info('Message generated with the following content: ' + JSON.stringify(attachments));

    return {
        channel,
        username,
        text: getText(status),
        attachments: attachments
    };
}

module.exports = sendSlackMessage;