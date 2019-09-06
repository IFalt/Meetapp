import Sequelize from 'sequelize';

import User from '../app/models/user';
import Files from '../app/models/files';
import Meetup from '../app/models/meetup';

import databaseConfig from '../config/database';
import Subscription from '../app/models/subscription';

const models = [User, Files, Meetup, Subscription];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
