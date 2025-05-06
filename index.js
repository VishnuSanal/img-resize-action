const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const width = core.getInput('width') || '300';
    const height = core.getInput('height') || '200';
    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== 'issue_comment') {
      core.setFailed('This action only works on issue_comment events.');
      return;
    }

    const commentId = context.payload.comment.id;
    const commentBody = context.payload.comment.body;
    const repo = context.repo;

    // Regex to capture alt text and URL from markdown image: ![alt](url)
    const updatedBody = commentBody.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
      const safeAlt = alt.replace(/"/g, '&quot;'); // escape quotes in alt
      return `<img src="${url}" alt="${safeAlt}" width="${width}" height="${height}">`;
    });

    if (updatedBody === commentBody) {
      console.log('No Markdown image tags found.');
      return;
    }

    await octokit.rest.issues.updateComment({
      owner: repo.owner,
      repo: repo.repo,
      comment_id: commentId,
      body: updatedBody,
    });

    console.log(`Updated comment #${commentId}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
