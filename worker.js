// worker.js con soporte para Method 1, 2 y 4
function lcg(s) { return (BigInt(s) * 1103515245n + 24691n) & 0xFFFFFFFFn; }

self.onmessage = function(e) {
    const { seedsList, tid, sid, target, offset, filters, natures, method } = e.data;
    let results = [];

    seedsList.forEach(sHex => {
        let initialSeed = BigInt("0x" + sHex);
        let seed = initialSeed;
        
        for (let adv = 0; adv <= (target + offset); adv++) {
            if (adv >= (target - offset)) {
                let s = seed;
                
                // 1. Generar PID (Igual para todos los métodos)
                s = lcg(s); let pL = Number(s >> 16n);
                s = lcg(s); let pH = Number(s >> 16n);
                let pid = ((pH << 16) >>> 0) | pL;

                // 2. Manejo de Métodos (Saltos de LCG)
                // Method 1: No salta nada.
                // Method 2: Salta 1 llamada.
                // Method 4: Salta 2 llamadas.
                if (method === 2) {
                    s = lcg(s); 
                } else if (method === 4) {
                    s = lcg(s); 
                    s = lcg(s);
                }

                // 3. Generar IVs
                s = lcg(s); let iv1 = Number(s >> 16n);
                s = lcg(s); let iv2 = Number(s >> 16n);
                
                let ivs = { 
                    h: iv1 & 31, 
                    a: (iv1 >> 5) & 31, 
                    d: (iv1 >> 10) & 31, 
                    s: iv2 & 31, 
                    sa: (iv2 >> 5) & 31, 
                    sd: (iv2 >> 10) & 31 
                };

                let nIdx = pid % 25;
                let isS = (tid ^ sid ^ (pid >>> 16) ^ (pid & 0xFFFF)) < 8;

                // 4. Filtros
                let passF = true;
                if (filters.shiny === 'yes' && !isS) passF = false;
                if (filters.nature !== 'any' && nIdx != filters.nature) passF = false;
                if (ivs.h < filters.hp_min || ivs.h > filters.hp_max || ivs.a < filters.at_min || ivs.a > filters.at_max ||
                    ivs.d < filters.df_min || ivs.d > filters.df_max || ivs.sa < filters.sa_min || ivs.sa > filters.sa_max ||
                    ivs.sd < filters.sd_min || ivs.sd > filters.sd_max || ivs.s < filters.sp_min || ivs.s > filters.sp_max) passF = false;

                if (passF) {
                    results.push({ adv, pid: pid.toString(16).toUpperCase(), sHex, nature: natures[nIdx], ivs, isS });
                }
            }
            seed = lcg(seed);
        }
    });

    self.postMessage(results);
};
