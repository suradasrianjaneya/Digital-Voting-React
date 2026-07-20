import app from './app.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Secure Digital Voting Platform API running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`, err);
  server.close(() => process.exit(1));
});
