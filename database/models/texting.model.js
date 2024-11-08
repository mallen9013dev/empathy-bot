const { database } = require("../database.config")
const { DataTypes } = require("sequelize")

const PhoneNumber = database.define(
  "phone_numbers",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    optedIn: {
      type: DataTypes.BOOLEAN,
      default: 0
    },
    optDate: {
      type: DataTypes.DATE
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

const TextMessage = database.define(
  "text_messages",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING
    },
    messageId: {
      type: DataTypes.STRING,
      unique: true
    },
    to: {
      type: DataTypes.STRING,
      allowNull: false
    },
    from: {
      type: DataTypes.STRING,
      allowNull: false
    },
    numSegments: {
      type: DataTypes.TINYINT
    },
    body: {
      type: DataTypes.STRING(2048), // max characters per twilio
      allowNull: false
    },
    direction: {
      type: DataTypes.ENUM("inbound", "outbound"),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING
    },
    errorCode: {
      type: DataTypes.STRING
    },
    errorMessage: {
      type: DataTypes.STRING
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  },
  {
    underscored: true
  }
)

module.exports = {
  TextMessage,
  PhoneNumber
}
