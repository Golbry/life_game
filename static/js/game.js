$(document).ready(() => {
    // Game state
    const gameState = {
        grid: null,
        nextGrid: null,
        isRunning: false,
        generation: 0,
        speed: 1.0,
        cellSize: 15,
        gridSize: 50,
        lastTime: 0,
        frameCount: 0
    };

    // Initialize game
    initializeGame();
    setupEventListeners();
    createGrid();
    setupTemplateHandling();
    startGameLoop();

    function initializeGame() {
        gameState.gridSize = parseInt($('#gridSizeControl').val()) || 50;
        gameState.speed = parseFloat($('#speedControl').val()) || 1.0;

        const totalCells = gameState.gridSize * gameState.gridSize;
        gameState.grid = new Uint8Array(totalCells);
        gameState.nextGrid = new Uint8Array(totalCells);

        updateStatistics();
    }

    function setupEventListeners() {
        $('#startBtn').click(() => {
            gameState.isRunning = true;
            updateControlsState();
        });

        $('#pauseBtn').click(() => {
            gameState.isRunning = false;
            updateControlsState();
        });

        $('#randomBtn').click(generateRandomPopulation);
        $('#resetBtn').click(resetGame);
        $('#saveTemplateBtn').click(openSaveTemplateModal);

        $('#speedControl').on('input', _.debounce((e) => {
            gameState.speed = parseFloat(e.target.value);
            $('#speedValue').text(`${gameState.speed}x`);
        }, 100));

        $('#gridSizeControl').on('input', _.debounce((e) => {
            const newSize = parseInt(e.target.value);
            $('#gridSizeValue').text(`${newSize}x${newSize}`);
            $('#currentGridSize').text(`${newSize}x${newSize}`);
            resizeGrid(newSize);
        }, 200));

        // Template modal events
        $('#confirmSaveTemplate').click(() => {
            const name = $('#templateName').val().trim();
            const description = $('#templateDescription').val().trim();

            if (!name) {
                alert('Please enter a template name');
                return;
            }

            const pattern = getCurrentPattern();
            $.ajax({
                url: '/api/templates',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    name: name,
                    description: description,
                    pattern: JSON.stringify(pattern)
                }),
                success: (response) => {
                    if (response.success) {
                        $('#saveTemplateModal').addClass('hidden');
                        $('#templateName').val('');
                        $('#templateDescription').val('');
                        alert('Template saved successfully!');
                    }
                }
            });
        });

        $('#cancelSaveTemplate').click(() => {
            $('#saveTemplateModal').addClass('hidden');
            $('#templateName').val('');
            $('#templateDescription').val('');
        });
    }

    function createGrid() {
        const container = document.getElementById('gameGrid');
        container.innerHTML = `
            <div class="relative w-full h-full">
                <div id="gridContainer" class="absolute inset-0"></div>
                <div id="gridOverlay" class="absolute inset-0 pointer-events-none z-10"></div>
                <div class="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 to-black/5"></div>
            </div>
        `;

        const gridContainer = document.getElementById('gridContainer');
        const containerWidth = container.clientWidth - 32;
        const maxCellSize = Math.floor((containerWidth - gameState.gridSize) / gameState.gridSize);
        gameState.cellSize = Math.min(maxCellSize, gameState.cellSize);

        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'grid';
        gridWrapper.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${gameState.gridSize}, ${gameState.cellSize}px);
            gap: 1px;
            background-color: #e5e7eb;
            margin: 0 auto;
            width: fit-content;
        `;

        for (let i = 0; i < gameState.gridSize * gameState.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;
            cell.style.cssText = `
                width: ${gameState.cellSize}px;
                height: ${gameState.cellSize}px;
                background-color: white;
                transition: all 0.15s ease;
                cursor: pointer;
            `;

            cell.addEventListener('click', () => toggleCell(i));
            gridWrapper.appendChild(cell);
        }

        gridContainer.innerHTML = '';
        gridContainer.appendChild(gridWrapper);
    }

    function setupTemplateHandling() {
        const gameGrid = $('#gameGrid');
        const gridOverlay = $('#gridOverlay');
        let previewTemplate = null;
        let isDragging = false;

        // Load templates
        loadTemplates();

        // Setup drag and drop events
        gameGrid
            .on('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameGrid.addClass('ring-2 ring-blue-500 ring-opacity-50 scale-[1.02]');
            })
            .on('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isDragging) {
                    isDragging = true;
                }

                // Update template preview position
                const rect = gameGrid[0].getBoundingClientRect();
                const x = e.originalEvent.clientX - rect.left;
                const y = e.originalEvent.clientY - rect.top;
                updateTemplatePreview(x, y);
            })
            .on('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                isDragging = false;
                gameGrid.removeClass('ring-2 ring-blue-500 ring-opacity-50 scale-[1.02]');
                gridOverlay.empty();
            })
            .on('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                try {
                    const data = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
                    if (data.templateId && data.pattern) {
                        const rect = gameGrid[0].getBoundingClientRect();
                        const x = e.originalEvent.clientX - rect.left;
                        const y = e.originalEvent.clientY - rect.top;

                        // Apply template with animation
                        const pattern = JSON.parse(data.pattern);
                        applyPatternToGrid(pattern, x, y);

                        // Add drop effect
                        const dropEffect = $('<div>')
                            .addClass('absolute bg-blue-500 bg-opacity-20 rounded-lg transform scale-110')
                            .css({
                                left: x - 50,
                                top: y - 50,
                                width: '100px',
                                height: '100px',
                                transition: 'all 0.3s ease'
                            })
                            .appendTo(gridOverlay);

                        setTimeout(() => {
                            dropEffect.css({
                                transform: 'scale(1)',
                                opacity: 0
                            });
                            setTimeout(() => dropEffect.remove(), 300);
                        }, 50);
                    }
                } catch (error) {
                    console.error('Drop error:', error);
                } finally {
                    isDragging = false;
                    gameGrid.removeClass('ring-2 ring-blue-500 ring-opacity-50 scale-[1.02]');
                    gridOverlay.empty();
                }
            });

        function loadTemplates() {
            $.get('/api/templates', (templates) => {
                renderTemplates('preset', templates.filter(t => t.category === 'preset'));
                renderTemplates('user', templates.filter(t => t.category === 'user'));
            });
        }

        function updateTemplatePreview(x, y) {
            if (!previewTemplate || !previewTemplate.pattern) return;

            try {
                const pattern = JSON.parse(previewTemplate.pattern);
                const cellSize = gameState.cellSize;
                const gridX = Math.floor(x / cellSize);
                const gridY = Math.floor(y / cellSize);

                gridOverlay.empty();

                const previewElement = $('<div>')
                    .addClass('template-preview-overlay')
                    .css({
                        position: 'absolute',
                        left: `${gridX * cellSize}px`,
                        top: `${gridY * cellSize}px`,
                        width: `${pattern[0].length * cellSize}px`,
                        height: `${pattern.length * cellSize}px`,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${pattern[0].length}, 1fr)`,
                        gap: '1px',
                        padding: '1px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '2px dashed rgba(59, 130, 246, 0.5)',
                        borderRadius: '4px',
                        transition: 'all 0.15s ease'
                    });

                pattern.flat().forEach(cell => {
                    $('<div>')
                        .addClass(`preview-cell ${cell ? 'bg-black' : 'bg-white'}`)
                        .css({
                            width: '100%',
                            height: '100%',
                            transition: 'all 0.15s ease'
                        })
                        .appendTo(previewElement);
                });

                gridOverlay.append(previewElement);
            } catch (error) {
                console.error('Preview error:', error);
            }
        }

        function renderTemplates(category, templates) {
            const container = category === 'preset' ? '#presetTemplates' : '#localTemplates';
            $(container).empty();

            templates.forEach(template => {
                const templateCard = $('<div>')
                    .addClass('template-card p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-move')
                    .attr('draggable', true)
                    .data('template-id', template.id)
                    .data('pattern', template.pattern);

                const header = $('<div>')
                    .addClass('font-medium mb-2')
                    .text(template.name);

                const preview = $('<div>')
                    .addClass('template-preview bg-gray-50 rounded aspect-square');

                templateCard.append(header, preview);
                $(container).append(templateCard);

                // Render preview
                try {
                    const pattern = JSON.parse(template.pattern);
                    renderPreview(pattern, preview);
                } catch (e) {
                    console.error('Error rendering preview:', e);
                }

                // Setup drag events
                templateCard
                    .on('dragstart', function(e) {
                        e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                            templateId: template.id,
                            pattern: template.pattern
                        }));
                        $(this).addClass('opacity-50 scale-95');
                        isDragging = true;
                    })
                    .on('dragend', function() {
                        $(this).removeClass('opacity-50 scale-95');
                        isDragging = false;
                    });
            });
        }

        function renderPreview(pattern, element) {
            const size = element.width();
            const cellSize = Math.floor(size / pattern[0].length);

            const grid = $('<div>')
                .addClass('grid h-full w-full')
                .css({
                    'grid-template-columns': `repeat(${pattern[0].length}, 1fr)`,
                    'gap': '1px'
                });

            pattern.flat().forEach(cell => {
                $('<div>')
                    .addClass(`preview-cell ${cell ? 'bg-black' : 'bg-white'}`)
                    .css({
                        'aspect-ratio': '1',
                        'transition': 'all 0.15s ease'
                    })
                    .appendTo(grid);
            });

            element.empty().append(grid);
        }

        // Handle template drag over
        gameGrid.on('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.originalEvent.dataTransfer.dropEffect = 'copy';

            if (!isDragging) {
                isDragging = true;
                gameGrid.addClass('ring-4 ring-blue-500 ring-opacity-50 scale-[1.02] transition-transform');
            }

            try {
                const dragData = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
                if (dragData && dragData.pattern) {
                    previewTemplate = dragData;
                    const rect = gameGrid[0].getBoundingClientRect();
                    const x = e.originalEvent.clientX - rect.left;
                    const y = e.originalEvent.clientY - rect.top;
                    updateTemplatePreview(x, y, JSON.parse(dragData.pattern));
                }
            } catch (error) {
                console.error('Error parsing drag data:', error);
            }
        });

        // Handle template drag enter
        gameGrid.on('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            gameGrid.addClass('ring-4 ring-blue-500 ring-opacity-50');
        });

        // Handle template drag leave
        gameGrid.on('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = false;
            gameGrid.removeClass('ring-4 ring-blue-500 ring-opacity-50 scale-[1.02]');
            gridOverlay.empty();
        });

        function updateTemplatePreview(x, y, pattern) {
            if (!pattern) return;

            const cellSize = gameState.cellSize;
            const gridX = Math.floor(x / cellSize);
            const gridY = Math.floor(y / cellSize);

            // Clear previous preview
            gridOverlay.empty();

            // Create preview overlay
            const previewElement = $('<div>')
                .addClass('template-preview-overlay')
                .css({
                    position: 'absolute',
                    left: `${gridX * cellSize}px`,
                    top: `${gridY * cellSize}px`,
                    width: `${pattern[0].length * cellSize}px`,
                    height: `${pattern.length * cellSize}px`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${pattern[0].length}, 1fr)`,
                    gap: '1px',
                    padding: '1px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '2px dashed rgba(59, 130, 246, 0.5)',
                    borderRadius: '4px',
                    transition: 'all 0.15s ease'
                });

            // Add cells to preview
            pattern.flat().forEach(cell => {
                $('<div>')
                    .addClass('preview-cell')
                    .toggleClass('bg-blue-200', cell)
                    .css({
                        width: '100%',
                        height: '100%',
                        transition: 'all 0.15s ease'
                    })
                    .appendTo(previewElement);
            });

            gridOverlay.append(previewElement);
        }

        // Handle template drop
        $(document).on('templateDrop', (e, data, x, y) => {
            if (!data || !data.pattern) return;

            try {
                const pattern = JSON.parse(data.pattern);
                const gridRect = gameGrid[0].getBoundingClientRect();
                const cellSize = gameState.cellSize;

                // Calculate grid position
                const gridX = Math.floor((x - gridRect.left) / cellSize);
                const gridY = Math.floor((y - gridRect.top) / cellSize);

                // Create drop animation
                const dropEffect = $('<div>')
                    .addClass('absolute bg-blue-500 bg-opacity-20 rounded-lg transform scale-110')
                    .css({
                        left: `${gridX * cellSize}px`,
                        top: `${gridY * cellSize}px`,
                        width: `${pattern[0].length * cellSize}px`,
                        height: `${pattern.length * cellSize}px`,
                        transition: 'all 0.3s ease'
                    })
                    .appendTo(gridOverlay);

                // Animate and apply pattern
                setTimeout(() => {
                    dropEffect.css({
                        transform: 'scale(1)',
                        opacity: 0
                    });

                    // Apply pattern with animation
                    applyPatternToGrid(pattern, gridX, gridY);
                    updateGridDisplay();
                    updateStatistics();

                    // Remove drop effect
                    setTimeout(() => dropEffect.remove(), 300);
                }, 50);

            } catch (error) {
                console.error('Error applying template:', error);
            } finally {
                // Clear preview
                gridOverlay.empty();
                previewTemplate = null;
            }
        });

        // Handle template drag enter
        gameGrid.on('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const dataTransfer = e.originalEvent.dataTransfer;
            const data = dataTransfer.getData('application/json');

            if (data) {
                try {
                    previewTemplate = JSON.parse(data);
                    gameGrid.addClass('ring-2 ring-blue-500 ring-opacity-50');
                } catch (error) {
                    console.error('Error parsing template data:', error);
                }
            }
        });

        // Handle template drag leave
        gameGrid.on('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();

            gridOverlay.empty();
            previewTemplate = null;
            gameGrid.removeClass('ring-2 ring-blue-500 ring-opacity-50');
        });

        function updateTemplatePreview(x, y) {
            if (!previewTemplate || !previewTemplate.pattern) return;

            try {
                const pattern = JSON.parse(previewTemplate.pattern);
                const cellSize = gameState.cellSize;
                const gridX = Math.floor(x / cellSize);
                const gridY = Math.floor(y / cellSize);

                // Update preview overlay
                gridOverlay.empty().append(
                    $('<div>')
                        .addClass('template-preview-overlay')
                        .css({
                            left: `${gridX * cellSize}px`,
                            top: `${gridY * cellSize}px`,
                            width: `${pattern[0].length * cellSize}px`,
                            height: `${pattern.length * cellSize}px`,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${pattern[0].length}, 1fr)`,
                            gap: '1px',
                            padding: '1px',
                            transition: 'all 0.15s ease'
                        })
                        .append(
                            pattern.flat().map(cell =>
                                $('<div>')
                                    .addClass('preview-cell')
                                    .toggleClass('bg-blue-200', cell)
                                    .css({
                                        width: '100%',
                                        height: '100%',
                                        transition: 'all 0.15s ease'
                                    })
                            )
                        )
                );
            } catch (error) {
                console.error('Error updating template preview:', error);
            }
        }
    }

    function applyPatternToGrid(pattern, startX, startY) {
        const patternHeight = pattern.length;
        const patternWidth = pattern[0].length;

        // Calculate centered position
        const offsetX = Math.floor(startX - patternWidth / 2);
        const offsetY = Math.floor(startY - patternHeight / 2);

        // Clear preview overlay
        const overlay = document.getElementById('gridOverlay');
        overlay.innerHTML = '';

        // Create placement animation container
        const animContainer = document.createElement('div');
        animContainer.className = 'absolute transform-gpu';
        animContainer.style.left = `${offsetX * gameState.cellSize}px`;
        animContainer.style.top = `${offsetY * gameState.cellSize}px`;
        animContainer.style.width = `${patternWidth * gameState.cellSize}px`;
        animContainer.style.height = `${patternHeight * gameState.cellSize}px`;
        overlay.appendChild(animContainer);

        // Create placement effect
        const effect = document.createElement('div');
        effect.className = 'absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg transform scale-110';
        effect.style.transition = 'all 0.3s ease';
        animContainer.appendChild(effect);

        // Apply pattern with cascading animation
        let delay = 0;
        const delayStep = 20;

        for (let i = 0; i < patternHeight; i++) {
            for (let j = 0; j < patternWidth; j++) {
                const x = (offsetX + j + gameState.gridSize) % gameState.gridSize;
                const y = (offsetY + i + gameState.gridSize) % gameState.gridSize;
                const index = y * gameState.gridSize + x;

                if (pattern[i][j]) {
                    setTimeout(() => {
                        const cell = document.querySelector(`.grid-cell[data-index="${index}"]`);
                        if (cell) {
                            cell.style.transform = 'scale(1.2)';
                            cell.style.backgroundColor = 'black';
                            gameState.grid[index] = 1;

                            // Add ripple effect
                            const ripple = document.createElement('div');
                            ripple.className = 'absolute rounded-full bg-blue-500 bg-opacity-30 transform scale-0';
                            ripple.style.left = `${j * gameState.cellSize}px`;
                            ripple.style.top = `${i * gameState.cellSize}px`;
                            ripple.style.width = `${gameState.cellSize}px`;
                            ripple.style.height = `${gameState.cellSize}px`;
                            animContainer.appendChild(ripple);

                            // Animate ripple
                            requestAnimationFrame(() => {
                                ripple.style.transition = 'all 0.5s ease';
                                ripple.style.transform = 'scale(1.5)';
                                ripple.style.opacity = '0';
                            });

                            // Reset cell scale
                            setTimeout(() => {
                                cell.style.transform = 'scale(1)';
                            }, 150);

                            // Clean up ripple
                            setTimeout(() => ripple.remove(), 500);
                        }
                    }, delay);

                    delay += delayStep;
                }
            }
        }

        // Fade out placement effect
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transform = 'scale(1)';

            // Clean up animation container
            setTimeout(() => animContainer.remove(), 300);
        }, delay + 100);

        updateStatistics();
    }

    function animateCell(index) {
        const cell = document.querySelector(`.grid-cell[data-index="${index}"]`);
        if (cell) {
            cell.style.backgroundColor = 'black';
            cell.style.transform = 'scale(1.1)';
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
            }, 150);
        }
    }

    function toggleCell(index) {
        const { grid } = gameState;
        grid[index] = grid[index] ? 0 : 1;

        const cell = document.querySelector(`.grid-cell[data-index="${index}"]`);
        if (cell) {
            cell.style.backgroundColor = grid[index] ? 'black' : 'white';
            cell.style.transform = 'scale(1.1)';
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
            }, 150);
        }

        updateStatistics();
    }

    function generateRandomPopulation() {
        const { grid, gridSize } = gameState;
        const totalCells = gridSize * gridSize;

        for (let i = 0; i < totalCells; i++) {
            grid[i] = Math.random() < 0.3 ? 1 : 0;
        }

        updateGridDisplay();
        updateStatistics();
    }

    function evolveGrid() {
        const { grid, nextGrid, gridSize } = gameState;
        const totalCells = gridSize * gridSize;

        for (let i = 0; i < totalCells; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const neighbors = countNeighbors(row, col);
            const isAlive = grid[i] === 1;

            nextGrid[i] = isAlive ?
                (neighbors === 2 || neighbors === 3) ? 1 : 0 :
                neighbors === 3 ? 1 : 0;
        }

        [gameState.grid, gameState.nextGrid] = [gameState.nextGrid, gameState.grid];
        gameState.generation++;
        updateGridDisplay();
        updateStatistics();
    }

    function countNeighbors(row, col) {
        const { grid, gridSize } = gameState;
        let count = 0;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = (row + i + gridSize) % gridSize;
                const newCol = (col + j + gridSize) % gridSize;
                count += grid[newRow * gridSize + newCol];
            }
        }

        return count;
    }

    function updateGridDisplay() {
        const cells = document.getElementsByClassName('grid-cell');
        const { grid } = gameState;

        for (let i = 0; i < cells.length; i++) {
            cells[i].style.backgroundColor = grid[i] ? 'black' : 'white';
        }
    }

    function getCurrentPattern() {
        const pattern = [];
        const { grid, gridSize } = gameState;

        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                row.push(grid[i * gridSize + j] === 1);
            }
            pattern.push(row);
        }

        return pattern;
    }

    function resetGame() {
        gameState.isRunning = false;
        gameState.generation = 0;
        gameState.grid.fill(0);
        gameState.nextGrid.fill(0);

        updateGridDisplay();
        updateStatistics();
        updateControlsState();
    }

    function updateStatistics() {
        const aliveCells = gameState.grid.reduce((sum, cell) => sum + cell, 0);
        $('#generationCount').text(gameState.generation);
        $('#aliveCellCount').text(aliveCells);
    }

    function updateControlsState() {
        const { isRunning } = gameState;
        $('#startBtn').prop('disabled', isRunning).toggleClass('opacity-50', isRunning);
        $('#pauseBtn').prop('disabled', !isRunning).toggleClass('opacity-50', !isRunning);
        $('#resetBtn').prop('disabled', isRunning).toggleClass('opacity-50', isRunning);
        $('#speedControl').prop('disabled', !isRunning);
        $('#gridSizeControl').prop('disabled', isRunning);
    }

    function openSaveTemplateModal() {
        $('#saveTemplateModal').removeClass('hidden');
        $('#templateName').focus();
    }

    function resizeGrid(newSize) {
        const oldSize = gameState.gridSize;
        const oldGrid = gameState.grid;

        // Calculate new cell size based on container width
        const container = document.getElementById('gameGrid');
        const containerWidth = container.clientWidth - 32;
        const newCellSize = Math.floor((containerWidth - newSize) / newSize);

        gameState.gridSize = newSize;
        gameState.cellSize = newCellSize;
        const totalCells = newSize * newSize;
        gameState.grid = new Uint8Array(totalCells);
        gameState.nextGrid = new Uint8Array(totalCells);

        // Preserve pattern in center
        const offset = Math.floor((newSize - oldSize) / 2);
        if (offset >= 0) {
            for (let i = 0; i < oldSize; i++) {
                for (let j = 0; j < oldSize; j++) {
                    const oldIndex = i * oldSize + j;
                    const newIndex = (i + offset) * newSize + (j + offset);
                    if (newIndex < totalCells) {
                        gameState.grid[newIndex] = oldGrid[oldIndex];
                    }
                }
            }
        }

        createGrid();
        updateStatistics();
    }

    function startGameLoop() {
        let lastUpdate = performance.now();
        const targetInterval = 1000 / 60; // 60 FPS

        function gameLoop(currentTime) {
            const deltaTime = currentTime - lastUpdate;

            if (gameState.isRunning && deltaTime >= targetInterval / gameState.speed) {
                evolveGrid();
                lastUpdate = currentTime;
            }

            requestAnimationFrame(gameLoop);
        }

        requestAnimationFrame(gameLoop);
    }
});
