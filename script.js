var host = "https://jarvis-ihcp.vercel.app"

const maxChars = 2000;

// Update character count on every key press
function checkLength() {
    const text = message.value;
    const textLength = text.length;

    current.textContent = maxChars - textLength;

    // If the text starts with a dollar symbol (About Us flag), ignore the character length limit
    if (text.startsWith('$')) {
        return;
    }

    if (textLength > maxChars) {
        message.value = text.substring(0, maxChars);
    }
}

// Custom Toast notification
// targetEl: optional — the input/textarea to shake on error
function showToast(message, type = 'success', targetEl = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-message">${message}</span>`;

    // Position toast at the top of the VISIBLE viewport (handles mobile keyboard)
    if (window.visualViewport) {
        toast.style.top = (window.visualViewport.offsetTop + 16) + 'px';
    }

    document.body.appendChild(toast);

    // Trigger slide in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    // Red glow + wiggle on the target input/textarea on error
    if (type === 'error' && targetEl) {
        targetEl.classList.remove('input-error'); // reset if already applied
        void targetEl.offsetWidth; // force reflow to restart animation
        targetEl.classList.add('input-error');
        setTimeout(() => targetEl.classList.remove('input-error'), 500);
    }

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function postQuery() {
    if (document.getElementById("message").value == "") {
        showToast("Please enter your query", "error", document.getElementById("message"));
    } else {
        pq_button.innerText = "Submitting...."
        pq_button.disabled = true;
        pq_button.className = "btn btn-disabled"
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Access-Control-Allow-Origin", "*");

        var raw = JSON.stringify({
            "message": message.value
        });

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch(host + "/postQuery", requestOptions)
            .then(response => response.text())
            .then(result => {
                showToast(result, 'success');
                setTimeout(() => {
                    window.open("https://t.me/infy_queries", "_self");
                }, 2000);
            })
            .catch(error => {
                console.log('error', error);
                showToast("Failed to submit query!", "error");
                pq_button.innerText = "Post Query ✍️";
                pq_button.disabled = false;
                pq_button.className = "btn btn-primary";
            });
    }
}


function postConfession() {
    if (document.getElementById("message").value == "") {
        showToast("Please enter your Story", "error", document.getElementById("message"));
    } else {
        pc_button.innerText = "Submitting...."
        pc_button.disabled = true;
        pc_button.className = "btn btn-disabled"
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Access-Control-Allow-Origin", "*");

        var rawMessage = message.value.trim();
        var finalMessage = age_gender.value + "\n" + rawMessage;

        // If content starts with $, move it to the very beginning (above age/gender)
        if (rawMessage.startsWith('$')) {
            finalMessage = "$\n" + age_gender.value + "\n" + rawMessage.substring(1).trim();
        }

        var raw = JSON.stringify({
            "message": finalMessage.trim()
        });

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        fetch(host + "/postConfession", requestOptions)
            .then(response => response.text())
            .then(result => {
                showToast(result, 'success');
                setTimeout(() => {
                    window.open("index.html", "_self");
                }, 2000);
            })
            .catch(error => {
                console.log('error', error);
                showToast("Failed to submit story!", "error");
                pc_button.innerText = "Submit Story";
                pc_button.disabled = false;
                pc_button.className = "btn btn-primary";
            });
    }
}


function writeQuery() {
    showConfirmationModal("Make sure you are writing the query in detail", {
        confirmText: "Continue",
        cancelText: "Cancel",
    }).then(confirmed => {
        if (confirmed === true) window.open("writeQuery.html", "_self");
        else window.location.href = 'index.html';
    });
}

function showConfirmationModal(message, options = {}) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';

        const modal = document.createElement('section');
        modal.className = 'confirmation-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'confirmationTitle');
        modal.setAttribute('aria-describedby', 'confirmationMessage');

        const title = document.createElement('h2');
        title.id = 'confirmationTitle';
        title.textContent = options.title || 'Before you continue';

        const description = document.createElement('p');
        description.id = 'confirmationMessage';
        description.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'confirmation-close';
        closeButton.setAttribute('aria-label', 'Close dialog');
        closeButton.title = 'Close dialog';
        const closeIcon = document.createElement('i');
        closeIcon.className = 'fas fa-times';
        closeIcon.setAttribute('aria-hidden', 'true');
        closeButton.appendChild(closeIcon);

        const actions = document.createElement('div');
        actions.className = 'confirmation-actions';

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary';
        cancelButton.textContent = options.cancelText || 'Cancel';

        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = 'btn btn-primary';
        confirmButton.textContent = options.confirmText || 'Continue';

        actions.append(cancelButton, confirmButton);
        modal.append(closeButton, title, description, actions);
        overlay.appendChild(modal);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function close(confirmed) {
            document.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = previousOverflow;
            overlay.remove();
            resolve(confirmed);
        }

        function handleKeydown(event) {
            if (event.key === 'Escape') {
                close(null);
                return;
            }
            if (event.key === 'Tab') {
                const buttons = [closeButton, cancelButton, confirmButton];
                if (event.shiftKey && document.activeElement === buttons[0]) {
                    event.preventDefault();
                    buttons[buttons.length - 1].focus();
                } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
                    event.preventDefault();
                    buttons[0].focus();
                }
            }
        }

        cancelButton.addEventListener('click', () => close(false));
        confirmButton.addEventListener('click', () => close(true));
        closeButton.addEventListener('click', () => close(null));
        overlay.addEventListener('click', event => {
            if (!event.target.closest('button')) close(null);
        });
        document.addEventListener('keydown', handleKeydown);
        document.body.appendChild(overlay);
        confirmButton.focus();
    });
}

function writeConfession() {
    // Add loading visuals
    const storyBtn = document.getElementById("story");
    if (storyBtn) {
        storyBtn.innerHTML = "<span class='spinner'></span> Loading...";
        storyBtn.disabled = true;
        storyBtn.classList.add("btn-disabled");
    }

    const formStatusRequest = window.choiceFormStatusPromise || fetch(host + "/formStatus", {
        method: 'GET',
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
        },
    }).then(response => response.text());

    formStatusRequest
        .then(responseText => {
            if (responseText === '1') {
                showConfirmationModal("Make sure you are submitting only the story and not a query.", {
                    confirmText: "Continue to story",
                    cancelText: "Write a query",
                }).then(confirmed => {
                    if (confirmed === true) {
                        openStoryRules();
                    } else if (confirmed === false) {
                        window.open("writeQuery.html", "_self");
                    } else {
                        window.location.href = 'index.html';
                    }
                });
            } else if (responseText === '0') {
                window.location.href = 'FormStatus.html';
            } else {
                console.warn("Unexpected response:", responseText);
                openStoryRules();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast("Something went wrong... Proceeding anyway", "error");
            setTimeout(() => {
                openStoryRules();
            }, 1500);
        });
}

function openStoryRules() {
    try {
        sessionStorage.setItem('storyRulesEntry', String(Date.now()));
    } catch {}
    window.location.href = 'writeConfessionRules.html';
}

function openAdminStory() {
    try {
        sessionStorage.setItem('storyEditorEntry', JSON.stringify({ mode: 'admin', created: Date.now() }));
    } catch {}
    window.location.href = 'write/new/';
}

function chooseLatestExperience() {
    showConfirmationModal("Make sure you are submitting only the story and not a query.", {
        confirmText: "Continue to story",
        cancelText: "Write a query",
    }).then(confirmed => {
        if (confirmed === true) {
            openStoryRules();
        } else if (confirmed === false) {
            window.location.href = 'writeQuery.html';
        } else {
            window.location.href = 'index.html';
        }
    });
}

function json(url) {
    return fetch(url).then(res => res.json());
}


/* ═══════════════════════════════════════════════════════════
   THEME TOGGLE — Dark / Light Mode
   ═══════════════════════════════════════════════════════════ */
(function initTheme() {
    const saved = localStorage.getItem('infy-theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    // Prevent flash of wrong theme
    document.documentElement.classList.add('no-transition');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.documentElement.classList.remove('no-transition');
        });
    });
})();

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('infy-theme', next);

    // Update all toggle icons on the page
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        // If next is light mode, icon changes to Moon (to switch back to dark)
        btn.textContent = next === 'light' ? '🌙' : '☀️';
    });
}

/* ═══════════════════════════════════════════════════════════
   THEME TOGGLE
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    // Set correct theme icon on load
    const theme = document.documentElement.getAttribute('data-theme') || 'dark'; // dark is default
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.textContent = theme === 'light' ? '🌙' : '☀️';
    });

    // Language restriction: Only allow English, emojis, symbols & special chars
    // Whitelist approach — strips anything that isn't:
    //   - Basic Latin (A-Z, a-z, 0-9, punctuation, symbols)
    //   - Common whitespace (space, tab, newline)
    //   - Emojis & pictographs (major Unicode emoji blocks)
    //   - Currency symbols, arrows, misc symbols, etc.
    const allowedCharsRegex = /[^\x20-\x7E\t\n\r\u00A0-\u00FF\u2000-\u27FF\u2900-\u2BFF\uFE00-\uFEFF\u{1F000}-\u{1FAFF}\u{1F600}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

    document.body.addEventListener('input', function (e) {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            if (e.target.hasAttribute('data-allow-unicode')) return;
            if (allowedCharsRegex.test(e.target.value)) {
                e.target.value = e.target.value.replace(allowedCharsRegex, '');
                showToast("Please use English language", "error", e.target);

                // Keep the character count updated correctly if it's the message block
                if (e.target.id === 'message' && typeof checkLength === 'function') {
                    checkLength();
                }
            }
        }
    });
});