const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const config = require("./config");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/", routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    errorCode: "NOT_FOUND",
  });
});

app.use(errorHandler);

const PORT = config.port;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
