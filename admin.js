(() => {
    const dialog = document.getElementById('adminDialog');
    if (!dialog) return;

    const loginView = document.getElementById('adminLoginView');
    const panelView = document.getElementById('adminPanelView');
    const confirmView = document.getElementById('adminConfirmView');
    const confirmMessage = document.getElementById('adminConfirmMessage');
    const loginForm = document.getElementById('adminLoginForm');
    const loginKey = document.getElementById('adminKey');
    const loginButton = document.getElementById('adminLoginButton');
    const loginMessage = document.getElementById('adminLoginMessage');
    const actionMessage = document.getElementById('adminActionMessage');
    const stats = document.getElementById('adminStats');
    let resolveConfirmation;
    let mascotState = 'idle';
    const wrongKeyMessages = [
        'Nope. The key says this is not your door.',
        'That key opened exactly zero doors. One more go?',
        'Access denied. The stories remain mysteriously guarded.',
        'Close, probably. The control room disagrees.',
        'The key did not pass the vibe check.',
    ];

    try {
        sessionStorage.removeItem('infy:adminKey');
    } catch {}

    function currentKey() {
        try {
            return sessionStorage.getItem('infy:adminKey') || '';
        } catch {
            return '';
        }
    }

    function setMascotState(state) {
        mascotState = state;
        window.adminMascotCurrentState = state;
        window.dispatchEvent(new CustomEvent('admin:mascot-state', { detail: { state } }));
    }

    function setView(isAuthenticated) {
        loginView.hidden = isAuthenticated;
        panelView.hidden = !isAuthenticated;
        confirmView.hidden = true;
        dialog.setAttribute('aria-labelledby', isAuthenticated ? 'adminPanelTitle' : 'adminDialogTitle');
        if (!isAuthenticated) setMascotState('idle');
        if (isAuthenticated) void refreshStatus();
    }

    async function request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${currentKey()}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`${window.host}${path}`, { ...options, headers, signal: controller.signal });
            const contentType = response.headers.get('content-type') || '';
            const result = contentType.includes('application/json') ? await response.json() : await response.text();
            if (response.status === 401) {
                sessionStorage.removeItem('infy:adminKey');
                setView(false);
                loginMessage.textContent = 'Your admin session expired. Please unlock again.';
            }
            if (!response.ok) {
                throw new Error(typeof result === 'object' ? result.error || 'Admin request failed.' : result || 'Admin request failed.');
            }
            return result;
        } finally {
            clearTimeout(timeout);
        }
    }

    async function refreshStatus() {
        actionMessage.textContent = 'Refreshing status...';
        try {
            const result = await request('/admin/status');
            const items = [
                ['Form', result.formOpen ? 'Open' : result.manualFormOpen ? 'Daily limit' : 'Closed'],
                ['Stories today', result.dailyCount],
                ['Stories total', result.totalCount],
                ['Query cooldowns', result.queryCooldowns],
                ['Story cooldowns', result.storyCooldowns],
            ];
            stats.replaceChildren();
            items.forEach(([label, value]) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'admin-stat';
                const term = document.createElement('dt');
                term.textContent = label;
                const description = document.createElement('dd');
                description.textContent = String(value ?? 'Unavailable');
                wrapper.append(term, description);
                stats.appendChild(wrapper);
            });
            document.getElementById('adminToggleForm').querySelector('span').textContent =
                result.manualFormOpen ? 'Close submissions' : 'Open submissions';
            actionMessage.textContent = '';
        } catch (error) {
            actionMessage.textContent = error.message || 'Could not load admin status.';
        }
    }

    function confirmAction(message) {
        panelView.hidden = true;
        confirmView.hidden = false;
        dialog.setAttribute('aria-labelledby', 'adminConfirmTitle');
        confirmMessage.textContent = message;
        return new Promise(resolve => { resolveConfirmation = resolve; });
    }

    function finishConfirmation(confirmed) {
        confirmView.hidden = true;
        panelView.hidden = false;
        dialog.setAttribute('aria-labelledby', 'adminPanelTitle');
        const resolve = resolveConfirmation;
        resolveConfirmation = null;
        if (resolve) resolve(confirmed);
    }

    async function runAction(path, label, confirmation) {
        if (confirmation && !(await confirmAction(confirmation))) return;
        actionMessage.textContent = `${label}...`;
        try {
            const result = await request(path, { method: 'POST' });
            const feedback = typeof result === 'string' ? result : result.message || `${label} complete.`;
            await refreshStatus();
            actionMessage.textContent = feedback;
        } catch (error) {
            actionMessage.textContent = error.message || `${label} failed.`;
        }
    }

    async function storeCredential() {
        if (!('PasswordCredential' in window) || !navigator.credentials?.store) return;
        try {
            await navigator.credentials.store(new PasswordCredential({
                id: document.getElementById('adminUsername').value,
                name: 'Infy Stories Admin',
                password: loginKey.value,
            }));
        } catch {}
    }

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!loginForm.reportValidity()) return;
        loginButton.disabled = true;
        loginMessage.textContent = 'Checking the key...';
        setMascotState('thinking');
        const key = loginKey.value;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`${window.host}/admin/authenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key }),
            signal: controller.signal,
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    loginMessage.textContent = wrongKeyMessages[Math.floor(Math.random() * wrongKeyMessages.length)];
                    setMascotState('judgemental');
                } else {
                    loginMessage.textContent = result.error || 'Admin access is not available right now.';
                    setMascotState('confused');
                }
                loginKey.value = '';
                return;
            }
            void storeCredential();
            sessionStorage.setItem('infy:adminKey', key);
            loginKey.value = '';
            loginMessage.textContent = '';
            setMascotState('happy');
            setTimeout(() => setView(true), 380);
        } catch {
            loginMessage.textContent = 'Could not reach the control room. Check the connection and try again.';
            setMascotState('confused');
        } finally {
            clearTimeout(timeout);
            loginButton.disabled = false;
        }
    });

    document.getElementById('adminEntryButton').addEventListener('click', () => {
        setView(false);
        dialog.showModal();
        loginKey.focus();
    });
    document.getElementById('adminDialogClose').addEventListener('click', () => {
        if (resolveConfirmation) finishConfirmation(false);
        dialog.close();
    });
    document.getElementById('adminConfirmCancel').addEventListener('click', () => finishConfirmation(false));
    document.getElementById('adminConfirmContinue').addEventListener('click', () => finishConfirmation(true));
    dialog.addEventListener('cancel', () => {
        if (resolveConfirmation) finishConfirmation(false);
    });
    dialog.addEventListener('close', () => {
        sessionStorage.removeItem('infy:adminKey');
        setView(false);
    });
    document.getElementById('adminRefresh').addEventListener('click', () => void refreshStatus());
    document.getElementById('adminWriteStory').addEventListener('click', () => {
        sessionStorage.setItem('storyEditorEntry', JSON.stringify({ mode: 'admin', created: Date.now() }));
        window.location.href = 'write/new/';
    });
    document.getElementById('adminToggleForm').addEventListener('click', () =>
        void runAction('/admin/form-status', 'Updating form status'));
    document.getElementById('adminResetCount').addEventListener('click', () =>
        void runAction('/admin/reset-count', 'Resetting daily count', 'Reset the daily story count to 1?'));
    document.getElementById('adminClearIps').addEventListener('click', () =>
        void runAction('/admin/ip-cooldowns', 'Clearing IP cooldowns', 'Clear story and query cooldown entries on this running API instance?'));
    document.getElementById('adminLogout').addEventListener('click', () => {
        sessionStorage.removeItem('infy:adminKey');
        loginMessage.textContent = '';
        loginKey.value = '';
        setView(false);
    });

    loginKey.addEventListener('focus', () => {
        if (loginKey.type === 'text') setMascotState('peek');
        else setMascotState('idle');
    });
    loginKey.addEventListener('input', () => {
        setMascotState(loginKey.type === 'text' ? 'peek' : 'typing');
    });
    loginKey.addEventListener('blur', () => {
        if (mascotState === 'typing' || mascotState === 'peek') setMascotState('idle');
    });
    document.getElementById('adminPasswordReveal').addEventListener('click', event => {
        const reveal = loginKey.type === 'password';
        loginKey.type = reveal ? 'text' : 'password';
        const button = event.currentTarget;
        button.setAttribute('aria-pressed', String(reveal));
        button.setAttribute('aria-label', reveal ? 'Hide admin key' : 'Show admin key');
        button.title = reveal ? 'Hide admin key' : 'Show admin key';
        button.querySelector('i').className = reveal ? 'fas fa-eye-slash' : 'fas fa-eye';
        loginKey.focus();
        setMascotState(reveal ? 'peek' : loginKey.value ? 'typing' : 'idle');
    });

    if (sessionStorage.getItem('infy:adminPrompt') === '1') {
        sessionStorage.removeItem('infy:adminPrompt');
        setView(false);
        dialog.showModal();
        loginMessage.textContent = 'Please unlock admin access again.';
    }
})();