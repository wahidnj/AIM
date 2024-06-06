
const {Sequelize} = require("sequelize");
const sequelize = require("../util/database");

const Assignment = sequelize.define(
  "assignments",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    first_message: {
      type: Sequelize.TEXT('long'),
      allowNull: true
    },
    prompt: {
      type: Sequelize.TEXT('long'),
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: true,
    }
  },
  { timestamps: false }
);

module.exports = Assignment;