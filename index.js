const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const width = core.getInput('width') || '600';
    const height = core.getInput('height') || '800';
    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== 'issue_comment' && context.eventName !== 'issues') {
      core.setFailed('This action only works on issue or comment events.');
      return;
    }

    // `issue_comment` events carry the body on `payload.comment`; `issues`
    // events carry it on `payload.issue`. They also update via different APIs.
    const isComment = context.eventName === 'issue_comment';
    const target = isComment ? context.payload.comment : context.payload.issue;
    const body = target.body;
    const repo = context.repo;

    // Regex to capture alt text and URL from markdown image: ![alt](url)
    const updatedBody = body.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
      const safeAlt = alt.replace(/"/g, '&quot;'); // escape quotes in alt
      return `<img src="${url}" alt="${safeAlt}" width="${width}" height="${height}">`;
    });

    if (updatedBody === body) {
      console.log('No Markdown image tags found.');
      return;
    }

    if (isComment) {
      await octokit.rest.issues.updateComment({
        owner: repo.owner,
        repo: repo.repo,
        comment_id: target.id,
        body: updatedBody,
      });
      console.log(`Updated comment #${target.id}`);
    } else {
      await octokit.rest.issues.update({
        owner: repo.owner,
        repo: repo.repo,
        issue_number: target.number,
        body: updatedBody,
      });
      console.log(`Updated issue #${target.number}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
