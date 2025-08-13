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

    // --- CÓDIGO DO PROXY INTEGRADO ---
    // URL do seu serviço de proxy pessoal na Vercel.
    const proxyUrl = 'https://proxy-1eg35vvho-julios-projects-2b4f0ac3.vercel.app/api/proxy?url=';

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
        let url = urlInput.value.trim();
        
        // Valida se a URL foi inserida
        if (!url) {
            errorMessage.textContent = 'Por favor, insira a URL da sua lista M3U.';
            return;
        }

        // --- MÁGICA DO PROXY ACONTECE AQUI ---
        // Se a URL for http, usa o proxy. Se for https, usa diretamente.
        if (url.startsWith('http://')) {
            console.log("URL HTTP detectada. Usando proxy...");
            url = proxyUrl + encodeURIComponent(url);
        }
        
        // Esconde o formulário e exibe o loader
        loginForm.style.display = 'none';
        loginLoader.style.display = 'flex';
        
        // Inicia o processo de carregamento a partir da URL (original ou com proxy)
        loadFromUrl(url);
    });

    // Salva a fonte de dados (URL) no banco de dados
    const saveSourceToDb = async (type, data) => {
        await db.config.put({ key: 'm3u_source_type', value: type });
        await db.config.put({ key: 'm3u_source_data', value: data });
    };

    // Função para carregar e processar a lista a partir de uma URL
    const loadFromUrl = async (url) => {
        try {
            onProgressCallback({ status: 'Buscando lista da URL...', details: 'Conectando...' });
            
            // Usamos 'no-cache' para garantir que a lista seja sempre a mais recente
            const response = await fetch(url, { cache: 'no-cache' });

            if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
            const m3uText = await response.text();
            
            onProgressCallback({ status: 'Configurando...', details: 'Salvando fonte de dados...' });
            
            // Salva a URL ORIGINAL, sem o proxy, para futuras sincronizações
            await saveSourceToDb('url', urlInput.value.trim()); 
            
            await YashiSync.processAndStoreM3U(m3uText, onProgressCallback); 
            
            onProgressCallback({ status: 'Tudo pronto!', details: 'Redirecionando...' });
            window.location.href = 'home.html';
        } catch (error) {
            handleError(`Falha ao carregar da URL. (Erro: ${error.message})`);
        }
    };
    
    // Lida com erros, exibindo uma mensagem e revertendo a UI
    const handleError = async (message) => {
        loginForm.style.display = 'block';
        loginLoader.style.display = 'none';
        errorMessage.textContent = message;
        // Limpa a configuração da fonte em caso de erro
        await db.config.delete('m3u_source_type');
        await db.config.delete('m3u_source_data');
    };
    
    // Define o estado inicial do loader
    onProgressCallback({ status: 'Iniciando...', details: '' });
});
