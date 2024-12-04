const fs = require('fs');
const data = fs.readFileSync('codigos_postales_municipios.csv', 'utf8')
    .split('\n')
    .slice(1) // Skip header
    .map(line => {
        if (!line.trim()) return null;
        const [cp, municipio_id, n] = line.split(',');
        if (!cp || !n) return null;
        return {
            cp: cp.trim(),
            n: n.trim().replace(/^"|"$/g, '') // Remove quotes
        };
    })
    .filter(Boolean);

const map = new Map();

data.forEach(({n: m, cp: c}) => {
    if (!map.has(m)) map.set(m, new Set());
    map.get(m).add(c);
});
const codigosPostales = [...map].map(([m,c]) => ({
    n: m,
    cp: [...c].sort((a,b) => a.localeCompare(b,0,{numeric:1}))
})).sort((a,b) => a.n.localeCompare(b.n));

// Export for browser usage
if (typeof window !== 'undefined') {
    window.codigosPostales = codigosPostales;
} else {
    module.exports = codigosPostales;
}

// Only write file if running in Node
if (typeof window === 'undefined') {
    fs.writeFileSync('codigos-postales-agrupados.js', 
        `const codigosPostales = ${JSON.stringify(codigosPostales)};`);
    console.log(`Processed ${data.length} entries into ${codigosPostales.length} municipalities`);
}