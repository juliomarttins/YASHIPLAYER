## avaliados\avaliados.html
```html

```


## backup\backup.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Backup & Restauração</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    
    <link rel="stylesheet" href="style_backup.css">
</head>
<body class="content-body">
    <div class="top-bar">
        <div class="top-bar-left">
            <img src="../logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='../home.html'">
            <button class="home-button" onclick="window.location.href='../home.html'" title="Voltar para Home">
                <i class="fas fa-home"></i>
            </button>
        </div>
    </div>

    <main id="main-content" class="backup-container">
        <h1>Backup e Restauração de Dados</h1>
        <p class="subtitle">Exporte seus dados para salvá-los ou importá-los em outro navegador ou computador.</p>

        <div class="cards-container">
            <div class="action-card">
                <i class="fas fa-download icon"></i>
                <h2>Exportar Dados</h2>
                <p>Crie um arquivo de backup (`.json`) contendo todos os seus Favoritos e o seu Histórico de Reprodução (Continue Assistindo).</p>
                <button id="export-button" class="backup-button export">
                    <i class="fas fa-file-export"></i>
                    Exportar Meus Dados
                </button>
            </div>

            <div class="action-card">
                <i class="fas fa-upload icon"></i>
                <h2>Importar Dados</h2>
                <p>Selecione um arquivo de backup (`yashi-player-backup.json`) para restaurar seus dados. <strong style="color: #FF8A80;">Atenção:</strong> a importação substituirá todos os seus favoritos e histórico atuais.</p>
                <input type="file" id="import-input" accept=".json" style="display: none;">
                <button id="import-button" class="backup-button import">
                    <i class="fas fa-file-import"></i>
                    Importar Arquivo de Backup
                </button>
            </div>
        </div>
    </main>

    <div id="toast-container"></div>
    <div id="confirmation-modal-overlay">
        <div class="confirmation-modal">
            <div class="confirmation-modal-content"></div>
            <div class="confirmation-modal-buttons">
                <button class="modal-button cancel-button">Cancelar</button>
                <button class="modal-button confirm-button">Confirmar</button>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_backup.js"></script>
</body>
</html>
```


## backup\engine_backup.js
```javascript
// /BACKUP/engine_backup.js
// Motor Específico para o Módulo de Backup

document.addEventListener('DOMContentLoaded', () => {
    // Valida se as dependências globais (db e Yashi) existem
    if (!window.db || !window.Yashi) {
        console.error("Dependências (db.js, common.js) não carregadas.");
        alert("Erro crítico na página. Por favor, recarregue.");
        return;
    }
    
    // Esta página não precisa de Yashi.initCommon(), pois sua UI é simples e autossuficiente.

    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const importInput = document.getElementById('import-input');
    const requiredFilename = "yashi-player-backup.json";

    // --- LÓGICA DE EXPORTAÇÃO ---
    exportButton.addEventListener('click', async () => {
        try {
            const favoritesData = await db.favorites.toArray();
            const historyData = await db.playbackHistory.toArray();

            const backupData = {
                version: "yashi-v1",
                timestamp: new Date().toISOString(),
                data: {
                    favorites: favoritesData,
                    playbackHistory: historyData
                }
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = requiredFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Yashi.showToast("Backup exportado com sucesso!", "success");

        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            Yashi.showToast(`Falha ao exportar: ${error.message}`, "error");
        }
    });

    // --- LÓGICA DE IMPORTAÇÃO ---
    importButton.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            importInput.value = '';
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!importedData.version || importedData.version !== "yashi-v1" || !importedData.data || !Array.isArray(importedData.data.favorites) || !Array.isArray(importedData.data.playbackHistory)) {
                    throw new Error("O arquivo de backup é inválido ou está corrompido.");
                }

                const favCount = importedData.data.favorites.length;
                const histCount = importedData.data.playbackHistory.length;
                const confirmationMessage = `
                    <p>Você está prestes a importar:</p>
                    <ul>
                        <li><strong>${favCount}</strong> itens para Favoritos</li>
                        <li><strong>${histCount}</strong> itens para o Histórico</li>
                    </ul>
                    <p style="color: #FF8A80; font-weight: bold;">Esta ação substituirá permanentemente seus dados atuais. Deseja continuar?</p>`;

                Yashi.showConfirmationModal(confirmationMessage, async () => {
                    await performImport(importedData.data);
                }, { confirmText: 'Sim, Importar' });

            } catch (error) {
                console.error("Erro ao ler ou validar o arquivo de backup:", error);
                Yashi.showToast(`Falha na importação: ${error.message}`, "error");
            } finally {
                importInput.value = '';
            }
        };

        // ADICIONADO: Tratamento de erro para a leitura do arquivo
        reader.onerror = () => {
            console.error("FileReader: Não foi possível ler o arquivo.");
            Yashi.showToast("Erro ao tentar ler o arquivo. Verifique se o arquivo não está corrompido.", "error");
            importInput.value = ''; // Limpa o input
        };

        reader.readAsText(file);
    });

    async function performImport(data) {
        try {
            await db.transaction('rw', db.favorites, db.playbackHistory, async () => {
                await db.favorites.clear();
                await db.playbackHistory.clear();

                if (data.favorites.length > 0) {
                    await db.favorites.bulkAdd(data.favorites);
                }
                if (data.playbackHistory.length > 0) {
                    await db.playbackHistory.bulkAdd(data.playbackHistory);
                }
            });

            const successMessage = `Dados importados: ${data.favorites.length} Favoritos e ${data.playbackHistory.length} itens no Histórico.`;
            Yashi.showToast(successMessage, "success", 5000);

        } catch (error) {
            console.error("Erro ao gravar dados no banco de dados:", error);
            Yashi.showToast(`Falha grave ao importar: ${error.message}`, "error");
        }
    }
});
```


## backup\style_backup.css
```css
/* /BACKUP/style_backup.css */
/* Estilos consolidados para o módulo de Backup */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --toast-error-bg: #2c1a1d;
    --toast-error-border: #dc3545;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}
html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR SIMPLES --- */
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 25px; }
.top-bar-left { display: flex; align-items: center; gap: 12px; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }

/* --- ESTILOS ESPECÍFICOS DA PÁGINA --- */
.backup-container {
    max-width: 900px;
    margin: 40px auto 0 auto;
    text-align: center;
}
.backup-container h1 {
    font-size: 2rem;
    color: var(--yashi-cyan);
    margin-bottom: 10px;
}
.subtitle {
    font-size: 1.1rem;
    color: var(--text-secondary-color);
    margin-bottom: 40px;
}
.cards-container {
    display: flex;
    gap: 30px;
    justify-content: center;
    flex-wrap: wrap;
}
.action-card {
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 30px;
    max-width: 400px;
    flex-grow: 1;
    text-align: left;
    display: flex;
    flex-direction: column;
}
.action-card .icon {
    font-size: 2.5rem;
    color: var(--yashi-cyan);
    margin-bottom: 20px;
    align-self: center;
}
.action-card h2 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.5rem;
    text-align: center;
}
.action-card p {
    color: var(--text-secondary-color);
    line-height: 1.6;
    flex-grow: 1;
}
.backup-button {
    border: none;
    padding: 15px 25px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
}
.backup-button:hover { transform: translateY(-3px); }
.backup-button.export {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
}
.backup-button.export:hover { box-shadow: 0 5px 20px rgba(0, 240, 240, 0.4); }
.backup-button.import {
    background-color: transparent;
    color: var(--yashi-cyan);
    border: 2px solid var(--yashi-cyan);
}
.backup-button.import:hover { background-color: var(--yashi-cyan); color: var(--background-color); }

/* --- SISTEMA DE NOTIFICAÇÃO E MODAIS --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; display: flex; align-items: center; gap: 10px; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }
.toast.success::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f058"; color: var(--toast-success-border); }
.toast.error { border-left-color: var(--toast-error-border); background-color: var(--toast-error-bg); }
.toast.error::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f06a"; color: var(--toast-error-border); }
#confirmation-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
#confirmation-modal-overlay.active { opacity: 1; visibility: visible; }
.confirmation-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; text-align: center; }
#confirmation-modal-overlay.active .confirmation-modal { transform: scale(1); }
.confirmation-modal-content { margin-bottom: 25px; }
.confirmation-modal-content p { margin: 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.confirmation-modal-content ul { list-style: none; padding: 0; margin: 15px 0; text-align: left; display: inline-block; }
.confirmation-modal-content li { margin-bottom: 5px; }
.confirmation-modal-buttons { display: flex; justify-content: center; gap: 15px; }
.modal-button.confirm-button { background-color: var(--toast-error-border); color: #fff; }
.modal-button.cancel-button { background-color: var(--border-color); color: var(--text-color); }
```


## canais\canais.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Canais</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />

    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="style_canais.css">
</head>
<body class="content-body">
    <main id="main-content"></main>

    <div id="player-view">
        <div id="player-container">
            <div class="player-header">
                <button class="back-from-player"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h2 id="player-title"></h2>
            </div>
            <video id="player" playsinline controls></video>
            <button id="player-prev-button" class="player-nav-button prev" title="Anterior"><i class="fas fa-backward-step"></i></button>
            <button id="player-next-button" class="player-nav-button next" title="Próximo"><i class="fas fa-forward-step"></i></button>
        </div>
    </div>

    <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_canais.js"></script>
</body>
</html>
```


## canais\engine_canais.js
```javascript
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
```


## canais\style_canais.css
```css
/* /CANAIS/style_canais.css */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --plyr-color-main: var(--yashi-cyan);
    --plyr-range-track-background: #3a414a;
    --plyr-tooltip-background: var(--yashi-cyan);
    --plyr-tooltip-color: #0d1117;
    --toast-error-bg: #2c1a1d;
    --toast-error-border: #dc3545;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}

html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR E PESQUISA --- */
main {
    padding-top: 80px;
    margin-top: -80px;
}
.top-bar { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 10px 25px; 
    margin: -25px -25px 25px -25px;
    gap: 15px; 
    flex-wrap: wrap;
    background-color: var(--surface-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
}
.top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 12px; }
.top-bar-right { flex-grow: 1; justify-content: flex-end; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; flex-shrink: 0; padding: 0 12px; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }
.home-button.with-text { width: auto; padding: 0 15px; gap: 10px; }
.home-button.with-text span { font-size: 0.9rem; font-weight: 500; }
#top-bar-back-button { display: none; }
.cover-size-buttons { display: flex; align-items: center; gap: 5px; background-color: var(--background-color); padding: 5px; border-radius: 8px; }
.size-label { font-size: 0.8rem; color: var(--text-secondary-color); margin-right: 5px; margin-left: 5px; font-weight: 500; }
.size-button { background: none; border: none; color: var(--text-secondary-color); width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.size-button:hover { color: var(--text-color); }
.size-button.active { background-color: var(--yashi-cyan); color: var(--background-color); }
.cover-size-buttons.disabled { opacity: 0.4; pointer-events: none; }
.search-container { position: relative; display: flex; align-items: center; width: 100%; max-width: 350px; }
.search-input { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-color); padding: 10px 75px 10px 15px; border-radius: 8px; width: 100%; transition: border-color 0.2s; }
.search-input:focus { outline: none; border-color: var(--yashi-cyan); }
.search-button, .clear-search-button { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary-color); cursor: pointer; padding: 8px; }
.clear-search-button { right: 40px; }
.hidden { display: none; }

/* --- GRID E CARDS --- */
.grid-container { display: grid; gap: 1.25rem; }
main[data-cover-size="micro"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
main[data-cover-size="small"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
main[data-cover-size="medium"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
main[data-cover-size="large"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }

.card { background-color: var(--surface-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; border: 1px solid transparent; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); border-color: var(--border-color); }
.card:focus, .card:focus-visible { outline: none; transform: translateY(-5px); box-shadow: 0 0 15px var(--yashi-cyan-glow); border-color: var(--yashi-cyan); }
.card-img { width: 100%; height: auto; aspect-ratio: 2 / 3; object-fit: cover; background-color: #21262d; }
.card.default-logo .card-img { object-fit: contain; padding: 1.5rem; }
.card-title { padding: 0.75rem; font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
main[data-cover-size="micro"] .card-title { font-size: 0.75rem; padding: 0.5rem; }
.favorite-button { position: absolute; top: 8px; right: 8px; background-color: rgba(13, 17, 23, 0.7); color: var(--text-secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.favorite-button:hover { background-color: rgba(0, 240, 240, 0.2); color: var(--yashi-cyan); }
.favorite-button.active { color: #FFD700; text-shadow: 0 0 8px #FFD700; }

/* --- PLAYER DE VÍDEO --- */
#player-view { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
#player-container { position: relative; width: 90%; max-width: 1200px; max-height: 80vh; height: auto; }
.player-header { display: flex; align-items: center; position: absolute; top: -45px; left: 0; gap: 15px; }
.back-from-player { background-color: var(--yashi-cyan); color: var(--background-color); border: 1px solid var(--yashi-cyan); padding: 8px 15px; border-radius: 8px; cursor: pointer; z-index: 1001; font-weight: bold; transition: all 0.2s ease-in-out; }
.back-from-player:hover { background-color: var(--yashi-cyan-glow); border-color: var(--yashi-cyan-glow); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
#player-title { font-size: 1.2rem; color: var(--text-color); }
.player-nav-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.6); color: var(--text-secondary-color); border: 2px solid var(--border-color); border-radius: 50%; width: 50px; height: 50px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2147483647; transition: all 0.2s ease-in-out; opacity: 0; visibility: hidden; }
#player-container:hover .player-nav-button.visible { opacity: 0.7; }
.player-nav-button.visible { visibility: visible; }
.player-nav-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
.player-nav-button:disabled { opacity: 0.2 !important; cursor: not-allowed; background-color: rgba(13, 17, 23, 0.5); color: var(--text-secondary-color); border-color: var(--border-color); box-shadow: none; }
.player-nav-button.prev { left: 20px; }
.player-nav-button.next { right: 20px; }

/* --- ANIMAÇÃO DE CARREGAMENTO E MENSAGENS --- */
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }
.content-loader, #no-results { grid-column: 1 / -1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; color: var(--text-secondary-color); text-align: center; }

/* --- MENU DE CATEGORIAS (SIDEBAR) --- */
#sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1999; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
#sidebar-overlay.active { opacity: 1; visibility: visible; }
#category-sidebar { position: fixed; top: 0; left: 0; width: 300px; max-width: 80%; height: 100%; background-color: var(--surface-color); border-right: 1px solid var(--border-color); z-index: 2000; transform: translateX(-100%); transition: transform 0.3s ease-in-out; display: flex; flex-direction: column; }
#category-sidebar.active { transform: translateX(0); }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.sidebar-header h3 { margin: 0; font-size: 1.1rem; }
#close-sidebar-button, .sidebar-back-button { background: none; border: none; color: var(--text-secondary-color); font-size: 20px; cursor: pointer; }
#category-list-container { padding: 10px; overflow-y: auto; flex-grow: 1; }
.sidebar-category-button { display: block; width: 100%; padding: 12px 15px; background: none; border: none; color: var(--text-secondary-color); text-align: left; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: background-color 0.2s, color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-category-button:hover { background-color: var(--border-color); color: var(--text-color); }
.sidebar-category-button.active { background-color: var(--yashi-cyan); color: var(--background-color); font-weight: bold; }

/* --- SISTEMA DE NOTIFICAÇÃO E MODAIS --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; display: flex; align-items: center; gap: 10px; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }
.toast.success::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f058"; color: var(--toast-success-border); }
.toast.error { border-left-color: var(--toast-error-border); background-color: var(--toast-error-bg); }
.toast.error::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f06a"; color: var(--toast-error-border); }
#confirmation-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
#confirmation-modal-overlay.active { opacity: 1; visibility: visible; }
.confirmation-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; text-align: center; }
#confirmation-modal-overlay.active .confirmation-modal { transform: scale(1); }
.confirmation-modal-content { margin-bottom: 25px; }
.confirmation-modal-content p { margin: 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.confirmation-modal-buttons { display: flex; justify-content: center; gap: 15px; }
.modal-button.confirm-button { background-color: var(--yashi-cyan); color: var(--background-color); }
.modal-button.cancel-button { background-color: var(--border-color); color: var(--text-color); }

/* --- ESTILOS DE PRATELEIRAS (SHELVES) --- */
.shelf-container { display: flex; flex-direction: column; gap: 35px; }
.category-shelf { width: 100%; }
.shelf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 5px; }
.shelf-title { font-size: 1.3rem; font-weight: 500; color: var(--text-color); display: flex; align-items: center; gap: 12px; }
.shelf-title .icon { color: var(--yashi-cyan); font-size: 1.1rem; }
.view-all-button {
    background-color: transparent;
    border: 1px solid var(--yashi-cyan);
    color: var(--yashi-cyan);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    margin-left: 15px;
}
.view-all-button:hover {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    transform: scale(1.05);
}
.carousel-wrapper { position: relative; }
.item-carousel { display: flex; gap: 1.25rem; overflow-x: auto; padding: 5px; margin: -5px; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; scrollbar-width: none; }
.item-carousel::-webkit-scrollbar { display: none; }
.scroll-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.8); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; opacity: 0; visibility: hidden; }
.carousel-wrapper:hover .scroll-button { opacity: 0.8; visibility: visible; }
.scroll-button.prev { left: -20px; }
.scroll-button.next { right: -20px; }
.scroll-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); transform: translateY(-50%) scale(1.1); }
.scroll-button:disabled { opacity: 0 !important; visibility: hidden; cursor: not-allowed; }
.item-carousel .card { flex-shrink: 0; width: 150px; }
```


## contato\contato.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Contato</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    
    <link rel="stylesheet" href="style_contato.css">
</head>
<body class="content-body">
    <div class="top-bar">
        <div class="top-bar-left">
            <img src="../logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='../home.html'">
            <button class="home-button" onclick="window.location.href='../home.html'" title="Voltar para Home">
                <i class="fas fa-home"></i>
            </button>
        </div>
    </div>

    <main id="main-content" class="contato-container">
        <h1>Sua Voz é Essencial</h1>
        <p class="subtitle">A evolução do Yashi Player depende da sua opinião. Escolha o canal ideal para falar conosco.</p>

        <div class="cards-container">
            <div class="contact-links">
                <div class="action-card small-card">
                    <i class="fa-brands fa-whatsapp icon whatsapp-icon"></i>
                    <h2>Suporte via WhatsApp</h2>
                    <p>Precisa de uma resposta rápida? Fale diretamente com o desenvolvedor. Ideal para suporte, dúvidas urgentes e feedback direto.</p>
                    <a href="https://wa.me/5562998413382?text=Ol%C3%A1!%20Gostaria%20de%20falar%20sobre%20o%20Yashi%20Player." target="_blank" class="contato-button whatsapp">
                        <i class="fa-brands fa-whatsapp"></i> Enviar Mensagem
                    </a>
                </div>
                <div class="action-card small-card">
                    <i class="fa-brands fa-telegram icon telegram-icon"></i>
                    <h2>Converse via Telegram</h2>
                    <p>Fale diretamente com a gente. Ideal para suporte, dúvidas e sugestões, sem a necessidade de entrar em um grupo.</p>
                    <a href="https://t.me/+5562994164778" target="_blank" class="contato-button telegram">
                        <i class="fa-brands fa-telegram"></i> Conversar
                    </a>
                </div>
            </div>
            
            <div class="action-card form-card">
                <i class="fa-solid fa-envelope-open-text icon"></i>
                <h2>Formulário de Contato</h2>
                <p>Para assuntos mais estruturados, o formulário é a melhor opção. Ele nos ajuda a organizar e responder suas solicitações com mais eficiência.</p>
                <p class="form-warning" style="color: #dc3545; font-weight: bold; text-align: center; margin-bottom: 20px;">
                    AVISO: O formulário de contato está temporariamente inativo. Por favor, envie sua mensagem diretamente para: <a href="mailto:maretins10@gmail.com" style="color: #dc3545; text-decoration: underline;">maretins10@gmail.com</a>
                </p>
                <form id="contact-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contact-name">Seu Nome</label>
                            <input type="text" id="contact-name" required disabled>
                        </div>
                        <div class="form-group">
                            <label for="contact-email">Seu E-mail (para resposta)</label>
                            <input type="email" id="contact-email" disabled>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="contact-subject">Assunto</label>
                        <select id="contact-subject" required disabled>
                            <option value="Dúvida Geral">Dúvida Geral</option>
                            <option value="Sugestão de Recurso">Sugestão de Recurso</option>
                            <option value="Relatório de Bug/Erro">Relatório de Bug/Erro</option>
                            <option value="Proposta de Parceria">Proposta de Parceria</option>
                            <option value="Outro Assunto">Outro Assunto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contact-message">Mensagem</label>
                        <textarea id="contact-message" rows="5" required disabled></textarea>
                    </div>
                    <button type="submit" class="contato-button submit" disabled>
                        <i class="fa-solid fa-paper-plane"></i> Enviar Mensagem
                    </button>
                </form>
            </div>
        </div>

        <div class="action-card full-width">
            <i class="fa-solid fa-fire-flame-curved icon"></i>
            <h2>Mantenha a Chama Acesa</h2>
            <p>O Yashi Player nasceu da paixão por uma experiência de mídia limpa, rápida e <strong>sem anúncios</strong>. E queremos que continue assim. Cada café que você paga se transforma em horas de código e novas funcionalidades. Você não está apenas doando, está investindo na ferramenta que usa.</p>
            <div class="pix-info">
                <p><strong>Nome:</strong> Julio Cesar P. Martins</p>
                <p><strong>Instituição:</strong> AstroPay</p>
                <p class="pix-key-container">
                    <strong>Chave:</strong> <span id="pix-key">3894648b-2333-4f43-9e24-5714895a1abb</span>
                </p>
                <button id="copy-pix-btn" class="contato-button copy-pix">
                    <i class="fa-solid fa-copy"></i> Copiar Chave PIX
                </button>
            </div>
        </div>
    </main>

    <div id="toast-container"></div>
    
    <script src="engine_contato.js"></script>
</body>
</html>
```


## contato\engine_contato.js
```javascript
// /CONTATO/engine_contato.js

document.addEventListener('DOMContentLoaded', () => {

    const contactForm = document.getElementById('contact-form');
    const submitFormButton = document.getElementById('submit-form-button');
    const copyPixBtn = document.getElementById('copy-pix-btn');
    const pixKeySpan = document.getElementById('pix-key');

    // Função para mostrar notificações (toast)
    const showToast = (message, type = 'success', duration = 3000) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    };

    // Lógica do Formulário de Contato
    if (contactForm && submitFormButton) {
        submitFormButton.addEventListener('click', (event) => {
            event.preventDefault();

            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            if (!name || !subject || !message) {
                showToast("Por favor, preencha todos os campos obrigatórios.", "error");
                return;
            }

            const mailtoSubject = `YASHI PLAYER - Contato: ${subject} - de ${name}`;
            const mailtoBody = `Nome: ${name}\n` +
                               `Email para Retorno: ${email || 'Não informado'}\n\n` +
                               `---------------------------------------\n` +
                               `Mensagem:\n${message}`;

            const mailtoLink = `mailto:maretins10@gmail.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

            // NOVO: Código de depuração para verificar o que está acontecendo
            console.log("Tentando enviar email...");
            console.log("Link gerado: ", mailtoLink);
            
            // Usar window.open para tentar abrir em uma nova aba
            window.open(mailtoLink, '_blank');
        });
    }

    // Lógica do Botão de Copiar Chave PIX
    if (copyPixBtn && pixKeySpan) {
        copyPixBtn.addEventListener('click', () => {
            const pixKey = pixKeySpan.textContent;
            navigator.clipboard.writeText(pixKey).then(() => {
                showToast('Chave PIX copiada!', 'success');
            }).catch(err => {
                console.error('Falha ao copiar PIX:', err);
                showToast('Erro ao copiar a chave.', 'error');
            });
        });
    }

});
```


## contato\style_contato.css
```css
/* /CONTATO/style_contato.css */
/* Estilos para o módulo de Contato */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --whatsapp-color: #25D366;
    --telegram-color: #0088cc;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}
html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR SIMPLES --- */
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 25px; }
.top-bar-left { display: flex; align-items: center; gap: 12px; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }

/* --- CONTAINER PRINCIPAL E CARDS --- */
.contato-container {
    max-width: 1200px;
    margin: 40px auto 0 auto;
    text-align: center;
}
.contato-container h1 {
    font-size: 2rem;
    color: var(--yashi-cyan);
    margin-bottom: 10px;
}
.subtitle {
    font-size: 1.1rem;
    color: var(--text-secondary-color);
    margin-bottom: 40px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}
.cards-container {
    display: flex;
    gap: 30px;
    justify-content: center;
    flex-wrap: wrap;
    align-items: stretch;
}
.contact-links {
    display: flex;
    flex-direction: column;
    gap: 30px;
    flex: 1;
    min-width: 300px;
}
.action-card {
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    text-align: left;
    height: 100%;
}
.action-card.form-card {
    flex: 2;
    min-width: 500px;
    height: auto; /* Remove a altura fixa para deixar o flexbox controlar */
}
.action-card.small-card {
    flex-grow: 1;
}
.action-card.full-width {
    flex-basis: 100%;
    max-width: 1000px;
    margin: 30px auto 0 auto;
}
.action-card .icon {
    font-size: 2.5rem;
    color: var(--yashi-cyan);
    margin-bottom: 20px;
    align-self: center;
}
.action-card .icon.whatsapp-icon { color: var(--whatsapp-color); }
.action-card .icon.telegram-icon { color: var(--telegram-color); }
.action-card h2 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.5rem;
    text-align: center;
}
.action-card p {
    color: var(--text-secondary-color);
    line-height: 1.6;
    flex-grow: 1;
    margin-bottom: 20px;
}

/* --- BOTÕES --- */
.contato-button {
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: auto;
    text-decoration: none;
    color: #fff;
    width: 100%;
}
.contato-button:hover { 
    transform: translateY(-3px); 
    color: #fff;
}
.contato-button.whatsapp { background-color: var(--whatsapp-color); }
.contato-button.whatsapp:hover { box-shadow: 0 5px 20px rgba(37, 211, 102, 0.4); }
.contato-button.telegram { background-color: var(--telegram-color); }
.contato-button.telegram:hover { box-shadow: 0 5px 20px rgba(0, 136, 204, 0.4); }
.contato-button.submit, .contato-button.copy-pix { background-color: var(--yashi-cyan); color: var(--background-color); }
.contato-button.submit:hover, .contato-button.copy-pix:hover { box-shadow: 0 5px 20px rgba(0, 240, 240, 0.4); }

/* --- FORMULÁRIO --- */
#contact-form {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.form-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}
.form-group {
    flex: 1;
    min-width: 200px;
    margin-bottom: 15px;
    text-align: left;
}
.form-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-secondary-color);
}
.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 12px;
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-color);
    font-family: inherit;
    font-size: 1rem;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--yashi-cyan);
    box-shadow: 0 0 10px rgba(0, 240, 240, 0.3);
}
.form-group textarea {
    resize: vertical;
    flex-grow: 1;
}
#contact-form .contato-button {
    margin-top: auto;
}

/* --- SEÇÃO PIX --- */
.pix-info {
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;
    margin-top: auto;
    text-align: center;
}
.pix-info p {
    margin: 5px 0 15px 0;
    line-height: 1.4;
}
.pix-key-container {
    background: var(--surface-color);
    padding: 10px;
    border-radius: 6px;
    overflow-wrap: break-word;
    word-break: break-all;
}
#pix-key {
    user-select: all;
}

/* --- TOAST (Notificação) --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }

/*
    Correção de responsividade para alinhar os cards.
    Em telas maiores, o `contact-links` e o `form-card`
    ficam lado a lado e se adaptam dinamicamente.
*/
@media (min-width: 993px) {
    .cards-container {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 30px;
    }

    .contact-links {
        display: flex;
        flex-direction: column;
        gap: 30px;
    }

    .action-card.form-card {
        grid-column: 2 / 3;
        grid-row: 1 / 2;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .action-card.small-card {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
}

@media (max-width: 992px) {
    .cards-container {
        flex-direction: column;
        align-items: center;
    }
    .contact-links {
        width: 100%;
        max-width: 100%;
    }
    .action-card.small-card {
        flex-basis: calc(50% - 15px);
        max-width: unset;
    }
    .action-card.form-card {
        width: 100%;
        min-width: unset;
    }
    .action-card.full-width {
        max-width: 100%;
    }
}
```


## continue-assistindo\continue_assistindo.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Continue Assistindo</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />

    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="style_continue_assistindo.css">
</head>
<body class="content-body">
    <main id="main-content"></main>

    <div id="player-view">
        <div id="player-container">
            <div class="player-header">
                <button class="back-from-player"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h2 id="player-title"></h2>
            </div>
            <video id="player" playsinline controls></video>
            <div id="autoplay-notice" class="autoplay-notice">Aguarde, a reprodução retomará automaticamente...</div>
            <button id="player-prev-button" class="player-nav-button prev" title="Anterior"><i class="fas fa-backward-step"></i></button>
            <button id="player-next-button" class="player-nav-button next" title="Próximo"><i class="fas fa-forward-step"></i></button>
        </div>
    </div>

    <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_continue_assistindo.js"></script>
</body>
</html>
```


## continue-assistindo\engine_continue_assistindo.js
```javascript
// /CONTINUE-ASSISTINDO/engine_continue_assistindo.js
// Motor Específico para o Módulo Continue Assistindo

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        alert("Erro crítico. Recarregue a página.");
        return;
    }

    const PAGE_TYPE = 'continue-watching';
    Yashi.initCommon(PAGE_TYPE);

    const { gridContainer, topBarBackButton, searchInput, searchButton } = Yashi.elements;
    
    if (Yashi.elements.categoryMenuButton) {
        Yashi.elements.categoryMenuButton.remove();
    }
    if (Yashi.elements.categorySidebar) {
        Yashi.elements.categorySidebar.remove();
    }
    if (Yashi.elements.sidebarOverlay) {
        Yashi.elements.sidebarOverlay.remove();
    }
    
    const renderTarget = gridContainer;
    let allPlaybackHistory = [];

    function renderGrid(items) {
        Yashi.lastRenderedData = items;
        renderTarget.innerHTML = '';
        renderTarget.className = 'grid-container';
        
        if (!items || items.length === 0) {
            renderTarget.innerHTML = '<p id="no-results">Você não possui nenhum item no histórico de reprodução.</p>';
            return;
        }
        items.forEach(item => {
            renderTarget.appendChild(createCard(item));
        });
        
        Yashi.updateBackButton();
    }

    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('tabindex', '0');

        const displayItem = item.playbackData;
        if (!displayItem) {
            return document.createComment(' Item de histórico inválido ');
        }
        
        if (!displayItem.logo) {
            card.classList.add('default-logo');
        }

        const defaultImg = '../capa.png';
        const itemType = item.type || (displayItem.seasons ? 'series' : displayItem.type); 
        const title = displayItem.name;
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

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-history-button';
        removeButton.setAttribute('tabindex', '-1');
        removeButton.title = 'Remover do Histórico';
        removeButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemIdToDelete = item.itemId;
            const confirmationMessage = `<p>Tem certeza que deseja remover "<strong>${title}</strong>" do seu histórico?</p>`;
            
            Yashi.showConfirmationModal(confirmationMessage, async () => {
                await db.playbackHistory.delete(itemIdToDelete);
                card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                card.style.transform = 'scale(0.9)';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.remove();
                    if (renderTarget && renderTarget.childElementCount === 0) {
                        renderTarget.innerHTML = '<p id="no-results">Você não possui nenhum item no histórico de reprodução.</p>';
                    }
                }, 300);
            }, { confirmText: 'Sim, Remover' });
        });
        card.appendChild(removeButton);

        if (itemType === 'channel') {
            const liveBadge = document.createElement('div');
            liveBadge.className = 'live-badge';
            liveBadge.textContent = 'AO VIVO';
            card.appendChild(liveBadge);
        } else if (item.progress && item.duration) {
            const progressOverlay = document.createElement('div');
            progressOverlay.className = 'progress-overlay';
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = `${(item.progress / item.duration) * 100}%`;
            progressOverlay.appendChild(progressBar);
            card.appendChild(progressOverlay);
        }

        card.addEventListener('click', () => {
            Yashi.playContent(displayItem, item.progress);
        });

        return card;
    }

    const renderPlaybackHistory = async () => {
        renderTarget.innerHTML = '<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>';
        try {
            allPlaybackHistory = await db.playbackHistory.orderBy('timestamp').reverse().toArray();
            renderGrid(allPlaybackHistory);
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar histórico de reprodução.</p>';
        }
    };

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            localStorage.setItem('yashi_search_query', query);
            window.location.href = '../PESQUISA/search.html';
        }
    };

    if (topBarBackButton) {
        topBarBackButton.style.display = 'flex';
        topBarBackButton.onclick = () => {
            window.location.href = '../home.html';
        };
    }

    if (searchButton) searchButton.addEventListener('click', performSearch);
    if (searchInput) searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    renderPlaybackHistory();
});
```


## continue-assistindo\style_continue_assistindo.css
```css
/* /CONTINUE-ASSISTINDO/style_continue_assistindo.css */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --plyr-color-main: var(--yashi-cyan);
    --plyr-range-track-background: #3a414a;
    --plyr-tooltip-background: var(--yashi-cyan);
    --plyr-tooltip-color: #0d1117;
    --toast-error-bg: #2c1a1d;
    --toast-error-border: #dc3545;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}

html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR E PESQUISA --- */
main {
    padding-top: 80px;
    margin-top: -80px;
}
.top-bar { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 10px 25px; 
    margin: -25px -25px 25px -25px;
    gap: 15px; 
    flex-wrap: wrap;
    background-color: var(--surface-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
}
.top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 12px; }
.top-bar-right { flex-grow: 1; justify-content: flex-end; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; flex-shrink: 0; padding: 0 12px; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }
.home-button.with-text { width: auto; padding: 0 15px; gap: 10px; }
.home-button.with-text span { font-size: 0.9rem; font-weight: 500; }
#top-bar-back-button { display: none; }
.cover-size-buttons { display: flex; align-items: center; gap: 5px; background-color: var(--background-color); padding: 5px; border-radius: 8px; }
.size-label { font-size: 0.8rem; color: var(--text-secondary-color); margin-right: 5px; margin-left: 5px; font-weight: 500; }
.size-button { background: none; border: none; color: var(--text-secondary-color); width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.size-button:hover { color: var(--text-color); }
.size-button.active { background-color: var(--yashi-cyan); color: var(--background-color); }
.cover-size-buttons.disabled { opacity: 0.4; pointer-events: none; }
.search-container { position: relative; display: flex; align-items: center; width: 100%; max-width: 350px; }
.search-input { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-color); padding: 10px 75px 10px 15px; border-radius: 8px; width: 100%; transition: border-color 0.2s; }
.search-input:focus { outline: none; border-color: var(--yashi-cyan); }
.search-button, .clear-search-button { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary-color); cursor: pointer; padding: 8px; }
.clear-search-button { right: 40px; }
.hidden { display: none; }

/* --- GRID E CARDS --- */
.grid-container { display: grid; gap: 1.25rem; }
main[data-cover-size="micro"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
main[data-cover-size="small"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
main[data-cover-size="medium"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
main[data-cover-size="large"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }

.card { background-color: var(--surface-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; border: 1px solid transparent; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); border-color: var(--border-color); }
.card:focus, .card:focus-visible { outline: none; transform: translateY(-5px); box-shadow: 0 0 15px var(--yashi-cyan-glow); border-color: var(--yashi-cyan); }
.card-img { width: 100%; height: auto; aspect-ratio: 2 / 3; object-fit: cover; background-color: #21262d; }
.card.default-logo .card-img { object-fit: contain; padding: 1.5rem; }
.card-title { padding: 0.75rem; font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
main[data-cover-size="micro"] .card-title { font-size: 0.75rem; padding: 0.5rem; }
.favorite-button { position: absolute; top: 8px; right: 8px; background-color: rgba(13, 17, 23, 0.7); color: var(--text-secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.favorite-button:hover { background-color: rgba(0, 240, 240, 0.2); color: var(--yashi-cyan); }
.favorite-button.active { color: #FFD700; text-shadow: 0 0 8px #FFD700; }
.remove-history-button { position: absolute; bottom: 8px; right: 8px; background-color: rgba(220, 53, 69, 0.7); color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; z-index: 6; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; opacity: 0; }
.card:hover .remove-history-button { opacity: 1; }
.remove-history-button:hover { background-color: rgba(220, 53, 69, 1); transform: scale(1.1); }

/* --- BARRA DE PROGRESSO E SELO AO VIVO --- */
.progress-overlay { position: absolute; bottom: 0; left: 0; width: 100%; height: 8px; background-color: rgba(0, 0, 0, 0.7); z-index: 2; }
.progress-bar { height: 100%; background-color: var(--yashi-cyan); width: 0%; transition: width 0.3s ease-in-out; }

.live-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background-color: var(--toast-error-border); /* Vermelho Padrão */
    color: #fff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
    z-index: 3;
    text-transform: uppercase;
    line-height: 1;
}

/* --- PLAYER DE VÍDEO --- */
#player-view { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
#player-container { position: relative; width: 90%; max-width: 1200px; max-height: 80vh; height: auto; }
.player-header { display: flex; align-items: center; position: absolute; top: -45px; left: 0; gap: 15px; }
.back-from-player { background-color: var(--yashi-cyan); color: var(--background-color); border: 1px solid var(--yashi-cyan); padding: 8px 15px; border-radius: 8px; cursor: pointer; z-index: 1001; font-weight: bold; transition: all 0.2s ease-in-out; }
.back-from-player:hover { background-color: var(--yashi-cyan-glow); border-color: var(--yashi-cyan-glow); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
#player-title { font-size: 1.2rem; color: var(--text-color); }
.player-nav-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.6); color: var(--text-secondary-color); border: 2px solid var(--border-color); border-radius: 50%; width: 50px; height: 50px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2147483647; transition: all 0.2s ease-in-out; opacity: 0; visibility: hidden; }
#player-container:hover .player-nav-button.visible { opacity: 0.7; }
.player-nav-button.visible { visibility: visible; }
.player-nav-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
.player-nav-button:disabled { opacity: 0.2 !important; cursor: not-allowed; background-color: rgba(13, 17, 23, 0.5); color: var(--text-secondary-color); border-color: var(--border-color); box-shadow: none; }
.player-nav-button.prev { left: 20px; }
.player-nav-button.next { right: 20px; }

/* --- ANIMAÇÃO DE CARREGAMENTO E MENSAGENS --- */
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }
.content-loader, #no-results { grid-column: 1 / -1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; color: var(--text-secondary-color); text-align: center; }
#no-results { font-size: 1.1rem; }

/* --- SISTEMA DE NOTIFICAÇÃO E MODAIS --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; display: flex; align-items: center; gap: 10px; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }
.toast.success::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f058"; color: var(--toast-success-border); }
.toast.error { border-left-color: var(--toast-error-border); background-color: var(--toast-error-bg); }
.toast.error::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f06a"; color: var(--toast-error-border); }
#confirmation-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
#confirmation-modal-overlay.active { opacity: 1; visibility: visible; }
.confirmation-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; text-align: center; }
#confirmation-modal-overlay.active .confirmation-modal { transform: scale(1); }
.confirmation-modal-content { margin-bottom: 25px; }
.confirmation-modal-content p { margin: 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.confirmation-modal-buttons { display: flex; justify-content: center; gap: 15px; }
.modal-button { border: none; padding: 10px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.modal-button:hover { transform: translateY(-2px); }
.modal-button.confirm-button { background-color: var(--yashi-cyan); color: var(--background-color); }
.modal-button.cancel-button { background-color: var(--border-color); color: var(--text-color); }
```


## css\base.css
```css
/* /css/base.css */

:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --plyr-color-main: var(--yashi-cyan);
    --plyr-range-track-background: #3a414a;
    --plyr-tooltip-background: var(--yashi-cyan);
    --plyr-tooltip-color: #0d1117;
    --toast-error-bg: #2c1a1d;
    --toast-error-border: #dc3545;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}

html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR E PESQUISA --- */
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 25px; gap: 15px; flex-wrap: wrap; }
.top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 12px; }
.top-bar-right { flex-grow: 1; justify-content: flex-end; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; flex-shrink: 0; padding: 0 12px; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }
.home-button.with-text { width: auto; padding: 0 15px; gap: 10px; }
.home-button.with-text span { font-size: 0.9rem; font-weight: 500; }
#top-bar-back-button { display: none; }
.view-buttons { display: flex; gap: 5px; background-color: var(--surface-color); padding: 5px; border-radius: 8px; transition: opacity 0.3s ease; }
.view-button { background: none; border: none; color: var(--text-secondary-color); width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease-in-out; }
.view-button.active { background-color: var(--yashi-cyan); color: var(--background-color); box-shadow: 0 0 10px rgba(0, 240, 240, 0.4); }
.view-buttons.disabled { opacity: 0.4; pointer-events: none; }
.search-container { position: relative; display: flex; align-items: center; width: 100%; max-width: 350px; }
.search-input { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-color); padding: 10px 75px 10px 15px; border-radius: 8px; width: 100%; transition: border-color 0.2s; }
.search-input:focus { outline: none; border-color: var(--yashi-cyan); }
.search-button, .clear-search-button { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary-color); cursor: pointer; padding: 8px; }
.clear-search-button { right: 40px; }
.hidden { display: none; }

/* --- GRID E CARDS --- */
.grid-container { display: grid; gap: 1.25rem; }
.grid-container.view-large { grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr)); }
.grid-container.view-medium { grid-template-columns: repeat(auto-fill, minmax(9.375rem, 1fr)); }
.grid-container.view-small { grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); }
.grid-container.view-details, .grid-container.view-list { grid-template-columns: 1fr; gap: 0.75rem; }
.card { background-color: var(--surface-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; border: 1px solid transparent; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); border-color: var(--border-color); }
.card:focus, .card:focus-visible { 
    outline: none;
    transform: translateY(-5px);
    box-shadow: 0 0 15px var(--yashi-cyan-glow);
    border-color: var(--yashi-cyan);
}
.card-img { width: 100%; height: auto; aspect-ratio: 2 / 3; object-fit: cover; background-color: #21262d; }
.card-title { padding: 0.75rem; font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.grid-container.view-details .card, .grid-container.view-list .card { flex-direction: row; align-items: center; }
.grid-container.view-details .card-img, .grid-container.view-list .card-img { width: 5rem; height: auto; aspect-ratio: 2 / 3; }
.grid-container.view-list .card-img { width: 3.75rem; }
.card-content { padding: 0.75rem; overflow: hidden; }
.card-description { font-size: 0.8rem; color: var(--text-secondary-color); margin-top: 0.25rem; }
.favorite-button { position: absolute; top: 8px; right: 8px; background-color: rgba(13, 17, 23, 0.7); color: var(--text-secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.favorite-button:hover { background-color: rgba(229, 9, 20, 0.15); color: #E50914; }
.favorite-button.active { color: #E50914; text-shadow: 0 0 8px rgba(229, 9, 20, 0.7); }
.remove-history-button { position: absolute; bottom: 8px; right: 8px; background-color: rgba(220, 53, 69, 0.7); color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; z-index: 6; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; opacity: 0; }
.card:hover .remove-history-button { opacity: 1; }
.remove-history-button:hover { background-color: rgba(220, 53, 69, 1); transform: scale(1.1); }
.info-button { position: absolute; bottom: 8px; left: 8px; background-color: rgba(13, 17, 23, 0.7); color: var(--text-secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 6; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; opacity: 0; }
.card:hover .info-button { opacity: 1; }
.info-button:hover { background-color: rgba(0, 240, 240, 0.2); color: var(--yashi-cyan); transform: scale(1.1); }

/* Estilo para o Tooltip Customizado */
.info-button, .favorite-button { position: relative; }
.info-button::after, .favorite-button::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    pointer-events: none;
    z-index: 10;
}
.info-button:hover::after, .favorite-button:hover::after {
    opacity: 1;
    visibility: visible;
}


/* --- BOTÃO DE FILTRO --- */
.filter-button { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary-color); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; flex-shrink: 0; }
.filter-button:hover { border-color: var(--yashi-cyan); color: var(--yashi-cyan); transform: translateY(-2px); }
.filter-button.active { background-color: var(--yashi-cyan); border-color: var(--yashi-cyan); color: var(--background-color); font-weight: bold; box-shadow: 0 0 15px rgba(0, 240, 240, 0.5); transform: translateY(-2px); }

/* --- PLAYER DE VÍDEO --- */
#player-view { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
#player-container { position: relative; width: 90%; max-width: 1200px; height: auto; }
.player-header { display: flex; align-items: center; position: absolute; top: -45px; left: 0; gap: 15px; }
.back-from-player { background-color: var(--surface-color); color: var(--text-color); border: 1px solid var(--border-color); padding: 8px 15px; border-radius: 8px; cursor: pointer; z-index: 1001; }
#player-title { font-size: 1.2rem; color: var(--text-color); }
.player-nav-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.6); color: var(--text-secondary-color); border: 2px solid var(--border-color); border-radius: 50%; width: 50px; height: 50px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2147483647; transition: all 0.2s ease-in-out; opacity: 0; visibility: hidden; }
#player-container:hover .player-nav-button.visible { opacity: 0.7; }
.player-nav-button.visible { visibility: visible; }
.player-nav-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
.player-nav-button:disabled { opacity: 0.2 !important; cursor: not-allowed; background-color: rgba(13, 17, 23, 0.5); color: var(--text-secondary-color); border-color: var(--border-color); box-shadow: none; }
.player-nav-button.prev { left: 20px; }
.player-nav-button.next { right: 20px; }
#player-container .autoplay-notice {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(13, 17, 23, 0.85);
    color: var(--yashi-cyan);
    padding: 15px 25px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 1rem;
    z-index: 2147483647;
    text-align: center;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease-in-out, visibility 0.3s;
}
#player-container .autoplay-notice strong {
    color: var(--yashi-cyan);
}
#player-container .autoplay-notice.visible {
    visibility: visible;
    opacity: 1;
}

/* Menu customizado de Formato de Tela (Aspect Ratio) */
#aspect-ratio-menu {
    position: absolute;
    bottom: 50px;
    right: 20px;
    background-color: var(--surface-color);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 5px 15px rgba(0,0,0,0.4);
    z-index: 50;
    overflow: hidden;
}
#aspect-ratio-menu.hidden {
    display: none;
}
#aspect-ratio-menu button {
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: var(--text-color);
    padding: 12px 20px;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}
#aspect-ratio-menu button:hover {
    background-color: var(--border-color);
}
#aspect-ratio-menu button.active {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    font-weight: bold;
}

/* Regras de object-fit para o vídeo */
.plyr[data-aspect-ratio="padrão"] video {
    object-fit: contain;
}
.plyr[data-aspect-ratio="preencher"] video {
    object-fit: cover;
}
.plyr[data-aspect-ratio="esticado"] video {
    object-fit: fill;
}

/* --- ANIMAÇÃO DE CARREGAMENTO --- */
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }
.content-loader, #no-results, .search-prompt { grid-column: 1 / -1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; color: var(--text-secondary-color); text-align: center; }

/* --- MENU DE CATEGORIAS (SIDEBAR) --- */
#sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1999; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
#sidebar-overlay.active { opacity: 1; visibility: visible; }
#category-sidebar { position: fixed; top: 0; left: 0; width: 300px; max-width: 80%; height: 100%; background-color: var(--surface-color); border-right: 1px solid var(--border-color); z-index: 2000; transform: translateX(-100%); transition: transform 0.3s ease-in-out; display: flex; flex-direction: column; }
#category-sidebar.active { transform: translateX(0); }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.sidebar-header h3 { margin: 0; font-size: 1.1rem; }
#close-sidebar-button, .sidebar-back-button { background: none; border: none; color: var(--text-secondary-color); font-size: 20px; cursor: pointer; }
#category-list-container { padding: 10px; overflow-y: auto; flex-grow: 1; }
.sidebar-category-button { display: block; width: 100%; padding: 12px 15px; background: none; border: none; color: var(--text-secondary-color); text-align: left; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: background-color 0.2s, color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-category-button:hover { background-color: var(--border-color); color: var(--text-color); }
.sidebar-category-button.active { background-color: var(--yashi-cyan); color: var(--background-color); font-weight: bold; }

/* --- SISTEMA DE NOTIFICAÇÃO (TOAST) --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; display: flex; align-items: center; gap: 10px; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }
.toast.success::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f058"; color: var(--toast-success-border); }
.toast.error { border-left-color: var(--toast-error-border); background-color: var(--toast-error-bg); }
.toast.error::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f06a"; color: var(--toast-error-border); }

/* --- MODAIS (GERAL) --- */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
.modal-overlay.active { opacity: 1; visibility: visible; }
.modal-box { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; }
.modal-overlay.active .modal-box { transform: scale(1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; }
.modal-header h3 { margin: 0; font-size: 1.3rem; color: var(--yashi-cyan); }
.modal-close-button { background: none; border: none; font-size: 28px; color: var(--text-secondary-color); cursor: pointer; line-height: 1; transition: color 0.2s, transform 0.2s; }
.modal-close-button:hover { color: var(--yashi-cyan); transform: rotate(90deg); }
.modal-content p { margin: 0 0 15px 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.modal-content strong { color: var(--yashi-cyan); }
.modal-buttons { display: flex; justify-content: center; gap: 15px; margin-top: 25px; }
.modal-button { border: none; padding: 10px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.modal-button:hover { transform: translateY(-2px); }
.confirm-button { background-color: var(--toast-error-border); color: #fff; }
.confirm-button:hover { box-shadow: 0 0 15px rgba(220, 53, 69, 0.5); }
.cancel-button { background-color: var(--border-color); color: var(--text-color); }
.cancel-button:hover { box-shadow: 0 0 15px rgba(48, 54, 61, 0.5); }
.pix-info { background-color: var(--background-color); border-radius: 8px; padding: 20px; margin-top: 20px; text-align: left; }
.pix-info h4 { margin: 0 0 15px 0; text-align: center; color: var(--text-color); }
.pix-info p { margin: 5px 0; }
.pix-info .pix-key { background: var(--surface-color); padding: 10px; border-radius: 6px; user-select: all; }
#copy-pix-btn { background-color: var(--yashi-cyan); color: var(--background-color); width: 100%; margin-top: 15px; }
#copy-pix-btn:hover { box-shadow: 0 0 15px var(--yashi-cyan-glow); }

/* --- MODAL DE CONFIRMAÇÃO (GERAL) --- */
#confirmation-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
#confirmation-modal-overlay.active { opacity: 1; visibility: visible; }
.confirmation-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; text-align: center; }
#confirmation-modal-overlay.active .confirmation-modal { transform: scale(1); }
.confirmation-modal-content { margin-bottom: 25px; }
.confirmation-modal-content p { margin: 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.confirmation-modal-content ul { list-style: none; padding: 0; margin: 15px 0; text-align: left; display: inline-block; }
.confirmation-modal-content li { margin-bottom: 5px; }
.confirmation-modal-buttons { display: flex; justify-content: center; gap: 15px; }
#confirmation-modal-overlay .confirm-button { background-color: var(--yashi-cyan); color: var(--background-color); border: none; }
#confirmation-modal-overlay .confirm-button:hover { background-color: var(--yashi-cyan-glow); box-shadow: 0 0 15px var(--yashi-cyan-glow); }

/* --- MODAL DE SINOPSES (GLOBAL) --- */
#synopsis-modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    justify-content: center; align-items: center;
    z-index: 10000;
    display: none;
    opacity: 0;
    transition: opacity 0.3s;
}
#synopsis-modal-overlay.active { display: flex; opacity: 1; }
.synopsis-modal {
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 90%; max-width: 800px; max-height: 80vh;
    display: flex; flex-direction: row;
    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    transform: scale(0.95);
    transition: transform 0.3s;
    overflow: hidden;
    position: relative;
}
#synopsis-modal-overlay.active .synopsis-modal { transform: scale(1); }
.synopsis-close-button {
    position: absolute; top: 10px; right: 10px;
    background: none; border: none;
    font-size: 28px; color: var(--text-secondary-color);
    cursor: pointer; line-height: 1;
    transition: color 0.2s, transform 0.2s;
    z-index: 10;
}
.synopsis-close-button:hover { color: var(--yashi-cyan); transform: rotate(90deg); }
.synopsis-poster { flex-shrink: 0; width: 33%; background-color: var(--background-color); }
.synopsis-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
.synopsis-details { padding: 30px; overflow-y: auto; flex-grow: 1; }
.synopsis-title { font-size: 1.8rem; font-weight: 700; color: var(--text-color); margin: 0 0 5px 0; padding-right: 30px; }
.synopsis-meta { font-size: 0.9rem; color: var(--text-secondary-color); margin-bottom: 20px; font-weight: 500; }
.synopsis-meta .rating { color: #FFD700; font-weight: bold; }
.synopsis-overview-title { font-size: 1.1rem; font-weight: bold; color: var(--yashi-cyan); margin: 20px 0 10px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; }
.synopsis-overview { font-size: 1rem; line-height: 1.7; color: var(--text-color); }
.synopsis-loading, .synopsis-error { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; padding: 20px; }
.synopsis-error { color: #ff7b72; }
.synopsis-actions {
    margin-top: 25px;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}
.modal-action-button {
    flex-grow: 1;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s, color 0.2s, border 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}
.modal-action-button:hover { transform: translateY(-2px); }
.modal-action-button.play {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
}
.modal-action-button.play:hover { box-shadow: 0 5px 20px rgba(0, 240, 240, 0.4); }
.modal-action-button.favorite {
    background-color: var(--border-color);
    color: var(--text-secondary-color);
}
.modal-action-button.favorite:hover { background-color: #3e444b; }
.modal-action-button.favorite.active {
    background-color: transparent;
    color: #E50914; /* Cor Vermelha para Salvo */
    border: 2px solid #E50914;
}
.modal-action-button.favorite.active i { text-shadow: 0 0 8px rgba(229, 9, 20, 0.7); }

/* --- Estilos para Avaliação com Slider --- */
.synopsis-rating-container {
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
    text-align: center;
}
.rating-display-slider {
    font-size: 1.1rem;
    color: var(--text-secondary-color);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 500;
}
#user-rating-value {
    color: var(--text-color);
    font-weight: bold;
    font-size: 1.2rem;
}
#user-rating-value .fa-heart {
    color: #E50914; /* Coração Vermelho */
    font-size: 1.1rem;
    vertical-align: middle;
}
.rating-slider-wrapper {
    display: flex;
    align-items: center;
    gap: 15px;
}
#clear-rating-btn {
    background: none;
    border: 1px solid var(--border-color);
    color: var(--text-secondary-color);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    transition: all 0.2s;
    flex-shrink: 0;
}
#clear-rating-btn:hover {
    background-color: var(--toast-error-border);
    color: white;
    border-color: var(--toast-error-border);
    transform: scale(1.1);
}

/* Customização do Slider */
input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 10px;
    background: linear-gradient(to right, var(--yashi-cyan) var(--slider-progress, 0%), var(--border-color) var(--slider-progress, 0%));
    border-radius: 5px;
    outline: none;
    cursor: pointer;
    transition: background 0.2s;
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: white;
    border: 3px solid var(--yashi-cyan);
    border-radius: 50%;
    cursor: grab;
    transition: transform 0.2s;
}
input[type="range"]:active::-webkit-slider-thumb {
    transform: scale(1.2);
    cursor: grabbing;
}
/* Firefox */
input[type="range"]::-moz-range-track {
    width: 100%;
    height: 10px;
    background: linear-gradient(to right, var(--yashi-cyan) var(--slider-progress, 0%), var(--border-color) var(--slider-progress, 0%));
    border-radius: 5px;
    outline: none;
    cursor: pointer;
}
input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: white;
    border: 3px solid var(--yashi-cyan);
    border-radius: 50%;
    cursor: grab;
    transition: transform 0.2s;
}
input[type="range"]:active::-moz-range-thumb {
    cursor: grabbing;
}

@media (max-width: 768px) {
    .synopsis-modal { flex-direction: column; max-height: 90vh; }
    .synopsis-poster { width: 100%; max-height: 300px; }
    .synopsis-poster img { object-fit: contain; }
    .synopsis-details { padding: 20px; }
    .synopsis-title { font-size: 1.5rem; }
}
```


## css\index_home.css
```css
/* /css/index_home.css */

/* Cores para o efeito de vidro (Login) e Home */
:root {
    /* As cores agora são herdadas do base.css, mas podemos redefinir se necessário. */
    /* Para garantir consistência, vamos usar as variáveis globais. */
    --glass-bg: rgba(22, 27, 34, 0.6);
    --glass-border: rgba(0, 240, 240, 0.3); /* Ciano Neon com transparência */
    --home-bg-dark: #0d1117;
    --home-bg-light: #161b22;
}

/* --- ESTILOS DA PÁGINA DE LOGIN --- */
.login-body {
    background: linear-gradient(135deg, var(--background-color) 0%, #080a0d 100%);
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    box-sizing: border-box;
}

.login-container {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    padding: 15px 30px; 
    border-radius: 12px;
    text-align: center;
    width: 90%;
    max-width: 500px;
    z-index: 2;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

/* Estilização da barra de rolagem interna */
.login-container::-webkit-scrollbar {
    width: 6px;
}
.login-container::-webkit-scrollbar-track {
    background: transparent;
    margin: 20px 0;
}
.login-container::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 20px;
}


#login-form {
    width: 100%;
}

.login-logo {
    max-width: 220px;
    height: auto;
    margin-bottom: 10px;
}
.login-container p {
    color: var(--text-secondary-color);
    margin-bottom: 15px;
    margin-top: 0;
}
.login-container input[type="text"] {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    background: rgba(13, 17, 23, 0.8);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-color);
    box-sizing: border-box;
    font-size: 16px;
}

#loadButton {
    width: 60%;
    padding: 19px;
    margin-top: 15px;
    border: none;
    border-radius: 50px;
    background: var(--yashi-cyan);
    color: var(--background-color);
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
}
#loadButton:hover { background: var(--yashi-cyan-glow); color: var(--background-color); transform: scale(1.02); }

.copyright-notice {
    font-size: 11px;
    color: var(--text-secondary-color);
    margin-top: 15px;
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.4;
    opacity: 0.7;
}

#error-message {
    color: #ff7b72;
    margin-top: 10px;
    min-height: 20px;
    font-weight: bold;
}

/* --- ESTILOS DO LOADER (TELA DE CARREGAMENTO) --- */
#login-loader {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

#loading-status {
    color: var(--text-color);
    font-size: 18px;
    font-weight: 500;
    margin-top: 10px;
}

#loading-details {
    color: var(--text-secondary-color);
    font-size: 14px;
    margin-top: 8px;
    height: 20px;
}

#login-loader .loader-note {
    font-size: 13px;
    color: #FFD700 !important; /* Cor amarela com !important para garantir a sobreposição */
    font-weight: 500;
    margin-top: 25px;
    max-width: 85%;
    line-height: 1.5;
    opacity: 0.9;
}

/* --- NOVOS ESTILOS DA PÁGINA HOME --- */
.home-body {
    background:
        repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.02) 1px,
            transparent 1px,
            transparent 30px
        ),
        linear-gradient(135deg, var(--home-bg-dark), var(--home-bg-light));
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 20px;
    box-sizing: border-box;
}

.home-container {
    width: 100%;
    max-width: 900px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.dashboard-layout {
    display: flex;
    gap: 20px;
    width: 100%;
    align-items: stretch;
}

.home-nav {
    flex: 3;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 20px;
}

.nav-button {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    padding: 20px;
    border-radius: 8px;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: transform 0.2s, background-color 0.2s;
    border: none;
    min-height: 150px;
}

.nav-button:hover {
    transform: scale(1.03);
    background-color: var(--yashi-cyan-glow);
}

.nav-button i {
    font-size: 40px;
    color: var(--background-color);
    transition: text-shadow 0.3s ease-in-out;
}

.nav-button:hover i {
    text-shadow: 0 0 12px rgba(13, 17, 23, 0.7);
}

.nav-button span {
    font-size: 18px;
    color: var(--background-color);
    font-weight: 500;
}

.actions-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
    justify-content: flex-start;
}

.small-actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 0;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background-color: transparent;
}

.small-actions-grid .action-button {
    border: none;
    border-radius: 8px;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    transition: transform 0.2s, background-color 0.2s;
    cursor: pointer;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 10px;
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    font-family: inherit; 
}

.small-actions-grid .action-button:hover {
    transform: scale(1.03);
    background-color: var(--yashi-cyan-glow);
}

.small-actions-grid .action-button i.fa-solid.fa-star {
    color: var(--background-color);
}

.small-actions-grid .action-button i {
    font-size: 28px;
    color: var(--background-color);
    transition: text-shadow 0.3s ease-in-out;
}

.small-actions-grid .action-button:hover i {
    text-shadow: 0 0 12px rgba(13, 17, 23, 0.7);
}

.small-actions-grid .action-button span {
    font-size: 0.8em; 
    color: var(--background-color);
    text-align: center;
    line-height: 1.2;
    font-weight: 500;
}

.action-button:not(.small-actions-grid .action-button) {
    background-color: transparent;
    border: 2px solid var(--yashi-cyan);
    color: var(--yashi-cyan);
    padding: 0 20px;
    border-radius: 8px;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 15px;
    font-weight: bold;
    transition: background-color 0.2s, color 0.2s;
    cursor: pointer;
    width: 100%;
    height: 60px;
    box-sizing: border-box;
}

.action-button:not(.small-actions-grid .action-button):hover {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
}
.action-button:not(.small-actions-grid .action-button):hover .sub-text {
    color: var(--background-color);
    opacity: 0.7;
}

.action-button:not(.small-actions-grid .action-button) i {
    font-size: 20px;
    width: 25px;
    text-align: center;
}

.action-button:not(.small-actions-grid .action-button) span {
    font-size: 16px;
    font-weight: 500;
}

/* Estilos para o botão de Sincronizar com subtítulo */
.sync-button .button-text-container {
    display: flex;
    flex-direction: column;
}
.sync-button .main-text {
    font-size: 17px;
    font-weight: 500;
    line-height: 1.2;
}
.sync-button .sub-text {
    font-size: 10px;
    font-weight: 400;
    color: var(--text-secondary-color);
    opacity: 0.9;
    transition: color 0.2s;
    white-space: nowrap;
    transform: scale(0.9);
    transform-origin: left;
}

.last-sync-display {
    display: none; /* Removido - agora está dentro do botão */
}

#sync-button i.fa-solid.fa-rotate-right {
    color: var(--yashi-cyan);
}

.home-logo-small {
    max-width: 160px;
    height: auto;
    margin-top: auto;
    align-self: center;
    opacity: 0.8;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
}

.home-logo-small:hover {
    opacity: 1;
    transform: scale(1.05);
    filter: drop-shadow(0 0 15px var(--yashi-cyan-glow));
}

.version-display {
    display: block;
    text-align: center;
    color: var(--text-secondary-color);
    font-size: 0.8rem;
    margin-top: 8px;
    opacity: 0.6;
}

.footer-notice {
    margin-top: 30px;
    font-size: 12px;
    color: var(--text-secondary-color);
    text-align: center;
    opacity: 0.6;
    max-width: 80%;
    line-height: 1.5;
}

#continue-watching-shelf {
    margin-top: 40px;
    margin-bottom: 20px;
}

.card { 
    position: relative;
    display: flex; 
    flex-direction: column; 
}

.card-clickable-area { 
    flex-grow: 1; 
    display: flex;
    flex-direction: column;
    position: relative; 
}

.card-content { 
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.progress-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 8px; 
    background-color: rgba(0, 0, 0, 0.7); 
    z-index: 2; 
}

.progress-bar {
    height: 100%;
    background-color: var(--yashi-cyan); 
    width: 0%; 
    transition: width 0.3s ease-in-out;
}

/* Responsividade */
@media (max-width: 768px) {
    .dashboard-layout {
        flex-direction: column;
    }
    .home-nav {
        order: 1;
        grid-template-columns: repeat(2, 1fr); 
        grid-template-rows: auto; 
    }
    .actions-column {
        order: 2;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }
    .small-actions-grid {
        grid-template-columns: repeat(2, 1fr); 
        width: 100%; 
        min-height: auto; 
        padding: 5px; 
    }
    .small-actions-grid .action-button {
        height: 70px; 
        font-size: 0.75rem; 
    }
    .small-actions-grid .action-button i {
        font-size: 22px; 
    }
    .small-actions-grid .action-button span { 
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
    }
    .action-button:not(.small-actions-grid .action-button) {
    }
}

/* EFEITO COMEMORATIVO PARA O BOTÃO DE NOVIDADES */
#novidades-button {
    border-color: var(--yashi-cyan-glow);
    box-shadow: 0 0 15px rgba(0, 240, 240, 0.5);
    animation: pulse-glow 2s infinite alternate;
}

@keyframes pulse-glow {
    from {
        box-shadow: 0 0 10px rgba(0, 240, 240, 0.4);
        border-color: var(--yashi-cyan);
    }
    to {
        box-shadow: 0 0 25px rgba(0, 240, 240, 0.8), 0 0 10px var(--yashi-cyan-glow);
        border-color: var(--yashi-cyan-glow);
    }
}

/* --- ESTILOS PARA REQUISITOS M3U --- */
.m3u-requirements {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--glass-border);
    text-align: left;
    font-size: 13px;
}
.m3u-requirements p {
    margin: 0 0 15px 0;
    color: var(--text-secondary-color);
    text-align: center;
    font-size: 13px;
    line-height: 1.4;
}
.m3u-requirements p a {
    color: var(--yashi-cyan);
    text-decoration: none;
    font-weight: 500;
}
.m3u-requirements p a:hover {
    text-decoration: underline;
}
.m3u-requirements ul {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    max-width: 320px;
}
.m3u-requirements li {
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.m3u-requirements .attr-name {
    color: var(--text-color);
    font-weight: 500;
}
.m3u-requirements .status-tag {
    font-weight: bold;
    font-size: 12px;
}
.m3u-requirements .status-tag.mandatory {
    color: #ff8a80; /* Vermelho claro */
}
.m3u-requirements .status-tag.recommended {
    color: #87CEFA; /* Azul claro */
}
.m3u-requirements .status-tag.not-required {
    color: var(--text-secondary-color); /* Branco/Cinza */
}
```


## favoritos\engine_favoritos.js
```javascript
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
                header.innerHTML = `
                    <div><i class="icon ${categoryInfo.icon}"></i> ${categoryInfo.title} <span>(${items.length})</span></div>`;

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
                    header.appendChild(sortButton);
                }
                
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
```


## favoritos\favoritos.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Itens Salvos</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />

    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="style_favoritos.css">
</head>
<body class="content-body">
    <main id="main-content"></main>

    <div id="player-view">
        <div id="player-container">
            <div class="player-header">
                <button class="back-from-player"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h2 id="player-title"></h2>
            </div>
            <video id="player" playsinline controls></video>
            <div id="autoplay-notice" class="autoplay-notice">Aguarde, a reprodução retomará automaticamente...</div>
            <button id="player-prev-button" class="player-nav-button prev" title="Anterior"><i class="fas fa-backward-step"></i></button>
            <button id="player-next-button" class="player-nav-button next" title="Próximo"><i class="fas fa-forward-step"></i></button>
        </div>
    </div>

    <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_favoritos.js"></script>
</body>
</html>
```


## favoritos\style_favoritos.css
```css
/* /FAVORITOS/style_favoritos.css */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --plyr-color-main: var(--yashi-cyan);
    --toast-error-bg: #2c1a1d;
    --toast-error-border: #dc3545;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}
html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR --- */
main {
    padding-top: 80px;
    margin-top: -80px;
}
.top-bar { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 10px 25px; 
    margin: -25px -25px 25px -25px;
    gap: 15px; 
    flex-wrap: wrap;
    background-color: var(--surface-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
}
.top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 12px; }
.top-bar-right { flex-grow: 1; justify-content: flex-end; }
.top-bar-logo { height: 35px; cursor: pointer; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }
#top-bar-back-button { display: none; }
.cover-size-buttons { display: flex; align-items: center; gap: 5px; background-color: var(--background-color); padding: 5px; border-radius: 8px; }
.size-label { font-size: 0.8rem; color: var(--text-secondary-color); margin-right: 5px; margin-left: 5px; font-weight: 500; }
.size-button { background: none; border: none; color: var(--text-secondary-color); width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.size-button:hover { color: var(--text-color); }
.size-button.active { background-color: var(--yashi-cyan); color: var(--background-color); }

/* --- NOVA SEÇÃO DE CATEGORIA --- */
.category-section {
    margin-bottom: 40px;
}
.category-title {
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--text-color);
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}
.category-title > div {
    display: flex;
    align-items: center;
    gap: 12px;
}
.category-title .icon {
    color: var(--yashi-cyan);
}
.category-title span {
    font-size: 1.1rem;
    color: var(--text-secondary-color);
}
.sort-button {
    background-color: transparent;
    border: 1px solid var(--yashi-cyan);
    color: var(--yashi-cyan);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    gap: 8px;
}
.sort-button:hover {
    background-color: rgba(0, 240, 240, 0.1);
    color: var(--yashi-cyan-glow);
    border-color: var(--yashi-cyan-glow);
    transform: scale(1.05);
}


/* --- GRID E CARDS --- */
.grid-container { display: grid; gap: 1.25rem; }
main[data-cover-size="micro"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
main[data-cover-size="small"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
main[data-cover-size="medium"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
main[data-cover-size="large"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }

.card { background-color: var(--surface-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; border: 1px solid transparent; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); }
.card:focus, .card:focus-visible { outline: none; box-shadow: 0 0 15px var(--yashi-cyan-glow); border-color: var(--yashi-cyan); }
.card-img { width: 100%; height: auto; aspect-ratio: 2 / 3; object-fit: cover; background-color: #21262d; }
.card.default-logo .card-img { object-fit: contain; padding: 1.5rem; }
.card-title { padding: 0.75rem; font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
main[data-cover-size="micro"] .card-title { font-size: 0.75rem; padding: 0.5rem; }
.favorite-button { position: absolute; top: 8px; right: 8px; background-color: rgba(13, 17, 23, 0.7); color: #E50914; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.favorite-button:hover { background-color: rgba(229, 9, 20, 0.2); }
.favorite-button.active { text-shadow: 0 0 8px rgba(229, 9, 20, 0.7); }
#no-results { text-align: center; color: var(--text-secondary-color); padding: 50px 0; font-size: 1.1rem; grid-column: 1 / -1; }

/* --- PLAYER E OUTROS ESTILOS GLOBAIS --- */
#player-view { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
#player-container { position: relative; width: 90%; max-width: 1200px; max-height: 80vh; height: auto; }
.player-header { display: flex; align-items: center; position: absolute; top: -45px; left: 0; gap: 15px; }
.back-from-player { background-color: var(--yashi-cyan); color: var(--background-color); border: 1px solid var(--yashi-cyan); padding: 8px 15px; border-radius: 8px; cursor: pointer; z-index: 1001; font-weight: bold; transition: all 0.2s ease-in-out; }
.back-from-player:hover { background-color: var(--yashi-cyan-glow); border-color: var(--yashi-cyan-glow); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
#player-title { font-size: 1.2rem; }
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }
.content-loader { grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; min-height: 50vh; }
#player-prev-button, #player-next-button { display: none !important; }

/* --- SISTEMA DE NOTIFICAÇÃO E MODAL --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; display: flex; align-items: center; gap: 10px; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }
.toast.success::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f058"; color: var(--toast-success-border); }
.toast.error { border-left-color: var(--toast-error-border); background-color: var(--toast-error-bg); }
.toast.error::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f06a"; color: var(--toast-error-border); }
#confirmation-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
#confirmation-modal-overlay.active { opacity: 1; visibility: visible; }
.confirmation-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; text-align: center; }
#confirmation-modal-overlay.active .confirmation-modal { transform: scale(1); }
.confirmation-modal-content { margin-bottom: 25px; }
.confirmation-modal-content p { margin: 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.confirmation-modal-buttons { display: flex; justify-content: center; gap: 15px; }
.modal-button { border: none; padding: 10px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.modal-button:hover { transform: translateY(-2px); }
.modal-button.confirm-button { background-color: var(--toast-error-border); color: #fff; }
.modal-button.cancel-button { background-color: var(--border-color); color: var(--text-color); }

/* --- ADICIONADO: ESTILOS DO MENU DE CATEGORIAS (SIDEBAR) --- */
#sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1999; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
#sidebar-overlay.active { opacity: 1; visibility: visible; }
#category-sidebar { position: fixed; top: 0; left: 0; width: 300px; max-width: 80%; height: 100%; background-color: var(--surface-color); border-right: 1px solid var(--border-color); z-index: 2000; transform: translateX(-100%); transition: transform 0.3s ease-in-out; display: flex; flex-direction: column; }
#category-sidebar.active { transform: translateX(0); }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.sidebar-header h3 { margin: 0; font-size: 1.1rem; }
#close-sidebar-button, .sidebar-back-button { background: none; border: none; color: var(--text-secondary-color); font-size: 20px; cursor: pointer; }
#category-list-container { padding: 10px; overflow-y: auto; flex-grow: 1; }
.sidebar-category-button { display: block; width: 100%; padding: 12px 15px; background: none; border: none; color: var(--text-secondary-color); text-align: left; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: background-color 0.2s, color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-category-button:hover { background-color: var(--border-color); color: var(--text-color); }
.sidebar-category-button.active { background-color: var(--yashi-cyan); color: var(--background-color); font-weight: bold; }
```


## filmes\engine_filmes.js
```javascript
// /FILMES/engine_filmes.js
// Motor Específico para o Módulo de Filmes

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.Yashi) {
        console.error("Motores globais (db.js, common.js) não encontrados.");
        alert("Erro crítico. Recarregue a página.");
        return;
    }

    const PAGE_TYPE = 'filmes';
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
    const coverSizeButtonsContainer = document.querySelector('.cover-size-buttons');

    let allMovies = [];
    let categoryCounts = {};
    const genreIcons = { 'Padrão': 'fa-solid fa-film', 'Ação': 'fa-solid fa-bomb', 'Comédia': 'fa-solid fa-face-laugh-beam', 'Terror': 'fa-solid fa-ghost', 'Ficção Científica': 'fa-solid fa-rocket', 'Animação': 'fa-solid fa-child', 'Aventura': 'fa-solid fa-map-signs', 'Crime': 'fa-solid fa-fingerprint', 'Documentário': 'fa-solid fa-camera-retro', 'Drama': 'fa-solid fa-masks-theater', 'Família': 'fa-solid fa-house-user', 'Fantasia': 'fa-solid fa-wand-magic-sparkles', 'Guerra': 'fa-solid fa-shield-halved', 'História': 'fa-solid fa-landmark', 'Suspense': 'fa-solid fa-user-secret', 'Romance': 'fa-solid fa-heart' };

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

        const filteredMovies = allMovies.filter(movie => normalizeText(movie.name).includes(query));
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
        renderGrid(filteredMovies);
    };

    function renderGrid(items, context = {}) {
        Yashi.lastRenderedData = items; 
        renderTarget.innerHTML = '';
        renderTarget.className = `grid-container`;
        
        if (!items || items.length === 0) {
            renderTarget.innerHTML = `<p id="no-results">Nenhum filme encontrado.</p>`;
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
        
        const displayItem = item;
        if (!displayItem.logo) {
            card.classList.add('default-logo');
        }

        const defaultImg = '../capa.png';
        const itemType = 'movie';
        const title = displayItem.name;
        const image = displayItem.logo || defaultImg;

        card.innerHTML = `
            <img loading="lazy" src="${image}" class="card-img" alt="${title}" onerror="this.onerror=null;this.src='${defaultImg}';">
            <div class="card-title">${title}</div>
            <div class="card-info-overlay">
                <div class="info-action">
                    <i class="fa-solid fa-info-circle"></i>
                    <span>Sinopse e Notas</span>
                </div>
            </div>
        `;

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

        card.addEventListener('click', () => {
            Yashi.showSynopsisModal(displayItem);
        });

        return card;
    }
    
    window.reRenderCurrentContent = () => {
        const currentState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
        if (currentState && currentState.renderFunc) {
            currentState.renderFunc();
        }
    };

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
        const moviesForCategory = category === 'Todos'
            ? allMovies
            : allMovies.filter(movie => (movie.groupTitle || 'Outros') === category);
        
        if(coverSizeButtonsContainer) coverSizeButtonsContainer.classList.remove('disabled');
        renderGrid(moviesForCategory);
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
        
        const STANDARD_GENRES = ['AÇÃO', 'COMÉDIA', 'TERROR', 'FICÇÃO CIENTÍFICA', 'ANIMAÇÃO', 'AVENTURA', 'CRIME', 'DRAMA', 'FAMÍLIA', 'FANTASIA', 'GUERRA', 'HISTÓRIA', 'SUSPENSE', 'ROMANCE'];

        const getCategoryPriority = (category) => {
            const normalizedCategory = category.toUpperCase();
            if (normalizedCategory.includes('2025') || normalizedCategory.includes('2024') || normalizedCategory.includes('2023')) return 1;
            if (STANDARD_GENRES.some(genre => normalizedCategory.includes(genre))) return 2;
            if (normalizedCategory.includes('ADULTO')) return 4;
            return 3;
        };

        shelfCategories.sort((a, b) => {
            const priorityA = getCategoryPriority(a);
            const priorityB = getCategoryPriority(b);
            if (priorityA !== priorityB) return priorityA - priorityB;
            if (priorityA === 1) {
                const yearA = parseInt(a.match(/202\d/)?.[0] || '0');
                const yearB = parseInt(b.match(/202\d/)?.[0] || '0');
                if (yearA !== yearB) return yearB - yearA;
            }
            return a.localeCompare(b);
        });

        const fragment = document.createDocumentFragment();
        shelfCategories.forEach(category => {
            const moviesForCategory = allMovies.filter(movie => (movie.groupTitle || 'Outros') === category);
            if (moviesForCategory.length === 0) return;

            const shelf = document.createElement('div');
            shelf.className = 'category-shelf';
            const iconClass = genreIcons[Object.keys(genreIcons).find(key => category.includes(key))] || genreIcons['Padrão'];
            const header = document.createElement('div');
            header.className = 'shelf-header';
            header.innerHTML = `
                <div class="shelf-title"><i class="icon ${iconClass}"></i><span>${category}</span></div>
                <button class="view-all-button" tabindex="0">VER TODOS (${moviesForCategory.length})</button>`;
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
            
            moviesForCategory.slice(0, 20).forEach(movie => carousel.appendChild(createCard(movie)));

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
    
    const loadAndProcessMovies = async () => {
        try {
            allMovies = await db.items.where('type').equals('movie').toArray();
            categoryCounts = {};
            allMovies.forEach(movie => {
                const category = movie.groupTitle || 'Outros';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            categoryCounts['Todos'] = allMovies.length;
            renderShelvesView();
            renderCategorySidebar();
        } catch (e) {
            renderTarget.innerHTML = '<p id="no-results">Falha ao carregar filmes do banco de dados.</p>';
        }
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

    loadAndProcessMovies();
});
```


## filmes\filmes.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Filmes</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />

    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="style_filmes.css">
</head>
<body class="content-body">
    <main id="main-content"></main>

    <div id="player-view">
        <div id="player-container">
            <div class="player-header">
                <button class="back-from-player"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h2 id="player-title"></h2>
            </div>
            <video id="player" playsinline controls></video>
            <button id="player-prev-button" class="player-nav-button prev" title="Anterior"><i class="fas fa-backward-step"></i></button>
            <button id="player-next-button" class="player-nav-button next" title="Próximo"><i class="fas fa-forward-step"></i></button>
        </div>
    </div>

    <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_filmes.js"></script>
</body>
</html>
```


## filmes\style_filmes.css
```css
/* /FILMES/style_filmes.css */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --plyr-color-main: var(--yashi-cyan);
    --plyr-range-track-background: #3a414a;
    --plyr-tooltip-background: var(--yashi-cyan);
    --plyr-tooltip-color: #0d1117;
    --toast-error-bg: #2c1a1d;
    --toast-error-border: #dc3545;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}

html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR E PESQUISA --- */
main {
    padding-top: 80px;
    margin-top: -80px;
}
.top-bar { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 10px 25px; 
    margin: -25px -25px 25px -25px;
    gap: 15px; 
    flex-wrap: wrap;
    background-color: var(--surface-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
}
.top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 12px; }
.top-bar-right { flex-grow: 1; justify-content: flex-end; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; flex-shrink: 0; padding: 0 12px; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }
.home-button.with-text { width: auto; padding: 0 15px; gap: 10px; }
.home-button.with-text span { font-size: 0.9rem; font-weight: 500; }
#top-bar-back-button { display: none; }
.cover-size-buttons { display: flex; align-items: center; gap: 5px; background-color: var(--background-color); padding: 5px; border-radius: 8px; }
.size-label { font-size: 0.8rem; color: var(--text-secondary-color); margin-right: 5px; margin-left: 5px; font-weight: 500; }
.size-button { background: none; border: none; color: var(--text-secondary-color); width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.size-button:hover { color: var(--text-color); }
.size-button.active { background-color: var(--yashi-cyan); color: var(--background-color); }
.cover-size-buttons.disabled { opacity: 0.4; pointer-events: none; }
.search-container { position: relative; display: flex; align-items: center; width: 100%; max-width: 350px; }
.search-input { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-color); padding: 10px 75px 10px 15px; border-radius: 8px; width: 100%; transition: border-color 0.2s; }
.search-input:focus { outline: none; border-color: var(--yashi-cyan); }
.search-button, .clear-search-button { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary-color); cursor: pointer; padding: 8px; }
.clear-search-button { right: 40px; }
.hidden { display: none; }

/* --- GRID E CARDS --- */
.grid-container { display: grid; gap: 1.25rem; }
main[data-cover-size="micro"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
main[data-cover-size="small"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
main[data-cover-size="medium"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
main[data-cover-size="large"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }

.card { background-color: var(--surface-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; border: 1px solid transparent; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); border-color: var(--border-color); }
.card:focus, .card:focus-visible { outline: none; transform: translateY(-5px); box-shadow: 0 0 15px var(--yashi-cyan-glow); border-color: var(--yashi-cyan); }
.card-img { width: 100%; height: auto; aspect-ratio: 2 / 3; object-fit: cover; background-color: #21262d; }
.card.default-logo .card-img { object-fit: contain; padding: 1.5rem; }
.card-title { padding: 0.75rem; font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }
main[data-cover-size="micro"] .card-title { font-size: 0.75rem; padding: 0.5rem; }
.favorite-button { position: absolute; top: 8px; right: 8px; background-color: rgba(13, 17, 23, 0.7); color: var(--text-secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.favorite-button:hover { background-color: rgba(0, 240, 240, 0.2); color: var(--yashi-cyan); }
.favorite-button.active { color: #FFD700; text-shadow: 0 0 8px #FFD700; }
.favorite-button { position: relative; }
.favorite-button::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%; left: 50%;
    transform: translateX(-50%);
    background-color: var(--yashi-cyan); color: var(--background-color);
    padding: 4px 8px; border-radius: 4px;
    font-size: 12px; font-weight: bold;
    white-space: nowrap;
    opacity: 0; visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    pointer-events: none;
    z-index: 10;
}
.favorite-button:hover::after { opacity: 1; visibility: visible; }

/* Barra de informações na capa */
.card-info-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%);
    color: var(--text-color);
    padding: 20px 10px 8px 10px;
    display: flex;
    justify-content: center; /* Centraliza o conteúdo */
    align-items: center;
    font-size: 0.85rem;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    cursor: pointer;
}
.card:hover .card-info-overlay { opacity: 1; }
.card-info-overlay .info-action {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* --- PLAYER DE VÍDEO --- */
#player-view { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
#player-container { position: relative; width: 90%; max-width: 1200px; max-height: 80vh; height: auto; }
.player-header { display: flex; align-items: center; position: absolute; top: -45px; left: 0; gap: 15px; }
.back-from-player { background-color: var(--yashi-cyan); color: var(--background-color); border: 1px solid var(--yashi-cyan); padding: 8px 15px; border-radius: 8px; cursor: pointer; z-index: 1001; font-weight: bold; transition: all 0.2s ease-in-out; }
.back-from-player:hover { background-color: var(--yashi-cyan-glow); border-color: var(--yashi-cyan-glow); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
#player-title { font-size: 1.2rem; color: var(--text-color); }
.player-nav-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.6); color: var(--text-secondary-color); border: 2px solid var(--border-color); border-radius: 50%; width: 50px; height: 50px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2147483647; transition: all 0.2s ease-in-out; opacity: 0; visibility: hidden; }
#player-container:hover .player-nav-button.visible { opacity: 0.7; }
.player-nav-button.visible { visibility: visible; }
.player-nav-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
.player-nav-button:disabled { opacity: 0.2 !important; cursor: not-allowed; background-color: rgba(13, 17, 23, 0.5); color: var(--text-secondary-color); border-color: var(--border-color); box-shadow: none; }
.player-nav-button.prev { left: 20px; }
.player-nav-button.next { right: 20px; }

/* --- ANIMAÇÃO DE CARREGAMENTO E MENSAGENS --- */
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }
.content-loader, #no-results { grid-column: 1 / -1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; color: var(--text-secondary-color); text-align: center; }

/* --- MENU DE CATEGORIAS (SIDEBAR) --- */
#sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1999; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
#sidebar-overlay.active { opacity: 1; visibility: visible; }
#category-sidebar { position: fixed; top: 0; left: 0; width: 300px; max-width: 80%; height: 100%; background-color: var(--surface-color); border-right: 1px solid var(--border-color); z-index: 2000; transform: translateX(-100%); transition: transform 0.3s ease-in-out; display: flex; flex-direction: column; }
#category-sidebar.active { transform: translateX(0); }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.sidebar-header h3 { margin: 0; font-size: 1.1rem; }
#close-sidebar-button, .sidebar-back-button { background: none; border: none; color: var(--text-secondary-color); font-size: 20px; cursor: pointer; }
#category-list-container { padding: 10px; overflow-y: auto; flex-grow: 1; }
.sidebar-category-button { display: block; width: 100%; padding: 12px 15px; background: none; border: none; color: var(--text-secondary-color); text-align: left; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: background-color 0.2s, color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-category-button:hover { background-color: var(--border-color); color: var(--text-color); }
.sidebar-category-button.active { background-color: var(--yashi-cyan); color: var(--background-color); font-weight: bold; }

/* --- SISTEMA DE NOTIFICAÇÃO E MODAIS --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; display: flex; align-items: center; gap: 10px; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }
.toast.success::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f058"; color: var(--toast-success-border); }
.toast.error { border-left-color: var(--toast-error-border); background-color: var(--toast-error-bg); }
.toast.error::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f06a"; color: var(--toast-error-border); }
#confirmation-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
#confirmation-modal-overlay.active { opacity: 1; visibility: visible; }
.confirmation-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; text-align: center; }
#confirmation-modal-overlay.active .confirmation-modal { transform: scale(1); }
.confirmation-modal-content { margin-bottom: 25px; }
.confirmation-modal-content p { margin: 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.confirmation-modal-buttons { display: flex; justify-content: center; gap: 15px; }
.modal-button.confirm-button { background-color: var(--yashi-cyan); color: var(--background-color); }
.modal-button.cancel-button { background-color: var(--border-color); color: var(--text-color); }

/* --- ESTILOS DE PRATELEIRAS (SHELVES) --- */
.shelf-container { display: flex; flex-direction: column; gap: 35px; }
.category-shelf { width: 100%; }
.shelf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 5px; }
.shelf-title { font-size: 1.3rem; font-weight: 500; color: var(--text-color); display: flex; align-items: center; gap: 12px; }
.shelf-title .icon { color: var(--yashi-cyan); font-size: 1.1rem; }
.view-all-button {
    background-color: transparent;
    border: 1px solid var(--yashi-cyan);
    color: var(--yashi-cyan);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    margin-left: 15px;
}
.view-all-button:hover {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    transform: scale(1.05);
}
.carousel-wrapper { position: relative; }
.item-carousel { display: flex; gap: 1.25rem; overflow-x: auto; padding: 5px; margin: -5px; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; scrollbar-width: none; }
.item-carousel::-webkit-scrollbar { display: none; }
.scroll-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.8); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; opacity: 0; visibility: hidden; }
.carousel-wrapper:hover .scroll-button { opacity: 0.8; visibility: visible; }
.scroll-button.prev { left: -20px; }
.scroll-button.next { right: -20px; }
.scroll-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); transform: translateY(-50%) scale(1.1); }
.scroll-button:disabled { opacity: 0 !important; visibility: hidden; cursor: not-allowed; }
.item-carousel .card { flex-shrink: 0; width: 150px; }
```


## home.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="fav.png" type="image/png">
    <title>YASHI PLAYER - Home</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/index_home.css">
</head>
<body class="home-body">
    <div class="home-container">
        <div class="dashboard-layout">
            <nav class="home-nav">
                <a href="canais/canais.html" class="nav-button">
                    <i class="fa-solid fa-tv"></i>
                    <span>Canais</span>
                </a>
                <a href="filmes/filmes.html" class="nav-button"> 
                    <i class="fa-solid fa-film"></i>
                    <span>Filmes</span>
                </a>
                <a href="series/series.html" class="nav-button">
                    <i class="fa-solid fa-video"></i>
                    <span>Séries</span>
                </a>
                <div class="small-actions-grid">
                    <a href="continue-assistindo/continue_assistindo.html" class="action-button small-action-button"> 
                        <i class="fa-solid fa-play-circle"></i>
                        <span>Continue Assistindo</span>
                    </a>
                    <a href="favoritos/favoritos.html" class="action-button small-action-button"> 
                        <i class="fa-solid fa-heart"></i>
                        <span>Salvos</span>
                    </a>
                    <a href="avaliados/avaliados.html" class="action-button small-action-button"> 
                        <i class="fa-solid fa-medal"></i>
                        <span>Avaliações</span>
                    </a>
                    <a href="backup/backup.html" class="action-button small-action-button"> 
                        <i class="fa-solid fa-cloud-arrow-down"></i>
                        <span>Backup & Restauração</span>
                    </a>
                </div>
            </nav>

            <aside class="actions-column">
                <button class="action-button sync-button" id="sync-button">
                    <i class="fa-solid fa-rotate-right"></i>
                    <div class="button-text-container">
                        <span class="main-text">Sincronizar</span>
                        <span class="sub-text" id="last-sync-time">Última: Carregando...</span>
                    </div>
                </button>
                <a href="pesquisa/search.html" class="action-button"> 
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span>Pesquisar</span>
                </a>
                <a href="novidades/novidades.html" class="action-button" id="novidades-button"> 
                    <i class="fa-solid fa-bullhorn"></i>
                    <span>Novidades v1.3!</span>
                </a>
                <img src="logo.png" alt="YASHI PLAYER Logo" class="home-logo-small">
            </aside>
        </div>
        
        <footer class="footer-notice">
            © 2025 YASHI PLAYER. Todos os direitos reservados. Este software é um reprodutor de mídia e não fornece conteúdo. O usuário é o único responsável pelas listas que utiliza, sendo obrigatório o uso de mídias licenciadas. A reprodução não autorizada deste player ou de seu design é proibida.
        </footer>
    </div>

    <script defer src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script defer src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script defer src="js/db.js"></script>
    <script defer src="js/common.js"></script>
    <script defer src="js/sync_v2.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Verifica se está logado
            db.config.get('m3u_source_type').then(sourceType => {
                if (!sourceType) {
                    window.location.href = 'index.html';
                }
            });

            // Lógica do botão de sincronização
            const syncButton = document.getElementById('sync-button');
            if (syncButton) {
                syncButton.addEventListener('click', () => {
                    if (window.YashiSync && typeof window.YashiSync.run === 'function') {
                        window.YashiSync.run(syncButton);
                    } else {
                        console.error('Falha Crítica: YashiSync.js não foi carregado corretamente.');
                    }
                });
            }

            // Mostra a última data de sincronização
            const lastSyncTimeElement = document.getElementById('last-sync-time');
            if (lastSyncTimeElement) {
                db.config.get('last_successful_sync').then(result => {
                    if (result && result.value) {
                        const date = new Date(result.value);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const hour = date.getHours().toString().padStart(2, '0');
                        const minute = date.getMinutes().toString().padStart(2, '0');
                        const formattedDate = `${hour}:${minute} - ${day}/${month}`;
                        lastSyncTimeElement.textContent = `Última: ${formattedDate}`;
                    } else {
                        lastSyncTimeElement.textContent = 'Nenhuma sincronização feita';
                    }
                }).catch(error => {
                    console.error("Erro ao buscar data de sincronização:", error);
                    lastSyncTimeElement.textContent = 'Última: Erro';
                });
            }
        });
    </script>
</body>
</html>
```


## index.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="fav.png" type="image/png">
    <title>YASHI PLAYER - Login</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/index_home.css">
</head>
<body class="login-body">
    <div class="login-container">
        <div id="login-form">
            <img src="logo.png" alt="YASHI PLAYER Logo" class="login-logo">
            <p>Insira a URL da sua lista M3U para começar.</p>
            <input type="text" id="urlInput" placeholder="Cole seu link aqui (verifique http ou https)">
            
            <button id="loadButton">Carregar Player</button>

            <div class="m3u-requirements">
                <p>Para a melhor experiência, sua lista deve conter os atributos abaixo. Consulte seu provedor ou <a href="contato/contato.html">compre uma lista com nossos parceiros</a>.</p>
                <ul>
                    <li><span class="attr-name">Título do Conteúdo</span> <span class="status-tag mandatory">[Obrigatório]</span></li>
                    <li><span class="attr-name">group-title</span> <span class="status-tag mandatory">[Obrigatório]</span></li>
                    <li><span class="attr-name">tvg-logo</span> <span class="status-tag recommended">[Recomendado]</span></li>
                </ul>
            </div>

            <div class="copyright-notice">
                Este aplicativo é um reprodutor de mídia e não fornece ou armazena conteúdo. Todo o conteúdo é carregado a partir das listas fornecidas pelo próprio usuário.
            </div>
            <div id="error-message"></div>
        </div>
        <div id="login-loader">
            <div class="loading-yashi">
                <span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span>
            </div>
            <div id="loading-status">Iniciando...</div>
            <div id="loading-details"></div>
            <p class="loader-note">Estamos preparando tudo para você. Este processo pode levar alguns segundos, mas garantirá que seu conteúdo carregue muito mais rápido depois. Vale a pena esperar!</p>
        </div>
    </div>
    
    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="js/db.js"></script>
    <script src="js/sync_v2.js"></script>
    <script src="js/login.js"></script>
</body>
</html>
```


## js\common.js
```javascript
// js/common.js - v1.5.0 - Refinamento UI: Favoritos -> Salvos
const Yashi = {
    elements: {},
    player: null,
    hls: null,
    navigationStack: [],
    lastRenderedData: [], 
    currentCoverSize: localStorage.getItem('yashi_cover_size') || 'medium',
    currentPlaylist: [],
    currentPlaylistIndex: -1,
    currentPlayingItem: null,
    countdownInterval: null,
    tmdbApiKey: 'f98c1fbdb195ab6e914a3a1a8e184b4b', // Sua chave de API TMDb

    initCommon(pageType) {
        this.elements.mainContent = document.getElementById('main-content');
        this.elements.playerView = document.getElementById('player-view');
        this.elements.playerElement = document.getElementById('player');
        this.elements.playerBackButton = document.querySelector('.back-from-player');
        this.elements.playerTitle = document.getElementById('player-title');
        this.elements.playerPrevButton = document.getElementById('player-prev-button');
        this.elements.playerNextButton = document.getElementById('player-next-button');

        if (!this.player) {
            const aspectRatioMenuButton = `
            <button class="plyr__control" id="aspect-ratio-menu-btn" title="Formato da Tela">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <path d="M3 9h18M9 21V9"></path>
                </svg>
            </button>`;

            this.player = new Plyr(this.elements.playerElement, {
                controls: [
                    'play-large', 'rewind', 'play', 'fast-forward', 'progress', 
                    'current-time', 'mute', 'volume', 'captions', 'settings', 
                    aspectRatioMenuButton, 'pip', 'airplay', 'fullscreen'
                ],
                seekTime: 30
            });
            
            this.player.on('ready', event => {
                const playerInstance = event.detail.plyr;
                const playerContainer = playerInstance.elements.container;
                const menuButton = document.getElementById('aspect-ratio-menu-btn');
                
                if (menuButton) {
                    const savedRatio = localStorage.getItem('yashi_aspect_ratio') || 'padrão';
                    playerContainer.setAttribute('data-aspect-ratio', savedRatio);

                    const menu = document.createElement('div');
                    menu.id = 'aspect-ratio-menu';
                    menu.classList.add('hidden');
                    
                    const ratios = {
                        'padrão': 'Padrão (Original)',
                        'preencher': 'Preencher Tela',
                        'esticado': 'Forçar Esticado'
                    };

                    Object.keys(ratios).forEach(key => {
                        const optionButton = document.createElement('button');
                        optionButton.dataset.ratio = key;
                        optionButton.textContent = ratios[key];
                        if (key === savedRatio) {
                            optionButton.classList.add('active');
                        }
                        optionButton.addEventListener('click', () => {
                            playerContainer.setAttribute('data-aspect-ratio', key);
                            localStorage.setItem('yashi_aspect_ratio', key);
                            menu.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                            optionButton.classList.add('active');
                            menu.classList.add('hidden');
                        });
                        menu.appendChild(optionButton);
                    });
                    
                    playerContainer.appendChild(menu);

                    menuButton.addEventListener('click', () => {
                        menu.classList.toggle('hidden');
                    });
                }
            });

            this.hls = new Hls();
            
            this.player.on('timeupdate', () => this.savePlaybackProgress());
            this.player.on('pause', () => this.savePlaybackProgress());
            window.addEventListener('beforeunload', () => this.savePlaybackProgress());

            this.player.on('ended', () => {
                const isLastItem = this.currentPlaylistIndex >= this.currentPlaylist.length - 1;
                if (!isLastItem) {
                    this.playFromPlaylist('next');
                } else {
                    this.clearPlaybackProgress();
                }
            });
        }

        if (this.elements.playerBackButton) {
            this.elements.playerBackButton.addEventListener('click', () => this.stopPlayer());
        }

        if (pageType && !['search', 'backup', 'novidades', 'contato'].includes(pageType)) this.injectTopBarAndSidebar();
        
        this.injectConfirmationModal();
        this.injectSynopsisModal(); 
        
        if (this.elements.playerPrevButton) this.elements.playerPrevButton.addEventListener('click', () => this.playFromPlaylist('prev'));
        if (this.elements.playerNextButton) this.elements.playerNextButton.addEventListener('click', () => this.playFromPlaylist('next'));

        if (pageType && !['search', 'backup', 'novidades', 'contato'].includes(pageType)) {
            this.elements.gridContainer = document.getElementById('grid-container');
            this.elements.searchInput = document.getElementById('search-input');
            this.elements.searchButton = document.getElementById('search-button');
            this.elements.clearSearchButton = document.getElementById('clear-search-button');
            this.elements.topBarBackButton = document.getElementById('top-bar-back-button');
            this.elements.categoryMenuButton = document.getElementById('category-menu-button');
            this.elements.categorySidebar = document.getElementById('category-sidebar');
            this.elements.sidebarOverlay = document.getElementById('sidebar-overlay');
            this.elements.closeSidebarButton = document.getElementById('close-sidebar-button');
            this.elements.categoryListContainer = document.getElementById('category-list-container');
            
            this.elements.coverSizeButtons = document.querySelectorAll('.size-button');
            this.elements.coverSizeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.updateCoverSize(button.dataset.size);
                });
            });
        }
        
        this.updateCoverSize(this.currentCoverSize);
        this.initKeyboardNavigation();
    },
    
    updateCoverSize(size) {
        if (!size) return;
        this.currentCoverSize = size;
        localStorage.setItem('yashi_cover_size', this.currentCoverSize);

        const mainElement = this.elements.mainContent || document.querySelector('main');
        if (mainElement) {
            mainElement.setAttribute('data-cover-size', this.currentCoverSize);
        }
        
        const buttons = this.elements.coverSizeButtons || document.querySelectorAll('.size-button');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === this.currentCoverSize);
        });
    },

    updateBackButton() {
        if (!this.elements.topBarBackButton) return;
        this.elements.topBarBackButton.style.display = this.navigationStack.length > 1 ? 'flex' : 'none';
        
        const newBackButton = this.elements.topBarBackButton.cloneNode(true);
        this.elements.topBarBackButton.parentNode.replaceChild(newBackButton, this.elements.topBarBackButton);
        this.elements.topBarBackButton = newBackButton;
    
        this.elements.topBarBackButton.onclick = () => {
            if (Yashi.navigationStack.length > 1) {
                Yashi.navigationStack.pop();
                const lastState = Yashi.navigationStack[Yashi.navigationStack.length - 1];
    
                if (lastState && lastState.type === 'external') {
                    const origin = sessionStorage.getItem('yashi_nav_origin');
                    sessionStorage.removeItem('yashi_nav_origin');
                    if (origin === 'pesquisa') {
                        window.location.href = '../pesquisa/search.html';
                    } else if (origin === 'favoritos') {
                        window.location.href = '../favoritos/favoritos.html';
                    } else {
                        window.location.href = '../home.html';
                    }
                } else if (lastState && typeof lastState.renderFunc === 'function') {
                    lastState.renderFunc();
                } else {
                    window.location.href = '../home.html';
                }
            } else {
                 window.location.href = '../home.html';
            }
        };
    },
    
    injectTopBarAndSidebar() {
        const template = `
            <div class="top-bar">
                <div class="top-bar-left">
                    <img src="../logo.png" alt="YASHI PLAYER Logo" class="top-bar-logo" onclick="window.location.href='../home.html'" title="Ir para Home">
                    <button class="home-button" onclick="window.location.href='../home.html'" title="Ir para Home" tabindex="0"><i class="fas fa-home"></i></button>
                    <button id="top-bar-back-button" class="home-button" title="Voltar" tabindex="0" style="display: none;"><i class="fas fa-arrow-left"></i></button>
                    <button id="category-menu-button" class="home-button with-text" title="Categorias" tabindex="0"><i class="fas fa-bars"></i><span>Categorias</span></button>
                    <div class="cover-size-buttons">
                        <span class="size-label">Tamanho:</span>
                        <button class="size-button" data-size="micro" title="Capas Micro"><i class="fa-solid fa-table-list"></i></button>
                        <button class="size-button" data-size="small" title="Capas Pequenas"><i class="fa-solid fa-grip"></i></button>
                        <button class="size-button" data-size="medium" title="Capas Médias"><i class="fa-solid fa-table-cells"></i></button>
                        <button class="size-button" data-size="large" title="Capas Grandes"><i class="fa-solid fa-table-cells-large"></i></button>
                    </div>
                </div>
                <div class="top-bar-right">
                    <div class="search-container">
                        <input type="text" id="search-input" placeholder="Pesquisar..." class="search-input">
                        <button id="clear-search-button" class="clear-search-button hidden" title="Limpar"><i class="fas fa-times"></i></button>
                        <button id="search-button" class="search-button" title="Pesquisar" tabindex="0"><i class="fas fa-search"></i></button>
                    </div>
                </div>
            </div>
            <div id="sidebar-overlay"></div>
            <nav id="category-sidebar">
                <div class="sidebar-header"><h3>Categorias</h3><button id="close-sidebar-button" title="Fechar" tabindex="0"><i class="fas fa-times"></i></button></div>
                <div id="category-list-container"></div>
            </nav>
            <div id="grid-container"></div>`;
        this.elements.mainContent.innerHTML = template;
    },

    injectConfirmationModal() {
        if (document.getElementById('confirmation-modal-overlay')) return;
        const modalHTML = `
            <div id="confirmation-modal-overlay">
                <div class="confirmation-modal">
                    <div class="confirmation-modal-content"></div>
                    <div class="confirmation-modal-buttons">
                        <button class="modal-button cancel-button">Cancelar</button>
                        <button class="modal-button confirm-button">Confirmar</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    injectSynopsisModal() {
        if (document.getElementById('synopsis-modal-overlay')) return;
        const modalHTML = `
            <div id="synopsis-modal-overlay">
                <div class="synopsis-modal">
                    <button class="synopsis-close-button">&times;</button>
                    <div class="synopsis-poster">
                        <img id="synopsis-poster-img" src="../capa.png" alt="Pôster">
                    </div>
                    <div id="synopsis-details-content" class="synopsis-details"></div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('synopsis-modal-overlay');
        const closeBtn = overlay.querySelector('.synopsis-close-button');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeSynopsisModal();
        });
        closeBtn.addEventListener('click', () => this.closeSynopsisModal());
    },

    initKeyboardNavigation() { /* ...código sem alterações... */ },
    
    hideNotice() {
        const notice = document.getElementById('autoplay-notice');
        if (notice) notice.classList.remove('visible');
    },

    async playContent(item, startTime = 0) {
        if (!item || !item.url) {
            this.showToast("Conteúdo ou URL inválido.", "error");
            return;
        }

        const lastPlayed = await db.playbackHistory.get(item.name);
        this.currentPlaylist = this.lastRenderedData || [item];
        this.currentPlaylistIndex = this.currentPlaylist.findIndex(p => p.name === item.name);
        this.currentPlayingItem = item;

        this.elements.playerView.style.display = 'flex';
        document.body.classList.add('player-active');
        if (this.elements.playerTitle) this.elements.playerTitle.textContent = item.name;

        const videoElement = this.elements.playerElement;
        const sourceUrl = item.url;
        
        this.player.stop();
        if (this.hls && this.hls.destroy) {
            this.hls.destroy();
        }

        if (sourceUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                this.hls = new Hls();
                this.hls.loadSource(sourceUrl);
                this.hls.attachMedia(videoElement);
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.player.play();
                });
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                videoElement.src = sourceUrl;
            } else {
                this.showToast("Seu navegador não suporta a reprodução deste conteúdo HLS.", "error");
            }
        } else {
            videoElement.src = sourceUrl;
        }

        this.player.once('canplay', () => {
            const timeToSeek = startTime || (lastPlayed ? lastPlayed.progress : 0);
            if (timeToSeek > 0 && timeToSeek < this.player.duration - 10) {
                this.player.currentTime = timeToSeek;
                 const notice = document.getElementById('autoplay-notice');
                if (notice) {
                    notice.classList.add('visible');
                    setTimeout(() => this.hideNotice(), 3000);
                }
            }
            this.player.play();
        });

        this.updatePlayerNavButtons();
    },

    stopPlayer() {
        this.savePlaybackProgress();
        if (this.player) {
            this.player.stop();
            this.elements.playerElement.src = '';
        }
        if (this.hls) {
            this.hls.destroy();
        }
        this.elements.playerView.style.display = 'none';
        document.body.classList.remove('player-active');
        this.currentPlayingItem = null;
        this.currentPlaylist = [];
        this.currentPlaylistIndex = -1;
    },
    
    updatePlayerNavButtons() {
        if (!this.elements.playerPrevButton || !this.elements.playerNextButton) return;

        const hasPrev = this.currentPlaylistIndex > 0;
        const hasNext = this.currentPlaylistIndex < this.currentPlaylist.length - 1;

        this.elements.playerPrevButton.disabled = !hasPrev;
        this.elements.playerPrevButton.classList.toggle('visible', hasPrev);
        
        this.elements.playerNextButton.disabled = !hasNext;
        this.elements.playerNextButton.classList.toggle('visible', hasNext);
    },

    playFromPlaylist(direction) {
        let nextIndex = this.currentPlaylistIndex;
        if (direction === 'next' && this.currentPlaylistIndex < this.currentPlaylist.length - 1) {
            nextIndex++;
        } else if (direction === 'prev' && this.currentPlaylistIndex > 0) {
            nextIndex--;
        }

        if (nextIndex !== this.currentPlaylistIndex) {
            this.currentPlaylistIndex = nextIndex;
            const nextItem = this.currentPlaylist[this.currentPlaylistIndex];
            if (nextItem) {
                this.playContent(nextItem, 0);
            }
        }
    },
    
    savePlaybackProgress: async function() {
        if (!this.currentPlayingItem || !this.player) return;

        const itemId = this.currentPlayingItem.name;
        const itemType = this.currentPlayingItem.type;
        const progress = this.player.currentTime;
        const duration = this.player.duration;

        if (itemType === 'channel') {
            await db.playbackHistory.put({
                itemId: itemId, progress: null, duration: null, timestamp: Date.now(),
                playbackData: this.currentPlayingItem, type: 'channel'
            });
            return;
        }

        if (progress > 5 && duration > 0 && progress / duration < 0.95) {
            await db.playbackHistory.put({
                itemId: itemId, progress: progress, duration: duration, timestamp: Date.now(),
                playbackData: this.currentPlayingItem, type: this.currentPlayingItem.seasons ? 'series' : (this.currentPlayingItem.type || 'movie')
            });
        } else if (duration > 0 && progress / duration >= 0.95) {
            await this.clearPlaybackProgress();
        }
    },
    
    clearPlaybackProgress: async function() {
        if (this.currentPlayingItem) {
            await db.playbackHistory.delete(this.currentPlayingItem.name);
        }
    },

    showToast(message, type = 'success', duration = 3000) {
        if (!document.getElementById('toast-container')) {
            document.body.insertAdjacentHTML('beforeend', '<div id="toast-container"></div>');
        }
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    },

    showConfirmationModal(message, onConfirm, options = {}) {
        const { confirmText = 'Confirmar', cancelText = 'Cancelar' } = options;
        const overlay = document.getElementById('confirmation-modal-overlay');
        const content = overlay.querySelector('.confirmation-modal-content');
        const confirmBtn = overlay.querySelector('.confirm-button');
        const cancelBtn = overlay.querySelector('.cancel-button');

        content.innerHTML = message;
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        overlay.classList.add('active');

        const confirmHandler = () => { onConfirm(); closeHandler(); };
        const closeHandler = () => {
            overlay.classList.remove('active');
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', closeHandler);
            overlay.removeEventListener('click', overlayCloseHandler);
        };
        const overlayCloseHandler = (e) => { if (e.target === overlay) closeHandler(); };

        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', closeHandler);
        overlay.addEventListener('click', overlayCloseHandler);
    },
    
    closeSynopsisModal() {
        const overlay = document.getElementById('synopsis-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    async showSynopsisModal(item, onContinueCallback) {
        const overlay = document.getElementById('synopsis-modal-overlay');
        if (!overlay) return;

        const posterImg = document.getElementById('synopsis-poster-img');
        const detailsContainer = document.getElementById('synopsis-details-content');
        
        overlay.classList.add('active');
        detailsContainer.innerHTML = `
            <div class="synopsis-loading">
                <div class="loading-yashi" style="font-size: 30px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div>
                <p>Buscando informações...</p>
            </div>`;
        posterImg.src = item.logo || '../capa.png';

        try {
            if (!item || !item.name) throw new Error("Dados do item são inválidos.");
            
            const cached = await db.metadataCache.get(item.name);
            if (cached) {
                this.renderSynopsisContent(detailsContainer, cached, item, onContinueCallback);
                posterImg.src = cached.posterUrl || item.logo || '../capa.png';
                return;
            }

            const itemType = item.seasons ? 'tv' : 'movie';
            const cleanName = item.name.replace(/\(\d{4}\)/, '').trim();
            const url = `https://api.themoviedb.org/3/search/${itemType}?api_key=${this.tmdbApiKey}&language=pt-BR&query=${encodeURIComponent(cleanName)}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha na comunicação com o servidor de metadados.');
            
            const data = await response.json();
            if (!data.results || data.results.length === 0) throw new Error('Nenhuma informação encontrada para este título.');
            
            const result = data.results[0];
            const posterUrl = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : (item.logo || '../capa.png');
            const year = result.release_date || result.first_air_date ? new Date(result.release_date || result.first_air_date).getFullYear() : 'N/A';
            const rating = result.vote_average ? result.vote_average.toFixed(1) : 'N/A';
            
            const metadata = {
                name: item.name,
                title: result.title || result.name,
                synopsis: result.overview || 'Sinopse não disponível.',
                posterUrl: posterUrl,
                year: year,
                rating: rating
            };

            await db.metadataCache.put(metadata);
            this.renderSynopsisContent(detailsContainer, metadata, item, onContinueCallback);
            posterImg.src = metadata.posterUrl;

        } catch (error) {
            detailsContainer.innerHTML = `
                <div class="synopsis-error">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p><strong>Erro!</strong></p>
                    <p>${error.message}</p>
                    <div class="synopsis-actions"></div>
                </div>`;
            this.renderSynopsisContent(detailsContainer, null, item, onContinueCallback, true);
        }
    },

    renderSynopsisContent(container, data, originalItem, onContinueCallback, isError = false) {
        let actionButtonHTML = '';

        if (originalItem.seasons && typeof onContinueCallback === 'function') {
            actionButtonHTML = `<button id="synopsis-action-btn" class="modal-action-button play"><i class="fas fa-list-ul"></i><span>Ver Episódios</span></button>`;
        } else if (originalItem.url) {
            actionButtonHTML = `<button id="synopsis-action-btn" class="modal-action-button play"><i class="fas fa-play"></i><span>Assistir</span></button>`;
        }

        const favButtonHTML = `<button id="synopsis-fav-btn" class="modal-action-button favorite"><i class="far fa-heart"></i><span>Salvar</span></button>`;

        const ratingSectionHTML = `
            <div class="synopsis-rating-container">
                <div class="rating-display-slider">
                    <span>Sua Nota:</span>
                    <span id="user-rating-value">Nenhuma</span>
                </div>
                <div class="rating-slider-wrapper">
                    <input type="range" id="rating-slider" min="0" max="10" step="1" value="0">
                    <button id="clear-rating-btn" title="Remover Avaliação">&times;</button>
                </div>
            </div>`;

        if (isError) {
            container.innerHTML = `
                <div class="synopsis-actions">${actionButtonHTML}${favButtonHTML}</div>
                ${ratingSectionHTML}`;
        } else {
            container.innerHTML = `
                <h2 class="synopsis-title">${data.title}</h2>
                <div class="synopsis-meta">
                    <span>${data.year}</span> &bull; 
                    <span><i class="fas fa-star"></i> <span class="rating">${data.rating}</span>/10</span>
                </div>
                <h3 class="synopsis-overview-title">Sinopse</h3>
                <p class="synopsis-overview">${data.synopsis || 'Sinopse não disponível.'}</p>
                <div class="synopsis-actions">
                    ${actionButtonHTML}
                    ${favButtonHTML}
                </div>
                ${ratingSectionHTML}`;
        }
        
        const actionBtn = container.querySelector('#synopsis-action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                this.closeSynopsisModal();
                if (originalItem.seasons && typeof onContinueCallback === 'function') { onContinueCallback(); } 
                else if (originalItem.url) { this.playContent(originalItem); }
            });
        }

        const favBtn = container.querySelector('#synopsis-fav-btn');
        if (favBtn) {
            const favIcon = favBtn.querySelector('i');
            const favText = favBtn.querySelector('span');
            const updateFavButtonState = (isFavorited) => {
                favIcon.className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
                favText.textContent = isFavorited ? 'Salvo' : 'Salvar';
                favBtn.classList.toggle('active', isFavorited);
            };
            db.favorites.get(originalItem.name).then(fav => updateFavButtonState(!!fav));
            favBtn.addEventListener('click', async () => {
                const isFavorited = favBtn.classList.contains('active');
                const itemType = originalItem.seasons ? 'series' : (originalItem.type || 'movie');
                try {
                    if (isFavorited) { await db.favorites.delete(originalItem.name); } 
                    else { await db.favorites.put({ name: originalItem.name, type: itemType, data: originalItem }); }
                    updateFavButtonState(!isFavorited);
                } catch (error) { this.showToast('Erro ao atualizar itens salvos.', 'error'); }
            });
        }

        const ratingSlider = container.querySelector('#rating-slider');
        const ratingValueDisplay = container.querySelector('#user-rating-value');
        const clearRatingBtn = container.querySelector('#clear-rating-btn');
        
        const updateSliderVisuals = (value) => {
            const numValue = Number(value);
            if (numValue === 0) {
                ratingValueDisplay.textContent = 'Nenhuma';
            } else {
                ratingValueDisplay.innerHTML = `${numValue} <i class="fa-solid fa-heart"></i>`;
            }
            ratingSlider.value = numValue;
            ratingSlider.style.setProperty('--slider-progress', `${(numValue / 10) * 100}%`);
        };

        db.movieRatings.get(originalItem.name).then(rating => {
            updateSliderVisuals(rating ? rating.rating : 0);
        });

        ratingSlider.addEventListener('input', () => {
            updateSliderVisuals(ratingSlider.value);
        });

        ratingSlider.addEventListener('change', async () => {
            const ratingValue = Number(ratingSlider.value);
            try {
                if (ratingValue === 0) {
                    await db.movieRatings.delete(originalItem.name);
                    Yashi.showToast('Avaliação removida.', 'success');
                } else {
                    await db.movieRatings.put({ itemId: originalItem.name, rating: ratingValue, timestamp: Date.now() });
                    Yashi.showToast(`Filme avaliado com nota ${ratingValue}!`, 'success');
                }
            } catch (error) {
                Yashi.showToast('Erro ao salvar sua avaliação.', 'error');
            }
        });

        clearRatingBtn.addEventListener('click', () => {
            ratingSlider.value = 0;
            ratingSlider.dispatchEvent(new Event('change'));
            updateSliderVisuals(0);
        });
    }
};

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && window.Yashi) {
        Yashi.savePlaybackProgress();
    }
});

window.Yashi = Yashi;
```


## js\db.js
```javascript
// js/db.js

const db = new Dexie('YashiPlayerDatabase');

// VERSÃO 8: Adiciona a tabela movieRatings para o sistema de avaliação v1.4
db.version(8).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
    config: '&key',
    searchHistory: '&itemId, timestamp',
    metadataCache: '&name',
    movieRatings: '&itemId, rating' // Chave: nome do item. Índice: nota para ordenação.
});

// VERSÃO INCREMENTADA PARA 7 para adicionar a tabela de cache de metadados (sinopse)
db.version(7).stores({
    // Tabelas existentes
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
    config: '&key',
    searchHistory: '&itemId, timestamp',

    // NOVA TABELA para o cache de sinopses e pôsteres
    // '&name' é a chave primária (o título do filme/série)
    metadataCache: '&name'
});

db.version(6).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
    config: '&key',
    searchHistory: '&itemId, timestamp'
});

db.version(5).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp',
    config: '&key'
});

// Mantém a compatibilidade com a versão 4
db.version(4).stores({
    items: '++id, name, type', 
    series: '&name',
    favorites: '&name, type',
    playbackHistory: '&itemId, type, seriesName, timestamp'
});


// Torna a variável 'db' acessível em outros scripts.
window.db = db;
```


## js\login.js
```javascript
// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Valida se as dependências essenciais (Dexie, YashiSync) foram carregadas.
    if (typeof Dexie === 'undefined' || typeof YashiSync === 'undefined') {
        handleError('Erro crítico de configuração. Por favor, recarregue a página.');
        return;
    }

    // Elementos da interface de login
    const urlInput = document.getElementById('urlInput');
    const loadButton = document.getElementById('loadButton');
    const errorMessage = document.getElementById('error-message');
    const loginForm = document.getElementById('login-form');
    const loginLoader = document.getElementById('login-loader');
    const loadingStatus = document.getElementById('loading-status');
    const loadingDetails = document.getElementById('loading-details');

    // Função de callback para atualizar a UI durante o carregamento
    const onProgressCallback = (progress) => {
        if (progress.status) {
            loadingStatus.textContent = progress.status;
        }
        if (progress.details) {
            loadingDetails.textContent = progress.details;
        }
    };
    
    // Adiciona o evento de clique ao botão principal
    loadButton.addEventListener('click', () => {
        const url = urlInput.value.trim();
        
        // Valida se a URL foi inserida
        if (!url) {
            errorMessage.textContent = 'Por favor, insira a URL da sua lista M3U.';
            return;
        }
        
        // Esconde o formulário e exibe o loader
        loginForm.style.display = 'none';
        loginLoader.style.display = 'flex';
        
        // Inicia o processo de carregamento a partir da URL
        loadFromUrl(url);
    });

    // Salva a fonte de dados (URL) no banco de dados
    const saveSourceToDb = async (type, data) => {
        await db.config.put({ key: 'm3u_source_type', value: type });
        await db.config.put({ key: 'm3u_source_data', value: data });
    };

    // Função para carregar e processar a lista a partir de uma URL
    const loadFromUrl = async (url) => {
        try {
            onProgressCallback({ status: 'Buscando lista da URL...', details: 'Conectando...' });
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
            const m3uText = await response.text();
            
            onProgressCallback({ status: 'Configurando...', details: 'Salvando fonte de dados...' });
            await saveSourceToDb('url', url); 
            
            await YashiSync.processAndStoreM3U(m3uText, onProgressCallback); 
            
            onProgressCallback({ status: 'Tudo pronto!', details: 'Redirecionando...' });
            window.location.href = 'home.html';
        } catch (error) {
            handleError(`Falha ao carregar da URL. (Erro: ${error.message})`);
        }
    };
    
    // Lida com erros, exibindo uma mensagem e revertendo a UI
    const handleError = async (message) => {
        loginForm.style.display = 'block';
        loginLoader.style.display = 'none';
        errorMessage.textContent = message;
        // Limpa a configuração da fonte em caso de erro
        await db.config.delete('m3u_source_type');
        await db.config.delete('m3u_source_data');
    };
    
    // Define o estado inicial do loader
    onProgressCallback({ status: 'Iniciando...', details: '' });
});
```


## js\sync_v2.js
```javascript
// js/sync_v2.js (VERSÃO COM REGRA DE DUPLICATAS APENAS PARA FILMES E SÉRIES)

window.YashiSync = {
    run: async function(buttonElement, onProgress) {
        const onProgressHandler = onProgress || (() => {});
        
        const sourceTypeObj = await db.config.get('m3u_source_type');
        const sourceDataObj = await db.config.get('m3u_source_data');
        
        const sourceType = sourceTypeObj ? sourceTypeObj.value : null;
        const sourceData = sourceDataObj ? sourceDataObj.value : null;

        if (!sourceType || !sourceData) {
            Yashi.showToast("Fonte da lista não encontrada. Faça o login novamente.", "error");
            return;
        }

        const mainText = buttonElement.querySelector('.main-text');
        const subText = buttonElement.querySelector('.sub-text');
        const icon = buttonElement.querySelector('i');
        const originalText = "Sincronizar";
        const originalIconClass = "fa-solid fa-rotate-right";

        buttonElement.disabled = true;
        mainText.textContent = 'Sincronizando...';
        if (subText) subText.style.display = 'none';
        icon.className = 'fa-solid fa-spinner fa-spin';

        try {
            let m3uText;
            if (sourceType === 'url') {
                onProgressHandler({ status: 'Buscando lista da URL...', details: 'Conectando...' });
                const response = await fetch(sourceData, { cache: 'no-cache' });
                if (!response.ok) throw new Error(`Falha ao buscar a URL. Status: ${response.status}`);
                m3uText = await response.text();
            } else { 
                onProgressHandler({ status: 'Lendo arquivo local...', details: 'Preparando...' });
                m3uText = sourceData;
            }

            await this.processAndStoreM3U(m3uText, onProgressHandler);
            
            await db.config.put({ key: 'last_successful_sync', value: new Date().toISOString() });
            
            icon.className = 'fa-solid fa-check';
            mainText.textContent = 'Sucesso!';
            onProgressHandler({ status: 'Sucesso!', details: 'Redirecionando...' });
            
            Yashi.showToast('Sincronização concluída! A página será recarregada.', 'success');

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            icon.className = 'fa-solid fa-xmark';
            mainText.textContent = 'Erro!';
            if (subText) subText.style.display = 'block';
            
            let userMessage = `Falha na sincronização: ${error.message}`;
            if (error.message.includes('Failed to fetch') || error.message.includes('Falha ao buscar a URL')) {
                userMessage = "Falha na Sincronização. A URL da sua lista pode ter expirado ou estar offline.";
            }
            
            Yashi.showToast(userMessage, 'error', 6000);
            console.error(`Falha na sincronização: ${error.message}`);
            onProgressHandler({ status: `Falha na sincronização`, details: error.message });
            
            setTimeout(() => {
                buttonElement.disabled = false;
                mainText.textContent = originalText;
                icon.className = originalIconClass;
            }, 5000);
        }
    },

    parseEntry: function(infoLine, urlLine) {
        if (!infoLine || !urlLine) return null;
    
        try {
            const name = infoLine.split(',').pop().trim();
            const logo = infoLine.match(/tvg-logo=\"([^\"]*)\"/)?.[1] || '';
            let groupTitle = (infoLine.match(/group-title=\"([^\"]*)\"/)?.[1] || 'Outros').trim();
            const url = urlLine.trim();
    
            const groupTitleNormalized = groupTitle.toUpperCase();
            const nameNormalized = name.toUpperCase();
    
            const seriesKeywords = ['SÉRIE', 'SERIES', 'TEMPORADA', 'ANIME'];
            const movieKeywords = ['FILME', 'MOVIE', 'VOD', 'CINEMA', 'COLETANEA', 'COLETÂNEA', 'ESPECIAL'];
            const adultKeywords = ['ADULTO', 'PRIVACY', 'PRIVATE', '+18'];
    
            // --- LÓGICA DE CLASSIFICAÇÃO HIERÁRQUICA FINAL ---
    
            // 1. Prioridade Máxima: Episódios de série explícitos (padrão SxxExx)
            if (name.match(/(.*?)[Ss](\d{1,2})[Ee](\d{1,3})/)) {
                return { name, logo, url, groupTitle, type: 'series_episode' };
            }
    
            // 2. Prioridade Alta: Canais explícitos (24H, PPV)
            if (groupTitleNormalized.includes('24H') || nameNormalized.includes('24H')) {
                return { name, logo, url, groupTitle, type: 'channel' };
            }
            if (groupTitleNormalized.includes('PPV') || nameNormalized.includes('PPV')) {
                return { name, logo, url, groupTitle: 'PAY PER VIEW', type: 'channel' };
            }
    
            // 3. Conteúdo Adulto
            if (adultKeywords.some(k => groupTitleNormalized.includes(k))) {
                const itemType = (nameNormalized.includes('FILM') || groupTitleNormalized.includes('FILM')) ? 'movie' : 'channel';
                return { name, logo, url, groupTitle: 'ADULTOS +18', type: itemType };
            }
    
            const isSeriesGroup = seriesKeywords.some(k => groupTitleNormalized.includes(k));
            const isMovieGroup = movieKeywords.some(k => groupTitleNormalized.includes(k));
    
            // 4. Regra para Grupos Ambíguos (ex: "FILMES E SÉRIES")
            if (isSeriesGroup && isMovieGroup) {
                // Se o nome do item parece um filme (contém ano), classifica como filme.
                if (name.match(/\b(19|20)\d{2}\b/)) {
                    return { name, logo, url, groupTitle, type: 'movie' };
                }
                // Senão, é mais provável que seja um canal mal categorizado.
                return { name, logo, url, groupTitle, type: 'channel' };
            }
    
            // 5. Grupos de Séries
            if (isSeriesGroup) {
                return { name, logo, url, groupTitle, type: 'movie' }; // Marcado como 'movie' para ser agrupado depois
            }
    
            // 6. Grupos de Filmes
            if (isMovieGroup) {
                return { name, logo, url, groupTitle, type: 'movie' };
            }
    
            // 7. Filme Inferido (contém um ano no título)
            if (name.match(/\b(19|20)\d{2}\b/)) {
                return { name, logo, url, groupTitle, type: 'movie' };
            }
            
            // 8. Padrão: Se nenhuma regra acima for atendida, é um canal
            return { name, logo, url, groupTitle, type: 'channel' };
    
        } catch (e) {
            console.warn("Falha ao processar uma linha do M3U:", infoLine, e);
            return null;
        }
    },

    processAndStoreM3U: async function(m3uText, onProgress) {
        onProgress({ status: 'Iniciando processamento...', details: 'Preparando para análise...' });
        
        const lines = m3uText.split('\n');
        const totalLines = lines.length;
        let itemsToStore = [];
        let seriesDataObject = {};
        const seriesKeywords = ['SÉRIE', 'SERIES', 'TEMPORADA', 'ANIME'];

        let i = 0;
        while (i < totalLines) {
            if (i % 1000 === 0) {
                onProgress({ status: 'Analisando conteúdo...', details: `Linha ${i} de ${totalLines}` });
            }

            const infoLine = lines[i]?.trim();
            if (!infoLine || !infoLine.startsWith('#EXTINF:')) {
                i++;
                continue;
            }

            let urlLine = null;
            let nextIndex = i + 1;
            while (nextIndex < totalLines) {
                const potentialUrl = lines[nextIndex]?.trim();
                if (potentialUrl && !potentialUrl.startsWith('#')) {
                    urlLine = potentialUrl;
                    break;
                }
                nextIndex++;
            }

            if (urlLine) {
                const entry = this.parseEntry(infoLine, urlLine);
                if (entry) {
                    // Limpeza final do nome do grupo
                    entry.groupTitle = entry.groupTitle.replace(/[|:»()\[\]]/g, '').replace(/^-/, '').trim();
                    if (entry.groupTitle === '') entry.groupTitle = 'Outros';

                    if (entry.type === 'series_episode') {
                        const seriesMatch = entry.name.match(/(.*?)[Ss](\d{1,2})[Ee](\d{1,3})/);
                        const seriesName = seriesMatch[1].replace(/[-_\.]*$/, '').trim().replace(/\s\s+/g, ' ');
                        const seasonNumber = parseInt(seriesMatch[2], 10);
                        const episodeNumber = parseInt(seriesMatch[3], 10);

                        if (!seriesDataObject[seriesName]) {
                            seriesDataObject[seriesName] = { name: seriesName, logo: '', seasons: {}, groupTitle: entry.groupTitle };
                        }
                        if (!seriesDataObject[seriesName].seasons[seasonNumber]) {
                            seriesDataObject[seriesName].seasons[seasonNumber] = { number: seasonNumber, logo: '', episodes: [], type: 'season' };
                        }
                        seriesDataObject[seriesName].seasons[seasonNumber].episodes.push({
                            name: entry.name, logo: entry.logo, url: entry.url, groupTitle: entry.groupTitle, number: episodeNumber, type: 'episode', seriesName: seriesName
                        });
                    } else {
                        itemsToStore.push(entry);
                    }
                }
                i = nextIndex + 1;
            } else {
                i++;
            }
        }

        onProgress({ status: 'Buscando séries mal classificadas...', details: 'Agrupando por nome...' });

        const potentialSeries = {};
        const itemsToRemove = new Set();
        const episodeRegex = /(.+?)\s*[E|EP|Episodio|Capitulo|Cap\.?|-]\s*(\d{1,4})$/i;

        for (let i = 0; i < itemsToStore.length; i++) {
            const item = itemsToStore[i];
            
            if (item.type === 'movie') {
                const groupTitleNormalized = item.groupTitle.toUpperCase();
                const isLikelySeriesGroup = seriesKeywords.some(k => groupTitleNormalized.includes(k));

                if (!isLikelySeriesGroup) {
                    continue; 
                }

                const match = item.name.match(episodeRegex);
                if (match) {
                    const seriesName = match[1].trim().replace(/[-_\.]*$/, '').replace(/\s\s+/g, ' ');
                    const episodeNumber = parseInt(match[2], 10);

                    if (!potentialSeries[seriesName]) {
                        potentialSeries[seriesName] = [];
                    }
                    potentialSeries[seriesName].push({ ...item, episodeNumber, originalIndex: i });
                }
            }
        }

        for (const seriesName in potentialSeries) {
            const episodes = potentialSeries[seriesName];
            if (episodes.length > 3) {
                if (!seriesDataObject[seriesName]) {
                    seriesDataObject[seriesName] = { 
                        name: seriesName, 
                        logo: episodes[0].logo || '', 
                        seasons: {}, 
                        groupTitle: episodes[0].groupTitle 
                    };
                }
                
                if (!seriesDataObject[seriesName].seasons[1]) {
                    seriesDataObject[seriesName].seasons[1] = { number: 1, logo: '', episodes: [], type: 'season' };
                }
                
                episodes.forEach(ep => {
                    seriesDataObject[seriesName].seasons[1].episodes.push({
                        name: ep.name, logo: ep.logo, url: ep.url, groupTitle: ep.groupTitle, 
                        number: ep.episodeNumber, type: 'episode', seriesName: seriesName
                    });
                    itemsToRemove.add(ep.originalIndex);
                });
            }
        }

        const sortedIndicesToRemove = Array.from(itemsToRemove).sort((a, b) => b - a);
        sortedIndicesToRemove.forEach(index => {
            itemsToStore.splice(index, 1);
        });

        onProgress({ status: 'Organizando séries...', details: 'Verificando capas...' });
        for (const seriesName in seriesDataObject) {
            const series = seriesDataObject[seriesName];
            series.type = 'series';
            const sortedSeasonKeys = Object.keys(series.seasons).sort((a, b) => a - b);
            
            for (const seasonKey of sortedSeasonKeys) {
                const season = series.seasons[seasonKey];
                if (season.episodes.length > 0) {
                    season.episodes.sort((a, b) => a.number - b.number);
                    const firstEpisodeWithLogo = season.episodes.find(ep => ep.logo && ep.logo.trim() !== '');
                    if (firstEpisodeWithLogo) {
                        season.logo = firstEpisodeWithLogo.logo;
                    }
                }
            }
            
            const firstSeasonWithLogo = sortedSeasonKeys.map(k => series.seasons[k]).find(s => s.logo && s.logo.trim() !== '');
            if (firstSeasonWithLogo) {
                series.logo = firstSeasonWithLogo.logo;
            }
        }
        
        let seriesList = Object.values(seriesDataObject);

        onProgress({ status: 'Higienizando dados...', details: 'Removendo capas repetidas...' });
        const usedLogos = new Set();
        
        const sanitizeItems = (items) => {
            return items.map(item => {
                const type = item.type;
                const name = item.name.toLowerCase();

                if (type === 'channel' || name.includes('24h')) {
                    return item;
                }

                if (type === 'movie' || type === 'series') {
                    if (item.logo) {
                        if (usedLogos.has(item.logo)) {
                            item.logo = '';
                        } else {
                            usedLogos.add(item.logo);
                        }
                    }
                }
                return item;
            });
        };

        itemsToStore = sanitizeItems(itemsToStore);
        seriesList = sanitizeItems(seriesList);

        if (itemsToStore.length === 0 && seriesList.length === 0) {
            throw new Error("Nenhum conteúdo válido foi encontrado na sua lista.");
        }
        
        const movieCount = itemsToStore.filter(i => i.type === 'movie').length;
        const channelCount = itemsToStore.filter(i => i.type === 'channel').length;
        const seriesCount = seriesList.length;
        onProgress({
            status: 'Análise concluída!',
            details: `${channelCount} canais, ${movieCount} filmes e ${seriesCount} séries encontrados.`
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        onProgress({ status: 'Salvando no banco de dados...', details: 'Limpando dados antigos...' });
        await db.transaction('rw', db.items, db.series, async () => {
            await db.items.clear();
            await db.series.clear();
            onProgress({ status: 'Salvando no banco de dados...', details: 'Gravando novos itens... Isso pode levar um momento.' });
            if (itemsToStore.length > 0) await db.items.bulkAdd(itemsToStore);
            if (seriesList.length > 0) await db.series.bulkAdd(seriesList);
        });
    }
};
```


## novidades\engine_novidades.js
```javascript
// /NOVIDADES/engine_novidades.js
// Motor Específico para o Módulo de Novidades

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) {
        window.location.href = '../index.html';
        return;
    }

    const mainContent = document.getElementById('main-content');

    const changelogData = [
        {
            version: "v1.3 - A Organização Definitiva",
            date: "12 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-sitemap", text: "<strong class='changelog-highlight-green'>Motor de Sincronização Aprimorado:</strong> A lógica que classifica o conteúdo foi completamente reescrita. O sistema agora usa uma análise hierárquica para separar canais, filmes e séries com muito mais precisão, resolvendo os bugs de conteúdo misturado nas páginas." },
                { icon: "fa-solid fa-list-check", text: "<strong class='changelog-highlight'>Ordenação Inteligente de Categorias:</strong> As prateleiras nas páginas de Séries e Canais agora são organizadas por prioridade, exibindo os grupos mais relevantes (como Lançamentos, PPV ou plataformas) no topo para uma navegação mais intuitiva." },
                { icon: "fa-solid fa-dice", text: "<strong class='changelog-highlight'>Sorteio de Favoritos:</strong> Adicionada a função 'Sortear' na página de Favoritos, uma ferramenta para ajudar casais e pessoas indecisas a escolher o que assistir." },
                { icon: "fa-solid fa-bug-slash", text: "<strong class='changelog-highlight'>Correções Estruturais:</strong> Resolvido um bug visual que fazia o modal de sinopse aparecer desconfigurado em várias páginas. O código foi centralizado no `base.css` para garantir estabilidade e evitar futuras regressões." },
                { icon: "fa-solid fa-ruler-combined", text: "<strong class='changelog-highlight-blue'>Ajustes Finos de UI/UX:</strong> Realizados múltiplos ajustes de layout, como a formatação do botão 'Sincronizar', a cor dos botões 'Ver Todos' e o texto do rodapé, para uma experiência mais coesa e profissional." }
            ]
        },
        {
            version: "v1.2 - Qualidade de Vida",
            date: "09 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-circle-info", text: "<strong class='changelog-highlight-green'>Sinopse e Notas Integradas:</strong> Agora você pode clicar em um ícone em qualquer filme ou série para ver a sinopse, ano e nota do TMDb em uma janela detalhada, com botões para assistir ou favoritar diretamente." },
                { icon: "fa-solid fa-clock-rotate-left", text: "<strong class='changelog-highlight'>Feedback de Sincronização:</strong> O botão 'Sincronizar' na tela inicial agora exibe a data e hora da última atualização bem-sucedida, mantendo você sempre informado." },
                { icon: "fa-solid fa-eye", text: "<strong class='changelog-highlight'>Interface Mais Limpa:</strong> As informações de 'Sinopse e Notas' foram simplificadas na visualização principal, aparecendo de forma elegante ao passar o mouse sobre a capa do conteúdo." },
                { icon: "fa-solid fa-paint-brush", text: "<strong class='changelog-highlight-blue'>Próximos Passos:</strong> O botão 'Sincronizar' passará por uma reestilização visual em breve para ficar mais moderno e apresentável." },
                { icon: "fa-solid fa-wand-magic-sparkles", text: "<strong class='changelog-highlight-blue'>Evolução Contínua:</strong> A funcionalidade de sinopse é a primeira de muitas melhorias. Mais ajustes e novidades estão a caminho!" }
            ]
        },
        {
            version: "v1.0 - Lançamento Estável",
            date: "05 de Agosto, 2025",
            notes: [
                { icon: "fas fa-rocket", text: "<strong class='changelog-highlight-green'>Bem-vindo à Versão Estável!</strong> O Yashi Player atinge sua maturidade. Agradecemos a todos que participaram da fase Beta. Esta versão consolida as melhores funcionalidades e corrige bugs para uma experiência robusta e fluida." },
                { icon: "fa-solid fa-search", text: "<strong class='changelog-highlight'>Sistema de Busca Inteligente:</strong> Pesquise em todo o seu conteúdo com uma busca que ignora acentos e capitalização. A nova página de Pesquisa agora é um hub de descoberta com seu histórico e sugestões de filmes." },
                { icon: "fa-solid fa-layer-group", text: "<strong class='changelog-highlight'>Interface Otimizada:</strong> A navegação foi aprimorada. A página de Favoritos agora é mais direta, e as categorias de Filmes são ordenadas de forma inteligente para destacar os lançamentos." },
                { icon: "fa-solid fa-play-circle", text: "<strong class='changelog-highlight'>Player e Histórico Aprimorados:</strong> O 'Continue Assistindo' agora trata canais ao vivo corretamente, exibindo um selo 'AO VIVO'. O player avança automaticamente para o próximo episódio em séries." },
                { icon: "fa-solid fa-table-cells-large", text: "<strong class='changelog-highlight'>Controle Total da Visualização:</strong> Personalize o tamanho das capas em todas as galerias e ajuste o formato da tela (aspect ratio) diretamente no player de vídeo." },
                { icon: "fa-solid fa-shield-halved", text: "<strong class='changelog-highlight'>Estabilidade e Confiança:</strong> Todos os módulos principais, incluindo Backup/Restauração e gerenciamento de Histórico, foram testados e estabilizados para este lançamento." }
            ]
        },
        {
            version: "v11.5B",
            date: "05 de Agosto, 2025",
            notes: [
                { icon: "fas fa-rocket", text: "<strong class='changelog-highlight-green'>A Fase Beta Está Chegando ao Fim!</strong> O Yashi Player se prepara para o lançamento de sua primeira versão estável. Agradecemos a todos que testaram e reportaram erros. A evolução está apenas começando!" },
                { icon: "fa-solid fa-search-location", text: "<strong class='changelog-highlight'>Pesquisa Local Inteligente:</strong> Agora você pode pesquisar filmes, séries e canais diretamente em suas respectivas páginas, com um novo botão para limpar a busca facilmente." },
                { icon: "fa-solid fa-wand-magic-sparkles", text: "<strong class='changelog-highlight'>Nova Página de Pesquisa:</strong> A tela de busca foi reimaginada como um hub de descoberta, exibindo seu histórico e um gerador de sugestões aleatórias de filmes por gênero." },
                { icon: "fa-solid fa-table-cells-large", text: "<strong class='changelog-highlight'>Controle de Tamanho:</strong> Adicionados novos botões de 'Tamanho' em todas as galerias para personalizar a visualização das capas (Micro, Pequena, Média e Grande)." },
                { icon: "fa-solid fa-circle-check", text: "<strong class='changelog-highlight'>Módulos Ativos:</strong> As seções 'Continue Assistindo', 'Favoritos' e 'Backup & Restauração' estão ativas e funcionando de forma estável." },
                { icon: "fa-solid fa-bug", text: "<strong class='changelog-highlight'>Correções Gerais:</strong> Resolvidos múltiplos bugs de navegação e interface, como o botão 'Voltar' e a exibição de elementos em telas incorretas, para uma experiência mais fluida." }
            ]
        },
        {
            version: "v10.5B",
            date: "04 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-brain", text: "<strong class='changelog-highlight'>Pesquisa Inteligente:</strong> A busca agora é inteligente, ignorando acentos e diferenças entre maiúsculas e minúsculas para encontrar resultados de forma muito mais eficaz (ex: 'dragao' encontra 'Dragão')." },
                { icon: "fa-solid fa-compass-drafting", text: "<strong class='changelog-highlight'>Hub de Descoberta na Busca:</strong> A tela de pesquisa, antes vazia, agora é um hub para descobrir conteúdo. Ela exibe seu histórico de itens visualizados e botões de gênero para sugestões aleatórias." },
                { icon: "fa-solid fa-shield-halved", text: "<strong class='changelog-highlight'>Correção de Estabilidade:</strong> Resolvido um erro crítico que causava uma tela em branco na página de pesquisa, garantindo que a funcionalidade esteja sempre acessível." }
            ]
        },
        {
            version: "v9.9B",
            date: "02 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-wand-magic-sparkles", text: "<strong class='changelog-highlight'>Interface Geral:</strong> Realizamos uma correção estrutural que restaura a barra superior em todas as telas e remove componentes visuais que apareciam fora do lugar, garantindo uma navegação estável e consistente." },
                { icon: "fa-solid fa-tv", text: "<strong class='changelog-highlight'>Player de Vídeo:</strong> O player foi refinado para evitar que o título e o botão 'Voltar' fiquem sobrepostos em vídeos com formatos de tela diferentes. O botão 'Voltar' também foi redesenhado para se alinhar à identidade visual do aplicativo." },
                { icon: "fa-solid fa-sliders", text: "<strong class='changelog-highlight'>Melhorias de Usabilidade:</strong> Os botões de modo de visualização agora possuem um novo efeito ao passar o mouse e indicam claramente qual modo está selecionado. Além disso, o aviso de retomada automática de vídeo foi aprimorado para maior clareza." },
                { icon: "fa-solid fa-bug", text: "<strong class='changelog-highlight'>Correções de Bugs:</strong> O botão para remover itens do 'Continue Assistindo' foi corrigido e agora funciona de forma confiável." }
            ]
        },
        {
            version: "v9.8B",
            date: "02 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-image", text: "<strong class='changelog-highlight'>Identidade Visual:</strong> O aplicativo agora possui um ícone oficial, garantindo uma identidade visual consistente nas abas e favoritos do seu navegador." }
            ]
        },
        {
            version: "v9.7B",
            date: "02 de Agosto, 2025",
            notes: [
                { icon: "fa-solid fa-layer-group", text: "<strong class='changelog-highlight'>Navegação Unificada:</strong> A navegação entre as telas de séries e episódios foi aprimorada para ser mais fluida e intuitiva, eliminando recarregamentos desnecessários." },
                { icon: "fa-solid fa-forward", text: "<strong class='changelog-highlight'>Player Aprimorado:</strong> A reprodução agora avança automaticamente para o próximo episódio. Além disso, a funcionalidade dos botões de controle foi restaurada e aprimorada." },
                { icon: "fa-solid fa-file-import", text: "<strong class='changelog-highlight'>Backup e Restauração:</strong> O sistema de importação de dados foi corrigido e fortalecido, garantindo que seus backups possam ser restaurados com segurança." },
                { icon: "fa-solid fa-pen-ruler", text: "<strong class='changelog-highlight'>Ajustes de Interface:</strong> Realizamos um ajuste fino no alinhamento de componentes na tela inicial para uma maior consistência visual." }
            ]
        },
        {
            version: "v9.0B",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-rocket", text: "<strong class='changelog-highlight'>Otimização de Performance:</strong> A arquitetura interna foi reestruturada para um carregamento mais rápido e uma experiência de uso mais ágil." },
                { icon: "fa-solid fa-broom", text: "<strong class='changelog-highlight'>Estabilidade Geral:</strong> Melhorias internas foram realizadas na base de código para garantir maior estabilidade e preparar o sistema para futuras atualizações." },
                { icon: "fa-solid fa-shield-halved", text: "<strong class='changelog-highlight'>Segurança:</strong> Foram implementadas novas diretrizes de proteção na estrutura do aplicativo." },
                { icon: "fa-solid fa-bug", text: "<strong class='changelog-highlight'>Correção de Bugs:</strong> Foram resolvidos erros críticos que poderiam causar instabilidade ou tela branca durante o uso, tornando o sistema mais robusto." }
            ]
        },
        {
            version: "v8.0B",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-tags", text: "<strong class='changelog-highlight'>Versão Beta:</strong> O aplicativo foi oficialmente consolidado como uma versão Beta, com identificação visual aprimorada." },
                { icon: "fa-solid fa-hand-holding-dollar", text: "<strong class='changelog-highlight'>Apoio ao Projeto:</strong> A seção de contribuição foi atualizada para maior clareza." },
                { icon: "fa-solid fa-text-height", text: "<strong class='changelog-highlight'>Ajustes de Layout:</strong> Realizados ajustes finos na interface para uma apresentação mais limpa e organizada." }
            ]
        },
        {
            version: "v7.5.1B",
            date: "30 de Julho, 2025",
            notes: [
                { icon: "fa-solid fa-database", text: "<strong class='changelog-highlight'>Listas Maiores:</strong> Aumentamos significativamente a capacidade do sistema para processar listas de conteúdo de qualquer tamanho sem travamentos." },
                { icon: "fa-solid fa-layer-group", text: "<strong class='changelog-highlight'>Carregamento Otimizado:</strong> O processo inicial de carregamento de dados foi refeito para ser mais rápido e confiável." },
                { icon: "fa-solid fa-trash-can", text: "<strong class='changelog-highlight'>Gerenciar Histórico:</strong> Agora é possível remover itens individualmente da sua lista de 'Continue Assistindo'." }
            ]
        }
    ];

    let currentPage = 1;
    const itemsPerPage = 3; 

    const renderPage = async (page) => {
        currentPage = page;
        mainContent.innerHTML = `<div class="content-loader"><div class="loading-yashi" style="font-size: 40px;"><span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span></div></div>`;

        try {
            const [movieCount, channelCount, seriesCount] = await Promise.all([
                db.items.where('type').equals('movie').count(),
                db.items.where('type').equals('channel').count(),
                db.series.count()
            ]);

            const totalPages = Math.ceil(changelogData.length / itemsPerPage);
            const paginatedItems = changelogData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            const changelogHTML = paginatedItems.map(item => `
                <div class="changelog-item">
                    <div class="changelog-header">
                        <span class="changelog-version">${item.version}</span>
                        <span class="changelog-date">${item.date}</span>
                    </div>
                    <div class="changelog-body">
                        <ul>
                            ${item.notes.map(note => `<li><i class="${note.icon}"></i> ${note.text}</li>`).join('')}
                        </ul>
                    </div>
                </div>`).join('');
            
            let paginationHTML = '';
            if (totalPages > 1) {
                paginationHTML = `
                    <div class="pagination-container">
                        <button class="page-button" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-left"></i> Anterior
                        </button>
                        <span class="page-info">Página ${currentPage} de ${totalPages}</span>
                        <button class="page-button" id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>
                            Próxima <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>`;
            }

            const pageHTML = `
                <div class="top-bar">
                    <div class="top-bar-left">
                        <img src="../logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='../home.html'">
                        <button class="home-button" onclick="window.location.href='../home.html'" title="Voltar para Home">
                            <i class="fas fa-home"></i>
                        </button>
                    </div>
                </div>
                <div class="novidades-container">
                    <div class="stats-container">
                        <div class="stat-card">
                            <i class="fa-solid fa-film"></i>
                            <div class="count">${movieCount}</div>
                            <div class="label">Filmes</div>
                        </div>
                        <div class="stat-card">
                            <i class="fa-solid fa-video"></i>
                            <div class="count">${seriesCount}</div>
                            <div class="label">Séries</div>
                        </div>
                        <div class="stat-card">
                            <i class="fa-solid fa-tv"></i>
                            <div class="count">${channelCount}</div>
                            <div class="label">Canais</div>
                        </div>
                    </div>
                    <div class="changelog-container">
                        <div class="changelog-title-container">
                            <h2>Histórico de Atualizações</h2>
                            <button id="report-error-btn" class="report-error-button"><i class="fas fa-bug"></i> Reportar Erro</button>
                        </div>
                        ${changelogHTML}
                        ${paginationHTML}
                    </div>
                </div>
                <div id="report-modal-overlay" class="report-modal-overlay">
                    <div class="report-modal-content">
                        <div class="report-modal-header">
                            <h3>Relatar um Problema</h3>
                            <button id="close-modal-btn" class="report-modal-close">&times;</button>
                        </div>
                        <form id="report-form">
                            <div class="form-group">
                                <label for="reporter-name">Seu Nome:</label>
                                <input type="text" id="reporter-name" required>
                            </div>
                            <div class="form-group">
                                <label for="reporter-email">Seu Email (opcional):</label>
                                <input type="email" id="reporter-email">
                            </div>
                            <div class="form-group">
                                <label for="report-date">Data:</label>
                                <input type="text" id="report-date" disabled>
                            </div>
                            <div class="form-group">
                                <label for="report-description">Erro que gostaria de relatar:</label>
                                <textarea id="report-description" rows="4" required></textarea>
                            </div>
                            <button type="submit" class="submit-report-btn">Enviar Relatório</button>
                        </form>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = pageHTML;
            addEventListeners();

        } catch (error) {
            mainContent.innerHTML = `<p id="no-results">Erro ao carregar novidades. Tente recarregar a página.</p>`;
            console.error("Erro ao renderizar página de novidades:", error);
        }
    };

    const addEventListeners = () => {
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        if (prevButton) prevButton.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
        if (nextButton) nextButton.addEventListener('click', () => { if (currentPage < Math.ceil(changelogData.length / itemsPerPage)) renderPage(currentPage + 1); });

        const reportBtn = document.getElementById('report-error-btn');
        const modalOverlay = document.getElementById('report-modal-overlay');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const reportForm = document.getElementById('report-form');

        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                const today = new Date();
                const dateField = document.getElementById('report-date');
                dateField.value = today.toLocaleDateString('pt-BR');
                modalOverlay.style.display = 'flex';
            });
        }

        const closeModal = () => {
            if (modalOverlay) modalOverlay.style.display = 'none';
        };

        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (modalOverlay) modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });

        if (reportForm) reportForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = document.getElementById('reporter-name').value;
            const email = document.getElementById('reporter-email').value;
            const date = document.getElementById('report-date').value;
            const description = document.getElementById('report-description').value;

            const subject = encodeURIComponent(`YASHI PLAYER v1.0 - Relatório de Erro de ${name}`);
            const body = encodeURIComponent(
                `Relatório de Erro - YASHI PLAYER\n\n` +
                `Nome: ${name}\n` +
                `Email: ${email || 'Não informado'}\n` +
                `Data: ${date}\n\n` +
                `---------------------------------------\n` +
                `Descrição do Problema:\n` +
                `${description}`
            );

            window.location.href = `mailto:maretins10@gmail.com?subject=${subject}&body=${body}`;
            closeModal();
        });
    };

    renderPage(1);
});
```


## novidades\novidades.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Novidades</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    
    <link rel="stylesheet" href="style_novidades.css">
</head>
<body class="content-body">
    <main id="main-content">
        <div class="content-loader">
            <div class="loading-yashi" style="font-size: 40px;">
                <span>Y</span><span>A</span><span>S</span><span>H</span><span>I</span>
            </div>
        </div>
    </main>

    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_novidades.js"></script>
</body>
</html>
```


## novidades\style_novidades.css
```css
/* /NOVIDADES/style_novidades.css */
/* Estilos consolidados para o módulo de Novidades */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --yashi-cyan-glow: #80FFFF;
    --toast-success-border: #28a745; /* Cor verde principal */
    --info-blue: #87CEFA; /* Azul claro para notas informativas */
}
html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }
.content-loader { display: flex; justify-content: center; align-items: center; min-height: 50vh; }
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }

/* --- BARRA SUPERIOR SIMPLES --- */
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color); margin-bottom: 40px; }
.top-bar-left { display: flex; align-items: center; gap: 12px; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }

/* --- ESTILOS ESPECÍFICOS DA PÁGINA --- */
.novidades-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px 20px 20px;
}

.stats-container {
    display: flex;
    justify-content: space-around;
    gap: 20px;
    margin-bottom: 40px;
    flex-wrap: wrap;
}
.stat-card {
    background-color: var(--surface-color);
    border-radius: 12px;
    padding: 25px;
    text-align: center;
    flex-grow: 1;
    border: 1px solid var(--border-color);
    transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 20px rgba(0, 240, 240, 0.2);
    border-color: var(--yashi-cyan);
}
.stat-card i {
    font-size: 36px;
    color: var(--yashi-cyan);
    margin-bottom: 15px;
}
.stat-card .count {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1;
}
.stat-card .label {
    font-size: 1rem;
    color: var(--text-secondary-color);
}
.changelog-container {
    margin-top: 50px;
}
.changelog-title-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 40px;
    flex-wrap: wrap;
}
.changelog-container h2 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--yashi-cyan);
    border-bottom: 2px solid var(--yashi-cyan);
    padding-bottom: 10px;
}
.report-error-button {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
}
.report-error-button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px var(--yashi-cyan-glow);
}
.changelog-item {
    background-color: var(--surface-color);
    border-left: 4px solid var(--yashi-cyan);
    padding: 20px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 25px;
}
.changelog-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}
.changelog-version {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    padding: 5px 12px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 0.9rem;
}
.changelog-date {
    color: var(--text-secondary-color);
    font-weight: 500;
}
.changelog-body ul {
    list-style: none;
    padding-left: 0;
    margin: 0;
}
.changelog-body li {
    padding: 8px 0;
    display: flex;
    align-items: center; 
    gap: 10px;
}
.changelog-body li i {
    color: var(--yashi-cyan);
    margin-top: 0;
}
.changelog-highlight {
    color: var(--yashi-cyan);
}
.changelog-highlight-green {
    color: var(--toast-success-border);
}
.changelog-highlight-blue {
    color: var(--info-blue);
}
.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    margin-top: 20px;
    border-top: 1px solid var(--border-color);
}
.page-button {
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
    color: var(--text-secondary-color);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    gap: 8px;
}
.page-button:not(:disabled):hover {
    border-color: var(--yashi-cyan);
    color: var(--yashi-cyan);
    transform: translateY(-2px);
}
.page-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.page-info {
    color: var(--text-color);
    font-weight: bold;
}

/* --- MODAL DE RELATÓRIO DE ERRO --- */
.report-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}
.report-modal-content {
    background: var(--surface-color);
    padding: 30px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    width: 90%;
    max-width: 500px;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.report-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 15px;
}
.report-modal-header h3 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--text-color);
}
.report-modal-close {
    background: none;
    border: none;
    font-size: 28px;
    color: var(--text-secondary-color);
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s, transform 0.2s;
}
.report-modal-close:hover {
    color: var(--yashi-cyan);
    transform: rotate(90deg);
}
.form-group {
    margin-bottom: 15px;
    text-align: left;
}
.form-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-secondary-color);
    font-size: 0.9rem;
}
.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px;
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-color);
    font-family: var(--font-family);
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--yashi-cyan);
    box-shadow: 0 0 10px rgba(0, 240, 240, 0.3);
}
.form-group input#report-date {
    background-color: #2a3038;
    cursor: not-allowed;
}
.form-group textarea {
    resize: vertical;
    min-height: 120px;
}
.submit-report-btn {
    width: 100%;
    padding: 15px;
    margin-top: 10px;
    background: var(--yashi-cyan);
    color: var(--background-color);
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
}
.submit-report-btn:hover {
    background-color: var(--yashi-cyan-glow);
    transform: scale(1.02);
}
```


## pesquisa\engine_search.js
```javascript
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
```


## pesquisa\search.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Pesquisa</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
    
    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="style_search.css">
</head>
<body class="content-body">
    <main id="main-content">
        <div class="search-header">
            <div class="header-left">
                <img src="../logo.png" alt="Logo" class="top-bar-logo" onclick="window.location.href='../home.html'">
                <button class="home-button" onclick="window.location.href='../home.html'" title="Voltar para Home">
                    <i class="fas fa-home"></i>
                </button>
                <div id="cover-size-buttons" class="cover-size-buttons">
                    <span class="size-label">Tamanho:</span>
                    <button class="size-button" data-size="micro" title="Capas Micro"><i class="fa-solid fa-table-list"></i></button>
                    <button class="size-button" data-size="small" title="Capas Pequenas"><i class="fa-solid fa-grip"></i></button>
                    <button class="size-button" data-size="medium" title="Capas Médias"><i class="fa-solid fa-table-cells"></i></button>
                    <button class="size-button" data-size="large" title="Capas Grandes"><i class="fa-solid fa-table-cells-large"></i></button>
                </div>
            </div>
            <div class="search-box">
                <input type="text" id="search-input" placeholder="Pesquisar por filmes, séries ou canais...">
                <button id="search-button-page" title="Pesquisar"><i class="fas fa-search"></i></button>
            </div>
        </div>

        <div id="initial-content-container">
            </div>

        <div id="category-filters" class="hidden"></div>

        <div id="results-container">
             </div>
    </main>

    <div id="player-view">
        <div id="player-container">
            <div class="player-header">
                <button class="back-from-player"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h2 id="player-title"></h2>
            </div>
            <video id="player" playsinline controls></video>
            <button id="player-prev-button" class="player-nav-button prev" title="Anterior"><i class="fas fa-backward-step"></i></button>
            <button id="player-next-button" class="player-nav-button next" title="Próximo"><i class="fas fa-forward-step"></i></button>
        </div>
    </div>

    <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_search.js"></script>
</body>
</html>
```


## pesquisa\style_search.css
```css
/* /PESQUISA/style_search.css */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --plyr-color-main: var(--yashi-cyan);
    --delete-red: #dc3545;
}
html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- CABEÇALHO DA PÁGINA DE PESQUISA --- */
.search-header {
    background-color: var(--surface-color);
    padding: 10px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 15px;
    position: sticky;
    top: 0;
    z-index: 50;
    margin: -25px -25px 0 -25px;
    width: calc(100% + 50px);
}
.header-left { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.top-bar-logo { height: 35px; cursor: pointer; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }
.cover-size-buttons { display: flex; align-items: center; gap: 5px; background-color: var(--background-color); padding: 5px; border-radius: 8px; }
.size-label {
    font-size: 0.8rem;
    color: var(--text-secondary-color);
    margin-right: 5px;
    margin-left: 5px;
    font-weight: 500;
}
.size-button { background: none; border: none; color: var(--text-secondary-color); width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.size-button:hover { color: var(--text-color); }
.size-button.active { background-color: var(--yashi-cyan); color: var(--background-color); }
.search-box { position: relative; display: flex; align-items: center; gap: 10px; flex-grow: 1; max-width: 600px; margin: 0 auto; }
#search-input { width: 100%; padding: 12px 20px; border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--background-color); color: var(--text-color); font-size: 15px; outline: none; transition: all 0.2s; }
#search-input:focus { border-color: var(--yashi-cyan); box-shadow: 0 0 10px rgba(0, 240, 240, 0.4); }
#search-button-page { background: var(--yashi-cyan); border: none; color: var(--background-color); width: 46px; height: 46px; border-radius: 10px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
#search-button-page:hover { transform: scale(1.1); box-shadow: 0 0 10px var(--yashi-cyan-glow); }

/* --- FILTROS DE CATEGORIA E RESULTADOS --- */
#category-filters { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; padding: 30px 0 25px 0; border-bottom: 1px solid var(--border-color); align-items: center; }
#category-filters.hidden { display: none; }
.filter-button { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary-color); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
.filter-button:hover { border-color: var(--yashi-cyan); color: var(--yashi-cyan); transform: translateY(-2px); }
.filter-button.active { background-color: var(--yashi-cyan); border-color: var(--yashi-cyan); color: var(--background-color); font-weight: bold; box-shadow: 0 0 15px rgba(0, 240, 240, 0.5); transform: translateY(-2px); }
#results-container { padding-top: 20px; }
.search-prompt, .no-results { color: var(--text-secondary-color); text-align: center; width: 100%; padding: 50px 0; font-size: 18px; }

/* --- ESTILOS PARA TELA INICIAL DA BUSCA (HUB DE DESCOBERTA) --- */
.discovery-section { margin: 40px 0; }
.discovery-title {
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
}
.discovery-title div { display: flex; align-items: center; gap: 15px; }
.discovery-title i { color: var(--yashi-cyan); }
.discovery-subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary-color);
    margin: -5px 0 20px 0;
}
.clear-history-button {
    background-color: transparent;
    border: 1px solid var(--delete-red);
    color: var(--delete-red);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
}
.clear-history-button:hover { background-color: var(--delete-red); color: #fff; transform: scale(1.05); }
.genre-buttons-container { display: flex; flex-wrap: wrap; gap: 10px; }
.genre-button { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary-color); padding: 12px 18px; border-radius: 50px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
.genre-button:hover { border-color: var(--yashi-cyan); color: var(--yashi-cyan); transform: translateY(-2px); }
.clear-suggestions-button {
    background-color: transparent;
    border: 1px solid var(--yashi-cyan);
    color: var(--yashi-cyan);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    padding: 10px 20px;
    border-radius: 8px;
    transition: all 0.2s;
    margin-left: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.clear-suggestions-button:hover { background-color: var(--yashi-cyan); color: var(--background-color); }

/* --- GRID, CARDS E CAROUSEL --- */
.item-carousel { display: grid; gap: 1.25rem; }
#main-content[data-cover-size="micro"] .item-carousel { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
#main-content[data-cover-size="small"] .item-carousel { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
#main-content[data-cover-size="medium"] .item-carousel { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
#main-content[data-cover-size="large"] .item-carousel { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }

.grid-container { display: grid; gap: 1.25rem; }
#main-content[data-cover-size="micro"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
#main-content[data-cover-size="small"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
#main-content[data-cover-size="medium"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
#main-content[data-cover-size="large"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }

.card { background-color: var(--surface-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; border: 1px solid transparent; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); }
.card:focus, .card:focus-visible { outline: none; box-shadow: 0 0 15px var(--yashi-cyan-glow); border-color: var(--yashi-cyan); }
.card-img { width: 100%; height: auto; aspect-ratio: 2 / 3; object-fit: cover; background-color: #21262d; }
.card-title { padding: 0.75rem; font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#main-content[data-cover-size="micro"] .card-title { font-size: 0.75rem; padding: 0.5rem; }
.favorite-button { position: absolute; top: 8px; right: 8px; background-color: rgba(13, 17, 23, 0.7); color: var(--text-secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.favorite-button:hover { background-color: rgba(0, 240, 240, 0.2); color: var(--yashi-cyan); }
.favorite-button.active { color: #FFD700; text-shadow: 0 0 8px #FFD700; }
.remove-from-history-button { position: absolute; bottom: 8px; right: 8px; background-color: rgba(220, 53, 69, 0.7); color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 14px; cursor: pointer; z-index: 6; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; opacity: 0; }
.card:hover .remove-from-history-button { opacity: 1; }
.remove-from-history-button:hover { background-color: rgba(220, 53, 69, 1); transform: scale(1.1); }
.no-results-in-section {
    color: var(--text-secondary-color);
    text-align: center;
    width: 100%;
    padding: 40px 20px;
    background-color: var(--surface-color);
    border: 1px dashed var(--border-color);
    border-radius: 8px;
    grid-column: 1 / -1;
}

/* --- PLAYER DE VÍDEO --- */
#player-view { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
#player-container { position: relative; width: 90%; max-width: 1200px; max-height: 80vh; height: auto; }
.player-header { display: flex; align-items: center; position: absolute; top: -45px; left: 0; gap: 15px; }
.back-from-player { background-color: var(--yashi-cyan); color: var(--background-color); border: 1px solid var(--yashi-cyan); padding: 8px 15px; border-radius: 8px; cursor: pointer; z-index: 1001; font-weight: bold; transition: all 0.2s ease-in-out; }
.back-from-player:hover { background-color: var(--yashi-cyan-glow); border-color: var(--yashi-cyan-glow); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
#player-title { font-size: 1.2rem; }
.player-nav-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.6); color: var(--text-secondary-color); border: 2px solid var(--border-color); border-radius: 50%; width: 50px; height: 50px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2147483647; transition: all 0.2s ease-in-out; opacity: 0; visibility: hidden; }
#player-container:hover .player-nav-button.visible { opacity: 0.7; }
.player-nav-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); box-shadow: 0 0 15px var(--yasi-cyan-glow); }
.player-nav-button.prev { left: 20px; }
.player-nav-button.next { right: 20px; }
.content-loader, #no-results { grid-column: 1 / -1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; color: var(--text-secondary-color); text-align: center; }
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }

/* --- MODAL DE CONFIRMAÇÃO --- */
#confirmation-modal-overlay { 
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    background: rgba(0, 0, 0, 0.7); 
    backdrop-filter: blur(5px); 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    z-index: 9998; 
    opacity: 0; 
    visibility: hidden; 
    transition: opacity 0.3s, visibility 0.3s; 
}
#confirmation-modal-overlay.active { 
    opacity: 1; 
    visibility: visible; 
}
.confirmation-modal { 
    background: var(--surface-color); 
    padding: 25px; 
    border-radius: 12px; 
    border: 1px solid var(--border-color); 
    width: 90%; 
    max-width: 450px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
    transform: scale(0.9); 
    transition: transform 0.3s; 
    text-align: center; 
}
#confirmation-modal-overlay.active .confirmation-modal { 
    transform: scale(1); 
}
.confirmation-modal-content { 
    margin-bottom: 25px; 
}
.confirmation-modal-content p { 
    margin: 0 0 10px 0; 
    font-size: 1rem; 
    line-height: 1.6; 
    color: var(--text-color); 
}
.confirmation-modal-buttons { 
    display: flex; 
    justify-content: center; 
    gap: 15px; 
}
.modal-button { 
    border: none; 
    padding: 10px 25px; 
    border-radius: 8px; 
    font-weight: bold; 
    cursor: pointer; 
    transition: transform 0.2s, box-shadow 0.2s; 
}
.modal-button:hover { 
    transform: translateY(-2px); 
}
.modal-button.confirm-button { 
    background-color: var(--delete-red); 
    color: #fff; 
}
.modal-button.cancel-button { 
    background-color: var(--border-color); 
    color: var(--text-color); 
}
```


## series\engine_series.js
```javascript
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
```


## series\series.html
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="referrer" content="no-referrer">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="../fav.png" type="image/png">
    <title>YASHI PLAYER - Séries</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />

    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="style_series.css">
</head>
<body class="content-body">
    <main id="main-content"></main>

    <div id="player-view">
        <div id="player-container">
            <div class="player-header">
                <button class="back-from-player"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h2 id="player-title"></h2>
            </div>
            <video id="player" playsinline controls></video>
            <button id="player-prev-button" class="player-nav-button prev" title="Anterior"><i class="fas fa-backward-step"></i></button>
            <button id="player-next-button" class="player-nav-button next" title="Próximo"><i class="fas fa-forward-step"></i></button>
        </div>
    </div>

    <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
    <script src="../js/db.js"></script>
    <script src="../js/common.js"></script>
    
    <script src="engine_series.js"></script>
</body>
</html>
```


## series\style_series.css
```css
/* /SERIES/style_series.css */

/* --- VARIÁVEIS GLOBAIS E RESETS --- */
:root {
    --yashi-cyan: #00F0F0;
    --yashi-cyan-glow: #80FFFF;
    --background-color: #0d1117;
    --surface-color: #161b22;
    --border-color: #30363d;
    --text-color: #c9d1d9;
    --text-secondary-color: #8b949e;
    --font-family: 'Inter', sans-serif;
    --plyr-color-main: var(--yashi-cyan);
    --plyr-range-track-background: #3a414a;
    --plyr-tooltip-background: var(--yashi-cyan);
    --plyr-tooltip-color: #0d1117;
    --toast-error-bg: #2c1a1d;
    --toast-error-border: #dc3545;
    --toast-success-bg: #1c2b22;
    --toast-success-border: #28a745;
}

html { font-size: clamp(14px, 1.2vw, 18px); }
body { background-color: var(--background-color); color: var(--text-color); font-family: var(--font-family); margin: 0; font-size: 1rem; }
* { box-sizing: border-box; }
.content-body { padding: 25px; }

/* --- BARRA SUPERIOR E PESQUISA --- */
main {
    padding-top: 80px;
    margin-top: -80px;
}
.top-bar { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 10px 25px; 
    margin: -25px -25px 25px -25px;
    gap: 15px; 
    flex-wrap: wrap;
    background-color: var(--surface-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
}
.top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 12px; }
.top-bar-right { flex-grow: 1; justify-content: flex-end; }
.top-bar-logo { height: 35px; cursor: pointer; flex-shrink: 0; }
.home-button { background: none; border: 1px solid var(--border-color); color: var(--text-secondary-color); height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease-in-out; flex-shrink: 0; padding: 0 12px; }
.home-button:hover { color: var(--yashi-cyan); border-color: var(--yashi-cyan); }
.home-button.with-text { width: auto; padding: 0 15px; gap: 10px; }
.home-button.with-text span { font-size: 0.9rem; font-weight: 500; }
#top-bar-back-button { display: none; }
.cover-size-buttons { display: flex; align-items: center; gap: 5px; background-color: var(--background-color); padding: 5px; border-radius: 8px; }
.size-label { font-size: 0.8rem; color: var(--text-secondary-color); margin-right: 5px; margin-left: 5px; font-weight: 500; }
.size-button { background: none; border: none; color: var(--text-secondary-color); width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.size-button:hover { color: var(--text-color); }
.size-button.active { background-color: var(--yashi-cyan); color: var(--background-color); }
.cover-size-buttons.disabled { opacity: 0.4; pointer-events: none; }
.search-container { position: relative; display: flex; align-items: center; width: 100%; max-width: 350px; }
.search-input { background-color: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-color); padding: 10px 75px 10px 15px; border-radius: 8px; width: 100%; transition: border-color 0.2s; }
.search-input:focus { outline: none; border-color: var(--yashi-cyan); }
.search-button, .clear-search-button { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary-color); cursor: pointer; padding: 8px; }
.clear-search-button { right: 40px; }
.hidden { display: none; }

/* --- GRID E CARDS --- */
.grid-container { display: grid; gap: 1.25rem; }
main[data-cover-size="micro"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
main[data-cover-size="small"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
main[data-cover-size="medium"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
main[data-cover-size="large"] .grid-container { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }

.card { background-color: var(--surface-color); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; border: 1px solid transparent; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); border-color: var(--border-color); }
.card:focus, .card:focus-visible { outline: none; transform: translateY(-5px); box-shadow: 0 0 15px var(--yashi-cyan-glow); border-color: var(--yashi-cyan); }
.card-img { width: 100%; height: auto; aspect-ratio: 2 / 3; object-fit: cover; background-color: #21262d; }
.card.default-logo .card-img { object-fit: contain; padding: 1.5rem; }
.card-title { padding: 0.75rem; font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }
main[data-cover-size="micro"] .card-title { font-size: 0.75rem; padding: 0.5rem; }
.favorite-button { position: absolute; top: 8px; right: 8px; background-color: rgba(13, 17, 23, 0.7); color: var(--text-secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.favorite-button:hover { background-color: rgba(0, 240, 240, 0.2); color: var(--yashi-cyan); }
.favorite-button.active { color: #FFD700; text-shadow: 0 0 8px #FFD700; }
.favorite-button { position: relative; }
.favorite-button::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%; left: 50%;
    transform: translateX(-50%);
    background-color: var(--yashi-cyan); color: var(--background-color);
    padding: 4px 8px; border-radius: 4px;
    font-size: 12px; font-weight: bold;
    white-space: nowrap;
    opacity: 0; visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    pointer-events: none;
    z-index: 10;
}
.favorite-button:hover::after { opacity: 1; visibility: visible; }
.season-card .card-title { white-space: normal; text-align: center; }
.season-card.no-image .card-img { display: none; }
.season-card.no-image { aspect-ratio: 2 / 3; align-items: center; justify-content: center; }
.season-card.no-image .card-title { font-size: 1.1rem; white-space: normal; text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center; }

/* Barra de informações na capa */
.card-info-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%);
    color: var(--text-color);
    padding: 20px 10px 8px 10px;
    display: flex;
    justify-content: center; /* Centraliza o conteúdo */
    align-items: center;
    font-size: 0.85rem;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    cursor: pointer;
}
.card:hover .card-info-overlay { opacity: 1; }
.card-info-overlay .info-action {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* --- PLAYER DE VÍDEO --- */
#player-view { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
#player-container { position: relative; width: 90%; max-width: 1200px; max-height: 80vh; height: auto; }
.player-header { display: flex; align-items: center; position: absolute; top: -45px; left: 0; gap: 15px; }
.back-from-player { background-color: var(--yashi-cyan); color: var(--background-color); border: 1px solid var(--yashi-cyan); padding: 8px 15px; border-radius: 8px; cursor: pointer; z-index: 1001; font-weight: bold; transition: all 0.2s ease-in-out; }
.back-from-player:hover { background-color: var(--yashi-cyan-glow); border-color: var(--yashi-cyan-glow); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
#player-title { font-size: 1.2rem; color: var(--text-color); }
.player-nav-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.6); color: var(--text-secondary-color); border: 2px solid var(--border-color); border-radius: 50%; width: 50px; height: 50px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2147483647; transition: all 0.2s ease-in-out; opacity: 0; visibility: hidden; }
#player-container:hover .player-nav-button.visible { opacity: 0.7; }
.player-nav-button.visible { visibility: visible; }
.player-nav-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); box-shadow: 0 0 15px var(--yashi-cyan-glow); }
.player-nav-button:disabled { opacity: 0.2 !important; cursor: not-allowed; background-color: rgba(13, 17, 23, 0.5); color: var(--text-secondary-color); border-color: var(--border-color); box-shadow: none; }
.player-nav-button.prev { left: 20px; }
.player-nav-button.next { right: 20px; }

/* --- ANIMAÇÃO DE CARREGAMENTO E MENSAGENS --- */
.loading-yashi span { display: inline-block; font-weight: bold; animation: wave 1.6s infinite; animation-delay: calc(.1s * var(--i)); }
@keyframes wave { 0%, 40%, 100% { transform: translateY(0); } 20% { transform: translateY(-15px); color: var(--yashi-cyan); } }
.content-loader, #no-results { grid-column: 1 / -1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; color: var(--text-secondary-color); text-align: center; }

/* --- MENU DE CATEGORIAS (SIDEBAR) --- */
#sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1999; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
#sidebar-overlay.active { opacity: 1; visibility: visible; }
#category-sidebar { position: fixed; top: 0; left: 0; width: 300px; max-width: 80%; height: 100%; background-color: var(--surface-color); border-right: 1px solid var(--border-color); z-index: 2000; transform: translateX(-100%); transition: transform 0.3s ease-in-out; display: flex; flex-direction: column; }
#category-sidebar.active { transform: translateX(0); }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.sidebar-header h3 { margin: 0; font-size: 1.1rem; }
#close-sidebar-button, .sidebar-back-button { background: none; border: none; color: var(--text-secondary-color); font-size: 20px; cursor: pointer; }
#category-list-container { padding: 10px; overflow-y: auto; flex-grow: 1; }
.sidebar-category-button { display: block; width: 100%; padding: 12px 15px; background: none; border: none; color: var(--text-secondary-color); text-align: left; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: background-color 0.2s, color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-category-button:hover { background-color: var(--border-color); color: var(--text-color); }
.sidebar-category-button.active { background-color: var(--yashi-cyan); color: var(--background-color); font-weight: bold; }

/* --- SISTEMA DE NOTIFICAÇÃO E MODAIS --- */
#toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { background-color: var(--surface-color); color: var(--text-color); padding: 15px 20px; border-radius: 8px; border-left: 5px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateX(100%); transition: all 0.4s ease-in-out; display: flex; align-items: center; gap: 10px; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { border-left-color: var(--toast-success-border); background-color: var(--toast-success-bg); }
.toast.success::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f058"; color: var(--toast-success-border); }
.toast.error { border-left-color: var(--toast-error-border); background-color: var(--toast-error-bg); }
.toast.error::before { font-family: "Font Awesome 6 Free"; font-weight: 900; content: "\f06a"; color: var(--toast-error-border); }
#confirmation-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9998; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
#confirmation-modal-overlay.active { opacity: 1; visibility: visible; }
.confirmation-modal { background: var(--surface-color); padding: 25px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; text-align: center; }
#confirmation-modal-overlay.active .confirmation-modal { transform: scale(1); }
.confirmation-modal-content { margin-bottom: 25px; }
.confirmation-modal-content p { margin: 0; font-size: 1rem; line-height: 1.6; color: var(--text-color); }
.confirmation-modal-buttons { display: flex; justify-content: center; gap: 15px; }
.modal-button.confirm-button { background-color: var(--yashi-cyan); color: var(--background-color); }
.modal-button.cancel-button { background-color: var(--border-color); color: var(--text-color); }

/* --- ESTILOS DE PRATELEIRAS (SHELVES) --- */
.shelf-container { display: flex; flex-direction: column; gap: 35px; }
.category-shelf { width: 100%; }
.shelf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 5px; }
.shelf-title { font-size: 1.3rem; font-weight: 500; color: var(--text-color); display: flex; align-items: center; gap: 12px; }
.shelf-title .icon { color: var(--yashi-cyan); font-size: 1.1rem; }
.view-all-button {
    background-color: transparent;
    border: 1px solid var(--yashi-cyan);
    color: var(--yashi-cyan);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    margin-left: 15px;
}
.view-all-button:hover {
    background-color: var(--yashi-cyan);
    color: var(--background-color);
    transform: scale(1.05);
}
.carousel-wrapper { position: relative; }
.item-carousel { display: flex; gap: 1.25rem; overflow-x: auto; padding: 5px; margin: -5px; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; scrollbar-width: none; }
.item-carousel::-webkit-scrollbar { display: none; }
.scroll-button { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(13, 17, 23, 0.8); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; opacity: 0; visibility: hidden; }
.carousel-wrapper:hover .scroll-button { opacity: 0.8; visibility: visible; }
.scroll-button.prev { left: -20px; }
.scroll-button.next { right: -20px; }
.scroll-button:hover { opacity: 1 !important; background-color: var(--yashi-cyan); color: var(--background-color); border-color: var(--yashi-cyan); transform: translateY(-50%) scale(1.1); }
.scroll-button:disabled { opacity: 0 !important; visibility: hidden; cursor: not-allowed; }
.item-carousel .card { flex-shrink: 0; width: 150px; }
```
