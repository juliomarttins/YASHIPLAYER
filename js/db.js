// js/db.js

const db = new Dexie('YashiPlayerDatabase');

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
    // Tabelas existentes
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
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