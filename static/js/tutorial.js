$(document).ready(() => {
    // Tutorial state
    let currentStep = 1;
    const totalSteps = $('.tutorial-step').length;
    let demoGrid = [];
    const demoGridSize = 10;

    // Initialize tutorial
    updateProgress();
    setupEventListeners();
    initializeDemoGrid();

    function setupEventListeners() {
        // Navigation buttons
        $('#prevStep').click(() => navigateStep('prev'));
        $('#nextStep').click(() => navigateStep('next'));

        // Step indicators
        $('.step-indicator').click(function() {
            const step = $(this).data('step');
            navigateToStep(step);
        });

        // Handle keyboard navigation
        $(document).keydown(function(e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                navigateStep(e.key === 'ArrowRight' ? 'next' : 'prev');
            }
        });
    }

    function navigateStep(direction) {
        const newStep = direction === 'next' ?
            Math.min(currentStep + 1, totalSteps) :
            Math.max(currentStep - 1, 1);

        navigateToStep(newStep);
    }

    function navigateToStep(step) {
        // Fade out current step
        $(`.tutorial-step[data-step="${currentStep}"]`).fadeOut(300, () => {
            // Update current step
            currentStep = step;

            // Fade in new step
            $(`.tutorial-step[data-step="${step}"]`)
                .removeClass('hidden')
                .fadeIn(300);

            // Update progress
            updateProgress();

            // Update button states
            updateNavigationButtons();

            // Save progress
            saveProgress(step);

            // Update demo grid based on step
            updateDemoGridForStep(step);
        });
    }

    function updateProgress() {
        // Animate progress bar
        const progress = (currentStep / totalSteps) * 100;
        $('#progressBar').css('width', `${progress}%`);

        // Update step counter with animation
        $('#currentStep').fadeOut(150, function() {
            $(this).text(currentStep).fadeIn(150);
        });

        // Update step indicators with animation
        $('.step-indicator').each(function() {
            const stepNum = $(this).data('step');
            $(this)
                .removeClass('bg-blue-500 bg-gray-300')
                .addClass(stepNum === currentStep ? 'bg-blue-500' : 'bg-gray-300')
                .css('transform', stepNum <= currentStep ? 'scale(1.1)' : 'scale(1)')
                .css('transition', 'all 0.3s ease');
        });
    }

    function updateNavigationButtons() {
        const isFirst = currentStep === 1;
        const isLast = currentStep === totalSteps;

        // Update previous button
        $('#prevStep')
            .prop('disabled', isFirst)
            .toggleClass('opacity-50', isFirst)
            .toggleClass('cursor-not-allowed', isFirst);

        // Update next button
        $('#nextStep')
            .text(isLast ? 'Finish' : 'Next')
            .toggleClass('bg-green-500', isLast)
            .toggleClass('bg-blue-500', !isLast);
    }

    function saveProgress(step) {
        $.ajax({
            url: '/api/tutorial/progress',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ step_id: step }),
            success: (response) => {
                if (!response.success) {
                    console.error('Failed to save progress');
                }
            }
        });
    }

    function initializeDemoGrid() {
        // Initialize grid array
        demoGrid = Array(demoGridSize).fill().map(() => Array(demoGridSize).fill(false));

        // Create grid HTML with animation classes
        let html = '<div class="grid grid-cols-10 gap-0 opacity-0 transform scale-95 transition-all duration-500">';
        for (let i = 0; i < demoGridSize; i++) {
            for (let j = 0; j < demoGridSize; j++) {
                html += `
                    <div class="demo-cell border border-gray-200 aspect-square cursor-pointer
                              hover:bg-gray-300 transition-all duration-200 ease-in-out"
                         data-row="${i}" data-col="${j}"></div>
                `;
            }
        }
        html += '</div>';

        $('#demoGrid').html(html);

        // Fade in grid
        setTimeout(() => {
            $('#demoGrid > div')
                .removeClass('opacity-0 scale-95')
                .addClass('opacity-100 scale-100');
        }, 100);

        // Add click handlers with animation
        $('.demo-cell').click(function() {
            const row = $(this).data('row');
            const col = $(this).data('col');

            // Toggle cell state with animation
            $(this)
                .addClass('scale-110')
                .toggleClass('bg-black')
                .delay(150)
                .queue(function() {
                    $(this).removeClass('scale-110').dequeue();
                });

            demoGrid[row][col] = !demoGrid[row][col];
        });
    }

    function updateDemoGridForStep(step) {
        // Update demo grid based on tutorial step
        switch(step) {
            case 2: // Basic Rules
                showBasicRulesPattern();
                break;
            case 3: // Cell Interaction
                clearDemoGrid();
                break;
            case 4: // Population Rules
                showPopulationRulesPattern();
                break;
            default:
                clearDemoGrid();
        }
    }

    function showBasicRulesPattern() {
        const pattern = [
            [0,1,0],
            [0,1,0],
            [0,1,0]
        ];
        applyPattern(pattern, 3, 3);
    }

    function showPopulationRulesPattern() {
        const pattern = [
            [0,1,1],
            [1,1,0],
            [0,1,0]
        ];
        applyPattern(pattern, 3, 3);
    }

    function applyPattern(pattern, startRow = 3, startCol = 3) {
        clearDemoGrid();
        pattern.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell) {
                    const cellElement = $(`.demo-cell[data-row="${startRow + i}"][data-col="${startCol + j}"]`);
                    cellElement
                        .addClass('scale-110 bg-black')
                        .delay(150)
                        .queue(function() {
                            $(this).removeClass('scale-110').dequeue();
                        });
                    demoGrid[startRow + i][startCol + j] = true;
                }
            });
        });
    }

    function clearDemoGrid() {
        $('.demo-cell').removeClass('bg-black');
        demoGrid = Array(demoGridSize).fill().map(() => Array(demoGridSize).fill(false));
    }
});
