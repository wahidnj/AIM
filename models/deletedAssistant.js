
const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const DeletedAssistant = sequelize.define(
  "deleted_assistant",
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
    assistant_id: {
        type: Sequelize.STRING,
        allowNull: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    voice: {
      type: Sequelize.STRING,
      allowNull: true
    },
    provider: {
      type: Sequelize.STRING,
      allowNull: true
    },
    assistant_vapi_id: {
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

// User.hasMany(Partner,{foreignKey:'vendor'})

module.exports = DeletedAssistant;