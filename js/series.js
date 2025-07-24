// js/series.js
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'series';
    Yashi.initCommon(PAGE_TYPE);

    // O gridContainer, searchInput, searchButton e clearSearchButton agora são injetados por Yashi.initCommon
    const gridContainer = Yashi.elements.gridContainer;
    const searchInput = Yashi.elements.searchInput;
    const searchButton = Yashi.elements.searchButton;
    const clearSearchButton = Yashi.elements.clearSearchButton;
    const topBarBackButton = Yashi.elements.topBarBackButton; // Pega o botão do common.js

    let allSeriesData = []; 

    const renderCurrentState = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (!currentState) return;

        // --- NOVA LÓGICA DO BOTÃO VOLTAR ---
        // Mostra ou esconde o botão de voltar da barra superior
        if (Yashi.navigationStack.length > 1) {
            topBarBackButton.style.display = 'flex'; // Mostra o botão
            topBarBackButton.onclick = () => {
                Yashi.navigationStack.pop();
                renderCurrentState();
            };
        } else {
            topBarBackButton.style.display = 'none'; // Esconde o botão
        }
        
        // O botão de voltar que ficava dentro do grid foi removido.
        // A renderização do grid agora é feita diretamente no container principal.
        Yashi.renderGrid(currentState.data, gridContainer);
    };

    const loadInitialSeries = async () => {
        try {
            allSeriesData = await db.series.orderBy('name').toArray();
            if (Yashi.navigationStack.length === 0) { // Só inicializa se a pilha estiver vazia
                Yashi.navigationStack = [{ type: 'seriesList', data: allSeriesData, title: 'Séries' }];
            }
            renderCurrentState();
        } catch (e) {
            gridContainer.innerHTML = '<p id="no-results">Falha ao carregar séries do banco de dados.</p>';
        }
    };

    const loadSpecificSeries = async (seriesName) => {
        try {
            allSeriesData = await db.series.orderBy('name').toArray();
            const targetSeries = allSeriesData.find(s => s.name === seriesName);

            if (targetSeries) {
                // Monta a pilha de navegação para simular a entrada direta na série
                Yashi.navigationStack.push({ type: 'seriesList', data: allSeriesData, title: 'Séries' });
                
                const seasons = Object.values(targetSeries.seasons).sort((a, b) => a.number - b.number);

                // *** LÓGICA DE CAPAS ADICIONADA AQUI PARA CONSISTÊNCIA ***
                // Garante que as capas das temporadas sejam carregadas corretamente, mesmo vindo da busca.
                seasons.forEach(season => {
                    if (season.episodes && season.episodes.length > 0) {
                        season.episodes.sort((a, b) => a.number - b.number);
                        season.logo = season.episodes[0].logo || targetSeries.logo;
                    } else {
                        season.logo = targetSeries.logo;
                    }
                });
                
                Yashi.navigationStack.push({ type: 'seasonList', data: seasons, title: targetSeries.name, parentSeries: targetSeries });
                
                renderCurrentState();
            } else {
                // Se a série não for encontrada por algum motivo, carrega a lista inicial
                await loadInitialSeries();
            }
        } catch (e) {
            gridContainer.innerHTML = '<p id="no-results">Falha ao carregar a série especificada.</p>';
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        
        if (!query) {
            renderCurrentState();
            clearSearchButton.classList.add('hidden');
            return;
        }
        
        const results = currentState.data.filter(item => {
            // Adapta a busca para o nome correto (item.name para séries, `Temporada ${item.number}` para temporadas)
            const nameToSearch = item.seasons ? item.name : `temporada ${item.number}`;
            return nameToSearch.toLowerCase().includes(query);
        });
        // A busca renderiza apenas os resultados no grid, mantendo o botão de voltar da barra superior intacto.
        Yashi.renderGrid(results, gridContainer, true);
        clearSearchButton.classList.remove('hidden');
    };

    const clearSearch = () => {
        searchInput.value = '';
        performSearch();
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', e => { 
        if (e.key === 'Enter') performSearch(); 
        clearSearchButton.classList.toggle('hidden', searchInput.value.length === 0);
    });
    clearSearchButton.addEventListener('click', clearSearch);

    // Sobrescreve reRenderCurrentContent para séries
    Yashi.reRenderCurrentContent = () => {
        renderCurrentState();
    };

    // --- LÓGICA DE CARREGAMENTO INICIAL ---
    const seriesNameToLoad = localStorage.getItem('yashi_deep_link_series_name');
    if (seriesNameToLoad) {
        // Se houver uma série para carregar, limpa o item do localStorage e carrega a série
        localStorage.removeItem('yashi_deep_link_series_name');
        await loadSpecificSeries(seriesNameToLoad);
    } else {
        // Senão, carrega a lista de séries padrão
        await loadInitialSeries();
    }
});
