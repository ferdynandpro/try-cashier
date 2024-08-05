// index.mjs or index.js (with "type": "module" in package.json)
import express from 'express';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
const secretKey = process.env.SECRET_KEY;

const allowedOrigins = ['https://cashier-web-five.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // jika Anda memerlukan credentials seperti cookie
  optionsSuccessStatus: 204 // beberapa browser lama (seperti IE11) menggunakan kode status ini
};

app.use(cors(corsOptions));
app.use(express.json());

let usersCollection;

MongoClient.connect(mongoUri)
  .then(client => {
    console.log('Connected to Database');
    const db = client.db('ProductInventoery');
    usersCollection = db.collection('users');
  })
  .catch(error => console.error('Failed to connect to the database:', error));

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
