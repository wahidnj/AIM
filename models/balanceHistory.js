
const {Sequelize} = require("sequelize");
const sequelize = require("../util/database");

const BalanceHistory = sequelize.define(
  "balance_history",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    customer_id: {
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

module.exports = BalanceHistory;