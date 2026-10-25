import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import docRoutes from './routes/documents.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler (multer errors, bad uploads, etc.)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TrustVault running on http://localhost:${PORT}`));
