const { Octokit } = require("@octokit/core");
const core = require('@actions/core');
const sendSlackMessage = require('./send-slack-message');

(async () => {
    try {
        core.startGroup('Sending Slack Message');
        const ghaApiToken = core.getInput("gha_api_token");
        let githubActionsApiClient;

        if(ghaApiToken) {
            if(!core.getInput('run_id')) {
                core.setFailed('The workflow run_id is required.');
            }
            githubActionsApiClient = new Octokit({ auth: ghaApiToken });
        }
        
        await sendSlackMessage(githubActionsApiClient);
    } catch (error) {
        core.setFailed(`[Error] There was an error when sending the slack notification ${error}`);
    }
})(); 