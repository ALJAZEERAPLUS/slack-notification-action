const fs = jest.createMockFromModule('@actions/core');

const input = {
    slack_webhook_url: 'https://hooks.slack.com/services/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',
    status: 'success',
    gha_api_token: '73192873892173yjahgdjha',
    slack_channel: 'mobile-apps-ci-alerts',
    slack_username: 'github',
    run_id: '123123'
};

fs.__setInput = (field, value) => {
    input[field] = value;
}

fs.getInput = (field) => {
    return input[field];
};

module.exports = fs;