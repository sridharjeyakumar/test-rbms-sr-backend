import app from "./app.js";
import { Config } from "./config/index.js";
// import cronRouter from "../api/cron/auto-reject-cron.js";
const PORT = process.env.PORT || Config.PORT;
// app.use(cronRouter);

const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    } catch (err) {
        console.error(`Server failed to start: ${err.message}`);
        process.exit(1);
    }
};

startServer();
