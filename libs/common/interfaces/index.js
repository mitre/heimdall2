const authStrategyDefinitions = require('./config/auth-strategy.json');
const AUTH_STRATEGY = authStrategyDefinitions.strategies;
const AUTH_STRATEGIES = Object.values(AUTH_STRATEGY);
const OAUTH_AUTH_STRATEGIES = authStrategyDefinitions.oauthStrategies;

exports.AUTH_STRATEGIES = AUTH_STRATEGIES;
exports.AUTH_STRATEGY = AUTH_STRATEGY;
exports.OAUTH_AUTH_STRATEGIES = OAUTH_AUTH_STRATEGIES;
