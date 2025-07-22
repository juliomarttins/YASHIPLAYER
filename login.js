document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const fileInput = document.getElementById('fileInput');
    const loadButton = document.getElementById('loadButton');
    const errorMessage = document.getElementById('error-message');
    const fileNameSpan = document.getElementById('file-name');

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameSpan.textContent = fileInput.files[0].name;
            urlInput.value = '';
        }
    });
    
    urlInput.addEventListener('input', () => {
        if (urlInput.value) {
            fileInput.value = '';
            fileNameSpan.textContent = 'Selecionar arquivo .m3u do computador';
        }
    });

    loadButton.addEventListener('click', () => {
        const url = urlInput.value.trim();
        const file = fileInput.files[0];

        if (!url && !file) {
            errorMessage.textContent = 'Por favor, insira uma URL ou selecione um arquivo.';
            return;
        }

        localStorage.clear();

        if (url) {
            localStorage.setItem('m3uSourceType', 'url');
            localStorage.setItem('m3uUrl', url);
            window.location.href = 'player.html';
        } else if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                localStorage.setItem('m3uSourceType', 'file');
                localStorage.setItem('m3uContent', e.target.result);
                window.location.href = 'player.html';
            };
            reader.onerror = () => { errorMessage.textContent = 'Erro ao ler o arquivo.'; };
            reader.readAsText(file);
        }
    });
});