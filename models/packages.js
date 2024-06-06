
const {Sequelize} = require("sequelize");
const sequelize = require("../util/database");

const Package = sequelize.define(
  "packages",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    amount: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    plan: {
      type: Sequelize.STRING,
      allowNull: true
    },
    service_1: {
      type: Sequelize.STRING,
      allowNull: true
    },
    service_2: {
      type: Sequelize.STRING,
      allowNull: true
    },
    service_3: {
      type: Sequelize.STRING,
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

module.exports = Package;