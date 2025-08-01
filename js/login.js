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

    const saveSourceToDb = async (type, data) => {
        await db.config.put({ key: 'm3u_source_type', value: type });
        await db.config.put({ key: 'm3u_source_data', value: data });
    };

    const loadFromUrl = async (url) => {
        try {
            await updateLoadingStatus('Buscando lista da URL...');
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
            const m3uText = await response.text();
            
            await updateLoadingStatus('Salvando configuração...');
            await saveSourceToDb('url', url); 
            
            await updateLoadingStatus('Processando conteúdo...');
            await YashiSync.processAndStoreM3U(m3uText); 
            
            await updateLoadingStatus('Tudo pronto!');
            window.location.href = 'home.html';
        } catch (error) {
            handleError(`Falha ao carregar da URL. (Erro: ${error.message})`);
        }
    };

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
    
    const handleError = async (message) => {
        loginForm.style.display = 'block';
        loginLoader.style.display = 'none';
        errorMessage.textContent = message;
        await db.config.delete('m3u_source_type');
        await db.config.delete('m3u_source_data');
    };
    
    loadingStatus.textContent = 'Iniciando...';
});