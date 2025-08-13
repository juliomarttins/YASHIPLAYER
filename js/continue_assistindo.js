// js/continue_assistindo.js (v7.51.3 - Adiciona contexto para renderizar botão de remoção)

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'continue-watching';
    Yashi.initCommon(PAGE_TYPE);

    const { gridContainer, topBarBackButton, searchInput, searchButton } = Yashi.elements;
    const renderTarget = gridContainer;

    let allPlaybackHistory = [];

    const updateBackButton = () => {
        topBarBackButton.style.display = 'flex';
        topBarBackButton.onclick = () => {
            window.location.href = 'home.html';
        };
    };

    window.renderPlaybackHistory = async () => {
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        try {
            allPlaybackHistory = await Yashi.getRecentPlaybackHistory(999);

            renderTarget.className = 'grid-container'; 
            Yashi.applyViewMode();

            if (allPlaybackHistory.length === 0) {
                renderTarget.innerHTML = '<p id="no-results">Você não possui nenhum item no histórico de reprodução.</p>';
                return;
            }

            renderTarget.innerHTML = '';
            allPlaybackHistory.forEach(item => {
                // AQUI: Passa o contexto para a função createCard
                const card = Yashi.createCard(item, { page: 'history' });
                renderTarget.appendChild(card);
            });
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar histórico de reprodução do banco de dados.</p>';
            console.error('Erro ao carregar histórico de reprodução:', e);
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = 'search.html';
        }
    };

    Yashi.reRenderCurrentContent = window.renderPlaybackHistory;
    updateBackButton();

    if (searchButton) searchButton.addEventListener('click', performSearch);
    if (searchInput) searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    renderPlaybackHistory();
});