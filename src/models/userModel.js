import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db.js';

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Clubs', // Name of the table
      key: 'club_id'  // Key in the Clubs table that we're referencing
    }
  }
});

export default User;
