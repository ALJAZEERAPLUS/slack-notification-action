'use strict';

const fs = jest.createMockFromModule('@actions/github');

fs.context = {
    actor: 'vhsantos26',
    repo: {
        repo: 'ump',
        owner: 'ALJAZEERAPLUS'
    },
    workflow: 'Al Jazeera Github Actions CI/CD',
    ref: 'refs/heads/master',
    sha: 'd069ebbf23922f6e123fa492b75cce928dc8a043'
};

module.exports = fs;