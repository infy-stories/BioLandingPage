(() => {
    const IMAGE_WIDTH = 1080;
    const IMAGE_HEIGHT = 1440;
    const STORY_FONT_SIZE = 44;
    const NORMAL_STORY_LIMIT = 2000;
    const SLIDES_PER_UPLOAD = 10;
    const API_ROOT = 'https://jarvis-ihcp.vercel.app/api';

    const themes = [
        { name: 'Midnight', background: '#111827', text: '#F9FAFB' },
        { name: 'Cream', background: '#FFF7ED', text: '#292524' },
        { name: 'Forest', background: '#12372A', text: '#F0FDF4' },
        { name: 'Deep Blue', background: '#172554', text: '#EFF6FF' },
        { name: 'Burgundy', background: '#3B0A14', text: '#FFF1F2' },
    ];

    const form = document.getElementById('storyForm');
    const storyInput = document.getElementById('storyText');
    const ageGenderInput = document.getElementById('ageGender');
    const previewViewport = document.getElementById('previewViewport');
    const previewStage = document.getElementById('previewStage');
    const measurementHost = document.getElementById('measurementHost');
    const submitButton = document.getElementById('submitStory');
    const submitStatus = document.getElementById('submitStatus');
    const characterCount = document.getElementById('characterCount');
    const storyError = document.getElementById('storyError');
    const submitControls = document.querySelector('.story-submit-controls');
    const submissionSuccess = document.getElementById('submissionSuccess');
    let selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    let slides = [];
    let activeSlide = 0;
    let previewObserver;

    function setButtonPressed(container, selectedButton) {
        container.querySelectorAll('button').forEach(button => {
            button.setAttribute('aria-pressed', String(button === selectedButton));
        });
    }

    function buildThemeOptions() {
        const container = document.getElementById('themeOptions');
        themes.forEach(theme => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'theme-option';
            button.title = `${theme.name} theme`;
            button.setAttribute('aria-label', `${theme.name} theme`);
            button.setAttribute('aria-pressed', String(theme === selectedTheme));

            const preview = document.createElement('span');
            preview.className = 'theme-chip';
            preview.style.backgroundColor = theme.background;
            preview.style.color = theme.text;
            preview.textContent = 'Aa';

            const label = document.createElement('span');
            label.textContent = theme.name;
            button.append(preview, label);
            button.addEventListener('click', () => {
                setButtonPressed(container, button);
                selectedTheme = theme;
                applySlideColors();
            });
            container.appendChild(button);
        });
    }

    function applySlideColors() {
        slides.forEach(slide => {
            slide.style.backgroundColor = selectedTheme.background;
            slide.style.color = selectedTheme.text;
        });
    }

    buildThemeOptions();

    function createSlide(index) {
        const slide = document.createElement('article');
        slide.className = 'story-slide';
        slide.style.setProperty('--story-font-size', `${STORY_FONT_SIZE}px`);
        slide.style.setProperty('--story-font-size-css', `${STORY_FONT_SIZE / 3}px`);
        slide.style.backgroundColor = selectedTheme.background;
        slide.style.color = selectedTheme.text;

        const body = document.createElement('div');
        body.className = 'story-body';

        const footer = document.createElement('div');
        footer.className = 'story-footer';
        const divider = document.createElement('div');
        divider.className = 'story-divider';
        const leftLine = document.createElement('span');
        leftLine.className = 'story-divider-line';
        const dots = document.createElement('span');
        dots.className = 'story-divider-dots';
        for (let dotIndex = 0; dotIndex < 3; dotIndex++) {
            dots.appendChild(document.createElement('i'));
        }
        const rightLine = document.createElement('span');
        rightLine.className = 'story-divider-line';
        divider.append(leftLine, dots, rightLine);

        const footerRow = document.createElement('div');
        footerRow.className = 'story-footer-row';
        const timestamp = document.createElement('span');
        timestamp.className = 'story-timestamp';
        timestamp.textContent = index === 0 ? getFormattedTimestamp() : '';
        const brand = document.createElement('span');
        brand.textContent = '@infy_stories';
        const page = document.createElement('span');
        page.className = 'story-slide-number';
        page.textContent = '1/1';
        footerRow.append(timestamp, page, brand);
        footer.append(divider, footerRow);
        slide.append(body);
        slide.append(footer);
        return slide;
    }

    function getFormattedTimestamp(date = new Date()) {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).formatToParts(date).map(part => [part.type, part.value]));
        const day = Number(parts.day);
        const suffix = day % 100 >= 11 && day % 100 <= 13
            ? 'th'
            : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');
        return `${day}${suffix} ${parts.month} ${parts.year} \u2014 ${parts.hour}:${parts.minute} ${parts.dayPeriod.toUpperCase()}`;
    }

    function paginateStory(text) {
        measurementHost.replaceChildren();
        const result = [];
        let slide = createSlide(0);
        let body = slide.querySelector('.story-body');
        let content = document.createTextNode('');
        body.appendChild(content);
        measurementHost.appendChild(slide);
        result.push(slide);

        const tokens = text.match(/\s+|\S+/gu) || [];
        tokens.forEach(token => {
            const previousLength = content.length;
            content.appendData(token);
            if (body.scrollHeight > body.clientHeight + 1 && body.textContent.trim()) {
                content.deleteData(previousLength, token.length);
                slide = createSlide(result.length);
                body = slide.querySelector('.story-body');
                content = document.createTextNode(token);
                body.appendChild(content);
                measurementHost.appendChild(slide);
                result.push(slide);
            }
        });

        const total = result.length;
        result.forEach((current, index) => {
            current.querySelector('.story-slide-number').textContent = `${index + 1}/${total}`;
        });
        return result;
    }

    function storyTextForPreview() {
        const story = storyInput.value.replace(/^\$+/, '').trim();
        const ageGender = ageGenderInput.value.trim();
        return [ageGender, story].filter(Boolean).join('\n');
    }

    function setPreviewScale() {
        const scale = previewViewport.clientWidth / 360;
        previewStage.style.transform = `scale(${scale})`;
    }

    function showSlide(index) {
        if (!slides.length) return;
        activeSlide = Math.max(0, Math.min(index, slides.length - 1));
        previewStage.replaceChildren(slides[activeSlide]);
        document.getElementById('slidePosition').textContent = `${activeSlide + 1} / ${slides.length}`;
        document.getElementById('previousSlide').disabled = activeSlide === 0;
        document.getElementById('nextSlide').disabled = activeSlide === slides.length - 1;
        setPreviewScale();
    }

    function updatePreview() {
        const text = storyTextForPreview();
        slides = paginateStory(text);
        applySlideColors();
        showSlide(Math.min(activeSlide, slides.length - 1));
    }

    function updateCharacterCount() {
        const characters = Array.from(storyInput.value).length;
        const adminStory = storyInput.value.startsWith('$');
        if (!adminStory && characters > NORMAL_STORY_LIMIT) {
            storyInput.value = Array.from(storyInput.value).slice(0, NORMAL_STORY_LIMIT).join('');
        }
        const currentLength = Array.from(storyInput.value).length;
        characterCount.textContent = storyInput.value.startsWith('$')
            ? `${currentLength} characters`
            : `${NORMAL_STORY_LIMIT - currentLength} characters remaining`;
        storyError.textContent = '';
        updatePreview();
    }

    storyInput.addEventListener('input', updateCharacterCount);
    ageGenderInput.addEventListener('input', updatePreview);
    document.getElementById('previousSlide').addEventListener('click', () => showSlide(activeSlide - 1));
    document.getElementById('nextSlide').addEventListener('click', () => showSlide(activeSlide + 1));
    if ('ResizeObserver' in window) {
        previewObserver = new ResizeObserver(setPreviewScale);
        previewObserver.observe(previewViewport);
    } else {
        window.addEventListener('resize', setPreviewScale);
    }

    async function renderJpeg(slide) {
        if (!window.html2canvas) throw new Error('Image renderer did not load. Check your connection and try again.');
        await document.fonts.ready;
        const originalParent = slide.parentNode;
        const originalNextSibling = slide.nextSibling;
        measurementHost.appendChild(slide);
        try {
            const canvas = await window.html2canvas(slide, {
                backgroundColor: null,
                scale: IMAGE_WIDTH / 360,
                width: 360,
                height: IMAGE_HEIGHT / (IMAGE_WIDTH / 360),
                logging: false,
            });
            return await new Promise((resolve, reject) => {
                canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not render this slide. Please try again.')), 'image/jpeg', 0.84);
            });
        } finally {
            if (originalParent) {
                originalParent.insertBefore(slide, originalNextSibling);
            } else {
                slide.remove();
            }
        }
    }

    function storyForSubmission() {
        return storyInput.value.trim();
    }

    function createUploadBatches(totalSlides) {
        return Math.ceil(totalSlides / SLIDES_PER_UPLOAD);
    }

    async function submitStory(event) {
        event.preventDefault();
        const story = storyForSubmission();
        const isAdmin = story.startsWith('$');
        if (!story || (!isAdmin && Array.from(story).length > NORMAL_STORY_LIMIT)) {
            storyError.textContent = story ? 'Stories are limited to 2000 characters.' : 'Please enter your story.';
            storyInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.classList.add('btn-disabled');
        submitStatus.textContent = 'Preparing your slides...';
        slides[0].querySelector('.story-timestamp').textContent = getFormattedTimestamp();
        let uploadToken = '';
        const batchCount = createUploadBatches(slides.length);

        try {
            for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
                const start = batchIndex * SLIDES_PER_UPLOAD;
                const end = Math.min(start + SLIDES_PER_UPLOAD, slides.length);
                const data = new FormData();
                data.append('story', story);
                data.append('age_gender', ageGenderInput.value.trim());
                data.append('batch_index', String(batchIndex));
                data.append('batch_count', String(batchCount));
                if (uploadToken) data.append('upload_token', uploadToken);

                for (let index = start; index < end; index++) {
                    submitStatus.textContent = `Rendering slide ${index + 1} of ${slides.length}...`;
                    const image = await renderJpeg(slides[index]);
                    data.append('images', image, `slide-${index + 1}.jpg`);
                }

                submitStatus.textContent = `Sending slides ${start + 1}-${end} of ${slides.length}...`;
                const response = await fetch(`${API_ROOT}/postConfession`, { method: 'POST', body: data });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Story submission failed.');
                uploadToken = result.nextUploadToken || '';
            }

            form.hidden = true;
            submitControls.hidden = true;
            submissionSuccess.hidden = false;
            submitStatus.textContent = '';
            if (previewObserver) previewObserver.disconnect();
        } catch (error) {
            submitStatus.textContent = error.message || 'Could not submit your story. Please try again.';
            submitButton.disabled = false;
            submitButton.classList.remove('btn-disabled');
        }
    }

    form.addEventListener('submit', submitStory);

    updateCharacterCount();
})();
