const express = require('express');
const CryptoJS = require('crypto-js');
const app = express();
const EXPIRE_DURATION = 30;

app.use(express.json());

const organizations = {
    piedpiper: {
        'test@test.com': '2FA_SAMPLE_SECRET_69$420'
    }
}

const getCurrentUnixTimeStamp = () => Math.floor(Date.now() / 1000);

function generateCode(timestamp, secret) {
    const hmacSha1 = CryptoJS.HmacSHA1(timestamp.toString(), secret).toString();
    const codeNumber = parseInt(hmacSha1, 16);
    const code = codeNumber % 1000000;
    return code.toString().padStart(6, '0');
}

function obtainAllLast30SecsCodes(secret) {
    const currentTimestamp = getCurrentUnixTimeStamp();
    const last30SecsCodes = []
    for (let i = currentTimestamp - EXPIRE_DURATION ; i < currentTimestamp; i++) {
        last30SecsCodes.push(generateCode(i, secret))
    }
    return last30SecsCodes
}

function validate(code, last30SecsCodes) {
    return last30SecsCodes.includes(code)
}

app.post('/2fa/:org', (req, res) => {
    const { email, code } = req.body;
    const org = req.params.org;
    const secret = organizations[org][email];
    const last30SecsCodes = obtainAllLast30SecsCodes(secret);
    return validate(code, last30SecsCodes) ? res.status(200).json({ status: 'success' }) : res.status(401).json({ status: 'failed' });
});

app.post('/auth', (req, res) => {
    const { email, password } = req.body;
    if (email === 'test@test.com' && password === 'test1234') {
        res.status(200).json({ status: 'success' })
    }
    else {
        res.status(401).json({ status: 'failed' });
    }
});

app.get('/test', (req, res) => {
    const secret = '2FA_SAMPLE_SECRET_69$420';
    res.send(obtainAllLast30SecsCodes(secret));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});
