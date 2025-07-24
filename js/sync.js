// js/sync.js
const YashiSync = {
    /**
     * Processa o texto M3U, categoriza e salva no banco de dados de forma segura.
     * @param {string} m3uText O conteúdo completo do arquivo M30.
     * @param {HTMLElement} statusElement O elemento HTML para exibir o progresso.
     */
    processAndStoreM3U: async (m3uText, statusElement) => {
        const updateStatus = (msg) => {
            if (statusElement) statusElement.textContent = msg;
            console.log(msg);
        };

        updateStatus('Analisando e categorizando conteúdo...');
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const lines = m3uText.split('\n');
            let moviesAndChannels = [];
            let seriesDataObject = {};

            // Palavras-chave para identificar filmes no group-title ou nome
            const movieKeywords = ['FILME', 'MOVIE', 'VOD', 'CINEMA'];
            // Palavras-chave genéricas FORTES para identificar canais ao vivo (que devem ser excluídos de filmes)
            const strongLiveChannelKeywords = ['CANAL', 'TV', 'AO VIVO', 'LIVE', 'CH']; // Removido 'STREAM'
            // Nomes específicos de canais que podem ter "filme" no nome, mas são canais
            // Esta lista foi PRUNADA para ser muito mais específica e conter APENAS NOMES DE CANAIS REAIS.
            const specificProblematicChannelNames = [
                'MEGAPIX', 'SONY', 'A&E', 'AXN', 'GLOBO', 'SBT', 'RECORD', 'BAND', 'ESPN', 'SPORTV', 'TNT', 'HBO', 
                'TELE CINE', 'PREMIERE', 'COMBATE', 'FOX', 'WARNER', 'UNIVERSAL', 'PARAMOUNT', 'DISNEY', 'CARTOON', 
                'NICKELODEON', 'DISCOVERY', 'NAT GEO', 'HISTORY', 'MULTISHOW', 'GNT', 'VIVA', 'BANDSPORTS', 'DAZN', 
                'AMC', 'CINEMAX' 
            ]; 

            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].startsWith('#EXTINF:')) continue;

                const info = lines[i];
                const url = lines[++i] ? lines[i].trim() : null;
                if (!url || url.startsWith('#')) {
                    i--; continue;
                }
                
                const name = info.split(',').pop().trim();
                const logo = info.match(/tvg-logo=\"([^\"]*)\"/)?.[1] || '';
                const groupTitleRaw = (info.match(/group-title=\"([^\"]*)\"/)?.[1] || 'Outros').trim();
                const groupTitleNormalized = groupTitleRaw.toUpperCase(); // Normaliza para comparação
                const nameNormalized = name.toUpperCase(); // Normaliza o nome para comparação

                let itemType = 'channel'; // Padrão: canal
                let mainCategory = 'Canais'; // Categoria principal padrão
                let subCategory = groupTitleRaw; // Subcategoria padrão (o groupTitle completo)

                // 1. Prioridade: É um episódio de série? (Detectado pelo padrão SxxExx no nome)
                const seriesMatch = name.match(/(.*?)[Ss](\d{1,2})[Ee](\d{1,3})/);
                if (seriesMatch) {
                    itemType = 'series_episode';
                    // Para séries, mainCategory e subCategory são tratados dentro de seriesDataObject
                } 
                // 2. Segunda Prioridade: É um filme VOD?
                // A ordem da verificação é crucial aqui. Primeiro, tentamos identificar como filme.
                // Um item é filme se tiver palavras-chave de filme E NÃO for um indicador forte de canal ao vivo E NÃO for um nome de canal problemático específico.
                else if (movieKeywords.some(keyword => groupTitleNormalized.includes(keyword) || nameNormalized.includes(keyword)) &&
                         !strongLiveChannelKeywords.some(keyword => groupTitleNormalized.includes(keyword) || nameNormalized.includes(keyword)) &&
                         !specificProblematicChannelNames.some(channelName => nameNormalized.includes(channelName) || groupTitleNormalized.includes(channelName))) {
                    itemType = 'movie';
                    mainCategory = 'Filmes'; // Define a categoria principal como Filmes

                    const parts = groupTitleRaw.split('|').map(p => p.trim());
                    // Se groupTitle for "Filmes | Ação", pega "Ação" como subCategory
                    if (parts.length > 1 && movieKeywords.some(keyword => parts[0].toUpperCase().includes(keyword))) {
                        subCategory = parts[1];
                    } else {
                        subCategory = 'Outros Filmes'; // Fallback para filmes sem subcategoria explícita
                    }
                }
                // 3. Terceira Prioridade: Se não for série nem filme, então é um canal.
                // Esta é a condição padrão final, que captura todos os outros casos.
                else {
                    itemType = 'channel'; 
                    mainCategory = 'Canais';
                    subCategory = groupTitleRaw;
                }
                
                if (itemType === 'series_episode') {
                    const seriesName = seriesMatch[1].replace(/[-_\.]*$/, '').trim().replace(/\s\s+/g, ' ');
                    const seasonNumber = parseInt(seriesMatch[2], 10);
                    const episodeNumber = parseInt(seriesMatch[3], 10);

                    if (!seriesDataObject[seriesName]) {
                         seriesDataObject[seriesName] = { name: seriesName, logo: '', seasons: {} };
                    }
                    if (!seriesDataObject[seriesName].seasons[seasonNumber]) {
                        seriesDataObject[seriesName].seasons[seasonNumber] = { number: seasonNumber, episodes: [] };
                    }
                    if (!seriesDataObject[seriesName].logo && logo) {
                       seriesDataObject[seriesName].logo = logo;
                    }
                    
                    seriesDataObject[seriesName].seasons[seasonNumber].episodes.push({
                        name, logo, url, groupTitle: groupTitleRaw, number: episodeNumber
                    });

                } else { 
                    moviesAndChannels.push({ name, logo, url, groupTitle: groupTitleRaw, type: itemType, mainCategory, subCategory }); 
                }
            }
            
            const seriesList = Object.values(seriesDataObject);

            // Atribui a capa do primeiro episódio a cada temporada.
            seriesList.forEach(series => {
                Object.values(series.seasons).forEach(season => {
                    if (season.episodes && season.episodes.length > 0) {
                        season.episodes.sort((a, b) => a.number - b.number);
                        season.logo = season.episodes[0].logo || series.logo;
                    }
                });
            });

            updateStatus('Iniciando gravação no banco de dados...');

            await db.transaction('rw', db.items, db.series, async () => {
                updateStatus('Limpando dados antigos...');
                await db.items.clear();
                await db.series.clear();

                updateStatus(`Salvando ${moviesAndChannels.length} filmes e canais...`);
                if (moviesAndChannels.length > 0) await db.items.bulkAdd(moviesAndChannels);

                updateStatus(`Salvando ${seriesList.length} séries...`);
                if (seriesList.length > 0) await db.series.bulkAdd(seriesList);
            });

            updateStatus('Gravação concluída com sucesso!');

        } catch (error) {
            updateStatus(`Erro ao processar: ${error.message}`);
            console.error("Erro Crítico no processamento:", error);
            throw error; // Propaga o erro para ser tratado por quem chamou
        }
    },

    /**
     * Inicia a sincronização em segundo plano a partir da fonte salva.
     * @param {HTMLElement} buttonElement O botão que iniciou a ação, para feedback.
     */
    run: async (buttonElement) => {
        const sourceType = localStorage.getItem('yashi_m3u_source_type');
        const sourceData = localStorage.getItem('yashi_m3u_source_data');

        if (!sourceType || !sourceData) {
            console.error('Fonte da lista não encontrada. Redirecionando para o login.');
            window.location.href = 'index.html';
            return;
        }

        const originalText = buttonElement.querySelector('span').textContent;
        const icon = buttonElement.querySelector('i');
        const originalIconClass = icon.className;

        buttonElement.disabled = true;
        buttonElement.querySelector('span').textContent = 'Sincronizando...';
        icon.className = 'fa-solid fa-spinner fa-spin';

        try {
            let m3uText;
            if (sourceType === 'url') {
                const response = await fetch(sourceData);
                if (!response.ok) throw new Error('Falha ao buscar a URL da lista.');
                m3uText = await response.text();
            } else { // sourceType === 'file'
                m3uText = sourceData;
            }

            await YashiSync.processAndStoreM3U(m3uText, null);
            
            icon.className = 'fa-solid fa-check';
            buttonElement.querySelector('span').textContent = 'Sucesso!';

        } catch (error) {
            icon.className = 'fa-solid fa-xmark';
            buttonElement.querySelector('span').textContent = 'Erro!';
            console.error(`Falha na sincronização: ${error.message}`);
        } finally {
            setTimeout(() => {
                buttonElement.disabled = false;
                buttonElement.querySelector('span').textContent = originalText;
                icon.className = originalIconClass;
            }, 2000);
        }
    }
};
