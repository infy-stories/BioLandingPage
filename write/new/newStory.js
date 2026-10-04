(() => {
    if (!window.storyEntryAllowed) return;

    const IMAGE_WIDTH = 1080;
    const IMAGE_HEIGHT = 1440;
    const STORY_FONT_SIZE = 42;
    const NORMAL_STORY_LIMIT = 2000;
    const SLIDES_PER_UPLOAD = 10;
    const API_ROOT = 'https://jarvis-ihcp.vercel.app/api';
    const DARK_THEME_TEXT = '#F5F1E8';
    const LIGHT_THEME_TEXT = '#292725';

    const themes = [
        { name: 'Midnight', emoji: '\uD83D\uDDA4', background: '#111111', text: DARK_THEME_TEXT, accent: '#2563EB' },
        { name: 'Cocoa', emoji: '\uD83E\uDD0E', background: '#4A3028', text: DARK_THEME_TEXT, accent: '#C65D24' },
        { name: 'Burgundy', emoji: '\uD83C\uDF77', background: '#5A1725', text: DARK_THEME_TEXT, accent: '#D58A9A' },
        { name: 'Forest', emoji: '\uD83C\uDF32', background: '#17352D', text: DARK_THEME_TEXT, accent: '#8FB89F' },
        { name: 'Navy', emoji: '\uD83C\uDF0A', background: '#101D35', text: DARK_THEME_TEXT, accent: '#35B5A4' },
        { name: 'Plum', emoji: '\uD83D\uDC9C', background: '#351B35', text: DARK_THEME_TEXT, accent: '#C889B5' },
        { name: 'Ivory', emoji: '\uD83C\uDF3E', background: '#F7F3EA', text: LIGHT_THEME_TEXT, accent: '#315FE8' },
        { name: 'Blush', emoji: '\uD83C\uDF38', background: '#F7E4E4', text: LIGHT_THEME_TEXT, accent: '#C75C73' },
        { name: 'Sage Mist', emoji: '\uD83C\uDF3F', background: '#E4EEE5', text: LIGHT_THEME_TEXT, accent: '#39705A' },
        { name: 'Powder Blue', emoji: '\uD83E\uDE75', background: '#E3EFF5', text: LIGHT_THEME_TEXT, accent: '#168F96' },
        { name: 'Peach', emoji: '\uD83C\uDF51', background: '#F9E4D5', text: LIGHT_THEME_TEXT, accent: '#D56738' },
        { name: 'Lavender Mist', emoji: '\uD83E\uDEBB', background: '#ECE7F5', text: LIGHT_THEME_TEXT, accent: '#7561B5' },
    ];
    const backgroundCache = new Map();

    const form = document.getElementById('storyForm');
    const storyInput = document.getElementById('storyText');
    const ageGenderInput = document.getElementById('ageGender');
    const adminTimestampInput = document.getElementById('storyDateTime');
    const adminEntry = window.storyAdminEntry;
    const previewViewport = document.getElementById('previewViewport');
    const previewStage = document.getElementById('previewStage');
    const measurementHost = document.getElementById('measurementHost');
    const submitButton = document.getElementById('submitStory');
    const submitStatus = document.getElementById('submitStatus');
    const characterCount = document.getElementById('characterCount');
    const storyError = document.getElementById('storyError');
    const submitControls = document.querySelector('.story-submit-controls');
    const submissionSuccess = document.getElementById('submissionSuccess');
    const generateTitlesInput = document.getElementById('generateTitles');
    const MAX_TITLE_RETRIES = 1;
    const titleSuggestions = document.getElementById('titleSuggestions');
    const titleGenerationStatus = document.getElementById('titleGenerationStatus');
    const titleOptions = document.getElementById('titleOptions');
    const titleForm = document.getElementById('titleForm');
    const retryTitles = document.getElementById('retryTitles');
    const submitTitleButton = document.getElementById('submitTitle');
    const titleDeliveryStatus = document.getElementById('titleDeliveryStatus');
    const previewTabs = document.getElementById('previewTabs');
    const previewNavigation = document.querySelector('.preview-navigation');
    let submittedStory;
    let selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    let slides = [];
    let activeSlide = 0;
    let previewObserver;
    let adminTitleSlide;
    let adminTitleTheme = selectedTheme;
    let adminTitleRendering = false;
    const adminTitleInput = document.getElementById('adminTitleText');
    const adminTitleStage = document.getElementById('adminTitleStage');
    const adminTitleViewport = document.getElementById('adminTitleViewport');
    const downloadAdminTitleButton = document.getElementById('downloadAdminTitle');
    const adminTitleStatus = document.getElementById('adminTitleStatus');

    if (adminEntry) {
        storyInput.value = '$ ';
        document.getElementById('adminSettings').hidden = false;
        document.getElementById('adminTitleTool').hidden = false;
    }

    function setButtonPressed(container, selectedButton) {
        container.querySelectorAll('button').forEach(button => {
            button.setAttribute('aria-pressed', String(button === selectedButton));
        });
    }

    function buildThemeOptions(container = document.getElementById('themeOptions'), selected = selectedTheme, onSelect = theme => {
        selectedTheme = theme;
        applySlideColors();
    }) {
        themes.forEach(theme => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'theme-option';
            button.title = `${theme.name} theme`;
            button.setAttribute('aria-label', `${theme.name} theme`);
            button.setAttribute('aria-pressed', String(theme === selected));

            const preview = document.createElement('span');
            preview.className = 'theme-chip';
            preview.style.backgroundColor = theme.background;
            preview.style.color = theme.text;
            preview.style.borderBottom = `4px solid ${theme.accent}`;
            preview.textContent = theme.emoji;
            preview.setAttribute('aria-hidden', 'true');
            button.append(preview);
            button.addEventListener('click', () => {
                setButtonPressed(container, button);
                onSelect(theme);
            });
            container.appendChild(button);
        });
    }

    function applySlideColors() {
        slides.forEach(slide => {
            slide.style.backgroundColor = selectedTheme.background;
            slide.style.color = selectedTheme.text;
            slide.style.setProperty('--slide-accent', selectedTheme.accent);
            slide.style.setProperty('--slide-background', selectedTheme.background);
            applySlideBackground(slide);
        });
    }

    function drawBackground(theme) {
        if (backgroundCache.has(theme.name)) return backgroundCache.get(theme.name);
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_WIDTH;
        canvas.height = IMAGE_HEIGHT;
        const context = canvas.getContext('2d');
        context.scale(3, 3);
        context.strokeStyle = theme.accent;
        context.fillStyle = theme.accent;
        context.lineWidth = 0.8;
        context.lineCap = 'round';
        const stroke = (path, opacity = 0.65) => {
            context.globalAlpha = opacity;
            context.stroke(new Path2D(path));
        };
        const fill = (path, opacity = 0.25) => {
            context.globalAlpha = opacity;
            context.fill(new Path2D(path));
        };
        const sprig = (x, y, rotation, scale, filled = false) => {
            context.save();
            context.translate(x, y);
            context.rotate(rotation);
            context.scale(scale, scale);
            stroke('M 0 130 Q -22 70 -9 0');
            const leaves = [
                'M -9 35 Q -34 14 -25 -14 Q -4 5 -9 35 Z',
                'M -11 60 Q 13 33 12 8 Q -14 22 -11 60 Z',
                'M -9 84 Q -46 65 -43 36 Q -17 48 -9 84 Z',
                'M -2 106 Q 20 78 20 52 Q -7 67 -2 106 Z',
            ];
            leaves.forEach(path => {
                if (filled) fill(path, 0.45);
                stroke(path, filled ? 0.7 : 0.6);
            });
            stroke('M -9 35 L -25 -14 M -11 60 L 12 8 M -9 84 L -43 36 M -2 106 L 20 52', 0.45);
            context.restore();
        };

        switch (theme.name) {
        case 'Midnight':
            [[360, 0, 0], [0, 480, Math.PI]].forEach(([x, y, rotation]) => {
                context.save();
                context.translate(x, y);
                context.rotate(rotation);
                for (let line = 0; line < 34; line++) {
                    const offset = line * 1.8;
                    context.lineWidth = 0.6 + line % 3;
                    stroke(`M ${-72 + offset} -5 Q ${-88 + offset} 18 ${-66 + offset} ${47 + line % 7 * 3}`, 0.18 + line % 5 * 0.1);
                }
                context.restore();
            });
            fill('M 0 28 L 95 28 L 68 36 Z', 0.12);
            break;
        case 'Cocoa':
            fill('M 238 0 C 225 54 306 47 360 86 L 360 0 Z', 0.19);
            fill('M 0 382 C 31 405 9 456 86 480 L 0 480 Z', 0.55);
            fill('M 214 480 C 219 422 286 457 303 414 Q 327 365 360 377 L 360 480 Z', 0.26);
            context.strokeStyle = theme.text;
            stroke('M 310 131 Q 306 72 346 23 M 317 98 C 278 66 304 42 346 23 C 350 61 341 78 317 98 M 317 98 Q 329 62 346 23', 0.65);
            context.strokeStyle = theme.accent;
            stroke('M 181 480 C 199 437 255 466 274 480', 0.65);
            break;
        case 'Burgundy':
            fill('M 282 0 C 282 27 322 48 360 34 L 360 0 Z', 0.25);
            fill('M 0 362 C 50 372 18 447 92 480 L 0 480 Z', 0.27);
            fill('M 246 480 C 269 423 319 417 360 384 L 360 480 Z', 0.23);
            sprig(346, 35, -0.22, 0.72);
            stroke('M 171 480 C 193 421 250 469 289 446 S 325 445 363 437', 0.5);
            break;
        case 'Forest':
            fill('M 308 0 Q 348 17 336 72 T 360 146 L 360 0 Z', 0.33);
            fill('M 0 326 C 18 359 43 340 47 386 C 50 434 118 441 125 480 L 0 480 Z', 0.19);
            fill('M 201 480 C 207 432 291 466 280 414 C 270 372 336 391 360 315 L 360 480 Z', 0.29);
            sprig(318, 45, -0.3, 0.9, true);
            break;
        case 'Navy':
            fill('M 321 0 C 266 29 292 61 325 66 Q 344 74 360 120 L 360 0 Z', 0.21);
            fill('M 240 480 C 261 442 292 470 302 438 Q 313 405 360 415 L 360 480 Z', 0.2);
            stroke('M 309 -5 C 271 29 295 70 320 87 S 342 126 360 156', 0.8);
            break;
        case 'Plum':
            fill('M 274 0 C 266 37 330 32 314 67 C 304 87 345 106 360 145 L 360 0 Z', 0.31);
            fill('M 0 279 C 34 304 12 347 31 375 C 51 405 21 440 79 480 L 0 480 Z', 0.31);
            fill('M 227 480 Q 268 412 307 444 Q 336 421 360 396 L 360 480 Z', 0.37);
            sprig(316, 50, -0.25, 0.85);
            break;
        case 'Ivory':
            fill('M 256 0 Q 272 34 314 36 Q 342 45 360 93 L 360 0 Z', 0.13);
            fill('M 0 305 C 42 338 11 394 48 426 Q 62 461 117 480 L 0 480 Z', 0.2);
            fill('M 283 480 Q 293 425 360 398 L 360 480 Z', 0.12);
            sprig(297, 98, -0.58, 0.78);
            stroke('M 182 480 C 201 432 244 465 278 456 S 328 440 363 425', 0.55);
            break;
        case 'Blush':
            fill('M 287 0 C 265 36 328 49 319 81 Q 341 103 360 120 L 360 0 Z', 0.18);
            fill('M 0 359 C 37 375 17 424 64 449 Q 84 462 95 480 L 0 480 Z', 0.2);
            fill('M 259 480 Q 299 423 360 421 L 360 480 Z', 0.14);
            sprig(335, 45, -0.15, 0.77);
            stroke('M 211 480 Q 226 443 274 458 T 363 433 M 347 114 Q 316 127 325 157', 0.55);
            break;
        case 'Sage Mist':
            fill('M 316 0 C 345 28 325 54 349 85 L 360 109 L 360 0 Z', 0.17);
            fill('M 0 325 C 31 340 18 378 52 407 Q 42 450 106 480 L 0 480 Z', 0.15);
            fill('M 225 480 C 254 451 285 465 290 421 Q 299 390 360 363 L 360 480 Z', 0.17);
            sprig(321, 35, -0.4, 0.95, true);
            stroke('M 237 480 Q 259 442 306 428 T 363 394', 0.55);
            break;
        case 'Lavender Mist':
            fill('M 277 0 C 233 40 304 47 315 78 Q 331 96 360 108 L 360 0 Z', 0.16);
            fill('M 0 283 C 32 314 7 351 26 385 C 50 424 33 457 83 480 L 0 480 Z', 0.2);
            fill('M 221 480 C 249 438 288 471 314 438 Q 330 425 360 442 L 360 480 Z', 0.18);
            [[309, 153, 13], [328, 198, 7], [289, 109, 3], [299, 119, 2]].forEach(([x, y, size]) => {
                fill(`M ${x} ${y - size} Q ${x} ${y} ${x + size / 2} ${y} Q ${x} ${y} ${x} ${y + size} Q ${x} ${y} ${x - size / 2} ${y} Q ${x} ${y} ${x} ${y - size}`, 0.8);
            });
            stroke('M 0 305 C 31 331 19 366 2 389 M 241 480 Q 284 437 323 479', 0.75);
            break;
        case 'Peach':
            fill('M 290 0 Q 320 39 360 44 L 360 0 Z', 0.14);
            fill('M 0 322 C 29 359 7 407 43 430 Q 66 456 110 480 L 0 480 Z', 0.22);
            fill('M 224 480 C 253 458 248 411 292 408 Q 330 413 360 383 L 360 480 Z', 0.14);
            sprig(317, 45, 0.18, 0.87);
            stroke('M 244 480 Q 260 439 296 410 M 255 121 Q 307 105 325 55', 0.6);
            break;
        case 'Powder Blue':
            fill('M 323 0 C 302 25 345 44 337 68 Q 335 81 360 95 L 360 0 Z', 0.16);
            fill('M 0 332 C 42 352 7 403 41 425 Q 72 447 92 480 L 0 480 Z', 0.2);
            fill('M 229 480 Q 258 453 265 421 C 275 382 330 390 360 345 L 360 480 Z', 0.18);
            stroke('M 313 -5 C 285 34 337 62 345 87 S 351 106 362 115', 0.85);
            break;
        }
        context.fillStyle = theme.text;
        context.globalAlpha = 0.035;
        for (let grain = 0; grain < 6500; grain++) {
            const x = (grain * 73.37) % 360;
            const y = (grain * 137.51) % 480;
            context.fillRect(x, y, 0.35, 0.35);
        }
        const image = canvas.toDataURL('image/png');
        backgroundCache.set(theme.name, image);
        return image;
    }

    function applySlideBackground(slide) {
        slide.querySelector('.story-background').src = drawBackground(selectedTheme);
    }

    buildThemeOptions();
    document.getElementById('randomPalette').addEventListener('click', () => {
        const alternatives = themes.filter(theme => theme !== selectedTheme);
        selectedTheme = alternatives[Math.floor(Math.random() * alternatives.length)];
        const container = document.getElementById('themeOptions');
        setButtonPressed(container, container.querySelectorAll('button')[themes.indexOf(selectedTheme)]);
        applySlideColors();
    });

    function createSlide(index) {
        const slide = document.createElement('article');
        slide.className = 'story-slide';
        slide.style.setProperty('--story-font-size', `${STORY_FONT_SIZE}px`);
        slide.style.setProperty('--story-font-size-css', `${STORY_FONT_SIZE / 3}px`);
        slide.style.backgroundColor = selectedTheme.background;
        slide.style.color = selectedTheme.text;
        slide.style.setProperty('--slide-accent', selectedTheme.accent);

        const overlay = document.createElement('img');
        overlay.className = 'story-background';
        overlay.alt = '';
        overlay.setAttribute('aria-hidden', 'true');
        slide.appendChild(overlay);
        applySlideBackground(slide);

        const header = document.createElement('div');
        header.className = 'story-brand';
        const logo = document.createElement('i');
        logo.className = 'fas fa-infinity story-brand-logo';
        logo.setAttribute('aria-hidden', 'true');
        const brand = document.createElement('span');
        brand.className = 'story-brand-name';
        brand.textContent = 'INFY STORIES';
        header.append(logo, brand);

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
        const page = document.createElement('span');
        page.className = 'story-slide-number';
        page.textContent = '01';
        footerRow.append(timestamp);
        footer.append(divider, footerRow);
        slide.append(header);
        slide.append(body);
        slide.append(footer);
        slide.append(page);
        return slide;
    }

    function getStoryDate() {
        if (adminEntry && adminTimestampInput.value) {
            const selectedDate = new Date(`${adminTimestampInput.value}+05:30`);
            if (!Number.isNaN(selectedDate.getTime())) return selectedDate;
        }
        return new Date();
    }

    function getFormattedTimestamp(date = getStoryDate()) {
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
            const page = current.querySelector('.story-slide-number');
            page.textContent = String(index + 1).padStart(2, '0');
            page.setAttribute('aria-label', `Slide ${index + 1} of ${total}`);
        });
        return result;
    }

    function storyTextForPreview() {
        const story = storyInput.value.replace(/^\$+/, '').trim();
        const ageGender = ageGenderInput.value.trim();
        return [ageGender, story].filter(Boolean).join('\n\n');
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
    adminTimestampInput.addEventListener('input', updatePreview);
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
        await Promise.all(Array.from(slide.querySelectorAll('img'))
            .filter(image => !image.hidden && (!image.complete || !image.naturalWidth))
            .map(image => image.decode()));
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

    function setSubmittingMessage(message) {
        submitButton.textContent = message;
    }

    async function apiJson(path, options, timeout = 60000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(`${API_ROOT}/${path}`, { ...options, signal: controller.signal });
            const result = await response.json();
            if (!response.ok) {
                throw Object.assign(new Error(result.error || 'Request failed. Please try again later.'), { httpStatus: response.status });
            }
            return result;
        } catch (error) {
            if (error.name === 'AbortError') throw new Error('Request timed out. Please try again later.');
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    function syncTitleStatus(snapshot) {
        if (snapshot !== submittedStory) return;
        if (!snapshot.generateTitles || snapshot.titleSent) {
            titleSuggestions.hidden = true;
            return;
        }
        if (!snapshot.storySent) return;
        titleSuggestions.hidden = false;
        titleGenerationStatus.textContent = snapshot.titlesLoading
            ? 'Generating title suggestions...'
            : snapshot.titleError || '';
        titleGenerationStatus.hidden = !titleGenerationStatus.textContent;
        retryTitles.hidden = !snapshot.titleError || (snapshot.titleRetries || 0) >= MAX_TITLE_RETRIES;
        retryTitles.disabled = snapshot.titlesLoading || !snapshot.submissionToken;
        titleForm.hidden = !snapshot.titles || !snapshot.submissionToken;
        submitTitleButton.disabled = !snapshot.submissionToken || !snapshot.selectedTitle || snapshot.titleSending || snapshot.titleSent;
    }

    function createTitleSlide(snapshot, title) {
        const slide = createSlide(0);
        slide.classList.add('story-title-slide');
        slide.style.backgroundColor = snapshot.theme.background;
        slide.style.color = snapshot.theme.text;
        slide.style.setProperty('--slide-accent', snapshot.theme.accent);
        slide.style.setProperty('--slide-background', snapshot.theme.background);
        slide.querySelector('.story-background').src = drawBackground(snapshot.theme);
        slide.querySelector('.story-footer').remove();
        slide.querySelector('.story-slide-number').remove();
        const body = slide.querySelector('.story-body');
        body.className = 'story-title-body';
        const heading = document.createElement('h1');
        heading.className = 'story-title-text';
        heading.textContent = title;
        const accent = document.createElement('div');
        accent.className = 'story-title-accent';
        body.append(heading, accent);
        return slide;
    }

    function setAdminTitleScale() {
        adminTitleStage.style.transform = `scale(${adminTitleViewport.clientWidth / 360})`;
    }

    function updateAdminTitlePreview() {
        if (!adminEntry) return;
        const title = adminTitleInput.value.trim();
        adminTitleSlide = createTitleSlide({ theme: adminTitleTheme }, title);
        adminTitleStage.replaceChildren(adminTitleSlide);
        downloadAdminTitleButton.disabled = !title || !adminTitleInput.validity.valid || adminTitleRendering;
        adminTitleStatus.textContent = '';
        setAdminTitleScale();
    }

    if (adminEntry) {
        buildThemeOptions(document.getElementById('adminTitleThemes'), adminTitleTheme, theme => {
            adminTitleTheme = theme;
            updateAdminTitlePreview();
        });
        adminTitleInput.addEventListener('input', updateAdminTitlePreview);
        if ('ResizeObserver' in window) {
            new ResizeObserver(setAdminTitleScale).observe(adminTitleViewport);
        } else {
            window.addEventListener('resize', setAdminTitleScale);
        }
        document.getElementById('adminTitleForm').addEventListener('submit', async event => {
            event.preventDefault();
            if (adminTitleRendering || !adminTitleInput.value.trim() || !adminTitleInput.validity.valid) return;
            adminTitleRendering = true;
            downloadAdminTitleButton.disabled = true;
            adminTitleStatus.textContent = 'Rendering title card...';
            const exportSlide = adminTitleSlide.cloneNode(true);
            const now = new Date();
            const pad = value => String(value).padStart(2, '0');
            const timestamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${String(now.getFullYear()).slice(-2)}_`
                + `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            const filename = `title-${timestamp}.jpg`;
            measurementHost.appendChild(exportSlide);
            try {
                const image = await renderJpeg(exportSlide);
                const url = URL.createObjectURL(image);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                requestAnimationFrame(() => URL.revokeObjectURL(url));
                adminTitleStatus.textContent = '';
            } catch (error) {
                adminTitleStatus.textContent = 'Title image creation failed.';
            } finally {
                exportSlide.remove();
                adminTitleRendering = false;
                downloadAdminTitleButton.disabled = !adminTitleInput.value.trim() || !adminTitleInput.validity.valid;
            }
        });
        updateAdminTitlePreview();
    }

    function showTitlePreview() {
        if (!submittedStory?.selectedTitle) return;
        if (!submittedStory.titleSlide) {
            submittedStory.titleSlide = createTitleSlide(submittedStory, submittedStory.selectedTitle);
        }
        previewStage.replaceChildren(submittedStory.titleSlide);
        previewNavigation.hidden = true;
        previewTabs.hidden = false;
        setButtonPressed(previewTabs, document.getElementById('previewTitle'));
        setPreviewScale();
    }

    function buildTitleChoices(snapshot) {
        titleOptions.replaceChildren();
        snapshot.titles.forEach((title, index) => {
            const label = document.createElement('label');
            label.className = 'title-option';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'suggested_title';
            radio.value = title;
            radio.id = `suggestedTitle${index}`;
            radio.addEventListener('change', () => {
                snapshot.selectedTitle = title;
                snapshot.titleSlide = null;
                showTitlePreview();
                syncTitleStatus(snapshot);
            });
            const text = document.createElement('span');
            text.textContent = title;
            label.append(radio, text);
            titleOptions.appendChild(label);
        });
    }

    async function requestTitles(snapshot) {
        if (!snapshot?.generateTitles || snapshot.titlesLoading || snapshot.titles) return;
        snapshot.titlesLoading = true;
        snapshot.titleError = '';
        syncTitleStatus(snapshot);
        try {
            const result = await apiJson('generate-titles', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    story: snapshot.story,
                    submissionIntent: snapshot.storySent ? undefined : snapshot.intent,
                    submissionToken: snapshot.submissionToken || undefined,
                }),
            });
            if (!Array.isArray(result.titles) || result.titles.length !== 3
                    || new Set(result.titles).size !== 3
                    || result.titles.some(title => typeof title !== 'string' || !title.trim() || Array.from(title).length > 45)) {
                throw new Error('AI returned invalid title suggestions. Please try again later.');
            }
            if (snapshot !== submittedStory) return;
            snapshot.titles = result.titles;
            buildTitleChoices(snapshot);
        } catch (error) {
            snapshot.titleError = 'Title generation failed.';
        } finally {
            snapshot.titlesLoading = false;
            syncTitleStatus(snapshot);
        }
    }

    document.getElementById('previewStory').addEventListener('click', () => {
        previewNavigation.hidden = false;
        setButtonPressed(previewTabs, document.getElementById('previewStory'));
        showSlide(activeSlide);
    });
    document.getElementById('previewTitle').addEventListener('click', showTitlePreview);
    retryTitles.addEventListener('click', () => {
        if (!submittedStory || submittedStory.titlesLoading || (submittedStory.titleRetries || 0) >= MAX_TITLE_RETRIES) return;
        submittedStory.titleRetries = (submittedStory.titleRetries || 0) + 1;
        void requestTitles(submittedStory);
    });
    titleForm.addEventListener('submit', async event => {
        event.preventDefault();
        const snapshot = submittedStory;
        if (!snapshot?.submissionToken || !snapshot.selectedTitle || snapshot.titleSending || snapshot.titleSent) return;
        snapshot.titleSending = true;
        titleOptions.querySelectorAll('input').forEach(input => { input.disabled = true; });
        titleDeliveryStatus.textContent = 'Rendering title slide...';
        syncTitleStatus(snapshot);
        try {
            const image = await renderJpeg(snapshot.titleSlide || createTitleSlide(snapshot, snapshot.selectedTitle));
            const data = new FormData();
            data.append('submission_token', snapshot.submissionToken);
            data.append('title', snapshot.selectedTitle);
            data.append('image', image, 'title-slide.jpg');
            titleDeliveryStatus.textContent = 'Sending title slide...';
            await apiJson('submit-title-image', { method: 'POST', body: data });
            snapshot.titleSent = true;
            titleDeliveryStatus.textContent = '';
            submissionSuccess.hidden = true;
            document.querySelector('.story-compose').hidden = true;
            document.querySelector('.new-story-heading').hidden = true;
            document.querySelector('.new-story-layout').classList.add('story-complete');
            document.getElementById('storyHomeControls').hidden = false;
            showTitlePreview();
        } catch (error) {
            titleDeliveryStatus.textContent = 'Title slide submission failed.';
        } finally {
            snapshot.titleSending = false;
            titleOptions.querySelectorAll('input').forEach(input => { input.disabled = snapshot.titleSent; });
            syncTitleStatus(snapshot);
        }
    });

    async function submitStory(event) {
        event.preventDefault();
        if (submitButton.disabled || submittedStory?.storySent) return;
        const story = storyForSubmission();
        const isAdmin = story.startsWith('$');
        if (!story.replace(/^\$+/, '').trim() || (!isAdmin && Array.from(story).length > NORMAL_STORY_LIMIT)) {
            storyError.textContent = story ? 'Stories are limited to 2000 characters.' : 'Please enter your story.';
            storyInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.classList.add('btn-disabled');
        setSubmittingMessage('Preparing slides...');
        submitStatus.textContent = '';
        const ageGender = ageGenderInput.value.trim();
        if (!submittedStory || submittedStory.story !== story || submittedStory.ageGender !== ageGender) {
            submittedStory = { story, ageGender, theme: selectedTheme, timestamp: getFormattedTimestamp() };
        }
        const snapshot = submittedStory;
        snapshot.generateTitles = generateTitlesInput.checked;
        selectedTheme = snapshot.theme;
        const paletteContainer = document.getElementById('themeOptions');
        setButtonPressed(paletteContainer, paletteContainer.querySelectorAll('button')[themes.indexOf(selectedTheme)]);
        applySlideColors();
        const formControls = [...form.querySelectorAll('input, textarea, button'), generateTitlesInput];
        formControls.forEach(control => { control.disabled = true; });
        slides[0].querySelector('.story-timestamp').textContent = snapshot.timestamp;
        let uploadToken = '';
        const batchCount = createUploadBatches(slides.length);

        try {
            if (snapshot.generateTitles && !snapshot.preparationAttempted) {
                snapshot.preparationAttempted = true;
                try {
                    const preparation = await apiJson('prepare-submission', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ story, age_gender: ageGender }),
                    }, 15000);
                    if (!preparation.submissionIntent) throw new Error('AI title preparation is unavailable.');
                    snapshot.intent = preparation.submissionIntent;
                } catch (error) {
                    snapshot.titleError = 'Title generation failed.';
                }
            }
            if (snapshot.generateTitles && snapshot.intent) void requestTitles(snapshot);
            for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
                const start = batchIndex * SLIDES_PER_UPLOAD;
                const end = Math.min(start + SLIDES_PER_UPLOAD, slides.length);
                const data = new FormData();
                data.append('story', story);
                data.append('age_gender', ageGender);
                data.append('batch_index', String(batchIndex));
                data.append('batch_count', String(batchCount));
                if (uploadToken) data.append('upload_token', uploadToken);
                if (snapshot.intent) data.append('submission_intent', snapshot.intent);

                for (let index = start; index < end; index++) {
                    setSubmittingMessage(`Rendering slide ${index + 1} of ${slides.length}...`);
                    const image = await renderJpeg(slides[index]);
                    data.append('images', image, `slide-${index + 1}.jpg`);
                }

                setSubmittingMessage('Submitting story...');
                await new Promise(resolve => requestAnimationFrame(resolve));
                snapshot.uploadAttempted = true;
                const result = await apiJson('postConfession', { method: 'POST', body: data });
                snapshot.completedBatches = (snapshot.completedBatches || 0) + 1;
                uploadToken = result.nextUploadToken || '';
                if (batchIndex < batchCount - 1 && !uploadToken) throw new Error('Story submission failed.');
                if (batchIndex === batchCount - 1) snapshot.submissionToken = result.submissionToken;
                if (batchIndex < batchCount - 1) setSubmittingMessage('Preparing the next batch...');
            }

            form.hidden = true;
            submitControls.hidden = true;
            submissionSuccess.hidden = false;
            snapshot.storySent = true;
            if (!snapshot.submissionToken) snapshot.titleError = 'Title generation failed.';
            syncTitleStatus(snapshot);
            submitStatus.textContent = '';
            if (typeof showToast === 'function') {
                showToast('Posting to Instagram is subject to content and community rules.', 'success');
            }
        } catch (error) {
            const uncertainDelivery = !snapshot.intent && snapshot.uploadAttempted
                && (snapshot.completedBatches || !error.httpStatus || error.httpStatus >= 500);
            submitStatus.textContent = 'Story submission failed.';
            submitButton.disabled = Boolean(uncertainDelivery);
            submitButton.classList.remove('btn-disabled');
            submitButton.textContent = 'Submit Story';
            formControls.forEach(control => { control.disabled = false; });
        }
    }

    form.addEventListener('submit', submitStory);

    updateCharacterCount();
})();
