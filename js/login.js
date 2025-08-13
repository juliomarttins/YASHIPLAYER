<<<<<<< HEAD
// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Valida se as dependências essenciais (Dexie, YashiSync) foram carregadas.
    if (typeof Dexie === 'undefined' || typeof YashiSync === 'undefined') {
        handleError('Erro crítico de configuração. Por favor, recarregue a página.');
        return;
    }

    // Elementos da interface de login
    const urlInput = document.getElementById('urlInput');
    const loadButton = document.getElementById('loadButton');
    const errorMessage = document.getElementById('error-message');
    const loginForm = document.getElementById('login-form');
    const loginLoader = document.getElementById('login-loader');
    const loadingStatus = document.getElementById('loading-status');
    const loadingDetails = document.getElementById('loading-details');

    // Função de callback para atualizar a UI durante o carregamento
    const onProgressCallback = (progress) => {
        if (progress.status) {
            loadingStatus.textContent = progress.status;
        }
        if (progress.details) {
            loadingDetails.textContent = progress.details;
        }
    };
    
    // Adiciona o evento de clique ao botão principal
    loadButton.addEventListener('click', () => {
        const url = urlInput.value.trim();
        
        // Valida se a URL foi inserida
        if (!url) {
            errorMessage.textContent = 'Por favor, insira a URL da sua lista M3U.';
            return;
        }
        
        // Esconde o formulário e exibe o loader
        loginForm.style.display = 'none';
        loginLoader.style.display = 'flex';
        
        // Inicia o processo de carregamento a partir da URL
        loadFromUrl(url);
    });

    // Salva a fonte de dados (URL) no banco de dados
=======
// js/login.js (v7.51.1 - Orquestração de status da UI)

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Dexie === 'undefined' || typeof YashiSync === 'undefined') {
        handleError('Erro de configuração. Recarregue a página.');
        return;
    }

    const urlInput = document.getElementById('urlInput');
    const fileInput = document.getElementById('fileInput');
    const loadButton = document.getElementById('loadButton');
    const errorMessage = document.getElementById('error-message');
    const fileNameSpan = document.getElementById('file-name');
    const loginForm = document.getElementById('login-form');
    const loginLoader = document.getElementById('login-loader');
    const loadingStatus = document.getElementById('loading-status');

    const updateLoadingStatus = (newText) => {
        return new Promise(resolve => {
            loadingStatus.style.opacity = '0';
            setTimeout(() => {
                loadingStatus.textContent = newText;
                loadingStatus.style.opacity = '1';
                resolve();
            }, 300);
        });
    };

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameSpan.textContent = fileInput.files[0].name;
            urlInput.value = '';
            errorMessage.textContent = '';
        }
    });
    
    urlInput.addEventListener('input', () => {
        if (urlInput.value) {
            fileInput.value = '';
            fileNameSpan.textContent = 'Selecionar arquivo .m3u';
            errorMessage.textContent = '';
        }
    });

    loadButton.addEventListener('click', () => {
        const url = urlInput.value.trim();
        const file = fileInput.files[0];
        if (!url && !file) {
            errorMessage.textContent = 'Insira uma URL ou selecione um arquivo.';
            return;
        }
        loginForm.style.display = 'none';
        loginLoader.style.display = 'flex';
        if (url) {
            loadFromUrl(url);
        } else if (file) {
            loadFromFile(file);
        }
    });

>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
    const saveSourceToDb = async (type, data) => {
        await db.config.put({ key: 'm3u_source_type', value: type });
        await db.config.put({ key: 'm3u_source_data', value: data });
    };

<<<<<<< HEAD
    // Função para carregar e processar a lista a partir de uma URL
    const loadFromUrl = async (url) => {
        try {
            onProgressCallback({ status: 'Buscando lista da URL...', details: 'Conectando...' });
=======
    const loadFromUrl = async (url) => {
        try {
            await updateLoadingStatus('Buscando lista da URL...');
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
            const m3uText = await response.text();
            
<<<<<<< HEAD
            onProgressCallback({ status: 'Configurando...', details: 'Salvando fonte de dados...' });
            await saveSourceToDb('url', url); 
            
            await YashiSync.processAndStoreM3U(m3uText, onProgressCallback); 
            
            onProgressCallback({ status: 'Tudo pronto!', details: 'Redirecionando...' });
=======
            await updateLoadingStatus('Salvando configuração...');
            await saveSourceToDb('url', url); 
            
            await updateLoadingStatus('Processando conteúdo...');
            await YashiSync.processAndStoreM3U(m3uText); 
            
            await updateLoadingStatus('Tudo pronto!');
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
            window.location.href = 'home.html';
        } catch (error) {
            handleError(`Falha ao carregar da URL. (Erro: ${error.message})`);
        }
    };
<<<<<<< HEAD
    
    // Lida com erros, exibindo uma mensagem e revertendo a UI
=======

    const loadFromFile = async (file) => {
        await updateLoadingStatus('Lendo arquivo local...');
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const m3uText = e.target.result;
                
                await updateLoadingStatus('Salvando arquivo no banco de dados...');
                await saveSourceToDb('file', m3uText);
                
                await updateLoadingStatus('Processando conteúdo...');
                await YashiSync.processAndStoreM3U(m3uText);

                await updateLoadingStatus('Tudo pronto!');
                window.location.href = 'home.html';
            } catch (error) {
                handleError(`Falha no processamento do arquivo. (Erro: ${error.message})`);
            }
        };
        reader.onerror = () => {
            handleError('Não foi possível ler o arquivo selecionado.');
        };
        reader.readAsText(file);
    };
    
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
    const handleError = async (message) => {
        loginForm.style.display = 'block';
        loginLoader.style.display = 'none';
        errorMessage.textContent = message;
<<<<<<< HEAD
        // Limpa a configuração da fonte em caso de erro
=======
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
        await db.config.delete('m3u_source_type');
        await db.config.delete('m3u_source_data');
    };
    
<<<<<<< HEAD
    // Define o estado inicial do loader
    onProgressCallback({ status: 'Iniciando...', details: '' });
=======
    loadingStatus.textContent = 'Iniciando...';
>>>>>>> 547020a5a19c041a9c3eab1f54447811bec5a6f1
});