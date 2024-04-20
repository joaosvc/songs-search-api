"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverError = exports.unauthorized = exports.badRequest = exports.ok = void 0;
const protocols_1 = require("./protocols");
const ok = (body) => ({
    statusCode: protocols_1.HttpStatusCode.OK,
    body,
});
exports.ok = ok;
const badRequest = (message) => {
    return {
        statusCode: protocols_1.HttpStatusCode.BAD_REQUEST,
        body: message,
    };
};
exports.badRequest = badRequest;
const unauthorized = (message) => {
    return {
        statusCode: protocols_1.HttpStatusCode.UNAUTHORIZED,
        body: message,
    };
};
exports.unauthorized = unauthorized;
const serverError = (message) => {
    return {
        statusCode: protocols_1.HttpStatusCode.SERVER_ERROR,
        body: `Something went wrong${message ? `: ${message}` : ""}`,
    };
};
exports.serverError = serverError;
