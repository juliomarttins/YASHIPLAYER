// js/login.js
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

    const loadFromUrl = async (url) => {
        try {
            loadingStatus.textContent = 'Buscando lista da URL...';
            // Salva a origem ANTES de tentar carregar
            localStorage.setItem('yashi_m3u_source_type', 'url');
            localStorage.setItem('yashi_m3u_source_data', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
            
            const m3uText = await response.text();
            await YashiSync.processAndStoreM3U(m3uText, loadingStatus);
            
            loadingStatus.textContent = 'Tudo pronto!';
            window.location.href = 'home.html';
        } catch (error) {
            handleError(`Falha ao carregar da URL. (Erro: ${error.message})`);
        }
    };

    const loadFromFile = (file) => {
        loadingStatus.textContent = 'Lendo arquivo local...';
        const reader = new FileReader();
        reader.onload = async (e) => {
            const m3uText = e.target.result;
            // Salva a origem ANTES de tentar carregar
            localStorage.setItem('yashi_m3u_source_type', 'file');
            localStorage.setItem('yashi_m3u_source_data', m3uText);

            await YashiSync.processAndStoreM3U(m3uText, loadingStatus);

            loadingStatus.textContent = 'Tudo pronto!';
            window.location.href = 'home.html';
        };
        reader.onerror = () => {
            handleError('Não foi possível ler o arquivo selecionado.');
        };
        reader.readAsText(file);
    };
    
    const handleError = (message) => {
        loginForm.style.display = 'block';
        loginLoader.style.display = 'none';
        errorMessage.textContent = message;
        // Limpa a origem salva se der erro
        localStorage.removeItem('yashi_m3u_source_type');
        localStorage.removeItem('yashi_m3u_source_data');
    };
});