import app from './src/app.js';
import connectDB from './src/config/db.js';

let PORT = process.env.PORT;

connectDB();

app.listen(PORT, () => {
  console.log(`port ${PORT} is open now for zigo`);
});
