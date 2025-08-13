// /SERIES/engine_series.js
// Motor Específico para o Módulo de Séries

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        alert("Erro crítico. Recarregue a página.");
        return;
    }

    const PAGE_TYPE = 'series';
    Yashi.initCommon(PAGE_TYPE);

    const { 
        gridContainer,
        topBarBackButton,
        categoryMenuButton,
        categorySidebar,
        sidebarOverlay, 
        categoryListContainer,
        closeSidebarButton,
        searchInput,
        searchButton,
        clearSearchButton
    } = Yashi.elements;
    
    const renderTarget = gridContainer;
    const coverSizeButtonsContainer = document.querySelector('.cover-size-buttons');

    let allSeries = [];
    let categoryCounts = {};
    const seriesCategoryIcons = { 'Padrão': 'fa-solid fa-layer-group', 'Animação': 'fa-solid fa-child', 'Documentário': 'fa-solid fa-book', 'Anime': 'fa-solid fa-dragon' };

    function normalizeText(text) {
        if (!text) return '';
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    const performLocalSearch = () => {
        const query = normalizeText(searchInput.value.trim());
        if (!query) {
            reRenderCurrentContent();
            return;
        }
        
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (currentState.type !== 'shelfList' && currentState.type !== 'fullGrid') {
            Yashi.showToast("A pesquisa só pode ser feita na tela principal de séries.", "error", 4000);
            return;
        }

        const filteredSeries = allSeries.filter(series => normalizeText(series.name).includes(query));
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
        renderGrid(filteredSeries);
    };

    function renderGrid(items, context = {}) {
        Yashi.lastRenderedData = items;
        renderTarget.innerHTML = '';
        renderTarget.className = 'grid-container';
        
        if (!items || items.length === 0) {
            renderTarget.innerHTML = `<p id="no-results">Nenhum item encontrado.</p>`;
            return;
        }
        items.forEach(item => {
            renderTarget.appendChild(createCard(item, context));
        });
        
        Yashi.updateBackButton();
    }

    function createCard(item, context = {}) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');

        const defaultImg = '../capa.png';
        const displayItem = item;
        const itemType = displayItem.seasons ? 'series' : (displayItem.episodes ? 'season' : 'episode');

        let title = displayItem.name;
        let image = displayItem.logo || (context.parentSeries ? context.parentSeries.logo : defaultImg);
        
        if (!displayItem.logo && itemType !== 'season') {
            card.classList.add('default-logo');
        }

        if (itemType === 'season') {
            card.classList.add('season-card');
            title = `Temporada ${displayItem.number || ''}`;
            if (!displayItem.logo) {
                card.classList.add('no-image');
            }
        }
        
        card.innerHTML = `
            <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
            <div class="card-title">${title}</div>
        `;

        if (itemType === 'series') {
            const infoOverlayHTML = `
                <div class="card-info-overlay">
                    <div class="info-action">
                        <i class="fa-solid fa-info-circle"></i>
                        <span>Sinopse e Notas</span>
                    </div>
                </div>`;
            card.insertAdjacentHTML('beforeend', infoOverlayHTML);

            const favButton = document.createElement('button');
            favButton.className = 'favorite-button';
            favButton.setAttribute('tabindex', '-1');
            favButton.setAttribute('data-tooltip', 'Salvar item');
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
        }

        card.addEventListener('click', () => {
            if (itemType === 'series') {
                const navigateToSeasons = () => {
                    const renderSeasonsView = () => {
                        if (coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
                        const seasons = Object.values(displayItem.seasons).sort((a, b) => (a.number || 0) - (b.number || 0));
                        renderGrid(seasons, { parentSeries: displayItem });
                    };
                    Yashi.navigationStack.push({ type: 'seriesDetail', renderFunc: renderSeasonsView, seriesName: displayItem.name });
                    renderSeasonsView();
                };
                Yashi.showSynopsisModal(displayItem, navigateToSeasons);

            } else if (itemType === 'season' && context.parentSeries) {
                const renderEpisodesView = () => {
                    renderGrid(displayItem.episodes, { parentSeries: context.parentSeries });
                };
                Yashi.navigationStack.push({ type: 'episodeList', renderFunc: renderEpisodesView });
                renderEpisodesView();

            } else if (displayItem.url) { 
                Yashi.playContent(displayItem);
            }
        });

        return card;
    }

    const toggleSidebar = (forceClose = false) => {
        if (forceClose || categorySidebar.classList.contains('active')) {
            categorySidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        } else {
            categorySidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            categoryListContainer.querySelector('button')?.focus();
        }
    };

    const renderFullGridView = (category) => {
        const seriesForCategory = category === 'Todos'
            ? allSeries
            : allSeries.filter(serie => (serie.groupTitle || 'Outros') === category);
        
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
        renderGrid(seriesForCategory);
        setTimeout(() => renderTarget.querySelector('.card')?.focus(), 100);
    };

    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 10;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 10;
    };

    const renderShelvesView = () => {
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.add('disabled');

        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        let shelfCategories = Object.keys(categoryCounts).filter(c => c !== 'Todos' && categoryCounts[c] > 0);
        
        const PLATFORM_KEYWORDS = ['NETFLIX', 'DISNEY', 'PRIME VIDEO', 'AMAZON', 'HBO', 'MAX', 'APPLE TV', 'PARAMOUNT', 'STAR+'];
        const STANDARD_GENRES = ['ANIMAÇÃO', 'DOCUMENTÁRIO', 'ANIME', 'AÇÃO', 'AVENTURA', 'COMÉDIA', 'DRAMA', 'TERROR', 'FICÇÃO', 'SUSPENSE', 'ROMANCE', 'CRIME'];

        let platformCount = 0;
        shelfCategories.forEach(category => {
            const normalizedCategory = category.toUpperCase();
            if (PLATFORM_KEYWORDS.some(p => normalizedCategory.includes(p))) {
                platformCount++;
            }
        });
        
        const platformMode = platformCount >= 3;

        const getCategoryPriority = (category) => {
            const normalizedCategory = category.toUpperCase();
            if (platformMode) {
                if (PLATFORM_KEYWORDS.some(p => normalizedCategory.includes(p))) return 1;
                return 2;
            } else {
                if (STANDARD_GENRES.some(g => normalizedCategory.includes(g))) return 1;
                return 2;
            }
        };

        shelfCategories.sort((a, b) => {
            const priorityA = getCategoryPriority(a);
            const priorityB = getCategoryPriority(b);
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return a.localeCompare(b);
        });

        const fragment = document.createDocumentFragment();
        shelfCategories.forEach(category => {
            const seriesForCategory = allSeries.filter(serie => (serie.groupTitle || 'Outros') === category);
            if(seriesForCategory.length === 0) return;

            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';
            const iconClass = seriesCategoryIcons[Object.keys(seriesCategoryIcons).find(key => category.toUpperCase().includes(key.toUpperCase()))] || seriesCategoryIcons['Padrão'];
            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title"><i class="icon ${iconClass}"></i><span>${category}</span></div>
                <button class="view-all-button" tabindex="0">VER TODAS (${seriesForCategory.length})</button>`;
            header.querySelector('.view-all-button').addEventListener('click', () => {
                Yashi.navigationStack.push({ type: 'fullGrid', renderFunc: () => renderFullGridView(category) });
                renderFullGridView(category);
            });
            
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';
            const prevBtn = document.createElement('button');
            prevBtn.className = 'scroll-button prev'; prevBtn.innerHTML = '&#10094;';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'scroll-button next'; nextBtn.innerHTML = '&#10095;';
            const carousel = document.createElement('div');
            carousel.className = 'item-carousel';
            
            seriesForCategory.slice(0, 20).forEach(serie => carousel.appendChild(createCard(serie)));

            prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -carousel.clientWidth * 0.8, behavior: 'smooth' }));
            nextBtn.addEventListener('click', () => carousel.scrollBy({ left: carousel.clientWidth * 0.8, behavior: 'smooth' }));
            carousel.addEventListener('scroll', () => handleCarouselScroll(carousel, prevBtn, nextBtn));
            
            carouselWrapper.append(prevBtn, carousel, nextBtn);
            shelf.append(header, carouselWrapper);
            fragment.appendChild(shelf);
            
            setTimeout(() => handleCarouselScroll(carousel, prevBtn, nextBtn), 200);
        });

        renderTarget.innerHTML = '';
        renderTarget.appendChild(fragment);
        Yashi.updateBackButton();
        setTimeout(() => document.querySelector('.view-all-button, .card')?.focus(), 100);
    };

    const renderCategorySidebar = () => {
        const sortedCategories = Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b));
        categoryListContainer.innerHTML = sortedCategories.map(category => {
            const count = categoryCounts[category] || 0;
            if (count === 0) return '';
            return `<button class="sidebar-category-button" data-category="${category}" tabindex="0">${category} (${count})</button>`
        }).join('');

        document.querySelectorAll('.sidebar-category-button').forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                Yashi.navigationStack.push({ type: 'fullGrid', renderFunc: () => renderFullGridView(category) });
                renderFullGridView(category);
                toggleSidebar(true);
            });
        });
    };

    const loadAndProcessSeries = async () => {
        try {
            allSeries = await db.series.orderBy('name').toArray();
            
            categoryCounts = {};
            allSeries.forEach(serie => {
                const category = serie.groupTitle || 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allSeries.length;
            renderCategorySidebar();
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar séries.</p>';
            console.error(e);
        }
    };
    
    window.reRenderCurrentContent = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    };

    categoryMenuButton.addEventListener('click', () => toggleSidebar());
    closeSidebarButton.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));
    searchButton.addEventListener('click', performLocalSearch);
    searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') performLocalSearch(); });
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchButton.classList.add('hidden');
        reRenderCurrentContent();
    });
    searchInput.addEventListener('input', () => { clearSearchButton.classList.toggle('hidden', !searchInput.value); });

    const initializePage = async () => {
        await loadAndProcessSeries();
        const deepLinkSeriesName = localStorage.getItem('yashi_deep_link_series_name');
        
        if (deepLinkSeriesName) {
            localStorage.removeItem('yashi_deep_link_series_name');
            const targetSeries = allSeries.find(s => s.name === deepLinkSeriesName);
    
            if (targetSeries) {
                const renderSeasonsView = () => {
                    if (coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
                    const seasons = Object.values(targetSeries.seasons).sort((a, b) => (a.number || 0) - (b.number || 0));
                    renderGrid(seasons, { parentSeries: targetSeries });
                };
                
                Yashi.navigationStack = [
                    { type: 'external' },
                    { type: 'seriesDetail', renderFunc: renderSeasonsView, seriesName: targetSeries.name }
                ];
                renderSeasonsView();
            } else {
                Yashi.showToast(`Não foi possível encontrar a série "${deepLinkSeriesName}".`, "error");
                renderShelvesView();
            }
        } else {
            renderShelvesView();
        }
    };
    
    initializePage();
});