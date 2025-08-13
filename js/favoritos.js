// js/favoritos.js (v9.6B - Correção das capas na visualização em grade)
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'favorites';
    Yashi.initCommon(PAGE_TYPE);

    const {
        gridContainer, topBarBackButton, viewButtons,
        searchButton, categoryMenuButton
    } = Yashi.elements;

    // Apenas esconde o que não faz sentido na página de favoritos
    if (searchButton) searchButton.parentElement.style.display = 'none';
    if (categoryMenuButton) categoryMenuButton.style.display = 'none';

    const viewButtonsContainer = viewButtons[0].parentElement;
    const renderTarget = gridContainer;
    let allFavorites = [];

    const updateBackButton = () => {
        // Lógica para o botão de voltar na barra de navegação
        const goBack = () => {
            if (Yashi.navigationStack.length > 1) {
                Yashi.navigationStack.pop();
                const lastState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
                if (lastState && lastState.renderFunc) {
                    lastState.renderFunc();
                }
            } else {
                window.location.href = 'home.html';
            }
        };

        // Atribui a função ao botão e garante visibilidade
        topBarBackButton.onclick = goBack;
        topBarBackButton.style.display = 'flex';
    };

    const renderFullGridView = () => {
        viewButtonsContainer.classList.remove('disabled');
        renderTarget.innerHTML = '';
        
        // CORREÇÃO: Mapeia o array para passar apenas o objeto 'data' para a função de renderização.
        const favoriteItems = allFavorites.map(fav => fav.data);
        Yashi.renderGrid(favoriteItems, renderTarget);

        updateBackButton();
    };
    
    const renderShelvesView = () => {
        Yashi.navigationStack = [{ type: 'shelfList', renderFunc: renderShelvesView }];
        
        viewButtonsContainer.classList.add('disabled');
        renderTarget.className = 'shelf-container';
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';

        if (allFavorites.length === 0) {
            renderTarget.innerHTML = '<p id="no-results">Você não possui nenhum item favorito ainda.</p>';
            updateBackButton();
            return;
        }

        const favoritesByType = {
            series: allFavorites.filter(fav => fav.type === 'series'),
            movie: allFavorites.filter(fav => fav.type === 'movie'),
            channel: allFavorites.filter(fav => fav.type === 'channel')
        };

        const categoryOrder = ['series', 'movie', 'channel'];
        const categoryInfo = {
            series: { title: 'Séries Favoritas', icon: 'fa-solid fa-video' },
            movie: { title: 'Filmes Favoritos', icon: 'fa-solid fa-film' },
            channel: { title: 'Canais Favoritos', icon: 'fa-solid fa-tv' }
        };

        const fragment = document.createDocumentFragment();

        const headerDiv = document.createElement('div');
        headerDiv.className = 'favorites-header';
        headerDiv.innerHTML = `
            <h2>Meus Favoritos</h2>
            <button id="view-all-favorites-btn" class="action-button">
                <i class="fas fa-grip"></i> Ver Todos em Grade
            </button>
        `;
        fragment.appendChild(headerDiv);

        categoryOrder.forEach(type => {
            const favorites = favoritesByType[type];
            if (favorites.length > 0) {
                const shelf = document.createElement('div');
                shelf.className = 'category-shelf';
                const header = document.createElement('div');
                header.className = 'shelf-header';
                header.innerHTML = `
                    <div class="shelf-title">
                        <i class="icon ${categoryInfo[type].icon}"></i>
                        <span>${categoryInfo[type].title} (${favorites.length})</span>
                    </div>
                `;
                const carousel = document.createElement('div');
                carousel.className = 'item-carousel';
                favorites.forEach(fav => {
                    // Aqui já estava correto, passando fav.data
                    const card = Yashi.createCard(fav.data);
                    carousel.appendChild(card);
                });
                shelf.appendChild(header);
                shelf.appendChild(carousel);
                fragment.appendChild(shelf);
            }
        });
        
        renderTarget.innerHTML = '';
        renderTarget.appendChild(fragment);

        document.getElementById('view-all-favorites-btn').addEventListener('click', () => {
            Yashi.navigationStack.push({ type: 'fullGrid', renderFunc: renderFullGridView });
            renderFullGridView();
        });

        updateBackButton();
    };

    const loadFavorites = async () => {
        try {
            allFavorites = await db.favorites.orderBy('name').toArray();
            renderShelvesView();
        } catch(e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar favoritos do banco de dados.</p>';
            console.error('Erro ao carregar favoritos:', e);
        }
    };

    // Inicialização
    loadFavorites();
});