const { database } = require("../database.config")
const { DataTypes } = require("sequelize")

const AiTextCompletion = database.define(
  "aiTextCompletions",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      required: true
    },
    completionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    model: {
      type: DataTypes.STRING
    },
    prompt: {
      type: DataTypes.STRING(5000),
      allowNull: false
    },
    response: {
      type: DataTypes.STRING(5000),
      allowNull: false
    },
    promptTokens: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    completionTokens: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    underscored: true,
    updatedAt: false
  }
)

module.exports = {
  AiTextCompletion
}
