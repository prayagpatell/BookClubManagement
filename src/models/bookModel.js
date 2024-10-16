import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Book = sequelize.define('Book', {
  book_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pub_date: {
    type: DataTypes.INTEGER
  }
});

export default Book;
