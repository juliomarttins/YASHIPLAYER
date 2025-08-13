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
    const saveSourceToDb = async (type, data) => {
        await db.config.put({ key: 'm3u_source_type', value: type });
        await db.config.put({ key: 'm3u_source_data', value: data });
    };

    // Função para carregar e processar a lista a partir de uma URL
    const loadFromUrl = async (url) => {
        try {
            onProgressCallback({ status: 'Buscando lista da URL...', details: 'Conectando...' });
            
            // --- MUDANÇA PRINCIPAL AQUI ---
            // Usamos o modo 'no-cors' para contornar o bloqueio do navegador para requisições http->https.
            // Isso envia a requisição sem ler a resposta, o que é suficiente para o HLS.js processar.
            const response = await fetch(url, { mode: 'no-cors' });

            // A resposta no modo 'no-cors' é "opaca", então não podemos checar response.ok.
            // Assumimos sucesso e deixamos o próximo passo (processamento) lidar com possíveis erros de conteúdo.
            
            // Como não podemos ler o conteúdo com 'no-cors', o método de processamento direto não funciona.
            // A solução é salvar a URL e deixar o player (HLS.js) lidar com ela diretamente,
            // pois ele não tem a mesma restrição de CORS para streams de vídeo.
            // Esta abordagem simplifica o login e transfere a responsabilidade para o player.

            // --- SIMPLIFICAÇÃO ---
            // Vamos apenas salvar a URL e redirecionar. O trabalho pesado fica para o player.
            // NOTA: Esta lógica é uma simplificação baseada no fato de que o fetch inicial é o problema.
            // Se a sincronização (YashiSync) for essencial no login, a abordagem muda.
            // Por enquanto, vamos priorizar o carregamento.

            // A lógica de sincronização precisa ser adaptada. Por agora, vamos simular o sucesso e ir para a home.
            // O ideal é que a sincronização ocorra em um contexto onde o CORS não é um problema (se possível),
            // ou que o player lide com a URL diretamente.
            // Para desbloquear você, vamos focar em fazer o conteúdo tocar.

            // Vamos tentar uma abordagem diferente: usar um proxy CORS público apenas como último recurso.
            // Isso é mais robusto.
            
            let m3uText;
            try {
                // Tentativa 1: Fetch direto
                const directResponse = await fetch(url);
                if (!directResponse.ok) throw new Error(`Erro na tentativa direta: ${directResponse.statusText}`);
                m3uText = await directResponse.text();
            } catch (e) {
                // Tentativa 2: Usar um proxy CORS público se a direta falhar
                console.warn("Fetch direto falhou, tentando com proxy CORS...", e);
                const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const proxyResponse = await fetch(corsProxyUrl);
                if (!proxyResponse.ok) throw new Error(`Erro na tentativa com proxy: ${proxyResponse.statusText}`);
                m3uText = await proxyResponse.text();
            }

            onProgressCallback({ status: 'Configurando...', details: 'Salvando fonte de dados...' });
            await saveSourceToDb('url', url); 
            
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
