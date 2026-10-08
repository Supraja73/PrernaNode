require('dotenv').config();
const validateEnv = require('./config/validateEnv');
validateEnv(); // fail-fast: throws before anything else boots if required config is missing/unsafe

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const storyRoutes = require('./routes/storyRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const hashtagRoutes = require('./routes/hashtagRoutes');
const searchRoutes = require('./routes/searchRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const skillRoutes = require('./routes/skillRoutes');
const mentorRequestRoutes = require('./routes/mentorRequestRoutes');
const businessRoutes = require('./routes/businessRoutes');
const productRoutes = require('./routes/productRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const communityRoutes = require('./routes/communityRoutes');
const communityPostRoutes = require('./routes/communityPostRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const eventRoutes = require('./routes/eventRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const advancedSearchRoutes = require('./routes/advancedSearchRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./socket');
const maintenanceMode = require('./middleware/maintenanceMode');
const { requestLogger } = require('./middleware/activityLogger');
const logger = require('./utils/logger');

connectDB();

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(compression()); // Part 5: gzip/brotli response compression
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(requestLogger); // Part 5: structured API request logging

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global rate limit
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PrernaNode API is running' });
});

app.use(maintenanceMode); // Part 5: platform-wide maintenance toggle (admin/auth routes stay exempt)

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/mentor-requests', mentorRequestRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/community-posts', communityPostRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/advanced-search', advancedSearchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/verification-requests', verificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`PrernaNode API — Connect. Inspire. Rise. — listening on port ${PORT} [${process.env.NODE_ENV || 'development'}] (HTTP + Socket.io)`);
});
