require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware for socket authentication
io.use(async (socket, next) => {
  try {
    // Parse cookies from headers
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) return next(new Error('Authentication error: No cookies'));

    // Extract token
    const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
    if (!tokenCookie) return next(new Error('Authentication error: Token not found'));
    
    const token = tokenCookie.split('=')[1];
    
    // Verify JWT
    const { JWT_SECRET } = require('./middlewares/authMiddleware');
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      
      socket.user = decoded;
      
      // RBAC Check for Superadmin Room
      // Query role details from DB
      const db = require('./config/db');
      const role = await db('user_role').where({ id: decoded.id_role }).first();
      
      if (role && role.nama_role.toLowerCase() === 'superadmin') {
        socket.join('superadmin-room');
      }
      
      next();
    });
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (User: ${socket.user?.identifier})`);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.locals.io = io;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Generate CSRF token
const crypto = require('crypto');
const logMiddleware = require('./middlewares/logMiddleware');

app.get('/api/csrf', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  // Store in app.locals for verification
  req.app.locals.csrfToken = token;
  // Also set as cookie (same-site, non-httpOnly) for same-origin use
  res.cookie('XSRF-TOKEN', token, { httpOnly: false, secure: false, sameSite: 'lax' });
  // Return token in body so cross-origin frontend (different port) can read it
  res.json({ token });
});

const verifyCsrfToken = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const xsrfHeader = req.headers['x-xsrf-token'];
    const expectedToken = req.app.locals.csrfToken;

    console.log('[CSRF Debug] Header:', xsrfHeader, 'Expected:', expectedToken);

    if (!xsrfHeader || !expectedToken || xsrfHeader !== expectedToken) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
  }
  next();
};
// Apply CSRF checking to all routes below this
app.use(verifyCsrfToken);
// Apply activity logging to all authenticated routes (this will run for all routes, but inside it checks if req.user exists)
app.use(logMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Import routes
const authRoutes = require('./routes/auth');
const pegawaiRoutes = require('./routes/pegawai');
const masterRoutes = require('./routes/master');
const tunjanganRoutes = require('./routes/tunjangan');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');
const logRoutes = require('./routes/log');

app.use('/api/auth', authRoutes);
app.use('/api/pegawai', pegawaiRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/tunjangan', tunjanganRoutes);
app.use('/api/user', userRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/log', logRoutes);




const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tunjangan Transport API',
      version: '1.0.0',
      description: 'API untuk Kalkulasi Tunjangan Transport Sistem Kepegawaian Mini'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global Error Handler
app.use((err, req, res, next) => {

  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
