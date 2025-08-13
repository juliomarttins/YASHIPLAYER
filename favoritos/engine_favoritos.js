// /FAVORITOS/engine_favoritos.js
// Motor Específico para o Módulo de Favoritos

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        return;
    }

    const PAGE_TYPE = 'favorites';
    Yashi.initCommon(PAGE_TYPE);

    const { gridContainer, topBarBackButton } = Yashi.elements;
    
    if (Yashi.elements.searchButton) Yashi.elements.searchButton.parentElement.style.display = 'none';
    if (Yashi.elements.categoryMenuButton) Yashi.elements.categoryMenuButton.style.display = 'none';
    
    const renderTarget = gridContainer;

    function createCard(favoriteObject) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');

        const displayItem = favoriteObject.data;
        if (!displayItem) {
             return document.createComment(' Objeto de favorito inválido ');
        }

        if (!displayItem.logo) {
            card.classList.add('default-logo');
        }
        
        const defaultImg = '../capa.png';
        const itemType = favoriteObject.type; 

        let title = displayItem.name;
        let image = displayItem.logo || defaultImg;

        const favButton = document.createElement('button');
        favButton.className = 'favorite-button active';
        favButton.setAttribute('tabindex', '-1');
        favButton.innerHTML = '<i class="fa-solid fa-heart"></i>';

        favButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemName = displayItem.name;
            
            Yashi.showConfirmationModal(`<p>Remover "<strong>${itemName}</strong>" dos seus itens salvos?</p>`, async () => {
                try {
                    await db.favorites.delete(itemName);
                    await loadAndRenderFavorites(); 
                } catch (error) { console.error("Falha ao remover item salvo:", error); }
            }, { confirmText: "Sim, Remover" });
        });

        card.innerHTML = `
            <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
            <div class="card-title">${title}</div>`;
        card.prepend(favButton);

        card.addEventListener('click', async () => {
            if (itemType === 'movie' || itemType === 'series') {
                Yashi.showSynopsisModal(displayItem, () => {
                    sessionStorage.setItem('yashi_nav_origin', 'favoritos');
                    localStorage.setItem('yashi_deep_link_series_name', displayItem.name);
                    window.location.href = '../series/series.html';
                });
            } else if (itemType === 'channel') {
                if(displayItem.url) Yashi.playContent(displayItem);
            }
        });

        return card;
    }
    
    function renderCategorizedGrid(favorites) {
        Yashi.lastRenderedData = favorites;
        renderTarget.innerHTML = ''; 
        renderTarget.className = ''; 

        if (favorites.length === 0) {
            renderTarget.innerHTML = `<p id="no-results">Você não possui nenhum item salvo ainda.</p>`;
            return;
        }

        const favoritesByType = {
            series: favorites.filter(fav => fav.type === 'series'),
            movie: favorites.filter(fav => fav.type === 'movie'),
            channel: favorites.filter(fav => fav.type === 'channel')
        };
        
        const categoryOrder = [
            { type: 'series', title: 'Séries Salvas', icon: 'fa-solid fa-video', sortLabel: 'Série' },
            { type: 'movie', title: 'Filmes Salvos', icon: 'fa-solid fa-film', sortLabel: 'Filme' },
            { type: 'channel', title: 'Canais Salvos', icon: 'fa-solid fa-tv', sortLabel: null }
        ];

        const fragment = document.createDocumentFragment();

        categoryOrder.forEach(categoryInfo => {
            const items = favoritesByType[categoryInfo.type];
            if (items.length > 0) {
                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';

                const header = document.createElement('h2');
                header.className = 'category-title';
                
                const titleDiv = document.createElement('div');
                titleDiv.innerHTML = `<i class="icon ${categoryInfo.icon}"></i> ${categoryInfo.title} <span>(${items.length})</span>`;
                header.appendChild(titleDiv);

                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'category-actions';

                if (categoryInfo.sortLabel) {
                    const sortButton = document.createElement('button');
                    sortButton.className = 'sort-button';
                    sortButton.innerHTML = `<i class="fa-solid fa-dice"></i> Sortear ${categoryInfo.sortLabel}`;
                    sortButton.addEventListener('click', () => {
                        const randomIndex = Math.floor(Math.random() * items.length);
                        const randomItem = items[randomIndex];
                        Yashi.showSynopsisModal(randomItem.data, () => {
                            sessionStorage.setItem('yashi_nav_origin', 'favoritos');
                            localStorage.setItem('yashi_deep_link_series_name', randomItem.data.name);
                            window.location.href = '../series/series.html';
                        });
                    });
                    actionsContainer.appendChild(sortButton);
                }

                const clearButton = document.createElement('button');
                clearButton.className = 'clear-category-button';
                clearButton.innerHTML = '<i class="fa-solid fa-trash-can"></i> Limpar';
                clearButton.title = `Limpar todos os itens de ${categoryInfo.title}`;
                clearButton.addEventListener('click', () => {
                    Yashi.showConfirmationModal(
                        `<p>Tem certeza que deseja remover <strong>TUDO</strong> de "${categoryInfo.title}"?</p><p style="color:#dc3545;">Esta ação não pode ser desfeita.</p>`,
                        async () => {
                            await db.favorites.where('type').equals(categoryInfo.type).delete();
                            await loadAndRenderFavorites();
                            Yashi.showToast(`Categoria "${categoryInfo.title}" limpa.`, 'success');
                        },
                        { confirmText: "Sim, Limpar" }
                    );
                });
                actionsContainer.appendChild(clearButton);

                header.appendChild(actionsContainer);
                
                const grid = document.createElement('div');
                grid.className = 'grid-container';

                items.forEach(fav => grid.appendChild(createCard(fav)));

                categorySection.appendChild(header);
                categorySection.appendChild(grid);
                fragment.appendChild(categorySection);
            }
        });

        renderTarget.appendChild(fragment);

        if (topBarBackButton) {
            topBarBackButton.style.display = 'none';
        }
    }

    const loadAndRenderFavorites = async () => {
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        try {
            const allFavorites = await db.favorites.orderBy('name').toArray();
            renderCategorizedGrid(allFavorites);
        } catch(e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar itens salvos.</p>';
        }
    };
    
    if (topBarBackButton) {
        topBarBackButton.onclick = () => {
            window.location.href = '../home.html';
        };
    }

    loadAndRenderFavorites();
});