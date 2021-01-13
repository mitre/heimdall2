import AppConfig from '../config/app_config';

const appConfig = new AppConfig();

module.exports = appConfig.getDbConfig();
