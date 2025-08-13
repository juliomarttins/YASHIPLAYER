// js/sync.js (v7.51.2 - Adiciona 'type' ao objeto da temporada)

window.YashiSync = {
    run: async function(buttonElement) {
        const sourceTypeObj = await db.config.get('m3u_source_type');
        const sourceDataObj = await db.config.get('m3u_source_data');
        
        const sourceType = sourceTypeObj ? sourceTypeObj.value : null;
        const sourceData = sourceDataObj ? sourceDataObj.value : null;

        if (!sourceType || !sourceData) {
            Yashi.showToast("Fonte da lista não encontrada. Faça o login novamente.", "error");
            return;
        }

        const span = buttonElement.querySelector('span');
        const icon = buttonElement.querySelector('i');
        const originalText = "Sincronizar";
        const originalIconClass = "fa-solid fa-rotate-right";

        buttonElement.disabled = true;
        span.textContent = 'Sincronizando...';
        icon.className = 'fa-solid fa-spinner fa-spin';

        try {
            let m3uText;
            if (sourceType === 'url') {
                const response = await fetch(sourceData, { cache: 'no-cache' });
                if (!response.ok) throw new Error(`Falha ao buscar a URL. Status: ${response.status}`);
                m3uText = await response.text();
            } else { 
                m3uText = sourceData;
            }

            await this.processAndStoreM3U(m3uText);
            
            icon.className = 'fa-solid fa-check';
            span.textContent = 'Sucesso!';
            
            Yashi.showToast('Sincronização concluída! A página será recarregada.', 'success');

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            icon.className = 'fa-solid fa-xmark';
            span.textContent = 'Erro!';
            
            Yashi.showToast(`Falha na sincronização: ${error.message}`, 'error', 6000);
            console.error(`Falha na sincronização: ${error.message}`);
            
            setTimeout(() => {
                buttonElement.disabled = false;
                span.textContent = originalText;
                icon.className = originalIconClass;
            }, 5000);
        }
    },

    processAndStoreM3U: async function(m3uText) {
        console.log('Analisando e categorizando conteúdo...');

        try {
            const lines = m3uText.split('\n');
            let itemsToStore = [];
            let seriesDataObject = {};

            const adultKeywords = ['ADULTO', 'PRIVACY', 'PRIVATE', '+18'];
            const movieKeywords = ['FILME', 'MOVIE', 'VOD', 'CINEMA', 'COLETANEA', 'COLETÂNEA', 'ESPECIAL', 'ESPECIAIS'];
            const seriesKeywords = ['SÉRIE', 'SERIES', 'TEMPORADA', 'ANIME'];
            const channelKeywords = ['24H', 'AO VIVO', 'CANAL', 'LIVE TV'];
            
            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].startsWith('#EXTINF:')) continue;

                const info = lines[i];
                const url = lines[++i] ? lines[i].trim() : null;
                if (!url || url.startsWith('#')) { i--; continue; }
                
                const name = info.split(',').pop().trim();
                const nameNormalized = name.toUpperCase();
                const logo = info.match(/tvg-logo=\"([^\"]*)\"/)?.[1] || '';
                let groupTitleRaw = (info.match(/group-title=\"([^\"]*)\"/)?.[1] || 'Outros').trim();
                const groupTitleNormalized = groupTitleRaw.toUpperCase();

                let itemType = 'channel';
                let finalGroupTitle = groupTitleRaw;
                
                const isMovieKeywordMatch = movieKeywords.some(k => groupTitleNormalized.startsWith(k));
                const containsSeriesKeyword = seriesKeywords.some(k => groupTitleNormalized.includes(k));

                if (name.match(/(.*?)[Ss](\d{1,2})[Ee](\d{1,3})/)) {
                    itemType = 'series_episode';
                }
                else if (adultKeywords.some(k => groupTitleNormalized.includes(k))) {
                    if (channelKeywords.some(k => groupTitleNormalized.includes(k) || nameNormalized.includes(k))) {
                        itemType = 'channel';
                        finalGroupTitle = 'ADULTOS +18';
                    } else {
                        itemType = 'movie'; 
                        finalGroupTitle = 'ADULTOS +18';
                    }
                }
                else if (isMovieKeywordMatch && !containsSeriesKeyword) {
                    itemType = 'movie';
                    const parts = groupTitleRaw.split('|').map(p => p.trim());
                    if (parts.length > 1 && movieKeywords.some(k => parts[0].toUpperCase().includes(k))) {
                        finalGroupTitle = parts[1];
                    } else {
                        finalGroupTitle = groupTitleRaw.replace(/filmes|movies|vod/i, '').trim();
                    }
                }

                finalGroupTitle = finalGroupTitle.replace(/^\||\|$/g, '').trim();
                if (finalGroupTitle === '') finalGroupTitle = 'Outros';

                if (itemType === 'series_episode') {
                    const seriesMatch = name.match(/(.*?)[Ss](\d{1,2})[Ee](\d{1,3})/);
                    const seriesName = seriesMatch[1].replace(/[-_\.]*$/, '').trim().replace(/\s\s+/g, ' ');
                    const seasonNumber = parseInt(seriesMatch[2], 10);
                    const episodeNumber = parseInt(seriesMatch[3], 10);

                    if (!seriesDataObject[seriesName]) {
                        seriesDataObject[seriesName] = { name: seriesName, logo: '', seasons: {}, groupTitle: finalGroupTitle }; 
                    }
                    if (!seriesDataObject[seriesName].seasons[seasonNumber]) {
                        // LINHA CORRIGIDA AQUI:
                        seriesDataObject[seriesName].seasons[seasonNumber] = { number: seasonNumber, episodes: [], type: 'season' }; 
                    }
                    if (!seriesDataObject[seriesName].logo && logo) {
                        seriesDataObject[seriesName].logo = logo;
                    }
                    
                    seriesDataObject[seriesName].seasons[seasonNumber].episodes.push({ name, logo, url, groupTitle: finalGroupTitle, number: episodeNumber, type: 'episode', seriesName: seriesName });
                } else {
                    itemsToStore.push({ name, logo, url, groupTitle: finalGroupTitle, type: itemType });
                }
            }
            
            const seriesList = Object.values(seriesDataObject);

            if (itemsToStore.length === 0 && seriesList.length === 0) {
                throw new Error("Nenhum conteúdo válido foi encontrado na sua lista.");
            }
            
            console.log('Limpando dados antigos do banco de dados...');
            await db.transaction('rw', db.items, db.series, async () => {
                await db.items.clear();
                await db.series.clear();
                console.log('Gravando novos dados...');
                if (itemsToStore.length > 0) await db.items.bulkAdd(itemsToStore);
                if (seriesList.length > 0) await db.series.bulkAdd(seriesList);
            });
            console.log('Sincronização concluída no banco de dados!');

        } catch (error) {
            console.error("Erro Crítico no processamento M3U:", error);
            throw error;
        }
    }
};