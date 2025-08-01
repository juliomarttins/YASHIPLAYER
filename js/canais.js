// js/canais.js (v18 - View Buttons Logic Fix & Bug Fix)
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'canais';
    Yashi.initCommon(PAGE_TYPE);

    const { 
        gridContainer, topBarBackButton, viewButtons,
        categoryMenuButton, categorySidebar, sidebarOverlay, 
        categoryListContainer, closeSidebarButton,
        searchInput, searchButton
    } = Yashi.elements;
    
    const renderTarget = gridContainer;
    const viewButtonsContainer = viewButtons[0].parentElement;

    let allChannels = [];
    let categoryCounts = {};
    const channelCategoryIcons = { 'Padrão': 'fa-solid fa-satellite-dish', 'Esportes': 'fa-solid fa-futbol', 'Notícias': 'fa-solid fa-newspaper', 'Filmes': 'fa-solid fa-film', 'Séries': 'fa-solid fa-tv', 'Infantil': 'fa-solid fa-child', 'Documentários': 'fa-solid fa-book', 'Abertos': 'fa-solid fa-tower-broadcast', 'ADULTOS +18': 'fa-solid fa-ban', '24H': 'fa-solid fa-clock' };

    const toggleSidebar = (forceClose = false) => {
        if (forceClose || categorySidebar.classList.contains('active')) {
            categorySidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        } else {
            categorySidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        }
    };

    const updateBackButton = () => {
        if (Yashi.navigationStack.length > 1) {
            topBarBackButton.style.display = 'flex';
            topBarBackButton.onclick = () => {
                Yashi.navigationStack.pop();
                renderCurrentState();
            };
        } else {
            topBarBackButton.style.display = 'none';
        }
    };

    const renderFullGridView = (category) => {
        const channelsForCategory = category === 'Todos'
            ? allChannels
            : allChannels.filter(channel => (channel.groupTitle || 'Outros') === category);
        
        viewButtonsContainer.classList.remove('disabled');
        renderTarget.innerHTML = '';
        
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        Yashi.navigationStack.push({ type: 'fullGrid', data: channelsForCategory, renderFunc: () => renderFullGridView(category) });

        Yashi.renderGrid(channelsForCategory, renderTarget);
        updateBackButton();
    };

    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 0;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 1;
    };

    const renderShelvesView = () => {
        viewButtonsContainer.classList.add('disabled');
        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        let shelfCategories = Object.keys(categoryCounts).filter(c => c !== 'Todos' && categoryCounts[c] > 0);
        for (let i = shelfCategories.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shelfCategories[i], shelfCategories[j]] = [shelfCategories[j], shelfCategories[i]];
        }
        
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];

        const fragment = document.createDocumentFragment();

        shelfCategories.forEach(category => {
            const channelsForCategory = allChannels.filter(channel => (channel.groupTitle || 'Outros') === category);
            
            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';

            const iconClass = channelCategoryIcons[Object.keys(channelCategoryIcons).find(key => category.toUpperCase().includes(key.toUpperCase()))] || channelCategoryIcons['Padrão'];

            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title">
                    <i class="icon ${iconClass}"></i>
                    <span>${category}</span>
                    <button class="view-all-button">VER TODOS (${channelsForCategory.length})</button>
                </div>
            `;
            header.querySelector('.view-all-button').addEventListener('click', () => renderFullGridView(category));
            
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';

            const prevBtn = document.createElement('button');
            prevBtn.className = 'scroll-button prev';
            prevBtn.innerHTML = '&#10094;';
            prevBtn.disabled = true;

            const nextBtn = document.createElement('button');
            nextBtn.className = 'scroll-button next';
            nextBtn.innerHTML = '&#10095;';

            const carousel = document.createElement('div');
            carousel.className = 'item-carousel';
            
            const channelsToShow = channelsForCategory.slice(0, 20);
            channelsToShow.forEach(channel => {
                const card = Yashi.createCard(channel);
                carousel.appendChild(card);
            });

            prevBtn.addEventListener('click', () => carousel.scrollBy(-carousel.clientWidth * 0.8, 0));
            nextBtn.addEventListener('click', () => carousel.scrollBy(carousel.clientWidth * 0.8, 0));
            carousel.addEventListener('scroll', () => handleCarouselScroll(carousel, prevBtn, nextBtn));
            
            setTimeout(() => handleCarouselScroll(carousel, prevBtn, nextBtn), 150);

            carouselWrapper.appendChild(prevBtn);
            carouselWrapper.appendChild(carousel);
            carouselWrapper.appendChild(nextBtn);

            shelf.appendChild(header);
            shelf.appendChild(carouselWrapper);
            fragment.appendChild(shelf);
        });

        renderTarget.innerHTML = '';
        renderTarget.appendChild(fragment);
        updateBackButton();
    };

    const renderCategorySidebar = (categories) => {
        categoryListContainer.innerHTML = '';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'sidebar-category-button';
            
            const count = categoryCounts[category] || 0;
            if (count === 0) return;

            button.textContent = `${category} (${count})`;
            button.dataset.category = category;

            button.addEventListener('click', () => {
                renderFullGridView(category);
                toggleSidebar(true);
            });
            categoryListContainer.appendChild(button);
        });
    };
    
    const renderCurrentState = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    };

    const loadAndProcessChannels = async () => {
        try {
            allChannels = await db.items.where('type').equals('channel').toArray();
            
            categoryCounts = {};
            allChannels.forEach(channel => {
                const category = channel.groupTitle && channel.groupTitle.trim() !== '' ? channel.groupTitle.trim() : 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allChannels.length;

            const sortedSidebarCategories = Object.keys(categoryCounts).sort((a,b) => a.localeCompare(b));
            renderCategorySidebar(sortedSidebarCategories);

            renderShelvesView();

        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar canais do banco de dados.</p>';
            console.error('Erro ao carregar canais:', e);
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = 'search.html';
        }
    };
    
    Yashi.reRenderCurrentContent = renderCurrentState;

    categoryMenuButton.addEventListener('click', () => toggleSidebar());
    closeSidebarButton.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    loadAndProcessChannels();
});