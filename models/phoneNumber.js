
const {Sequelize} = require("sequelize");
const sequelize = require("../util/database");

const PhoneNumber = sequelize.define(
  "phone_number",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    vapi_id: {
        type: Sequelize.STRING,
        allowNull: true
    },
    customer_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    name: {
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

module.exports = PhoneNumber;