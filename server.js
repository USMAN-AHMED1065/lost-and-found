
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const app = express();
const PORT = 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));


app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session.userId;
  res.locals.userId = req.session.userId;
  next();
});

// Parse form data (like request.form in Flask)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// method override

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Import routes
const postsRouter = require('./routes/posts');
app.use('/posts', postsRouter);


// Authentication routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

// Profile routes
const profileRouter = require('./routes/profile');
app.use('/profile', profileRouter);

// Home route
app.get('/', (req, res) => {
  res.render('home');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});