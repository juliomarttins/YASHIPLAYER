// js/canais.js (v9.6B - FOCO AUTOMÁTICO NA NAVEGAÇÃO)
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
            categoryListContainer.querySelector('button')?.focus();
        }
    };

    const updateBackButton = () => {
        topBarBackButton.style.display = Yashi.navigationStack.length > 1 ? 'flex' : 'none';
        topBarBackButton.onclick = () => {
            Yashi.navigationStack.pop();
            Yashi.reRenderCurrentContent();
        };
    };

    const renderFullGridView = (category) => {
        const channelsForCategory = category === 'Todos'
            ? allChannels
            : allChannels.filter(channel => (channel.groupTitle || 'Outros') === category);
        
        viewButtonsContainer.classList.remove('disabled');
        renderTarget.innerHTML = '';
        Yashi.renderGrid(channelsForCategory, renderTarget);
        updateBackButton();
        setTimeout(() => renderTarget.querySelector('.card')?.focus(), 100);
    };

    const handleCarouselScroll = (carousel, prevBtn, nextBtn) => {
        const scrollEnd = carousel.scrollWidth - carousel.clientWidth;
        prevBtn.disabled = carousel.scrollLeft <= 10;
        nextBtn.disabled = carousel.scrollLeft >= scrollEnd - 10;
    };

    const renderShelvesView = () => {
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        viewButtonsContainer.classList.add('disabled');
        
        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        
        let shelfCategories = Object.keys(categoryCounts).filter(c => c !== 'Todos' && categoryCounts[c] > 0);
        for (let i = shelfCategories.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shelfCategories[i], shelfCategories[j]] = [shelfCategories[j], shelfCategories[i]];
        }
        
        const fragment = document.createDocumentFragment();
        shelfCategories.forEach(category => {
            const channelsForCategory = allChannels.filter(channel => (channel.groupTitle || 'Outros') === category);
            if (channelsForCategory.length === 0) return;

            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';
            shelf.setAttribute('data-focus-group', '');

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
                carousel.appendChild(Yashi.createCard(channel));
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
        updateBackButton();
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
    
    Yashi.reRenderCurrentContent = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    };

    categoryMenuButton.addEventListener('click', () => toggleSidebar());
    closeSidebarButton.addEventListener('click', () => toggleSidebar(true));
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = 'search.html';
        }
    });
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchButton.click();
    });

    loadAndProcessChannels();
});