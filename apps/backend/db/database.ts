import AppConfig from '../config/app-config';

const appConfig = new AppConfig();

module.exports = appConfig.getDbConfig();
