const fs = require('fs');
const c = fs.readFileSync('C:\\Users\\syedu\\OneDrive\\Desktop\\Tyler-Tower\\tyler-core\\dist\\command-centre-v2.html', 'utf8');
let prowCount = 0;
let badgeCount = 0;
c.split('\n').forEach(l => {
  if (l.includes('class="prow division-card"')) prowCount++;
  if (l.includes('class="badge bench division-card"')) badgeCount++;
});
console.log('prow division-card count:', prowCount);
console.log('badge bench division-card count:', badgeCount);
// also check data-division exists on some prow cards
const prowDataDiv = c.match(/data-division=/g);
console.log('prow data-division attribute count (in entire file):', prowDataDiv ? prowDataDiv.length : 0);

// check the CSS .division-card rule exists
const cssRule = c.match(/\.division-card\s*\{[^}]+\}/);
console.log('CSS .division-card rule found:', cssRule ? 'yes' : 'no');

// check the visible state rule
const visibleRule = c.match(/\.division-card\.visible\s*\{[^}]+\}/);
console.log('CSS .division-card.visible rule found:', visibleRule ? 'yes' : 'no');