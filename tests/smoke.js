const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const market = fs.readFileSync('market.js','utf8');
const required = ['dashboard','cartera','liquidez','crypto','objetivo','riesgo','decision','aportaciones','alertas','radar','historial','config'];
for (const name of required) {
  if (!html.includes(`${name}()`)) throw new Error(`Missing module: ${name}`);
}
for (const token of ['PortfolioIntelligenceV4','MarketV4','7203.T','Ethereum','SWDA.L']) {
  if (!market.includes(token)) throw new Error(`Missing core token: ${token}`);
}
if (!html.includes("data.crypto.eth")) throw new Error('ETH quantity handling missing');
console.log('Patrimonio V2 smoke test: PASS');
