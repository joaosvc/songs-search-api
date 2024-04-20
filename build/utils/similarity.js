"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.similarity = void 0;
const levenshteinDistance = (a, b) => {
    const dp = [];
    for (let i = 0; i <= a.length; i++) {
        dp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
        dp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[a.length][b.length];
};
const similarity = (a, b) => {
    const maxLength = Math.max(a.length, b.length);
    const distance = levenshteinDistance(a, b);
    return 1 - distance / maxLength;
};
exports.similarity = similarity;
