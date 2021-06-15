const express = require("express")

const app = express()
app.use("/", express.static("out"))
app.use("/", express.static("html"))

app.listen(8080, () => console.info("Listening!"))
