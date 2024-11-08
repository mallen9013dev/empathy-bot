const Sequelize = require("sequelize")

const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env

const database = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql"
})

const initDB = async () => {
  try {
    await database.authenticate()

    if (process.env.SYNC_DB === "true") {
      await database.sync({ force: true })
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error)
  }
}

module.exports = {
  database,
  initDB
}
