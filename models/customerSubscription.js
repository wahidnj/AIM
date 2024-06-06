
const {Sequelize} = require("sequelize");
const sequelize = require("../util/database");

const CustomerSubscription = sequelize.define(
  "customer_subscription",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    package_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    customer_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    subscribed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    expired_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
    phone_number_id: {
      type: Sequelize.INTEGER,
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

module.exports = CustomerSubscription;