// Przechowywanie klucza API w localStorage
let apiKey = localStorage.getItem('openai_api_key') || '';

console.log('Script.js załadowany');

// Inicjalizacja
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM załadowany, inicjalizacja...');
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
        apiKeyInput.value = apiKey;
        apiKeyInput.addEventListener('change', function() {
            apiKey = this.value;
            localStorage.setItem('openai_api_key', apiKey);
        });
    }

    // Przełączanie trybów
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // Aktualizacja przycisków
            modeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Aktualizacja zawartości
            document.querySelectorAll('.mode-content').forEach(c => c.classList.remove('active'));
            document.getElementById(mode + '-mode').classList.add('active');
            
            // Ukryj wyniki
            document.getElementById('results').classList.add('hidden');
            document.getElementById('prompt-result').classList.add('hidden');
            document.getElementById('image-result').classList.add('hidden');
        });
    });

    // Przełączanie widoczności sekcji DALL-E
    const useDalleCheckbox = document.getElementById('use-dalle');
    const dallePromptSection = document.getElementById('dalle-prompt-section');
    if (useDalleCheckbox && dallePromptSection) {
        useDalleCheckbox.addEventListener('change', function() {
            dallePromptSection.style.display = this.checked ? 'block' : 'none';
        });
    }

    // Generowanie z API
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Kliknięto przycisk generuj (API)');
            this.style.opacity = '0.7';
            setTimeout(() => {
                generateIdeas();
                this.style.opacity = '1';
            }, 100);
        });
    } else {
        console.error('Nie znaleziono przycisku generate-btn');
        alert('Błąd: Nie znaleziono przycisku generowania. Odśwież stronę.');
    }

    // Generowanie promptu
    const generatePromptBtn = document.getElementById('generate-prompt-btn');
    if (generatePromptBtn) {
        generatePromptBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Kliknięto przycisk generuj (Prompt)');
            this.style.opacity = '0.7';
            setTimeout(() => {
                generatePrompt();
                this.style.opacity = '1';
            }, 100);
        });
    } else {
        console.error('Nie znaleziono przycisku generate-prompt-btn');
        alert('Błąd: Nie znaleziono przycisku generowania. Odśwież stronę.');
    }

    // Kopiowanie wyników
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const content = document.getElementById('results-content').textContent;
            copyToClipboard(content);
        });
    }

    // Wybór pomysłów do obrazów
    const selectIdeasBtn = document.getElementById('select-ideas-btn');
    if (selectIdeasBtn) {
        selectIdeasBtn.addEventListener('click', function() {
            showIdeasSelection();
        });
    }

    // Anulowanie wyboru
    const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
    if (cancelSelectionBtn) {
        cancelSelectionBtn.addEventListener('click', function() {
            document.getElementById('ideas-selection').classList.add('hidden');
        });
    }

    // Generowanie wybranych obrazów
    const generateSelectedImagesBtn = document.getElementById('generate-selected-images-btn');
    if (generateSelectedImagesBtn) {
        generateSelectedImagesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Kliknięto przycisk generuj wybrane obrazy');
            generateSelectedImages();
        });
    } else {
        console.error('Nie znaleziono przycisku generate-selected-images-btn');
    }

    // Aktualizacja kosztu pojedynczego obrazu przy zmianie rozmiaru
    const imageTypeSelect = document.getElementById('image-type');
    if (imageTypeSelect) {
        imageTypeSelect.addEventListener('change', updateSingleImageCost);
        updateSingleImageCost(); // Ustaw początkowy koszt
    }

    // Zamykanie galerii
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    if (closeGalleryBtn) {
        closeGalleryBtn.addEventListener('click', function() {
            document.getElementById('ideas-images-gallery').classList.add('hidden');
        });
    }

    // Kopiowanie promptu
    const copyPromptBtn = document.getElementById('copy-prompt-btn');
    if (copyPromptBtn) {
        copyPromptBtn.addEventListener('click', () => {
            const content = document.getElementById('prompt-text').textContent;
            copyToClipboard(content);
        });
    }
    
    // Przełączanie widoczności overlay tekstu
    const addTextOverlayCheckbox = document.getElementById('add-text-overlay');
    const textOverlaySection = document.getElementById('text-overlay-section');
    if (addTextOverlayCheckbox && textOverlaySection) {
        addTextOverlayCheckbox.addEventListener('change', function() {
            textOverlaySection.style.display = this.checked ? 'block' : 'none';
        });
    }

    // Przełączanie między generowaniem a uploadem
    const generateRadio = document.getElementById('generate-new');
    const uploadRadio = document.getElementById('upload-existing');
    const generateSection = document.getElementById('generate-section');
    const uploadSection = document.getElementById('upload-section');
    
    if (generateRadio && uploadRadio && generateSection && uploadSection) {
        generateRadio.addEventListener('change', function() {
            if (this.checked) {
                generateSection.style.display = 'block';
                uploadSection.style.display = 'none';
            }
        });
        
        uploadRadio.addEventListener('change', function() {
            if (this.checked) {
                generateSection.style.display = 'none';
                uploadSection.style.display = 'block';
            }
        });
    }

    // Upload zdjęcia
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            handleImageUpload(e.target.files[0]);
        });
    }

    // Generowanie obrazu
    const generateImageBtn = document.getElementById('generate-image-btn');
    let isGenerating = false; // Flaga zapobiegająca wielokrotnemu generowaniu
    
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isGenerating) {
                console.log('Generowanie już w toku...');
                return;
            }
            
            console.log('Kliknięto przycisk generuj obraz');
            this.style.opacity = '0.7';
            this.disabled = true;
            this.textContent = 'Generuję...';
            
            generateCreativeImage();
        });
    }

    // Pobieranie obrazu
    const downloadImageBtn = document.getElementById('download-image-btn');
    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', downloadGeneratedImage);
    }

    // Regenerowanie obrazu
    const regenerateImageBtn = document.getElementById('regenerate-image-btn');
    if (regenerateImageBtn) {
        regenerateImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (isGenerating) return;
            generateCreativeImage();
        });
    }

    // Anulowanie generowania
    const cancelBtn = document.getElementById('cancel-generation-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            cancelGeneration();
        });
    }
    
    console.log('Inicjalizacja zakończona');
});

// Funkcja wyszukiwania w PubMed
async function searchPubMed(topic) {
    try {
        // PubMed API - darmowe, nie wymaga klucza
        const searchQuery = encodeURIComponent(topic + ' nutrition diet');
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchQuery}&retmax=5&retmode=json`;
        
        console.log('Wyszukuję w PubMed:', searchQuery);
        
        const searchResponse = await fetch(url);
        const searchData = await searchResponse.json();
        
        if (!searchData.esearchresult || !searchData.esearchresult.idlist || searchData.esearchresult.idlist.length === 0) {
            console.log('Brak wyników w PubMed');
            return null;
        }
        
        const pmids = searchData.esearchresult.idlist.slice(0, 3); // Maksymalnie 3 artykuły
        console.log('Znalezione artykuły PubMed:', pmids);
        
        // Pobierz szczegóły artykułów
        const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
        const fetchResponse = await fetch(fetchUrl);
        const fetchData = await fetchResponse.json();
        
        // Pobierz abstrakty osobno (esummary czasami nie zwraca abstraktów)
        const abstractUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
        let abstractsMap = {};
        try {
            const abstractResponse = await fetch(abstractUrl);
            const abstractText = await abstractResponse.text();
            // Parsuj XML aby wyciągnąć abstrakty (uproszczone)
            pmids.forEach(pmid => {
                const abstractMatch = abstractText.match(new RegExp(`<PubmedData>.*?<ArticleId IdType="pubmed">${pmid}</ArticleId>.*?<AbstractText[^>]*>(.*?)</AbstractText>`, 's'));
                if (abstractMatch) {
                    abstractsMap[pmid] = abstractMatch[1].replace(/<[^>]+>/g, '').trim();
                }
            });
        } catch (e) {
            console.log('Nie udało się pobrać abstraktów:', e);
        }
        
        const articles = [];
        if (fetchData.result && pmids) {
            pmids.forEach(pmid => {
                const article = fetchData.result[pmid];
                if (article) {
                    const authorsList = article.authors ? article.authors.map(a => a.name).join(', ') : '';
                    articles.push({
                        title: article.title || '',
                        authors: authorsList,
                        journal: article.source || '',
                        year: article.pubdate ? article.pubdate.split(' ')[0] : '',
                        pmid: pmid,
                        abstract: abstractsMap[pmid] || article.abstract || ''
                    });
                }
            });
        }
        
        console.log('Pobrane artykuły:', articles);
        return articles;
    } catch (error) {
        console.error('Błąd wyszukiwania PubMed:', error);
        return null;
    }
}

async function generateIdeas() {
    console.log('generateIdeas wywołane');
    
    const contentType = document.getElementById('content-type').value;
    const topic = document.getElementById('topic').value;
    const audience = document.getElementById('target-audience').value;
    const tone = document.getElementById('tone').value;
    const usePubMed = document.getElementById('use-pubmed')?.checked ?? true;

    console.log('Wartości:', { contentType, topic, audience, tone, apiKey: apiKey ? 'jest' : 'brak', usePubMed });

    if (!topic || !topic.trim()) {
        alert('Proszę wpisać temat!');
        return;
    }

    // Jeśli nie ma klucza API, przełącz na tryb prompt
    if (!apiKey || !apiKey.trim()) {
        alert('Brak klucza API. Przełączam na tryb prompt.');
        document.querySelector('[data-mode="prompt"]').click();
        // Wypełnij pola w trybie prompt
        document.getElementById('prompt-content-type').value = contentType;
        document.getElementById('prompt-topic').value = topic;
        document.getElementById('prompt-audience').value = audience;
        document.getElementById('prompt-tone').value = tone;
        generatePrompt();
        return;
    }

    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const resultsContent = document.getElementById('results-content');
    if (!resultsContent) {
        console.error('Nie znaleziono results-content');
    }

    loading.classList.remove('hidden');
    results.classList.add('hidden');
    
    // Aktualizuj tekst loading
    if (loading.querySelector('p')) {
        loading.querySelector('p').textContent = usePubMed ? 'Wyszukuję artykuły naukowe z PubMed...' : 'Generuję pomysły...';
    }

    try {
        let pubmedContext = '';
        let pubmedReferences = '';
        
        // Wyszukaj artykuły w PubMed jeśli zaznaczone
        if (usePubMed) {
            const articles = await searchPubMed(topic);
            if (articles && articles.length > 0) {
                pubmedContext = '\n\nAktualne badania naukowe z PubMed:\n';
                pubmedReferences = '\n\nŹródła naukowe:\n';
                
                articles.forEach((article, index) => {
                    pubmedContext += `${index + 1}. ${article.title}\n`;
                    if (article.abstract) {
                        pubmedContext += `   Streszczenie: ${article.abstract.substring(0, 200)}...\n`;
                    }
                    pubmedContext += `   Autorzy: ${article.authors}\n`;
                    pubmedContext += `   Czasopismo: ${article.journal} (${article.year})\n\n`;
                    
                    pubmedReferences += `${index + 1}. ${article.title}. ${article.authors}. ${article.journal} (${article.year}). PubMed ID: ${article.pmid}\n`;
                });
                
                pubmedContext += '\nUżyj tych badań naukowych jako podstawy dla pomysłów. Odwołuj się do konkretnych wyników badań.';
            }
        }
        
        if (loading.querySelector('p')) {
            loading.querySelector('p').textContent = 'Generuję pomysły na podstawie badań naukowych...';
        }
        
        const prompt = buildPrompt(contentType, topic, audience, tone) + pubmedContext;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Jesteś pomocnym asystentem dla dietetyków, który generuje kreatywne pomysły na treści oparte na aktualnych badaniach naukowych.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error('Błąd API: ' + response.statusText);
        }

        const data = await response.json();
        let ideas = data.choices[0].message.content;
        
        // Dodaj referencje do wyników
        if (pubmedReferences) {
            ideas += '\n\n' + '─'.repeat(50) + '\n' + pubmedReferences;
        }

        // Zapisz pomysły do późniejszego użycia
        window.lastGeneratedIdeas = ideas;
        window.lastContentType = contentType;
        window.lastTopic = topic;

        resultsContent.textContent = ideas;
        results.classList.remove('hidden');
    } catch (error) {
        alert('Błąd: ' + error.message + '\n\nSpróbuj użyć trybu prompt (bez klucza API).');
        console.error(error);
    } finally {
        loading.classList.add('hidden');
    }
}

async function generatePrompt() {
    console.log('generatePrompt wywołane');
    
    try {
        const contentType = document.getElementById('prompt-content-type');
        const topicInput = document.getElementById('prompt-topic');
        const audience = document.getElementById('prompt-audience');
        const tone = document.getElementById('prompt-tone');
        const usePubMed = document.getElementById('prompt-use-pubmed')?.checked ?? true;

        if (!contentType || !topicInput || !audience || !tone) {
            throw new Error('Nie znaleziono wszystkich pól formularza');
        }

        const contentTypeValue = contentType.value;
        const topic = topicInput.value;
        const audienceValue = audience.value;
        const toneValue = tone.value;

        console.log('Wartości:', { contentTypeValue, topic, audienceValue, toneValue, usePubMed });

        if (!topic || !topic.trim()) {
            alert('⚠️ Proszę wpisać temat!');
            topicInput.focus();
            return;
        }

        let prompt = buildPrompt(contentTypeValue, topic, audienceValue, toneValue);
        let pubmedReferences = '';
        
        // Wyszukaj artykuły w PubMed jeśli zaznaczone
        if (usePubMed) {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.classList.remove('hidden');
                loading.querySelector('p').textContent = 'Wyszukuję artykuły naukowe z PubMed...';
            }
            
            const articles = await searchPubMed(topic);
            
            if (loading) {
                loading.classList.add('hidden');
            }
            
            if (articles && articles.length > 0) {
                prompt += '\n\nAktualne badania naukowe z PubMed:\n';
                pubmedReferences = '\n\nŹródła naukowe do dodania do promptu:\n';
                
                articles.forEach((article, index) => {
                    prompt += `${index + 1}. ${article.title}\n`;
                    if (article.abstract) {
                        prompt += `   Streszczenie: ${article.abstract.substring(0, 200)}...\n`;
                    }
                    prompt += `   Autorzy: ${article.authors}\n`;
                    prompt += `   Czasopismo: ${article.journal} (${article.year})\n\n`;
                    
                    pubmedReferences += `${index + 1}. ${article.title}. ${article.authors}. ${article.journal} (${article.year}). PubMed ID: ${article.pmid}\n`;
                });
                
                prompt += '\nUżyj tych badań naukowych jako podstawy dla pomysłów. Odwołuj się do konkretnych wyników badań.';
                prompt += pubmedReferences;
            }
        }
        
        const promptResult = document.getElementById('prompt-result');
        const promptText = document.getElementById('prompt-text');

        if (!promptResult || !promptText) {
            throw new Error('Nie znaleziono elementów prompt-result lub prompt-text');
        }

        promptText.textContent = prompt;
        promptResult.classList.remove('hidden');
        
        // Zapisz informacje dla późniejszego generowania obrazów
        window.lastGeneratedIdeas = prompt; // Użyj promptu jako podstawy
        window.lastContentType = contentTypeValue;
        window.lastTopic = topic;
        
        // Ukryj inne sekcje wyników
        document.getElementById('results').classList.add('hidden');
        
        // Przewiń do wyników
        setTimeout(() => {
            promptResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        console.log('Prompt wygenerowany i wyświetlony');
    } catch (error) {
        console.error('Błąd w generatePrompt:', error);
        alert('Błąd: ' + error.message + '\n\nOdśwież stronę i spróbuj ponownie.');
    }
}

function buildPrompt(contentType, topic, audience, tone) {
    const contentTypeMap = {
        'post': 'post na social media (Instagram/Facebook)',
        'newsletter': 'newsletter email',
        'blog': 'artykuł blogowy',
        'reel': 'scenariusz na reel/video (Instagram/TikTok)'
    };

    const toneMap = {
        'profesjonalny': 'profesjonalny i merytoryczny',
        'przyjazny': 'przyjazny i ciepły',
        'motywujący': 'motywujący i inspirujący',
        'edukacyjny': 'edukacyjny i wyjaśniający',
        'luźny': 'luźny i swobodny'
    };

    return `Jesteś ekspertem od marketingu dla dietetyków. Wygeneruj 3-5 najlepszych, najbardziej kreatywnych pomysłów na ${contentTypeMap[contentType]} na temat: "${topic}".

Wymagania:
- Grupa docelowa: ${audience}
- Ton wypowiedzi: ${toneMap[tone]}
- Każdy pomysł powinien być konkretny i gotowy do użycia
- Uwzględnij aktualne trendy w dietetyce
- Pomysły powinny być wartościowe i edukacyjne
- Maksymalnie 5 pomysłów - jakość ważniejsza niż ilość

Dla każdego pomysłu podaj w następującym formacie:
Tytuł: "[pełny tytuł pomysłu]"

Opis: [krótki opis treści - 2-3 zdania]

Kluczowe punkty: [lista punktów do poruszenia]

Call-to-action: [sugerowane wezwanie do działania]

WAŻNE: Każdy pomysł musi być kompletny. Nie ucinaj tytułów ani opisów w połowie zdania.`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Skopiowano do schowka!');
    }).catch(err => {
        // Fallback dla starszych przeglądarek
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Skopiowano do schowka!');
    });
}

// Funkcje generowania obrazów
let currentGeneratedImageUrl = null;
let generationAborted = false;

function cancelGeneration() {
    generationAborted = true;
    isGenerating = false;
    
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
    
    const generateBtn = document.getElementById('generate-image-btn');
    if (generateBtn) {
        generateBtn.style.opacity = '1';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generuj Obraz';
    }
    
    alert('Generowanie anulowane');
}

// Nowa funkcja generowania kreatywnych obrazów
// Funkcja obsługi uploadu zdjęcia
function handleImageUpload(file) {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('⚠️ Proszę wybrać plik obrazu!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageResult = document.getElementById('image-result');
        const generatedImage = document.getElementById('generated-image');
        
        if (imageResult && generatedImage) {
            generatedImage.src = e.target.result;
            imageResult.classList.remove('hidden');
            document.getElementById('results').classList.add('hidden');
            document.getElementById('prompt-result').classList.add('hidden');
            
            // Zapisz obraz do późniejszego użycia
            window.uploadedImageData = e.target.result;
            
            setTimeout(() => {
                imageResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };
    reader.readAsDataURL(file);
}

async function generateCreativeImage() {
    if (isGenerating) {
        console.log('Generowanie już w toku, pomijam...');
        return;
    }
    
    const imageSource = document.querySelector('input[name="image-source"]:checked')?.value || 'generate';
    
    // Jeśli użytkownik wgrał zdjęcie
    if (imageSource === 'upload') {
        const uploadedFile = document.getElementById('image-upload').files[0];
        if (!uploadedFile) {
            alert('⚠️ Proszę wybrać zdjęcie do wgrania!');
            return;
        }
        
        const generateSimilar = document.getElementById('generate-similar')?.checked;
        const addTextOverlay = document.getElementById('add-text-overlay').checked;
        const overlayText = document.getElementById('overlay-text').value;
        
        if (generateSimilar && (!apiKey || !apiKey.trim())) {
            alert('⚠️ Generowanie podobnego obrazu wymaga klucza API OpenAI.');
            return;
        }
        
        await processUploadedImage(uploadedFile, generateSimilar, addTextOverlay, overlayText);
        return;
    }
    
    // Standardowe generowanie nowego obrazu
    if (!apiKey || !apiKey.trim()) {
        alert('⚠️ Ta funkcja wymaga klucza API OpenAI. Wprowadź klucz w sekcji "Tryb API".');
        return;
    }
    
    isGenerating = true;
    generationAborted = false;
    const loading = document.getElementById('loading');
    const generateBtn = document.getElementById('generate-image-btn');
    
    // Ustaw przycisk na "generowanie"
    if (generateBtn) {
        generateBtn.style.opacity = '0.7';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generuję...';
    }
    
    console.log('generateCreativeImage wywołane');
    
    try {
        const description = document.getElementById('image-description').value;
        const imageType = document.getElementById('image-type').value;
        const styleDesc = document.getElementById('image-style-desc').value;
        const addTextOverlay = document.getElementById('add-text-overlay').checked;
        const overlayText = document.getElementById('overlay-text').value;

        if (!description || !description.trim()) {
            alert('⚠️ Proszę wpisać opis obrazu!');
            document.getElementById('image-description').focus();
            return;
        }

        // Rozmiary dla DALL-E
        const sizes = {
            'post': '1024x1024',
            'story': '1024x1792',
            'banner': '1792x1024'
        };

        const dalleSize = sizes[imageType] || sizes['post'];

        // Buduj prompt dla DALL-E - mieszanka polskiego i angielskiego dla lepszej kompatybilności
        const stylePrompts = {
            'photography': 'professional photography, high quality, sharp focus',
            'lifestyle': 'lifestyle photography, natural, candid, authentic',
            'studio': 'studio photography, clean background, professional lighting',
            'outdoor': 'outdoor photography, natural lighting, environmental',
            'minimalist': 'minimalist style, clean composition, simple',
            'vibrant': 'vibrant colors, high saturation, energetic'
        };

        const stylePrompt = stylePrompts[styleDesc] || stylePrompts['photography'];
        // WAŻNE: Instrukcja o polskich napisach + użycie polskiego w opisie dla lepszej skuteczności
        // Wyodrębnij polskie słowa z opisu jako przykład
        const polishWords = description.split(' ').filter(word => word.length > 3).slice(0, 3).join(' ');
        const dallePrompt = `Create an image showing: ${description}. Style: ${stylePrompt}, high resolution, detailed. MANDATORY: All text, signs, labels, banners, posters, or any written words visible in the image MUST be in Polish language (język polski). Do not use English text. Use Polish words like "${polishWords}" as examples of Polish text style.`;

        if (loading) {
            loading.classList.remove('hidden');
            const loadingText = loading.querySelector('p');
            if (loadingText) {
                loadingText.textContent = 'Generuję obraz DALL-E (może potrwać 10-20 sekund)...';
            }
        }

        // Generuj obraz z DALL-E
        const imageUrl = await generateImageWithDalleCreative(dallePrompt, dalleSize);

        if (generationAborted) {
            return;
        }

        currentGeneratedImageUrl = imageUrl;

        // Jeśli trzeba dodać tekst overlay
        let finalImageUrl = imageUrl;
        if (addTextOverlay && overlayText && overlayText.trim()) {
            finalImageUrl = await addTextOverlayToImage(imageUrl, overlayText, imageType);
        }

        // Pokaż obraz
        const imageResult = document.getElementById('image-result');
        const generatedImage = document.getElementById('generated-image');
        
        if (imageResult && generatedImage) {
            generatedImage.src = finalImageUrl;
            imageResult.classList.remove('hidden');
            document.getElementById('results').classList.add('hidden');
            document.getElementById('prompt-result').classList.add('hidden');
            
            setTimeout(() => {
                imageResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

        console.log('Obraz wygenerowany');
    } catch (error) {
        console.error('Błąd w generateCreativeImage:', error);
        alert('Błąd: ' + error.message + '\n\nUpewnij się, że masz poprawny klucz API OpenAI.');
    } finally {
        // ZAWSZE resetuj stan
        isGenerating = false;
        if (loading) {
            loading.classList.add('hidden');
        }
        if (generateBtn) {
            generateBtn.style.opacity = '1';
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generuj Obraz';
        }
    }
}

async function generateImageWithDalleCreative(prompt, size) {
    if (!apiKey || !apiKey.trim()) {
        throw new Error('Brak klucza API');
    }

    console.log('Wysyłam request do DALL-E:', { prompt: prompt.substring(0, 100) + '...', size });

    // Timeout dla całego requestu - maksymalnie 40 sekund (DALL-E może być wolne)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.error('Timeout - anuluję request po 40 sekundach');
        controller.abort();
    }, 40000);
    
    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                size: size,
                quality: 'standard',
                n: 1
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Odpowiedź z DALL-E:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || response.statusText;
            console.error('Błąd DALL-E API:', errorData);
            throw new Error('Błąd DALL-E API: ' + errorMsg);
        }

        const data = await response.json();
        console.log('Dane z DALL-E otrzymane');
        
        if (!data.data || !data.data[0] || !data.data[0].url) {
            console.error('Nieprawidłowa struktura odpowiedzi:', data);
            throw new Error('Nieprawidłowa odpowiedź z DALL-E API');
        }
        
        console.log('Obraz wygenerowany pomyślnie');
        return data.data[0].url;
        
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('Timeout - request został anulowany');
            throw new Error('Timeout - generowanie obrazu trwa zbyt długo (40 sekund). Spróbuj ponownie.');
        }
        console.error('Błąd DALL-E:', error);
        throw error;
    }
}

async function addTextOverlayToImage(imageUrl, text, imageType) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Narysuj obraz
            ctx.drawImage(img, 0, 0);
            
            // Dodaj półprzezroczyste tło pod tekstem
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
            
            // Dodaj tekst
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.font = 'bold 48px Arial, sans-serif';
            
            const textY = canvas.height - 50;
            ctx.fillText(text, canvas.width / 2, textY);
            ctx.strokeText(text, canvas.width / 2, textY);
            
            resolve(canvas.toDataURL('image/png'));
        };
        
        img.onerror = () => reject(new Error('Nie udało się załadować obrazu'));
        img.src = imageUrl;
    });
}

async function processUploadedImage(file, generateSimilar, addTextOverlay, overlayText) {
    isGenerating = true;
    const loading = document.getElementById('loading');
    const generateBtn = document.getElementById('generate-image-btn');
    
    if (generateBtn) {
        generateBtn.style.opacity = '0.7';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Przetwarzam...';
    }
    
    try {
        // Najpierw wczytaj zdjęcie
        const reader = new FileReader();
        const imageDataUrl = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        
        let finalImageUrl = imageDataUrl;
        
        // Jeśli użytkownik chce wygenerować podobny obraz AI
        if (generateSimilar) {
            if (loading) {
                loading.classList.remove('hidden');
                const loadingText = loading.querySelector('p');
                if (loadingText) {
                    loadingText.textContent = 'Analizuję zdjęcie i generuję podobny obraz AI...';
                }
            }
            
            // Użyj GPT Vision do opisania zdjęcia, a potem wygeneruj podobny obraz
            const description = await describeImageWithGPT(imageDataUrl);
            console.log('Opis zdjęcia:', description);
            
            const imageType = document.getElementById('image-type')?.value || 'post';
            const styleDesc = document.getElementById('image-style-desc')?.value || 'photography';
            
            const sizes = {
                'post': '1024x1024',
                'story': '1024x1792',
                'banner': '1792x1024'
            };
            const dalleSize = sizes[imageType] || sizes['post'];
            
            const stylePrompts = {
                'photography': 'professional photography, high quality',
                'lifestyle': 'lifestyle photography, natural',
                'studio': 'studio photography',
                'outdoor': 'outdoor photography',
                'minimalist': 'minimalist style',
                'vibrant': 'vibrant colors'
            };
            const stylePrompt = stylePrompts[styleDesc] || stylePrompts['photography'];
            
            const dallePrompt = `Create a similar image showing: ${description}. Style: ${stylePrompt}, high resolution, detailed. MANDATORY: All text, signs, labels, banners, posters, or any written words visible in the image MUST be in Polish language (język polski). Do not use English text.`;
            
            finalImageUrl = await generateImageWithDalleCreative(dallePrompt, dalleSize);
            
            if (loading) {
                loading.classList.add('hidden');
            }
        }
        
        // Jeśli trzeba dodać tekst overlay
        if (addTextOverlay && overlayText && overlayText.trim()) {
            finalImageUrl = await addTextOverlayToImage(finalImageUrl, overlayText, 'post');
        }
        
        // Pokaż wynik
        const imageResult = document.getElementById('image-result');
        const generatedImage = document.getElementById('generated-image');
        
        if (imageResult && generatedImage) {
            generatedImage.src = finalImageUrl;
            imageResult.classList.remove('hidden');
            document.getElementById('results').classList.add('hidden');
            document.getElementById('prompt-result').classList.add('hidden');
            
            setTimeout(() => {
                imageResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        
    } catch (error) {
        console.error('Błąd przetwarzania zdjęcia:', error);
        alert('Błąd: ' + error.message);
    } finally {
        isGenerating = false;
        if (loading) {
            loading.classList.add('hidden');
        }
        if (generateBtn) {
            generateBtn.style.opacity = '1';
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generuj Obraz';
        }
    }
}

async function describeImageWithGPT(imageDataUrl) {
    if (!apiKey || !apiKey.trim()) {
        throw new Error('Brak klucza API');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Opisz szczegółowo to zdjęcie w kontekście dietetyki i zdrowego stylu życia. Opisz co widzisz, kolory, kompozycję, nastrój, osoby, przedmioty. Opisz po polsku, ale w sposób który można użyć do wygenerowania podobnego obrazu przez DALL-E.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageDataUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error('Błąd GPT Vision: ' + (errorData.error?.message || response.statusText));
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

function downloadGeneratedImage() {
    const img = document.getElementById('generated-image');
    if (!img || !img.src) {
        alert('Błąd: Nie znaleziono obrazu do pobrania');
        return;
    }

    const link = document.createElement('a');
    link.download = `obraz-dietetyczny-${Date.now()}.png`;
    link.href = img.src;
    link.click();
}

async function generateBackground() {
    if (isGenerating) {
        console.log('Generowanie już w toku, pomijam...');
        return;
    }
    
    isGenerating = true;
    generationAborted = false;
    const loading = document.getElementById('loading');
    const generateBtn = document.getElementById('generate-background-btn');
    
    // Ustaw przycisk na "generowanie"
    if (generateBtn) {
        generateBtn.style.opacity = '0.7';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generuję...';
    }
    
    console.log('generateBackground wywołane');
    
    try {
        // Sprawdź czy nie anulowano przed rozpoczęciem
        if (generationAborted) {
            return;
        }
        const imageType = document.getElementById('image-type').value;
        const colorScheme = document.getElementById('image-color').value;
        const style = document.getElementById('image-style').value;
        const useDalle = document.getElementById('use-dalle').checked;
        const dallePrompt = document.getElementById('dalle-prompt').value;
        const addText = document.getElementById('add-text').checked;
        const title = document.getElementById('image-title').value;
        const subtitle = document.getElementById('image-subtitle').value;

        const canvas = document.getElementById('image-canvas');
        if (!canvas) {
            throw new Error('Nie znaleziono canvas');
        }

        // Rozmiary canvas
        const sizes = {
            'post': { width: 1080, height: 1080 },
            'story': { width: 1080, height: 1920 },
            'banner': { width: 1920, height: 1080 },
            'quote': { width: 1080, height: 1080 }
        };

        const size = sizes[imageType] || sizes['post'];
        canvas.width = size.width;
        canvas.height = size.height;

        const ctx = canvas.getContext('2d');
        currentCanvas = canvas;
        currentCtx = ctx;
        currentImageType = imageType;
        currentStyle = style;

        // Generuj tło (szybko, bez DALL-E domyślnie)
        if (useDalle && apiKey && apiKey.trim() && !generationAborted) {
            if (loading) {
                loading.classList.remove('hidden');
                const loadingText = loading.querySelector('p');
                if (loadingText) {
                    loadingText.textContent = 'Generuję obraz tła DALL-E (może potrwać 10-20 sekund)...';
                }
            }
            
            try {
                // Timeout dla DALL-E - maksymalnie 25 sekund
                await Promise.race([
                    generateImageWithDalle(ctx, canvas, dallePrompt || 'healthy food', colorScheme),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout - generowanie trwa zbyt długo')), 25000)
                    )
                ]);
                
                if (generationAborted) {
                    return;
                }
            } catch (error) {
                if (generationAborted) {
                    return;
                }
                console.error('Błąd DALL-E, używam domyślnego tła:', error);
                drawBackground(ctx, canvas, colorScheme, style);
            } finally {
                if (loading && !generationAborted) {
                    loading.classList.add('hidden');
                }
            }
        } else if (!generationAborted) {
            // Szybkie generowanie tła (natychmiastowe)
            drawBackground(ctx, canvas, colorScheme, style);
        }
        
        if (generationAborted) {
            return;
        }

        // Dodaj tekst tylko jeśli jest zaznaczone i wypełnione
        if (addText && title && title.trim()) {
            drawText(ctx, canvas, title, subtitle, style, imageType);
        }

        // Pokaż wynik
        const imageResult = document.getElementById('image-result');
        if (imageResult) {
            imageResult.classList.remove('hidden');
            document.getElementById('results').classList.add('hidden');
            document.getElementById('prompt-result').classList.add('hidden');
            
            setTimeout(() => {
                imageResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

        console.log('Tło wygenerowane');
    } catch (error) {
        console.error('Błąd w generateBackground:', error);
        alert('Błąd: ' + error.message + '\n\nSpróbuj ponownie lub odśwież stronę.');
    } finally {
        // ZAWSZE resetuj stan
        isGenerating = false;
        if (loading) {
            loading.classList.add('hidden');
        }
        if (generateBtn) {
            generateBtn.style.opacity = '1';
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generuj Tło';
        }
    }
}

function addTextToImage() {
    if (!currentCtx || !currentCanvas) {
        alert('Najpierw wygeneruj tło!');
        return;
    }

    const title = document.getElementById('result-title').value;
    const subtitle = document.getElementById('result-subtitle').value;

    if (!title || !title.trim()) {
        alert('⚠️ Proszę wpisać tytuł!');
        document.getElementById('result-title').focus();
        return;
    }

    // Zapisz aktualny stan canvas (z tłem)
    const imageData = currentCtx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
    
    // Narysuj tekst na istniejącym tle
    drawText(currentCtx, currentCanvas, title, subtitle, currentStyle, currentImageType);
    
    // Opcjonalnie: wyczyść pola po dodaniu tekstu
    // document.getElementById('result-title').value = '';
    // document.getElementById('result-subtitle').value = '';
}

function drawBackground(ctx, canvas, colorScheme, style) {
    const colors = {
        'green': ['#a8e6cf', '#88d8a3', '#4ecdc4'],
        'blue': ['#a8d8ea', '#7bb3d3', '#4a90e2'],
        'orange': ['#ffd3a5', '#fd9853', '#ff6b6b'],
        'purple': ['#d4a5f5', '#b794f6', '#9f7aea'],
        'pink': ['#fbc2eb', '#f8a5c2', '#f093fb'],
        'gradient': ['#667eea', '#764ba2', '#f093fb']
    };

    const colorPalette = colors[colorScheme] || colors['green'];
    
    if (colorScheme === 'gradient' || style === 'modern') {
        // Gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, colorPalette[0]);
        gradient.addColorStop(0.5, colorPalette[1]);
        gradient.addColorStop(1, colorPalette[2]);
        ctx.fillStyle = gradient;
    } else {
        // Jednolity kolor
        ctx.fillStyle = colorPalette[0];
    }
    
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dodaj dekoracyjne elementy
    if (style === 'elegant' || style === 'bold') {
        drawDecorativeElements(ctx, canvas, colorPalette, style);
    }
}

function drawDecorativeElements(ctx, canvas, colors, style) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    
    // Okręgi w tle
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 50 + Math.random() * 100;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = colors[2];
        ctx.fill();
    }
    
    ctx.restore();
}

function drawText(ctx, canvas, title, subtitle, style, imageType) {
    // Ustawienia czcionki
    const isVertical = imageType === 'story';
    const maxWidth = isVertical ? canvas.width * 0.85 : canvas.width * 0.8;
    
    // Tytuł
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fontSize = isVertical ? 80 : 72;
    if (title.length > 30) fontSize = isVertical ? 60 : 50;
    if (title.length > 50) fontSize = isVertical ? 45 : 40;
    
    ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
    
    // Cień tekstu
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    const titleY = isVertical ? canvas.height * 0.4 : canvas.height * 0.45;
    
    // Najpierw oblicz linie tytułu (bez rysowania) aby wiedzieć ile miejsca zajmuje
    const titleLines = wrapText(ctx, title, canvas.width / 2, titleY, maxWidth, fontSize, false);
    const titleHeight = titleLines.length * fontSize * 1.5;
    
    // Narysuj tytuł
    wrapText(ctx, title, canvas.width / 2, titleY, maxWidth, fontSize, true);
    
    // Podtytuł
    if (subtitle && subtitle.trim()) {
        const subtitleFontSize = isVertical ? 40 : 36;
        ctx.font = `${subtitleFontSize}px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const subtitleY = titleY + titleHeight / 2 + (isVertical ? 60 : 50);
        wrapText(ctx, subtitle, canvas.width / 2, subtitleY, maxWidth, subtitleFontSize, true);
    }
    
    ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, fontSize, draw = true) {
    if (!text || !text.trim()) return [];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    // Ustaw czcionkę przed mierzeniem
    ctx.font = ctx.font || `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const metrics = ctx.measureText(testLine);
        const width = metrics.width;
        
        if (width < maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    if (!draw) {
        return lines; // Zwróć linie bez rysowania
    }

    let lineHeight = fontSize * 1.5;
    let totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;
        // Upewnij się że tekst mieści się w canvas
        if (lineY > fontSize && lineY < ctx.canvas.height - fontSize) {
            ctx.fillText(line, x, lineY);
            ctx.strokeText(line, x, lineY);
        }
    });
    
    return lines;
}

async function generateImageWithDalle(ctx, canvas, prompt, colorScheme) {
    if (!apiKey || !apiKey.trim()) {
        throw new Error('Brak klucza API');
    }

    // Generuj prompt dla DALL-E (krótszy, szybszy)
    const dallePromptText = `Food photography, ${prompt}, ${colorScheme} colors, clean minimalist background`;
    
    // DALL-E 3 obsługuje tylko określone rozmiary
    let dalleSize = '1024x1024';
    if (canvas.width === 1080 && canvas.height === 1920) {
        dalleSize = '1024x1792'; // Story
    } else if (canvas.width === 1920 && canvas.height === 1080) {
        dalleSize = '1792x1024'; // Banner
    }
    
    // Timeout dla całego requestu - maksymalnie 25 sekund
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: dallePromptText,
                size: dalleSize,
                quality: 'standard',
                n: 1
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || response.statusText;
            throw new Error('Błąd DALL-E API: ' + errorMsg);
        }

        const data = await response.json();
        if (!data.data || !data.data[0] || !data.data[0].url) {
            throw new Error('Nieprawidłowa odpowiedź z DALL-E API');
        }
        
        const imageUrl = data.data[0].url;

        // Załaduj obraz z timeoutem (maksymalnie 15 sekund)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await Promise.race([
            new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Nie udało się załadować obrazu z DALL-E'));
                img.src = imageUrl;
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout ładowania obrazu (15 sekund)')), 15000)
            )
        ]);

        // Narysuj obraz jako tło (skaluj do rozmiaru canvas)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Dodaj półprzezroczystą warstwę dla lepszej czytelności tekstu
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Timeout - generowanie obrazu trwa zbyt długo. Spróbuj ponownie lub użyj szybkiego tła.');
        }
        console.error('Błąd DALL-E:', error);
        throw error; // Przekaż błąd dalej, aby można było użyć domyślnego tła
    }
}

function downloadImage() {
    const canvas = document.getElementById('image-canvas');
    if (!canvas) {
        alert('Błąd: Nie znaleziono obrazu do pobrania');
        return;
    }

    const link = document.createElement('a');
    link.download = `grafika-dietetyczna-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Funkcja generowania obrazów do pomysłów
function parseIdeasFromText(text) {
    const ideas = [];
    
    // Szukaj sekcji "Tytuł:" jako głównego wzorca
    const titlePattern = /Tytuł:\s*["']?([^"'\n]+)["']?/gi;
    const titleMatches = [...text.matchAll(titlePattern)];
    
    if (titleMatches.length > 0) {
        // Parsuj każdy pomysł na podstawie wzorca "Tytuł: ..."
        for (let i = 0; i < titleMatches.length; i++) {
            const match = titleMatches[i];
            const titleStart = match.index;
            const titleEnd = titleStart + match[0].length;
            
            // Znajdź tytuł (usuń cudzysłowy jeśli są)
            let title = match[1].trim();
            
            // Znajdź opis - tekst między "Tytuł:" a następnym "Tytuł:" lub końcem
            const nextTitleStart = i < titleMatches.length - 1 ? titleMatches[i + 1].index : text.length;
            const ideaText = text.substring(titleEnd, nextTitleStart);
            
            // Wyodrębnij opis (część po "Opis:")
            const descMatch = ideaText.match(/Opis:\s*(.+?)(?=Kluczowe punkty|Call-to-action|$)/is);
            const description = descMatch ? descMatch[1].trim().replace(/\n+/g, ' ').substring(0, 200) : '';
            
            // Upewnij się że tytuł nie jest ucięty
            if (title && title.length > 3) {
                // Sprawdź czy tytuł nie kończy się w połowie słowa (jeśli kończy się literą bez spacji, może być ucięty)
                if (title.match(/[a-ząęćłńóśźż]$/i) && !title.includes('...')) {
                    // Może być ucięty - spróbuj znaleźć pełny tytuł
                    const fullTitleMatch = text.substring(titleStart).match(/Tytuł:\s*["']?([^"'\n]+?)(?:\n|Opis:|$)/i);
                    if (fullTitleMatch && fullTitleMatch[1].length > title.length) {
                        title = fullTitleMatch[1].trim();
                    }
                }
                
                ideas.push({
                    title: title,
                    description: description
                });
            }
        }
    } else {
        // Fallback: szukaj numerowanych pomysłów
        const lines = text.split('\n').filter(line => line.trim());
        let currentIdea = null;
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            // Szukaj numerowanych pomysłów (1., 2., etc.) lub wzorca "Tytuł:"
            const numberedMatch = line.match(/^(\d+)[\.\)]\s*(.+)$/);
            const titleMatch = line.match(/^(Tytuł|Temat|Pomysł|Idea)[:\s]+(.+)$/i);
            
            if (numberedMatch || titleMatch) {
                // Zapisz poprzedni pomysł jeśli istnieje i jest kompletny
                if (currentIdea && currentIdea.title && currentIdea.title.length > 5) {
                    ideas.push(currentIdea);
                }
                
                const title = numberedMatch ? numberedMatch[2] : titleMatch[2];
                // Sprawdź czy tytuł nie jest ucięty (nie kończy się w połowie słowa)
                if (title && title.length > 5 && !title.match(/[a-ząęćłńóśźż]$/)) {
                    currentIdea = {
                        title: title.trim(),
                        description: ''
                    };
                }
            } else if (currentIdea && line.length > 10 && !line.match(/^(Kluczowe|Call-to-action|Opis):/i)) {
                // Dodaj do opisu jeśli linia jest dłuższa niż 10 znaków i nie jest nagłówkiem
                if (currentIdea.description) {
                    currentIdea.description += ' ' + line;
                } else {
                    currentIdea.description = line;
                }
                // Ogranicz długość opisu
                if (currentIdea.description.length > 200) {
                    currentIdea.description = currentIdea.description.substring(0, 200) + '...';
                }
            }
        }
        
        // Dodaj ostatni pomysł jeśli jest kompletny
        if (currentIdea && currentIdea.title && currentIdea.title.length > 5) {
            ideas.push(currentIdea);
        }
    }
    
    // Ogranicz do maksymalnie 5 pomysłów (jakość ważniejsza niż ilość)
    return ideas.slice(0, 5).filter(idea => idea.title && idea.title.length > 5);
}

// Funkcje pomocnicze dla kosztów
function getImageCost(imageType) {
    const costs = {
        'post': 0.04,      // 1024x1024
        'story': 0.08,     // 1024x1792
        'banner': 0.08     // 1792x1024
    };
    return costs[imageType] || 0.04;
}

function updateSingleImageCost() {
    const imageType = document.getElementById('image-type')?.value || 'post';
    const cost = getImageCost(imageType);
    const costElement = document.getElementById('single-image-cost');
    if (costElement) {
        costElement.textContent = `$${cost.toFixed(2)}`;
    }
}

function showIdeasSelection() {
    const ideasText = window.lastGeneratedIdeas || document.getElementById('results-content')?.textContent;
    
    if (!ideasText || !ideasText.trim()) {
        alert('Najpierw wygeneruj pomysły!');
        return;
    }
    
    const ideas = parseIdeasFromText(ideasText);
    
    if (ideas.length === 0) {
        alert('Nie udało się wyodrębnić pomysłów z tekstu. Spróbuj ponownie wygenerować pomysły.');
        return;
    }
    
    const checklist = document.getElementById('ideas-checklist');
    const selectionDiv = document.getElementById('ideas-selection');
    
    if (!checklist || !selectionDiv) {
        alert('Błąd: Nie znaleziono elementów wyboru');
        return;
    }
    
    // Wyczyść i wypełnij checklist
    checklist.innerHTML = '';
    
    ideas.forEach((idea, index) => {
        const item = document.createElement('div');
        item.className = 'idea-checkbox-item';
        item.id = `idea-${index}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${index}`;
        checkbox.value = index;
        checkbox.checked = true; // Domyślnie wszystkie zaznaczone
        checkbox.addEventListener('change', updateTotalCost);
        
        const label = document.createElement('label');
        label.htmlFor = `checkbox-${index}`;
        
        const titleSpan = document.createElement('div');
        titleSpan.className = 'idea-title';
        titleSpan.textContent = idea.title;
        
        const descSpan = document.createElement('div');
        descSpan.className = 'idea-description';
        descSpan.textContent = idea.description || '';
        
        label.appendChild(checkbox);
        label.appendChild(titleSpan);
        item.appendChild(label);
        if (idea.description) {
            item.appendChild(descSpan);
        }
        
        // Dodaj efekt kliknięcia na całym elemencie
        item.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                checkbox.checked = !checkbox.checked;
                updateTotalCost();
            }
            item.classList.toggle('selected', checkbox.checked);
        });
        
        checklist.appendChild(item);
    });
    
    selectionDiv.classList.remove('hidden');
    updateTotalCost();
    
    // Przewiń do sekcji wyboru
    setTimeout(() => {
        selectionDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function updateTotalCost() {
    const checkboxes = document.querySelectorAll('#ideas-checklist input[type="checkbox"]:checked');
    const imageType = document.getElementById('image-type')?.value || 'post';
    const costPerImage = getImageCost(imageType);
    const totalCost = checkboxes.length * costPerImage;
    
    const costElement = document.getElementById('total-cost');
    if (costElement) {
        costElement.textContent = `$${totalCost.toFixed(2)} (${checkboxes.length} obrazów)`;
    }
    
    // Aktualizuj style zaznaczonych elementów
    document.querySelectorAll('.idea-checkbox-item').forEach((item, index) => {
        const checkbox = document.getElementById(`checkbox-${index}`);
        if (checkbox) {
            item.classList.toggle('selected', checkbox.checked);
        }
    });
}

async function generateSelectedImages() {
    console.log('=== ROZPOCZĘCIE GENEROWANIA OBRAZÓW ===');
    
    if (!apiKey || !apiKey.trim()) {
        alert('⚠️ Ta funkcja wymaga klucza API OpenAI. Wprowadź klucz w sekcji "Tryb API".');
        return;
    }
    
    const checkboxes = Array.from(document.querySelectorAll('#ideas-checklist input[type="checkbox"]:checked'));
    console.log('Zaznaczone checkboxy:', checkboxes.length);
    
    if (checkboxes.length === 0) {
        alert('⚠️ Wybierz przynajmniej jeden pomysł!');
        return;
    }
    
    const ideasText = window.lastGeneratedIdeas || document.getElementById('results-content')?.textContent;
    console.log('Tekst pomysłów:', ideasText?.substring(0, 100));
    
    if (!ideasText || !ideasText.trim()) {
        alert('Błąd: Nie znaleziono tekstu pomysłów. Wygeneruj pomysły ponownie.');
        return;
    }
    
    const allIdeas = parseIdeasFromText(ideasText);
    console.log('Wszystkie pomysły:', allIdeas.length, allIdeas);
    
    if (allIdeas.length === 0) {
        alert('Błąd: Nie udało się wyodrębnić pomysłów z tekstu.');
        return;
    }
    
    // Wybierz tylko zaznaczone pomysły
    const selectedIdeas = checkboxes.map(cb => {
        const index = parseInt(cb.value);
        const idea = allIdeas[index];
        console.log(`Pomysł ${index}:`, idea);
        return idea;
    }).filter(idea => idea != null);
    
    console.log('Wybrane pomysły:', selectedIdeas.length, selectedIdeas);
    
    if (selectedIdeas.length === 0 || selectedIdeas.some(idea => !idea || !idea.title)) {
        alert('Błąd: Nie udało się wyodrębnić wybranych pomysłów. Sprawdź konsolę (F12).');
        return;
    }
    
    const gallery = document.getElementById('ideas-images-gallery');
    const galleryContainer = document.getElementById('gallery-container');
    const loading = document.getElementById('loading');
    
    if (!gallery || !galleryContainer) {
        alert('Błąd: Nie znaleziono elementów galerii');
        return;
    }
    
    // Pokaż loading
    if (loading) {
        loading.classList.remove('hidden');
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = `Generuję ${selectedIdeas.length} obrazów DALL-E (może potrwać kilka minut)...`;
        }
    }
    
    // Wyczyść galerię
    galleryContainer.innerHTML = '';
    gallery.classList.remove('hidden');
    
    // Pobierz ustawienia z formularza obrazów
    const imageType = document.getElementById('image-type')?.value || 'post';
    const styleDesc = document.getElementById('image-style-desc')?.value || 'photography';
    
    // Rozmiary dla DALL-E
    const sizes = {
        'post': '1024x1024',
        'story': '1024x1792',
        'banner': '1792x1024'
    };
    
    const dalleSize = sizes[imageType] || sizes['post'];
    const costPerImage = getImageCost(imageType);
    
    const stylePrompts = {
        'photography': 'professional photography, high quality',
        'lifestyle': 'lifestyle photography, natural',
        'studio': 'studio photography',
        'outdoor': 'outdoor photography',
        'minimalist': 'minimalist style',
        'vibrant': 'vibrant colors'
    };
    
    const stylePrompt = stylePrompts[styleDesc] || stylePrompts['photography'];
    
    let successCount = 0;
    let failCount = 0;
    
    // Generuj obrazy dla wybranych pomysłów
    for (let i = 0; i < selectedIdeas.length; i++) {
        const idea = selectedIdeas[i];
        
        console.log(`Generuję obraz ${i + 1}/${selectedIdeas.length}:`, idea.title);
        
        if (loading) {
            const loadingText = loading.querySelector('p');
            if (loadingText) {
                loadingText.textContent = `Generuję obraz ${i + 1} z ${selectedIdeas.length}: ${idea.title.substring(0, 30)}... (koszt: $${costPerImage.toFixed(2)})`;
            }
        }
        
        try {
            // Utwórz opis obrazu - mieszanka polskiego i angielskiego dla lepszej kompatybilności
            const ideaText = `${idea.title}. ${idea.description || ''}`;
            // WAŻNE: Instrukcja o polskich napisach na początku i na końcu + użycie polskiego w opisie
            // DALL-E lepiej reaguje gdy widzi polskie słowa w kontekście
            const imageDescription = `Create an image showing: ${ideaText}. Style: ${stylePrompt}, high resolution, detailed. MANDATORY: All text, signs, labels, banners, posters, or any written words visible in the image MUST be in Polish language (język polski). Do not use English text. Use Polish words like "${idea.title.split(' ').slice(0, 3).join(' ')}" as examples of Polish text style.`;
            
            console.log('Opis obrazu:', imageDescription);
            
            // Generuj obraz z DALL-E
            console.log(`Rozpoczynam generowanie obrazu ${i + 1}...`);
            const imageUrl = await generateImageWithDalleCreative(imageDescription, dalleSize);
            
            if (!imageUrl) {
                throw new Error('Brak URL obrazu');
            }
            
            console.log(`Obraz ${i + 1} wygenerowany, URL:`, imageUrl.substring(0, 50));
            
            // Utwórz element galerii
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'gallery-item-title';
            titleDiv.textContent = idea.title || `Pomysł ${i + 1}`;
            
            const costBadge = document.createElement('div');
            costBadge.style.cssText = 'font-size: 0.8em; color: #666; margin-top: 5px;';
            costBadge.textContent = `💰 Koszt: $${costPerImage.toFixed(2)}`;
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.cssText = 'max-width: 100%; height: auto; border-radius: 8px;';
            img.alt = idea.title || `Pomysł ${i + 1}`;
            img.onerror = () => {
                console.error(`Błąd ładowania obrazu ${i + 1}`);
                img.style.border = '2px solid red';
                img.alt = 'Błąd ładowania obrazu';
            };
            img.onload = () => {
                console.log(`Obraz ${i + 1} załadowany pomyślnie`);
            };
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'gallery-item-actions';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'copy-btn';
            downloadBtn.textContent = 'Pobierz';
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = `pomysl-${i + 1}-${Date.now()}.png`;
                link.href = imageUrl;
                link.click();
            };
            
            actionsDiv.appendChild(downloadBtn);
            
            galleryItem.appendChild(titleDiv);
            galleryItem.appendChild(costBadge);
            galleryItem.appendChild(img);
            galleryItem.appendChild(actionsDiv);
            
            galleryContainer.appendChild(galleryItem);
            successCount++;
            
            console.log(`Obraz ${i + 1} dodany do galerii. Sukces: ${successCount}, Błędy: ${failCount}`);
            
            // Opóźnienie między generowaniami (DALL-E ma limity)
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`Błąd generowania obrazu ${i + 1}:`, error);
            console.error('Szczegóły błędu:', {
                message: error.message,
                stack: error.stack,
                idea: idea
            });
            
            // Dodaj element błędu do galerii
            const errorItem = document.createElement('div');
            errorItem.className = 'gallery-item';
            errorItem.style.border = '2px solid #dc3545';
            errorItem.innerHTML = `
                <div class="gallery-item-title" style="color: #dc3545;">❌ Błąd: ${idea.title || `Pomysł ${i + 1}`}</div>
                <div style="color: #666; margin-top: 10px;">${error.message}</div>
            `;
            galleryContainer.appendChild(errorItem);
            
            failCount++;
            // Kontynuuj z następnym obrazem
        }
    }
    
    console.log('=== ZAKOŃCZENIE GENEROWANIA ===');
    console.log('Sukces:', successCount, 'Błędy:', failCount);
    
    // Ukryj loading
    if (loading) {
        loading.classList.add('hidden');
    }
    
    // Przewiń do galerii
    setTimeout(() => {
        gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    const totalCost = successCount * costPerImage;
    const message = successCount > 0 
        ? `Wygenerowano ${successCount} obrazów${failCount > 0 ? ` (${failCount} błędów)` : ''}!\n\nCałkowity koszt: $${totalCost.toFixed(2)}`
        : `Nie udało się wygenerować żadnego obrazu. Sprawdź konsolę przeglądarki (F12) aby zobaczyć szczegóły błędów.`;
    
    alert(message);
    console.log('Generowanie zakończone:', { successCount, failCount, totalCost });
}

