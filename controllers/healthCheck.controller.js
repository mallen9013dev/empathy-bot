const getStatus = async (req, res) => {
  const getFormattedUptime = (uptimeInSeconds) => {
    const days = Math.floor(uptimeInSeconds / 86400)
    const hours = Math.floor((uptimeInSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60)
    const seconds = Math.floor(uptimeInSeconds % 60)

    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  const payload = {
    status: "API is running \uD83C\uDFC3",
    uptime: getFormattedUptime(process.uptime())
  }

  res.status(201).send(payload)
}

module.exports = {
  getStatus
}
