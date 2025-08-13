// /CANAIS/engine_canais.js
// Motor Específico para o Módulo de Canais

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        alert("Erro crítico. Recarregue a página.");
        return;
    }

    const PAGE_TYPE = 'canais';
    Yashi.initCommon(PAGE_TYPE);

    const { 
        gridContainer,
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
    const viewButtonsContainer = document.querySelector('.cover-size-buttons');

    let allChannels = [];
    let categoryCounts = {};
    const channelCategoryIcons = { 'Padrão': 'fa-solid fa-satellite-dish', 'Esportes': 'fa-solid fa-futbol', 'Notícias': 'fa-solid fa-newspaper', 'Filmes': 'fa-solid fa-film', 'Séries': 'fa-solid fa-tv', 'Infantil': 'fa-solid fa-child', 'Documentários': 'fa-solid fa-book', 'Abertos': 'fa-solid fa-tower-broadcast', 'ADULTOS +18': 'fa-solid fa-ban', '24H': 'fa-solid fa-clock' };

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
        const filteredChannels = allChannels.filter(channel => normalizeText(channel.name).includes(query));
        if(viewButtonsContainer) viewButtonsContainer.classList.remove('disabled');
        renderGrid(filteredChannels);
    };

    function renderGrid(items, context = {}) {
        Yashi.lastRenderedData = items;
        renderTarget.innerHTML = '';
        renderTarget.className = 'grid-container';
        
        if (!items || items.length === 0) {
            renderTarget.innerHTML = `<p id="no-results">Nenhum canal encontrado.</p>`;
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

        if (!item.logo) {
            card.classList.add('default-logo');
        }

        const defaultImg = '../capa.png';
        const displayItem = item;
        const itemType = 'channel';

        let title = displayItem.name;
        let image = displayItem.logo || defaultImg;
        
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

        card.innerHTML = `
            <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
            <div class="card-title">${title}</div>`;
        card.prepend(favButton);

        card.addEventListener('click', () => {
            if (displayItem.url) {
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
        const channelsForCategory = category === 'Todos'
            ? allChannels
            : allChannels.filter(channel => (channel.groupTitle || 'Outros') === category);
        
        if(viewButtonsContainer) viewButtonsContainer.classList.remove('disabled');
        renderGrid(channelsForCategory);
        setTimeout(() => renderTarget.querySelector('.card')?.focus(), 100);
    };

    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 10;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 10;
    };

    const renderShelvesView = () => {
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        if(viewButtonsContainer) viewButtonsContainer.classList.add('disabled');
        
        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        let shelfCategories = Object.keys(categoryCounts).filter(c => c !== 'Todos' && categoryCounts[c] > 0);
        
        const PRIORITY_1_KEYWORDS = ['JOGOS DO DIA', 'LANÇAMENTOS', 'PREMIERE', 'PPV', 'CLIENTE'];
        const PRIORITY_2_KEYWORDS = ['GLOBO', 'SBT', 'RECORD', 'BAND'];
        const PRIORITY_3_KEYWORDS = [ 'SPORTV', 'ESPN', 'TELECINE', 'HBO', 'MEGAPIX', 'TNT', 'AXN', 'SONY', 'WARNER', 'UNIVERSAL', 'MULTISHOW', 'GNT', 'VIVA', 'DISCOVERY', 'HISTORY', 'NAT GEO', 'ANIMAL PLANET', 'CARTOON', 'NICKELODEON', 'DISNEY' ];

        const getCategoryPriority = (category) => {
            const normalizedCategory = category.toUpperCase();
            if (PRIORITY_1_KEYWORDS.some(k => normalizedCategory.includes(k))) return 1;
            if (PRIORITY_2_KEYWORDS.some(k => normalizedCategory.includes(k))) return 2;
            if (PRIORITY_3_KEYWORDS.some(k => normalizedCategory.includes(k))) return 3;
            return 4; 
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
            const channelsForCategory = allChannels.filter(channel => (channel.groupTitle || 'Outros') === category);
            if (channelsForCategory.length === 0) return;

            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';

            const iconClass = channelCategoryIcons[Object.keys(channelCategoryIcons).find(key => category.toUpperCase().includes(key.toUpperCase()))] || channelCategoryIcons['Padrão'];

            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title"><i class="icon ${iconClass}"></i><span>${category}</span></div>
                <button class="view-all-button" tabindex="0">VER TODOS (${channelsForCategory.length})</button>
            `;
            header.querySelector('.view-all-button').addEventListener('click', () => {
                Yashi.navigationStack.push({ type: 'fullGrid', renderFunc: () => renderFullGridView(category) });
                renderFullGridView(category);
            });
            
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';
            const prevBtn = document.createElement('button');
            prevBtn.className = 'scroll-button prev';
            prevBtn.innerHTML = '&#10094;';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'scroll-button next';
            nextBtn.innerHTML = '&#10095;';
            const carousel = document.createElement('div');
            carousel.className = 'item-carousel';
            
            channelsForCategory.slice(0, 20).forEach(channel => {
                carousel.appendChild(createCard(channel));
            });

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
        const sortedCategories = Object.keys(categoryCounts).sort((a,b) => a.localeCompare(b));
        categoryListContainer.innerHTML = sortedCategories.map(category => {
             const count = categoryCounts[category] || 0;
             if(count === 0) return '';
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

    const loadAndProcessChannels = async () => {
        try {
            allChannels = await db.items.where('type').equals('channel').toArray();
            categoryCounts = {};
            allChannels.forEach(channel => {
                const category = channel.groupTitle || 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allChannels.length;
            renderShelvesView();
            renderCategorySidebar();
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar canais.</p>';
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
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performLocalSearch();
    });
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchButton.classList.add('hidden');
        reRenderCurrentContent();
    });
    searchInput.addEventListener('input', () => {
        clearSearchButton.classList.toggle('hidden', !searchInput.value);
    });

    loadAndProcessChannels();
});