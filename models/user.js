const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init({
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    firstName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: {
              msg: 'Please provide a value for "First Name"',
            },
            notEmpty: {
              msg: 'Please provide a value for "First Name"',
            },
          },
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: {
              msg: 'Please provide a value for "Last Name"',
            },
            notEmpty: {
                msg: 'Please provide a value for "Last Name"',
              },
          },
     },
    emailAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: {
              msg: 'Please provide a value for "Email Address"',
            },
            notEmpty: {
                msg: 'Please provide a value for "Email Address"',
              },
          },
     },
     password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: {
              msg: 'Please provide a value for "Password"',
            },
            notEmpty: {
                msg: 'Please provide a value for "Password"',
              },
          },
     },
  }, {
    timestamps: true, // enable timestamps
    sequelize 
   });

   User.associate = (models) => {
    User.hasMany(models.Course, {
      as: 'userId', // alias
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });
  };

  return User;
};