// js/db.js

// Cria uma nova instância do banco de dados Dexie chamada 'YashiPlayerDatabase'.
const db = new Dexie('YashiPlayerDatabase');

// Define a estrutura (schema) do banco de dados.
// Estamos na versão 1 do nosso banco de dados.
db.version(1).stores({
    // Cria uma "tabela" chamada 'items' para filmes e canais.
    // '++id' = cria uma chave primária que se auto-incrementa (1, 2, 3...).
    // 'name, type' = cria índices para que possamos pesquisar rapidamente por nome e tipo.
    items: '++id, name, type', 
    
    // Cria uma "tabela" chamada 'series'.
    // '&name' = o nome da série é a chave primária e deve ser único.
    series: '&name'
});

// Torna a variável 'db' acessível em outros scripts.
window.db = db;