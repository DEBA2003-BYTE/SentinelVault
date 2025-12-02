const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sentinel-vault')
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const users = await db.collection('users').find({}).toArray();
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log('Email:', user.email, 'IsAdmin:', user.isAdmin);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
