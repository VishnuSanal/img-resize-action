const core = require('@actions/core');
const github = require('@actions/github');

// Read an HTML attribute value (single- or double-quoted) from a tag string.
function getAttr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  if (!match) return '';
  return match[2] !== undefined ? match[2] : (match[3] || '');
}

// Rewrite image references in `body` to a normalized <img> with fixed size.
// Handles both Markdown (`![alt](url)`) and HTML (`<img ... src="url" ...>`),
// since GitHub now inserts <img> tags directly for uploaded images.
function resizeImages(body, width, height) {
  const tag = (url, alt) =>
    `<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}" width="${width}" height="${height}">`;

  return body
    .replace(/!\[(.*?)\]\((.*?)\)/g, (m, alt, url) => tag(url, alt))
    .replace(/<img\b[^>]*>/gi, (m) => {
      const src = getAttr(m, 'src');
      return src ? tag(src, getAttr(m, 'alt')) : m;
    });
}

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

    const updatedBody = resizeImages(body, width, height);

    if (updatedBody === body) {
      console.log('No image tags found.');
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
