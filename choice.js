document.addEventListener('DOMContentLoaded', function () {
    const progress = document.getElementById('choiceProgress');
    const optionButtons = document.querySelectorAll('.experience-option .btn');
    let timer;
    let selectionStarted = false;

    // Warm the serverless backend while the user considers the two choices.
    const statusController = new AbortController();
    const statusTimeout = window.setTimeout(() => statusController.abort(), 5000);
    window.choiceFormStatusPromise = fetch(window.host + "/formStatus", {
        method: 'GET',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        signal: statusController.signal,
    }).then(response => response.text()).catch(error => {
        console.warn('Serverless warm-up request failed:', error);
        return null;
    }).finally(() => window.clearTimeout(statusTimeout));

    function setSelectionPending(experience) {
        if (selectionStarted) return;
        selectionStarted = true;
        optionButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('btn-disabled');
        });
        const selectedButton = experience === 'new' ? optionButtons[0] : optionButtons[1];
        selectedButton.textContent = experience === 'new'
            ? 'Opening latest experience...'
            : 'Opening existing form...';
    }

    function openLegacyExperience() {
        setSelectionPending('legacy');
        window.writeConfession();
    }

    function stopTimer() {
        window.clearTimeout(timer);
        progress.classList.remove('choice-progress-running');
    }

    window.chooseExperience = function (experience) {
        stopTimer();
        setSelectionPending(experience);
        if (experience === 'new') {
            window.chooseLatestExperience();
        } else {
            openLegacyExperience();
        }
    };

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            progress.classList.add('choice-progress-running');
            timer = window.setTimeout(openLegacyExperience, 5000);
        });
    });
});
