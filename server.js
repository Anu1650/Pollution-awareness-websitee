const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

const dataFilePath = path.join(__dirname, 'data.json');

// Public pages
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/effects', (req, res) => res.render('effects'));
app.get('/prevention', (req, res) => res.render('prevention'));

// Contact form submission
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  const newEntry = {
    name,
    email,
    message,
    timestamp: new Date().toISOString()
  };

  let existingData = [];

  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath);
    if (raw.length > 0) {
      existingData = JSON.parse(raw);
    }
  }

  existingData.push(newEntry);
  fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2));

  res.send("<h1>Thank you for contacting us!</h1><a href='/'>Back to Home</a>");
});

// Admin login form
app.get('/admin', (req, res) => {
  res.render('admin_login', { error: null });
});

// Handle admin login
app.post('/admin', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '1234') {
    req.session.isAdmin = true;
    res.redirect('/admin/dashboard');
  } else {
    res.render('admin_login', { error: 'Invalid username or password' });
  }
});

// Admin dashboard
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin');

  let contactData = [];

  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath);
    if (raw.length > 0) {
      contactData = JSON.parse(raw);
    }
  }

  res.render('admin_dashboard', { contactData, error: null });
});

// Add record from admin panel
app.post('/admin/add', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('Access Denied');

  const { name, email, message } = req.body;
  const newEntry = {
    name,
    email,
    message,
    timestamp: new Date().toISOString()
  };

  let contactData = [];
  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath);
    if (raw.length > 0) {
      contactData = JSON.parse(raw);
    }
  }

  contactData.push(newEntry);
  fs.writeFileSync(dataFilePath, JSON.stringify(contactData, null, 2));

  res.redirect('/admin/dashboard');
});

// Delete specific record by index
app.post('/admin/delete/:index', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('Access Denied');

  const index = parseInt(req.params.index);
  if (isNaN(index)) return res.status(400).send('Invalid index.');

  let contactData = [];

  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath);
    if (raw.length > 0) {
      contactData = JSON.parse(raw);
    }
  }

  if (index >= 0 && index < contactData.length) {
    contactData.splice(index, 1);
    fs.writeFileSync(dataFilePath, JSON.stringify(contactData, null, 2));
  }

  res.redirect('/admin/dashboard');
});

// Download JSON file
app.get('/download-json', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('Access Denied');

  if (fs.existsSync(dataFilePath)) {
    res.download(dataFilePath, 'contact_data.json');
  } else {
    res.status(404).send('JSON file not found.');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Start server
app.listen(3000, () => {
  console.log('🌍 Server running at http://localhost:3000');
});
