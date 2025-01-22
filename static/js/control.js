$(document).ready(() => {
    // Game state
    let gameState = {
        isRunning: false,
        speed: 1.0,
        gridSize: 50
    };

    // Initialize controls
    initializeControls();
    setupEventListeners();
    updateControlsState();

    function initializeControls() {
        // Set initial values
        $('#speedValue').text(`${gameState.speed}x`);
        $('#gridSizeValue').text(`${gameState.gridSize}x${gameState.gridSize}`);
        $('#evolutionState').text('Paused');
    }

    function setupEventListeners() {
        // Game control buttons
        $('#startBtn').click(() => {
            gameState.isRunning = true;
            updateGameState('start');
        });

        $('#pauseBtn').click(() => {
            gameState.isRunning = false;
            updateGameState('pause');
        });

        $('#resetBtn').click(() => {
            gameState.isRunning = false;
            updateGameState('reset');
        });

        // Speed control
        $('#speedControl').on('input', _.debounce((e) => {
            gameState.speed = parseFloat(e.target.value);
            $('#speedValue').text(`${gameState.speed}x`);
            updateSpeed(gameState.speed);
        }, 200));

        // Grid size control
        $('#gridSizeControl').on('input', _.debounce((e) => {
            gameState.gridSize = parseInt(e.target.value);
            $('#gridSizeValue').text(`${gameState.gridSize}x${gameState.gridSize}`);
            updateGridSize(gameState.gridSize);
        }, 200));
    }

    function updateGameState(action) {
        $.ajax({
            url: '/api/control/state',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: action }),
            success: (response) => {
                if (response.success) {
                    $('#evolutionState').text(gameState.isRunning ? 'Running' : 'Paused');
                    updateControlsState();
                }
            }
        });
    }

    function updateSpeed(speed) {
        $.ajax({
            url: '/api/control/speed',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ speed: speed }),
            success: (response) => {
                if (!response.success) {
                    alert(response.error || 'Failed to update speed');
                    // Reset speed control to previous value
                    $('#speedControl').val(gameState.speed);
                    $('#speedValue').text(`${gameState.speed}x`);
                }
            },
            error: (xhr) => {
                const response = xhr.responseJSON || {};
                alert(response.error || 'Failed to update speed');
                // Reset speed control to previous value
                $('#speedControl').val(gameState.speed);
                $('#speedValue').text(`${gameState.speed}x`);
            }
        });
    }

    function updateGridSize(size) {
        $.ajax({
            url: '/api/control/grid',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ size: size }),
            success: (response) => {
                if (!response.success) {
                    alert(response.error || 'Failed to update grid size');
                    // Reset grid size control to previous value
                    $('#gridSizeControl').val(gameState.gridSize);
                    $('#gridSizeValue').text(`${gameState.gridSize}x${gameState.gridSize}`);
                }
            },
            error: (xhr) => {
                const response = xhr.responseJSON || {};
                alert(response.error || 'Failed to update grid size');
                // Reset grid size control to previous value
                $('#gridSizeControl').val(gameState.gridSize);
                $('#gridSizeValue').text(`${gameState.gridSize}x${gameState.gridSize}`);
            }
        });
    }

    function updateControlsState() {
        // Update button states
        $('#startBtn').prop('disabled', gameState.isRunning);
        $('#pauseBtn').prop('disabled', !gameState.isRunning);
        $('#resetBtn').prop('disabled', gameState.isRunning);

        // Update button appearances
        $('#startBtn').toggleClass('opacity-50', gameState.isRunning);
        $('#pauseBtn').toggleClass('opacity-50', !gameState.isRunning);
        $('#resetBtn').toggleClass('opacity-50', gameState.isRunning);

        // Update controls
        $('#speedControl').prop('disabled', !gameState.isRunning);
        $('#gridSizeControl').prop('disabled', gameState.isRunning);
    }
});
