// js/db.js

const db = new Dexie('YashiPlayerDatabase');

<<<<<<< HEAD
// VERSÃO 8: Adiciona a tabela movieRatings para o sistema de avaliação v1.4
db.version(8).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
    config: '&key',
    searchHistory: '&itemId, timestamp',
    metadataCache: '&name',
    movieRatings: '&itemId, rating' // Chave: nome do item. Índice: nota para ordenação.
});

// VERSÃO INCREMENTADA PARA 7 para adicionar a tabela de cache de metadados (sinopse)
db.version(7).stores({
=======
// VERSÃO INCREMENTADA PARA 5 para adicionar a tabela de configuração
db.version(5).stores({
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
    // Tabelas existentes
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
<<<<<<< HEAD
    config: '&key',
    searchHistory: '&itemId, timestamp',

    // NOVA TABELA para o cache de sinopses e pôsteres
    // '&name' é a chave primária (o título do filme/série)
    metadataCache: '&name'
});

db.version(6).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
    config: '&key',
    searchHistory: '&itemId, timestamp'
});

db.version(5).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
=======
    
    // NOVA TABELA para armazenar a fonte M3U e outras configurações
    // 'key' é o identificador (ex: 'm3u_source_data') e 'value' é o conteúdo
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
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