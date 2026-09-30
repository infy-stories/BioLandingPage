document.addEventListener('DOMContentLoaded', function () {
    const progress = document.getElementById('choiceProgress');
    let timer;

    function openLegacyExperience() {
        window.writeConfession();
    }

    function stopTimer() {
        window.clearTimeout(timer);
        progress.classList.remove('choice-progress-running');
    }

    window.chooseExperience = function (experience) {
        stopTimer();
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
