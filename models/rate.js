
const {Sequelize} = require("sequelize");
const sequelize = require("../util/database");

const Rate = sequelize.define(
  "rate",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    provider: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    voice: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    amount: {
      type: Sequelize.DOUBLE,
      defaultValue: 0.0
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

module.exports = Rate;