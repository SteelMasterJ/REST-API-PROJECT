'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Course extends Sequelize.Model {}
  Course.init({
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: Sequelize.STRING,
    description: Sequelize.TEXT,
    estimatedTime: {
        type: Sequelize.STRING,
        allowNull: true
    },
    materialsNeeded: {
        type: Sequelize.STRING,
        allowNull: true
    }
  }, { 
    sequelize 
  });

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
        as: 'user',
        foreignKey: {
            fieldName: 'userId',
            allowNull: false,
        },
    });
};

  return Course;
};