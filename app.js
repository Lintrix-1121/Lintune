const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config();
const authenticate = require('./middleware/jwtAuth');

const app = express();

const startSubscriptionJob = require('./middleware/subscriptionJob');


// CORS Configuration BEFORE other middleware
// app.use(cors({
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       'http://localhost:3000',
//       'http://127.0.0.1:3000',
//       'https://crestune.logiphix.tech',
//       'https://api.crestune.logiphix.tech'
//     ];
//     // Allow requests with no origin (like mobile apps or curl)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));


// App middleware
app.use(express.json(
  {
    verify: (req,res, buf) => {
    req.rawBody = buf.toString();
  }
  }
));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});


// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    //sameSite: 'none',
    //domain: 'logiphix.tech',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database setup
const sequelize = require('./config/dbConfig');
const User = require('./models/user')(sequelize, require('sequelize').Sequelize);
const Tune = require('./models/song')(sequelize, require('sequelize').Sequelize);

const SubscriptionPlan = require('./models/subscriptionPlans')(sequelize, require('sequelize').Sequelize);
const Subscription = require('./models/subscriptions')(sequelize, require('sequelize').Sequelize);
const Payments = require('./models/payments')(sequelize, require('sequelize').Sequelize);

// Initialize controllers
const AuthController = require('./controllers/authController');
const UserController = require('./controllers/userController');
const UploadController = require('./controllers/uploadController');
const DownloadController = require('./controllers/downloadController');
const TuneController = require('./controllers/tuneController');
const { verify } = require('jsonwebtoken');

const SubscriptionPlanController = require('./controllers/subscriptionPlanController');
const SubscriptionController = require('./controllers/subscriptionController');
const PaymentsController = require('./controllers/paymentController');
const requireActiveSubscrption = require('./middleware/requireActiveSubscrption');

const authController = new AuthController(User);
const userController = new UserController(User);
const uploadController = new UploadController(Tune);
const downloadController = new DownloadController(Tune);
const tuneController = new TuneController(Tune);

const subscriptionPlanController = new SubscriptionPlanController(
  SubscriptionPlan
);
const subscriptionController = new SubscriptionController(
  Subscription, SubscriptionPlan, Payments, User
);
const paymentController = new PaymentsController(
  Payments, Subscription, SubscriptionPlan
);

const requireSubscription = require('./middleware/requireActiveSubscrption')(
  Subscription
);


// Routes
app.use('/auth', require('./routes/authRoutes')(authController));
app.use('/users', require('./routes/userRoutes')(userController));
app.use('/upload', 
  authenticate, requireSubscription,
  require('./routes/uploadRoutes')(uploadController));
app.use('/dold', authenticate, requireSubscription, require('./routes/downloadRoutes')(downloadController));
app.use('/tune', authenticate, requireSubscription, require('./routes/tuneRoutes'));

app.use('/subscription-plans', require('./routes/subscriptionPlanRoutes')(
  subscriptionPlanController, authenticate
));
app.use('/subscriptions', require('./routes/subscriptionRoutes')(
  subscriptionController, authenticate
));
app.use('/payments', require('./routes/paymentRoutes')(
  paymentController, authenticate
));


// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Linback Server is running!',
    endpoints: {
      auth: {
        google: 'GET /auth/google',
        logout: 'POST /auth/logout',
        status: 'GET /auth/status'
      },
      users: {
        current: 'GET /users/me',
        update: 'PUT /users/me',
        delete: 'DELETE /users/me'
      }
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database connection and server start
const PORT = process.env.PORT;

async function startServer() {
  try {
    console.log('Attempting to connect to database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    startSubscriptionJob({ Subscription, SubscriptionPlan, Payments });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Google OAuth callback: http://localhost:${PORT}/auth/google/callback`);
      console.log(`API Base URL: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    console.log('Troubleshooting tips:');
    console.log('1. Check if your database server is running');
    console.log('2. Verify database credentials in .env file');
    console.log('3. Ensure database exists');
    console.log('4. Check if port 3000 is available');
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection:', err.message);
  console.log('Shutting down server gracefully...');
  process.exit(1);
});

startServer();
