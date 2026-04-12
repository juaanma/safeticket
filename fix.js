const fs = require('fs');
let txt = fs.readFileSync('login.html', 'utf8');
txt = txt.replace(/placeholder=".*?" required/, 'placeholder="********" required');
fs.writeFileSync('login.html', txt);
let txt2 = fs.readFileSync('register.html', 'utf8');
txt2 = txt2.replace(/placeholder=".*?" required/, 'placeholder="********" required');
fs.writeFileSync('register.html', txt2);
