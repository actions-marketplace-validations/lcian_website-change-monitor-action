import './sourcemap-register.cjs';import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({

/***/ 752:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 191:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ }),

/***/ 186:
/***/ ((module) => {

module.exports = eval("require")("cheerio");


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXTERNAL MODULE: ../../.nvm/versions/node/v22.18.0/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/github
var github = __nccwpck_require__(752);
// EXTERNAL MODULE: ../../.nvm/versions/node/v22.18.0/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?axios
var _notfoundaxios = __nccwpck_require__(191);
// EXTERNAL MODULE: ../../.nvm/versions/node/v22.18.0/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?cheerio
var _notfoundcheerio = __nccwpck_require__(186);
;// CONCATENATED MODULE: external "crypto"
const external_crypto_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("crypto");
;// CONCATENATED MODULE: ./src/index.js





const URL = process.env["INPUT_URL"];
const SELECTOR = process.env["INPUT_SELECTOR"];

const DISCORD_WEBHOOK_URL = process.env["INPUT_DISCORD-WEBHOOK-URL"];
const SLACK_WEBHOOK_URL = process.env["INPUT_SLACK-WEBHOOK-URL"];

async function getContentHash(url, selector) {
    let html;
    try {
        html = await _notfoundaxios.get(url).then((res) => res.data);
    } catch (error) {
        console.error(`Error fetching URL ${URL}:`, error);
        process.exit(1);
    }

    let content = "";
    if (selector) {
        const $ = _notfoundcheerio.load(html);
        const elements = $(selector);
        for (const element of elements) {
            content += $(element).html();
        }
    } else {
        content = html;
    }

    const hash = external_crypto_namespaceObject.createHash("sha256").update(content).digest("base64");
    return hash;
}

async function getLastContentHash() {
    const octokit = github.getOctokit(process.env.GH_TOKEN);
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

    const actionId = external_crypto_namespaceObject.createHash("sha256").update(process.env.GITHUB_ACTION).digest("hex");
    const variable = `__WEBSITE_CHANGE_MONITOR_ACTION__${actionId}`;

    try {
        const res = await octokit.request(`GET /repos/${owner}/${repo}/actions/variables/${variable}`, {
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        return res.data.value;
    } catch (error) {
        return null;
    }
}

async function saveContentHash(hash) {
    const octokit = github.getOctokit(process.env.GH_TOKEN);
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

    const actionId = external_crypto_namespaceObject.createHash("sha256").update(process.env.GITHUB_ACTION).digest("hex");
    const variableName = `__WEBSITE_CHANGE_MONITOR_ACTION__${actionId}`;

    let shouldCreate = true;
    const response = await octokit.request(`GET /repos/${owner}/${repo}/actions/variables`, {
        headers: {
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    for (const repoVariable of response.data.variables) {
        if (repoVariable.name.toUpperCase() === variableName.toUpperCase()) {
            shouldCreate = false;
            break;
        }
    }

    if (shouldCreate) {
        await octokit.request(`POST /repos/${owner}/${repo}/actions/variables`, {
            name: variableName,
            value: hash,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
    } else {
        await octokit.request(`PATCH /repos/${owner}/${repo}/actions/variables/${variableName}`, {
            value: hash,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
    }
}

async function notifyDiscord(url, content) {
    await _notfoundaxios.post(url, { content }, { headers: { "Content-Type": "application/json" } });
}

async function notifySlack(url, content) {
    await _notfoundaxios.post(url, { text: content }, { headers: { "Content-Type": "application/json" } });
}

async function notify(url) {
    const content = `Website ${url} has changed!`;
    if (DISCORD_WEBHOOK_URL) {
        await notifyDiscord(DISCORD_WEBHOOK_URL, content);
    }
    if (SLACK_WEBHOOK_URL) {
        await notifySlack(SLACK_WEBHOOK_URL, content);
    }
}

async function main() {
    const hash = await getContentHash(URL, SELECTOR);
    const previousHash = await getLastContentHash(URL);
    if (hash === previousHash) {
        console.log("No changes detected.");
        return;
    } else {
        console.log("Changes detected. Sending notification.");
        await Promise.all([notify(URL), saveContentHash(hash)]);
    }
}

main();


//# sourceMappingURL=index.js.map