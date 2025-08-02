#!/usr/bin/env node

const { execSync } = require('child_process');

function getGitUsername() {
    try {
        const username = execSync('git config --get user.name', { encoding: 'utf8' }).trim();
        console.log('Git username:', username || 'Unknown User');
        return username || 'Unknown User';
    } catch (error) {
        console.log('Error getting git username:', error.message);
        return 'Unknown User';
    }
}

getGitUsername();