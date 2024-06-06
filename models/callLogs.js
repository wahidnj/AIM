
const {Sequelize} = require("sequelize");
const sequelize = require("../util/database");

const CallLog = sequelize.define(
  "call_logs",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    assistant_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    customer_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    call_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    vapi_cost: {
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    deepgram_cost: {
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    payment_gateway_cost: {
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    aim_cost: {
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    total_cost: {
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false
    },
    started_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    ended_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    recording_url: {
      type: Sequelize.STRING,
      allowNull: true
    },
    transcribe: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    cost_breakdown: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    message_info: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    end_reason: {
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
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  { timestamps: false }
);

module.exports = CallLog;