const fs = jest.createMockFromModule('@octokit/core');

let jobsApiResponse;

fs.__setJobsResponse = (response) => {
    jobsApiResponse = response;
};

fs.request = (accessToken, repo, run_id, owner) => {
    return jobsApiResponse;
};

module.exports = fs;