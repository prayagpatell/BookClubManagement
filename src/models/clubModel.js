import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Club = sequelize.define('Club', {
  club_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  club_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date_created: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  current_book: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Books', // Name of the table
      key: 'book_id'  // Key in the Books table that we're referencing
    }
  }
});

export default Club;
