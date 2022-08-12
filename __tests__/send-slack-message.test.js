const sendSlackMessage = require('../src/send-slack-message');

const mockGithubActionsApiClient = require('@octokit/core');
const mockInput = require('@actions/core');
const mockGithubContext = require('@actions/github');

beforeEach(() => {
  fetch.resetMocks();
});

test('It should include the workflow run URL in the message', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'cancelled');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.attachments[0].actions[1].url).toEqual(`https://github.com/${mockGithubContext.context.repo.owner}/${mockGithubContext.context.repo.repo}/actions/runs/${mockInput.getInput('run_id')}`);
});

test('It should include the commit SHA in the message', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'cancelled');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.attachments[0].actions[0].url).toEqual(`https://github.com/${mockGithubContext.context.repo.owner}/${mockGithubContext.context.repo.repo}/commit/${mockGithubContext.context.sha}`);
});

test('It should not include the report link in the message', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'cancelled');
  mockInput.__setInput('report_link', '');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.attachments[0].actions.length).toEqual(2);
});

test('It should include the report link in the message', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'cancelled');
  mockInput.__setInput('report_link', 'https://www.google.com/');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.attachments[0].actions[2].url).toEqual(`https://www.google.com/`);
});

test('It should include the branch name in the message', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'cancelled');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.attachments[0].fields[1].value).toEqual(mockGithubContext.context.ref);
});

test('It should include the repository name in the message', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'cancelled');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.attachments[0].fields[0].value).toEqual(`<https://github.com/${mockGithubContext.context.repo.owner}/${mockGithubContext.context.repo.repo}|${mockGithubContext.context.repo.owner}/${mockGithubContext.context.repo.repo}>`);
});

test('It should send workflow cancelled message when status input is cancelled', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'cancelled');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining('cancelled'));
});

test('It should send workflow failure message when status input is failure', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'failure');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining('failed'));
});

test('It should send workflow success message when status input is success', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', undefined);
  mockInput.__setInput('status', 'success');

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining('successfully'));
});

test('It should send workflow failure message with notifying the active members of the channel when a job failed', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', '1623usgdhjay263176');
  mockInput.__setInput('notify_all', 'true');
  mockGithubActionsApiClient.__setJobsResponse({
    "data": {
      "jobs": [
        {
          "conclusion": "failure"
        }
      ]
    }
  });

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining('failed'));
  expect(message.text).toEqual(expect.stringContaining("<!here>"));
});

test("It should send workflow failure message without notifying the active members of the channel when a job failed", async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput("gha_api_token", "1623usgdhjay263176");
  mockInput.__setInput("notify_all", "false");
  mockGithubActionsApiClient.__setJobsResponse({
    "data": {
      "jobs": [
        {
          "conclusion": "failure"
        }
      ]
    }
  });

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining("failed"));
  expect(message.text).toEqual(expect.not.stringContaining("<!here>"));
});

test('It should send workflow cancelled message when a job was cancelled and another failed', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', '1623usgdhjay263176');
  mockGithubActionsApiClient.__setJobsResponse({
    "data": {
      "jobs": [
        {
          "conclusion": "failure"
        },
        {
          "conclusion": "cancelled"
        }
      ]
    }
  });

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining('cancelled'));
});

test('It should send workflow success message when all jobs were successful', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', '1623usgdhjay263176');
  mockGithubActionsApiClient.__setJobsResponse({
    "data": {
      "jobs": [
        {
          "conclusion": "success"
        },
        {
          "conclusion": "success"
        }
      ]
    }
  });

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining('successfully'));
});

test('It should send workflow cancelled message when a job was cancelled and all jobs were successful', async () => {
  fetch.mockResponseOnce(undefined);
  mockInput.__setInput('gha_api_token', '1623usgdhjay263176');
  mockGithubActionsApiClient.__setJobsResponse({
    "data": {
      "jobs": [
        {
          "conclusion": "success"
        },
        {
          "conclusion": "success"
        },
        {
          "conclusion": "cancelled"
        }
      ]
    }
  });

  await sendSlackMessage(mockGithubActionsApiClient);

  const message = JSON.parse(fetch.mock.calls[0][1].body);

  expect(message.text).toEqual(expect.stringContaining('cancelled'));
});