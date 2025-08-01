// js/favoritos.js (v7.0 - Adição de Exportar/Importar Favoritos)
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) { window.location.href = 'index.html'; return; }

    const PAGE_TYPE = 'favorites';
    Yashi.initCommon(PAGE_TYPE);

    const { gridContainer, topBarBackButton, searchInput, searchButton } = Yashi.elements;
    const renderTarget = gridContainer;

    let allFavorites = [];

    const updateBackButton = () => {
        // Na página de favoritos, o botão de voltar sempre leva para a home
        topBarBackButton.style.display = 'flex';
        topBarBackButton.onclick = () => {
            window.location.href = 'home.html';
        };
    };

    window.renderFavorites = async () => {
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        try {
            allFavorites = await db.favorites.toArray();
            
            // Garante que o gridContainer tenha a classe 'grid-container'
            renderTarget.className = 'grid-container'; 
            Yashi.applyViewMode(); // Aplica o modo de visualização

            if (allFavorites.length === 0) {
                renderTarget.innerHTML = '<p id="no-results">Você não possui nenhum item favorito ainda.</p>';
                return;
            }

            renderTarget.innerHTML = ''; // Limpa o loader
            allFavorites.forEach(fav => {
                const card = Yashi.createCard(fav.data); // fav.data contém o objeto original do item
                renderTarget.appendChild(card);
            });
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar favoritos do banco de dados.</p>';
            console.error('Erro ao carregar favoritos:', e);
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = 'search.html';
        }
    };

    // --- Lógica de Exportação e Importação ---
    const exportButton = document.getElementById('export-favorites-btn');
    const importButton = document.getElementById('import-favorites-btn');
    const importInput = document.getElementById('import-favorites-input');

    if (exportButton) {
        exportButton.addEventListener('click', async () => {
            try {
                const favoritesToExport = await db.favorites.toArray();
                const dataStr = JSON.stringify(favoritesToExport, null, 2); 
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'yashi_favorites.json'; 
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url); 
                
                alert('Favoritos exportados com sucesso para yashi_favorites.json!');
            } catch (error) {
                console.error('Erro ao exportar favoritos:', error);
                alert('Falha ao exportar favoritos. Verifique o console para mais detalhes.');
            }
        });
    }

    if (importButton && importInput) {
        importButton.addEventListener('click', () => {
            importInput.click(); // Simula o clique no input de arquivo oculto
        });

        importInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (!Array.isArray(importedData)) {
                        throw new Error('Formato de arquivo inválido. Esperado um array de favoritos.');
                    }

                    let importedCount = 0;
                    for (const item of importedData) {
                        // Garante que o item tem o formato esperado para um favorito (com 'name' e 'data')
                        if (item.name && item.data) {
                            // Usa .put() para inserir ou atualizar (se o 'name' já existir)
                            await db.favorites.put(item); 
                            importedCount++;
                        } else {
                            console.warn('Item ignorado durante a importação devido a formato inválido:', item);
                        }
                    }
                    alert(`${importedCount} favoritos importados com sucesso!`);
                    window.renderFavorites(); // Re-renderiza a lista de favoritos
                } catch (error) {
                    console.error('Erro ao importar favoritos:', error);
                    alert(`Falha ao importar favoritos: ${error.message}. Verifique o console.`);
                }
            };
            reader.readAsText(file);
        });
    }
    // --- Fim da Lógica de Exportação e Importação ---

    // Inicialização
    Yashi.reRenderCurrentContent = window.renderFavorites; // Permite que common.js chame renderFavorites
    updateBackButton();
    renderFavorites();

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});