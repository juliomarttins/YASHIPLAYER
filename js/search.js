// js/search.js
document.addEventListener('DOMContentLoaded', () => {
    // Validação inicial
    if (!window.db) {
        console.error("Banco de dados não encontrado.");
        return;
    }

    // --- Elementos do DOM ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button-page');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const resultsContainer = document.getElementById('results-container');
    const playerView = document.getElementById('player-view');
    const playerElement = document.getElementById('player');
    const playerBackButton = document.querySelector('.back-from-player');
    const viewButtons = document.querySelectorAll('.view-button');

    // --- Estado da Aplicação ---
    const player = new Plyr(playerElement);
    let hls = new Hls();
    let currentSearchResults = {};
    let currentViewMode = localStorage.getItem('yashi_search_view_mode') || 'view-details';

    // --- Funções ---
    const performSearch = async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            resultsContainer.innerHTML = `<p class="search-prompt">Digite pelo menos 2 caracteres.</p>`;
            categoryFiltersContainer.classList.add('hidden');
            return;
        }

        resultsContainer.innerHTML = '<div class="content-loader">Buscando...</div>';
        categoryFiltersContainer.classList.add('hidden');

        try {
            let allItems = await db.items.toArray();
            let allSeries = await db.series.toArray();
            
            const filteredSeries = allSeries.filter(series => series.name.toLowerCase().includes(query));
            const filteredMovies = allItems.filter(item => item.type === 'movie' && item.name.toLowerCase().includes(query));
            const filteredChannels = allItems.filter(item => item.type === 'channel' && item.name.toLowerCase().includes(query));

            currentSearchResults = {
                series: filteredSeries,
                movies: filteredMovies,
                channels: filteredChannels,
            };

            renderCategoryFilters();
            applyViewMode();

        } catch (error) {
            console.error('Erro geral ao pesquisar:', error);
            resultsContainer.innerHTML = `<p class="no-results">Ocorreu um erro durante a busca.</p>`;
        }
    };
    
    const renderCategoryFilters = () => {
        categoryFiltersContainer.innerHTML = '';
        resultsContainer.innerHTML = '';
        const categories = [{ key: 'series', label: 'Séries' }, { key: 'movies', label: 'Filmes' }, { key: 'channels', label: 'Canais' }];
        let hasResults = false;
        let firstCategoryWithResults = null;
        categories.forEach(cat => {
            const count = currentSearchResults[cat.key].length;
            if (count > 0) {
                hasResults = true;
                if (!firstCategoryWithResults) firstCategoryWithResults = cat.key;
                const button = document.createElement('button');
                button.className = 'filter-button';
                button.textContent = `${cat.label} (${count})`;
                button.dataset.category = cat.key;
                button.addEventListener('click', () => {
                    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    renderGrid(currentSearchResults[cat.key]);
                });
                categoryFiltersContainer.appendChild(button);
            }
        });
        if (hasResults) {
            categoryFiltersContainer.classList.remove('hidden');
            categoryFiltersContainer.querySelector(`[data-category="${firstCategoryWithResults}"]`).click();
        } else {
            categoryFiltersContainer.classList.add('hidden');
            resultsContainer.innerHTML = `<p class="no-results">Nenhum resultado encontrado para "${searchInput.value}".</p>`;
        }
    };

    const renderGrid = (items) => {
        resultsContainer.innerHTML = '';
        if (!items || items.length === 0) return;
        items.forEach(item => {
            const card = createCard(item);
            resultsContainer.appendChild(card);
        });
        applyViewMode();
    };

    const createCard = (item) => {
        const card = document.createElement('div');
        card.className = 'card';
        const defaultImg = 'https://placehold.co/180x270/0D1117/8B949E?text=Sem+Capa';

        // --- LÓGICA DO BOTÃO DE FAVORITAR (ADICIONADA) ---
        const itemType = item.seasons ? 'series' : item.type;
        const favoriteName = item.name;

        if (itemType === 'movie' || itemType === 'channel' || itemType === 'series') {
            const favButton = document.createElement('button');
            favButton.className = 'favorite-button';
            favButton.innerHTML = '<i class="fa-regular fa-star"></i>';
            favButton.title = 'Adicionar aos Favoritos';
            
            db.favorites.get(favoriteName).then(fav => {
                if (fav) {
                    favButton.classList.add('active');
                    favButton.innerHTML = '<i class="fa-solid fa-star"></i>';
                    favButton.title = 'Remover dos Favoritos';
                }
            });

            favButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isFavorited = favButton.classList.contains('active');
                if (isFavorited) {
                    await db.favorites.delete(favoriteName);
                    favButton.classList.remove('active');
                    favButton.innerHTML = '<i class="fa-regular fa-star"></i>';
                    favButton.title = 'Adicionar aos Favoritos';
                    Yashi.showToast(`"${favoriteName}" removido dos favoritos.`, 'error');
                } else {
                    await db.favorites.put({ name: favoriteName, type: itemType, data: item });
                    favButton.classList.add('active');
                    favButton.innerHTML = '<i class="fa-solid fa-star"></i>';
                    favButton.title = 'Remover dos Favoritos';
                    Yashi.showToast(`"${favoriteName}" adicionado aos favoritos!`, 'success');
                }
            });
            card.appendChild(favButton);
        }
        // --- FIM DA LÓGICA DO BOTÃO ---

        let title = item.name;
        let image = item.logo || defaultImg;
        let description = '';

        if (item.type === 'channel') description = `Categoria: ${item.groupTitle}`;
        else if (item.type === 'movie') description = `Categoria: ${item.groupTitle}`;
        else if (item.seasons) description = `Temporadas: ${Object.keys(item.seasons).length}`;

        const cardClickableArea = document.createElement('div'); // Wrapper para clique
        cardClickableArea.className = 'card-clickable-area';

        if (currentViewMode === 'view-list' || currentViewMode === 'view-details') {
            cardClickableArea.innerHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-content">
                    <div class="card-title">${title}</div>
                    <div class="card-description">${description}</div>
                </div>`;
        } else {
             cardClickableArea.innerHTML = `
                <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
                <div class="card-title">${title}</div>`;
        }
        
        card.appendChild(cardClickableArea);

        if (item.url) {
            cardClickableArea.addEventListener('click', () => playContent(item));
        } else if (item.seasons) {
            cardClickableArea.style.cursor = 'pointer';
            cardClickableArea.addEventListener('click', () => {
                localStorage.setItem('yashi_deep_link_series_name', item.name);
                window.location.href = 'series.html';
            });
        } else {
            cardClickableArea.style.cursor = 'default';
        }
        
        return card;
    };

    const playContent = (item) => {
        const playerTitleEl = document.getElementById('player-title');
        if (playerTitleEl) {
            playerTitleEl.textContent = item.name;
        }

        playerView.style.display = 'flex';
        try {
            if (Hls.isSupported() && item.url.includes('.m3u8')) {
                hls.destroy(); hls = new Hls();
                hls.loadSource(item.url);
                hls.attachMedia(playerElement);
            } else {
                hls.destroy();
                playerElement.src = item.url;
            }
            player.play();
        } catch (error) { console.error("Erro ao carregar vídeo:", error); }
    };

    const stopPlayer = () => {
        player.stop();
        hls.destroy();
        playerView.style.display = 'none';

        const playerTitleEl = document.getElementById('player-title');
        if (playerTitleEl) {
            playerTitleEl.textContent = '';
        }
    };

    const applyViewMode = () => {
        if (resultsContainer) {
            resultsContainer.className = `grid-container ${currentViewMode}`;
        }
        viewButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.viewMode === currentViewMode);
        });
    };

    // --- Event Listeners ---
    playerBackButton.addEventListener('click', stopPlayer);

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    searchButton.addEventListener('click', performSearch);

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentViewMode = button.dataset.viewMode;
            localStorage.setItem('yashi_search_view_mode', currentViewMode);
            applyViewMode();
            const activeFilter = categoryFiltersContainer.querySelector('.filter-button.active');
            if (activeFilter) {
                renderGrid(currentSearchResults[activeFilter.dataset.category]);
            }
        });
    });

    applyViewMode();
    
    // Dispara a busca se uma pesquisa veio de outra página
    const previousQuery = localStorage.getItem('yashi_search_query');
    if (previousQuery) {
        searchInput.value = previousQuery;
        localStorage.removeItem('yashi_search_query'); // Limpa para não pesquisar de novo
        performSearch();
    }
});