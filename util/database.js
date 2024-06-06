const Sequelize = require("sequelize");

const sequelize = new Sequelize("aim", "admin", "wahid@#@#@#", {
  dialect: "mysql",
  host: "localhost",
  logging: false,
  define: {
    freezeTableName: true
  },
});

module.exports = sequelize;