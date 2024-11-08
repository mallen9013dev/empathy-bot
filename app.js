require("dotenv").config()
const cookieParser = require("cookie-parser")
const cors = require("cors")
const express = require("express")
const routes = require("./routes")
const { initDB } = require("./database/database.config")

const app = express()
const port = 3000

app.use(cookieParser())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded())
app.use("/api", routes)

initDB()

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
