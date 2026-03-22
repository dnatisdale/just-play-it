const fs = require('fs');
['style.css', 'index.html'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.split('#be1e37').join('#940414');
  content = content.split('190, 30, 55').join('148, 4, 20');
  fs.writeFileSync(f, content, 'utf8');
});
