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