// /PESQUISA/engine_search.js
// Motor Específico para o Módulo de Pesquisa

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        return;
    }
    
    Yashi.initCommon('search');

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button-page');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const resultsContainer = document.getElementById('results-container');
    const initialContentContainer = document.getElementById('initial-content-container');
    const coverSizeButtons = document.querySelectorAll('.size-button');
    const mainContent = document.getElementById('main-content');

    let currentSearchResults = {};
    let currentGenreSuggestions = {};
    let currentCoverSize = localStorage.getItem('yashi_search_cover_size') || 'medium';
    const GENRE_BUTTONS = ['Ação', 'Comédia', 'Drama', 'Terror', 'Ficção Científica', 'Suspense', 'Animação', 'Aventura'];

    function normalizeText(text) {
        if (!text) return '';
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function renderGrid(items, gridWrapper, context = {}) {
        const grid = document.createElement('div');
        grid.className = `grid-container`;
        
        if (!items || items.length === 0) {
            grid.innerHTML = `<p class="no-results">Nenhum item encontrado.</p>`;
        } else {
            items.forEach(item => {
                grid.appendChild(createCard(item, context));
            });
        }
        gridWrapper.innerHTML = ''; 
        gridWrapper.appendChild(grid);
    }
    
    async function saveToHistory(item) {
        try {
            await db.searchHistory.put({
                itemId: item.name,
                timestamp: Date.now(),
                data: item
            });
        } catch (error) { console.error("Falha ao salvar histórico de busca:", error); }
    }

    function createCard(item, context = {}) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');

        const displayItem = item;
        if (!displayItem || typeof displayItem !== 'object') {
            return card;
        }

        if (!displayItem.logo) {
            card.classList.add('default-logo');
        }

        const defaultImg = '../capa.png';
        const itemType = displayItem.seasons ? 'series' : displayItem.type;
        const title = displayItem.name || 'Título indisponível';
        const image = displayItem.logo || defaultImg;
        
        const imgElement = document.createElement('img');
        imgElement.loading = 'lazy';
        imgElement.src = image;
        imgElement.className = 'card-img';
        imgElement.alt = title;
        imgElement.onerror = function() { this.onerror=null; this.src=defaultImg; };

        const titleElement = document.createElement('div');
        titleElement.className = 'card-title';
        titleElement.textContent = title;

        card.append(imgElement, titleElement);

        const favButton = document.createElement('button');
        favButton.className = 'favorite-button';
        favButton.setAttribute('tabindex', '-1');
        db.favorites.get(displayItem.name).then(fav => {
            favButton.innerHTML = fav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
            if (fav) favButton.classList.add('active');
        });
        favButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isFavorited = favButton.classList.contains('active');
            try {
                if (isFavorited) {
                    await db.favorites.delete(displayItem.name);
                    favButton.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    favButton.classList.remove('active');
                } else {
                    await db.favorites.put({ name: displayItem.name, type: itemType, data: displayItem });
                    favButton.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    favButton.classList.add('active');
                }
            } catch (error) { console.error("Falha ao atualizar itens salvos:", error); }
        });
        card.prepend(favButton);

        if (context.source === 'history') {
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-from-history-button';
            removeButton.title = 'Remover do Histórico';
            removeButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                Yashi.showConfirmationModal(
                    `<p>Remover "<strong>${title}</strong>" do seu histórico de busca?</p>`,
                    async () => {
                        await db.searchHistory.delete(displayItem.name);
                        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                        card.style.transform = 'scale(0.9)';
                        card.style.opacity = '0';
                        setTimeout(() => {
                            card.remove();
                            if (initialContentContainer.querySelector('.item-carousel')?.childElementCount === 0) {
                                renderInitialState();
                            }
                        }, 300);
                    }, { confirmText: 'Sim, Remover' }
                );
            });
            card.appendChild(removeButton);
        }

        card.addEventListener('click', () => {
            saveToHistory(displayItem);
            if (itemType === 'movie' || itemType === 'series') {
                Yashi.showSynopsisModal(displayItem, () => {
                    sessionStorage.setItem('yashi_nav_origin', 'pesquisa');
                    localStorage.setItem('yashi_deep_link_series_name', displayItem.name);
                    window.location.href = '../series/series.html';
                });
            } else if (itemType === 'channel') {
                if (displayItem.url) Yashi.playContent(displayItem);
            }
        });
        
        return card;
    }
    
    async function renderInitialState() {
        resultsContainer.innerHTML = '';
        initialContentContainer.innerHTML = '';
        initialContentContainer.style.display = 'block';
        categoryFiltersContainer.classList.add('hidden');

        const historySection = document.createElement('div');
        historySection.className = 'discovery-section';
        const historyTitle = document.createElement('div');
        historyTitle.className = 'discovery-title';
        historyTitle.innerHTML = `<div><i class="fa-solid fa-clock-rotate-left"></i><span>Pesquisados Recentemente</span></div>`;
        
        const clearHistoryBtn = document.createElement('button');
        clearHistoryBtn.className = 'clear-history-button';
        clearHistoryBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Limpar Tudo`;
        clearHistoryBtn.title = 'Limpar todo o histórico de busca';
        
        clearHistoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Yashi.showConfirmationModal(
                `<p>Tem certeza que deseja limpar <strong>todo</strong> o seu histórico de itens pesquisados?</p>`,
                async () => {
                    await db.searchHistory.clear();
                    renderInitialState();
                }, { confirmText: 'Sim, Limpar Tudo' }
            );
        });
        historyTitle.appendChild(clearHistoryBtn);
        historySection.appendChild(historyTitle);
        
        const historyContent = document.createElement('div');
        const historyItems = await db.searchHistory.orderBy('timestamp').reverse().limit(15).toArray();

        if (historyItems.length > 0) {
            historyContent.className = 'item-carousel';
            historyItems.forEach(item => historyContent.appendChild(createCard(item.data, { source: 'history' })));
            clearHistoryBtn.style.display = 'flex';
        } else {
            historyContent.innerHTML = `<p class="no-results-in-section">Itens que você clica na busca aparecerão aqui.</p>`;
            clearHistoryBtn.style.display = 'none';
        }
        historySection.appendChild(historyContent);
        initialContentContainer.appendChild(historySection);

        const genreSection = document.createElement('div');
        genreSection.className = 'discovery-section';
        genreSection.innerHTML = `
            <div class="discovery-title">
                <div><i class="fa-solid fa-dice"></i><span>Descubra Filmes por Gênero</span></div>
            </div>
            <p class="discovery-subtitle">Clique em um gênero para receber 15 sugestões aleatórias de filmes.</p>
        `;
        const genreButtonsContainer = document.createElement('div');
        genreButtonsContainer.className = 'genre-buttons-container';
        GENRE_BUTTONS.forEach(genre => {
            const button = document.createElement('button');
            button.className = 'genre-button';
            button.textContent = genre;
            button.addEventListener('click', () => showRandomSuggestionsByGenre(genre));
            genreButtonsContainer.appendChild(button);
        });
        genreSection.appendChild(genreButtonsContainer);
        initialContentContainer.appendChild(genreSection);
    }
    
    const performSearch = async () => {
        const query = normalizeText(searchInput.value.trim());
        if (query.length < 2) {
            if (document.activeElement === searchInput) return;
            renderInitialState();
            return;
        }

        initialContentContainer.style.display = 'none';
        resultsContainer.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        const allItems = await db.items.toArray();
        const allSeries = await db.series.toArray();
        currentSearchResults = {
            series: allSeries.filter(s => normalizeText(s.name).includes(query)),
            movies: allItems.filter(i => i.type === 'movie' && normalizeText(i.name).includes(query)),
            channels: allItems.filter(i => i.type === 'channel' && normalizeText(i.name).includes(query)),
        };
        renderCategoryFilters(currentSearchResults, `Resultados para "${searchInput.value}"`);
    };
    
    async function showRandomSuggestionsByGenre(genre) {
        initialContentContainer.style.display = 'none';
        resultsContainer.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        const allMovies = await db.items.where('type').equals('movie').toArray();
        const normalizedGenre = normalizeText(genre);

        const filteredMovies = allMovies.filter(item => normalizeText(item.groupTitle).includes(normalizedGenre));

        currentGenreSuggestions = {
            movies: shuffleArray([...filteredMovies]).slice(0, 15)
        };

        renderCategoryFilters(currentGenreSuggestions, `Sugestões de Filmes para "${genre}"`, true);
    }

    function renderCategoryFilters(sourceData, title, isSuggestion = false) {
        resultsContainer.innerHTML = '';
        categoryFiltersContainer.innerHTML = '';
        
        let categories;
        if (isSuggestion) {
            categories = [{ key: 'movies', label: 'Filmes' }];
        } else {
            categories = [
                { key: 'movies', label: 'Filmes' },
                { key: 'series', label: 'Séries' },
                { key: 'channels', label: 'Canais' }
            ];
        }

        let hasResults = false;
        let firstCategoryWithResults = null;

        categories.forEach(cat => {
            const count = sourceData[cat.key]?.length || 0;
            if (count > 0) {
                hasResults = true;
                if (!firstCategoryWithResults) firstCategoryWithResults = cat.key;
                
                const button = document.createElement('button');
                button.className = 'filter-button';
                button.textContent = `${cat.label} (${count})`;
                button.dataset.category = cat.key;

                button.addEventListener('click', () => {
                    document.querySelectorAll('#category-filters .filter-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    const items = sourceData[cat.key] || []; 
                    renderGrid(items, resultsContainer);
                });
                categoryFiltersContainer.appendChild(button);
            }
        });

        const clearButton = document.createElement('button');
        clearButton.className = 'clear-suggestions-button';
        clearButton.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Voltar à Descoberta`;
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            renderInitialState();
        });
        categoryFiltersContainer.appendChild(clearButton);

        if (hasResults) {
            categoryFiltersContainer.classList.remove('hidden');
            categoryFiltersContainer.querySelector(`[data-category="${firstCategoryWithResults}"]`).click();
        } else {
            resultsContainer.innerHTML = `<p class="no-results">${title}: Nenhum resultado encontrado.</p>`;
        }
    }

    const updateCoverSize = (size) => {
        mainContent.setAttribute('data-cover-size', size);
        document.querySelectorAll('#cover-size-buttons .size-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
    };

    document.querySelectorAll('#cover-size-buttons .size-button').forEach(button => {
        button.addEventListener('click', () => {
            currentCoverSize = button.dataset.size;
            localStorage.setItem('yashi_search_cover_size', currentCoverSize);
            updateCoverSize(currentCoverSize);
        });
    });

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    updateCoverSize(currentCoverSize);
    
    const previousQuery = localStorage.getItem('yashi_search_query');
    if (previousQuery) {
        searchInput.value = previousQuery;
        localStorage.removeItem('yashi_search_query');
        performSearch();
    } else {
        renderInitialState();
    }
});