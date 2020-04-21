export declare const name: string;
export declare const version: string;
export declare const description: string;
export declare const main: string;
export declare const types: string;
export declare const engines: {
    "node": string;
    "atscm-cli": string;
    "atserver": string;
};
export declare const scripts: {
    "compile": string;
    "compile:watch": string;
    "docs": string;
    "docs:coverage": string;
    "format": string;
    "lint": string;
    "prepublishOnly": string;
    "test": string;
    "test:base": string;
    "test:unit": string;
    "test:integration": string;
    "test:watch": string;
    "test:coverage": string;
    "test:docs": string;
    "types": string;
};
export declare const repository: {
    "type": string;
    "url": string;
};
export declare const author: string;
export declare const license: string;
export declare namespace bugs {
    export const url: string;
}
export declare const homepage: string;
export declare const devDependencies: {
    "@atscm/esdoc-typescript-plugin": string;
    "@babel/cli": string;
    "@babel/core": string;
    "@babel/plugin-proposal-class-properties": string;
    "@babel/plugin-proposal-object-rest-spread": string;
    "@babel/preset-env": string;
    "@babel/preset-typescript": string;
    "@babel/register": string;
    "@ls-age/bump-version": string;
    "@ls-age/esdoc-coverage": string;
    "@ls-age/eslint-config": string;
    "@types/fs-extra": string;
    "@types/semver": string;
    "@typescript-eslint/eslint-plugin": string;
    "@typescript-eslint/parser": string;
    "babel-plugin-istanbul": string;
    "broken-link-checker-local": string;
    "buffer-replace": string;
    "codecov": string;
    "conventional-changelog-lint": string;
    "cross-env": string;
    "esdoc": string;
    "esdoc-ecmascript-proposal-plugin": string;
    "esdoc-standard-plugin": string;
    "eslint": string;
    "eslint-config-prettier": string;
    "eval": string;
    "husky": string;
    "istanbul-combine": string;
    "mocha": string;
    "mocha-circleci-reporter": string;
    "nyc": string;
    "prettier": string;
    "proxyquire": string;
    "sinon": string;
    "typescript": string;
    "unexpected": string;
    "unexpected-sinon": string;
    "unexpected-stream": string;
    "yargs": string;
};
export declare const dependencies: {
    "@atscm/server-scripts": string;
    "@babel/code-frame": string;
    "browser-sync": string;
    "chalk": string;
    "detect-indent": string;
    "fs-extra": string;
    "gulp": string;
    "gulp-compile-handlebars": string;
    "gulplog": string;
    "handlebars-helpers": string;
    "hasha": string;
    "modify-xml": string;
    "mri": string;
    "node-cleanup": string;
    "node-opcua": string;
    "p-queue": string;
    "prompts": string;
    "sane": string;
    "semver": string;
    "stream-to-promise": string;
    "through2": string;
    "validate-npm-package-name": string;
    "vinyl": string;
};
export declare const nyc: {
    "all": boolean;
    "include": string[];
    "exclude": string[];
    "require": string[];
    "sourceMap": boolean;
    "instrument": boolean;
    "check-coverage": boolean;
};
export declare namespace husky {
    export const hooks: {
        "commit-msg": string;
    };
}
export declare const renovate: {
    "extends": string[];
    "baseBranches": string[];
};
