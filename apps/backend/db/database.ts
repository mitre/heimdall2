import AppConfig from '../config/app_config';

const appConfig = AppConfig.getInstance();

module.exports = appConfig.getDbConfig();
