import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { bootstrapDatabase } from '../services/bootstrapService.js';

dotenv.config();

const seed = async () => {
  await connectDB();
  await bootstrapDatabase();
  console.log('Database seeded');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
