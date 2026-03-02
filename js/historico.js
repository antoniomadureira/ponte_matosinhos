import { db, collection, query, orderBy, getDocs, onSnapshot, limit } from './firebase.js';

const lista = document.getElementById('lista-registos');
const displayTempo = document.getElementById('tempo-aberta-hoje');
const textoEstadoAtual = document.getElementById('texto-estado-atual');
const btnExportar = document.getElementById('btn-exportar');
const filtroEstado = document.getElementById('filtro-estado');

let dadosGlobais = [];

// 1. ESCUTA EM TEMPO REAL DO ESTADO ATUAL (Status Pill no Histórico)
if (textoEstadoAtual) {
    const qAtual = query(collection(db, "registos_ponte"), orderBy("timestamp", "desc"), limit(1));
    onSnapshot(qAtual, (snapshot) => {
        if (snapshot.empty) return;
        snapshot.forEach((doc) => {
            const estado = doc.data().estado;
            if (estado === "ABERTA") {
                textoEstadoAtual.innerText = "PONTE ABERTA - TRÂNSITO CORTADO";
            } else if (estado === "FECHADA") {
                textoEstadoAtual.innerText = "PONTE FECHADA - TRÂNSITO LIVRE";
            } else if (estado === "EM PREPARAÇÃO") {
                textoEstadoAtual.innerText = "PONTE EM PREPARAÇÃO";
            }
        });
    });
}

// 2. FUNÇÃO PARA ATUALIZAR O HISTÓRICO E CÁLCULOS
async function atualizarHistorico() {
    const q = query(collection(db, "registos_ponte"), orderBy("timestamp", "asc")); // Ordem cronológica para cálculos
    const snap = await getDocs(q);
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let msTotalAbertaHoje = 0;
    let ultimoTempoAbertura = null;

    dadosGlobais = snap.docs.map(doc => {
        const d = doc.data();
        let est = d.estado;
        if (est === "FECAHADA") est = "FECHADA"; // Correção de legados

        const jsDate = d.timestamp ? d.timestamp.toDate() : new Date();
        
        /**
         * SUGESTÃO 2: CÁLCULO DE TEMPO ABERTA HOJE
         * Processa os eventos do dia para calcular a duração total.
         */
        if (jsDate >= hoje) {
            if (est === "ABERTA") {
                ultimoTempoAbertura = jsDate;
            } else if ((est === "FECHADA" || est === "EM PREPARAÇÃO") && ultimoTempoAbertura) {
                msTotalAbertaHoje += (jsDate - ultimoTempoAbertura);
                ultimoTempoAbertura = null;
            }
        }

        return { est, dataLocal: d.dataLocal, jsDate };
    });

    // Se a ponte ainda estiver aberta, somar até ao momento atual
    if (ultimoTempoAbertura) {
        msTotalAbertaHoje += (new Date() - ultimoTempoAbertura);
    }

    exibirTempo(msTotalAbertaHoje);
    renderizarLista(filtroEstado ? filtroEstado.value : 'todos');
}

// 3. AUXILIARES DE RENDERIZAÇÃO
function exibirTempo(ms) {
    if (!displayTempo) return;
    const totalSegundos = Math.floor(ms / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    displayTempo.innerText = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function renderizarLista(filtro) {
    if (!lista) return;
    
    // Inverter para mostrar os mais recentes primeiro na lista visual
    const dadosParaExibir = [...dadosGlobais].reverse().filter(r => 
        filtro === 'todos' || r.est === filtro
    );

    if (dadosParaExibir.length === 0) {
        lista.innerHTML = '<div class="loading-text">Sem registos encontrados.</div>';
        return;
    }

    lista.innerHTML = dadosParaExibir.map(r => `
        <div class="record-row">
            <div class="col-estado ${r.est === 'ABERTA' ? 'text-aberta' : (r.est === 'FECHADA' ? 'text-fechada' : 'text-preparacao')}">${r.est}</div>
            <div class="col-data">${r.dataLocal.split(' ')[0]}</div>
            <div class="col-hora">${r.dataLocal.split(' ')[1]}</div>
        </div>
    `).join('');
}

/**
 * SUGESTÃO 3: EXPORTAÇÃO CSV
 * Gera um ficheiro CSV com os dados carregados do histórico.
 */
if (btnExportar) {
    btnExportar.addEventListener('click', () => {
        if (dadosGlobais.length === 0) return;
        
        const csvRows = [
            ["Estado", "Data", "Hora"],
            ...dadosGlobais.map(r => [r.est, r.dataLocal.split(' ')[0], r.dataLocal.split(' ')[1]])
        ];

        const csvContent = "data:text/csv;charset=utf-8," 
            + csvRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `historico_ponte_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Evento de Filtro
if (filtroEstado) {
    filtroEstado.addEventListener('change', (e) => renderizarLista(e.target.value));
}

// Inicializar
atualizarHistorico();
setInterval(atualizarHistorico, 60000); // Atualizar cálculos a cada minuto
