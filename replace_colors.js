const fs = require('fs');
const path = require('path');

const files = ['style.css', 'index.html'];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace hex
  content = content.replace(/#be1e37/gi, '#940414');
  
  // Replace rgb tuple
  content = content.replace(/190,\s*30,\s*55/g, '148, 4, 20');
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Replaced colors successfully!');
