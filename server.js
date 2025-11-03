require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI missing in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

const studentSchema = new mongoose.Schema({
  collegeName: { type: String, default: 'BVC COLLEGE OF ENGINEERING' },
  collegeLocation: { type: String, default: 'Palacherla, Rajahmundry, East Godavari, Andhra Pradesh' },
  name: { type: String, required: true },
  roll: { type: String, required: true, unique: true },
  fatherName: String,
  dob: String,
  joinYear: Number,
  expiryYear: Number,
  address: String,
  uniqueCode: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

function genRoll(joinYear) {
  const jy = String(joinYear).slice(-2);
  const num = Math.floor(1000 + Math.random()*9000);
  return `${jy}-${num}`;
}

function genUnique(name) {
  const initials = (name||'').split(' ').map(s=>s[0]||'').join('').toUpperCase().slice(0,4);
  const t = String(Date.now()).slice(-6);
  const r = Math.floor(100+Math.random()*900);
  return `BVC${initials}${t}${r}`;
}

app.get('/', (req, res) => res.send('College ID backend running'));

app.post('/api/students', async (req, res) => {
  try {
    const { name, fatherName, dob, joinYear, roll, address } = req.body;
    const jy = joinYear ? Number(joinYear) : (new Date()).getFullYear();
    const finalRoll = roll && roll.trim() ? roll.trim() : genRoll(jy);
    const expiry = jy + 4;
    const uniqueCode = genUnique(name || finalRoll);

    const s = new Student({
      name, fatherName, dob, joinYear: jy, roll: finalRoll, expiryYear: expiry, address, uniqueCode
    });
    await s.save();
    res.json({ success: true, student: s });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const list = await Student.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
