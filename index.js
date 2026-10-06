// Root entrypoint for opencode V2 directory-form plugin registration.
//
// V2 (2.0.4 or later) wants a config plugin entry to be a directory with an
// index entrypoint, e.g. "plugins": ["/absolute/path/to/branchwright"].
// npm and git installs resolve through package.json "main" instead.
export { default } from './.opencode/plugins/workflow.js';
export { BranchwrightPlugin } from './.opencode/plugins/workflow.js';
