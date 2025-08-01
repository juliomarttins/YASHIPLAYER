// js/db.js

const db = new Dexie('YashiPlayerDatabase');

// VERSÃO INCREMENTADA PARA 5 para adicionar a tabela de configuração
db.version(5).stores({
    // Tabelas existentes
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
    
    // NOVA TABELA para armazenar a fonte M3U e outras configurações
    // 'key' é o identificador (ex: 'm3u_source_data') e 'value' é o conteúdo
    config: '&key'
});

// Mantém a compatibilidade com a versão 4
db.version(4).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp'
});


// Torna a variável 'db' acessível em outros scripts.
window.db = db;