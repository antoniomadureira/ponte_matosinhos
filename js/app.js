/**
 * MONITOR - PONTE MÓVEL MATOSINHOS
 * Versão Estabilizada - CGIU (Proxy Fix)
 */

// 1. INICIALIZAÇÃO IMEDIATA DO RELÓGIO
const iniciarRelogio = () => {
    const display = document.getElementById('timestamp-atual');
    const tick = () => {
        if (display) {
            const agora = new Date();
            display.innerText = agora.toLocaleTimeString('pt-PT');
        }
    };
    tick();
    setInterval(tick, 1000);
};
iniciarRelogio();

// 2. IMPORTAÇÕES
import { db, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from './firebase.js';

const textoEstado = document.getElementById('texto-estado');
const luzes = {
    RED: document.getElementById('light-red'),
    YELLOW: document.getElementById('light-yellow'),
    GREEN: document.getElementById('light-green')
};

let ultimoEstado = null;
let dbPronta = false;

// 3. ESCUTA EM TEMPO REAL (FIREBASE)
const q = query(collection(db, "registos_ponte"), orderBy("timestamp", "desc"), limit(1));

onSnapshot(q, (snapshot) => {
    dbPronta = true;
    if (snapshot.empty) return;

    snapshot.forEach((doc) => {
        const estado = doc.data().estado;
        ultimoEstado = estado;

        // Reset Visual
        Object.values(luzes).forEach(l => l?.classList.remove('red-active', 'yellow-active', 'green-active'));

        if (estado === "ABERTA") {
            textoEstado.innerText = "PONTE ABERTA - TRÂNSITO CORTADO";
            luzes.RED?.classList.add('red-active');
        } else if (estado === "FECHADA") {
            textoEstado.innerText = "PONTE FECHADA - TRÂNSITO LIVRE";
            luzes.GREEN?.classList.add('green-active');
        } else if (estado === "EM PREPARAÇÃO") {
            textoEstado.innerText = "PONTE EM PREPARAÇÃO";
            luzes.YELLOW?.classList.add('yellow-active');
        }
    });
}, (err) => console.error("Erro Firebase:", err));

// 4. VERIFICAÇÃO APDL (Com novo Proxy para evitar CORS)
async function verificarAPDL() {
    if (!dbPronta) return;

    try {
        // Novo Proxy: corsproxy.io é mais estável para este tipo de pedidos
        const targetUrl = 'https://siga.apdl.pt/AberturaPonteMovel/?t=' + Date.now();
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Proxy instável");

        // O corsproxy.io devolve o HTML diretamente como texto
        const html = (await res.text()).toLowerCase();
        let detectado = "DESCONHECIDO";

        const regexFechada = /tr[aâ]nsito\s+livre|em\s+tr[aâ]nsito/i;
        const regexAberta = /interrompido|manobra|ponte\s+aberta/i;
        const regexPreparacao = /prepara[çc][ãa]o/i;

        if (regexFechada.test(html)) {
            detectado = "FECHADA";
        } else if (regexAberta.test(html)) {
            detectado = "ABERTA";
        } else if (regexPreparacao.test(html)) {
            detectado = "EM PREPARAÇÃO";
        }

        if (detectado !== "DESCONHECIDO" && detectado !== ultimoEstado) {
            await addDoc(collection(db, "registos_ponte"), {
                estado: detectado,
                timestamp: serverTimestamp(),
                dataLocal: new Date().toLocaleString('pt-PT').replace(',', '')
            });
        }
    } catch (e) {
        console.warn("APDL inacessível temporariamente...");
    }
}

// 20 segundos para evitar bloqueios de IP e respeitar limites do proxy
setInterval(verificarAPDL, 20000);