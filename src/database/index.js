import Sequelize from 'sequelize';

import User from '../app/models/user';
import Files from '../app/models/files';

import databaseConfig from '../config/database';

const models = [User, Files];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models.map(model => model.init(this.connection));
  }
}

export default new Database();
