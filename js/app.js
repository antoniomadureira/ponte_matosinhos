/**
 * MONITOR - PONTE MÓVEL MATOSINHOS
 * Versão Estabilizada - CGIU (CodeTabs Proxy Fix)
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

// 2. IMPORTAÇÕES (Garante que o firebase.js está na mesma pasta)
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

        // Reset Visual das luzes
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

// 4. VERIFICAÇÃO APDL (Com Proxy CodeTabs para evitar bloqueios)
async function verificarAPDL() {
    if (!dbPronta) return;

    try {
        // Alvo: Site oficial da APDL
        const targetUrl = 'https://siga.apdl.pt/AberturaPonteMovel/?t=' + Date.now();
        // Proxy: CodeTabs (mais estável para evitar erros de Connection Reset)
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Proxy instável");

        const html = (await res.text()).toLowerCase();
        let detectado = "DESCONHECIDO";

        // Regex para deteção do estado no HTML
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

        // Se o estado mudou, grava no Firestore
        if (detectado !== "DESCONHECIDO" && detectado !== ultimoEstado) {
            await addDoc(collection(db, "registos_ponte"), {
                estado: detectado,
                timestamp: serverTimestamp(),
                dataLocal: new Date().toLocaleString('pt-PT').replace(',', '')
            });
        }
    } catch (e) {
        // Aviso silencioso na consola em caso de falha de rede ou proxy
        console.warn("Sincronização APDL: Tentando novamente no próximo ciclo...");
    }
}

// Intervalo de 20 segundos para monitorização contínua
setInterval(verificarAPDL, 20000);