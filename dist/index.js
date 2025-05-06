/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 746:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 670:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(746);
const github = __nccwpck_require__(670);

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const width = core.getInput('width') || '300';
    const height = core.getInput('height') || '200';
    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.eventName !== 'issue_comment' && context.eventName !== 'issues') {
      core.setFailed('This action only works on commented events.');
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

module.exports = __webpack_exports__;
/******/ })()
;