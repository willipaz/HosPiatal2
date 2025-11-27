const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Database setup
const db = new sqlite3.Database('./hospital.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

// Create tables
function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        rg TEXT,
        cpf TEXT UNIQUE NOT NULL,
        idade INTEGER,
        sus TEXT,
        telefone TEXT,
        sexo TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS triages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        senha TEXT NOT NULL,
        especialidade TEXT NOT NULL,
        sintomas TEXT,
        timestamp INTEGER,
        status TEXT DEFAULT 'pendente',
        FOREIGN KEY (patient_id) REFERENCES patients (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        especialidade TEXT NOT NULL,
        procedimentos TEXT,
        exames TEXT,
        medicamentos TEXT,
        observacao TEXT,
        status TEXT,
        data TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients (id)
    )`);
}

// API Endpoints

// Save triage data
app.post('/api/triage', (req, res) => {
    const { nome, rg, cpf, idade, sus, telefone, sexo, especialidade, sintomas, senha, timestamp } = req.body;

    // Insert or update patient
    db.run(`INSERT OR REPLACE INTO patients (nome, rg, cpf, idade, sus, telefone, sexo)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
             [nome, rg, cpf, idade, sus, telefone, sexo], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const patientId = this.lastID;

        // Insert triage
        db.run(`INSERT INTO triages (patient_id, senha, especialidade, sintomas, timestamp, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                 [patientId, senha, especialidade, sintomas, timestamp, 'pendente'], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Triage saved successfully', triageId: this.lastID });
        });
    });
});

// Get medical records by CPF
app.get('/api/prontuario/:cpf', (req, res) => {
    const cpf = req.params.cpf;

    db.get(`SELECT id FROM patients WHERE cpf = ?`, [cpf], (err, patient) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!patient) {
            return res.json([]);
        }

        db.all(`SELECT mr.*, p.nome, p.idade, p.rg
                FROM medical_records mr
                JOIN patients p ON mr.patient_id = p.id
                WHERE mr.patient_id = ?
                ORDER BY mr.data DESC`, [patient.id], (err, records) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(records);
        });
    });
});

// Save medical record
app.post('/api/medical-record', (req, res) => {
    const { cpf, especialidade, procedimentos, exames, medicamentos, observacao, status } = req.body;

    db.get(`SELECT id FROM patients WHERE cpf = ?`, [cpf], (err, patient) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const data = new Date().toISOString();
        db.run(`INSERT INTO medical_records (patient_id, especialidade, procedimentos, exames, medicamentos, observacao, status, data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                 [patient.id, especialidade, procedimentos, exames, medicamentos, observacao, status, data], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // If status is 'alta' or 'internação', update the corresponding triage to the same status
            if (status === 'alta' || status === 'internação') {
                db.run(`UPDATE triages SET status = ? WHERE patient_id = ? AND especialidade = ? AND status = 'pendente' ORDER BY timestamp DESC LIMIT 1`,
                       [status, patient.id, especialidade], function(err) {
                    if (err) {
                        console.error('Error updating triage status:', err.message);
                    }
                });
            }

            res.json({ message: 'Medical record saved successfully', recordId: this.lastID });
        });
    });
});

// Update triage status
app.put('/api/triage/:id/status', (req, res) => {
    const { status } = req.body;
    const triageId = req.params.id;

    db.run(`UPDATE triages SET status = ? WHERE id = ?`, [status, triageId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Triage status updated successfully' });
    });
});

// Get all triages
app.get('/api/triages', (req, res) => {
    db.all(`SELECT t.*, p.nome, p.cpf FROM triages t JOIN patients p ON t.patient_id = p.id ORDER BY t.timestamp DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
