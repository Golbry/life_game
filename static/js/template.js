$(document).ready(() => {
    // Initialize template system
    initializeTemplates();
    setupEventListeners();

    function initializeTemplates() {
        loadTemplates();
        initializeDragAndDrop();
    }

    function setupEventListeners() {
        $(document).on('click', '.template-card', function() {
            const templateId = $(this).data('template-id');
            selectTemplate(templateId);
        });

        $(document).on('click', '.delete-template', function(e) {
            e.stopPropagation();
            const templateId = $(this).data('template-id');
            deleteTemplate(templateId);
        });

        $('#applyTemplate').click(() => {
            const selectedId = $('.template-card.selected').data('template-id');
            if (selectedId) {
                applyTemplate(selectedId);
            }
        });

        $('#saveTemplate').click(() => {
            $('#saveTemplateModal').removeClass('hidden');
            $('#templateName').focus();
        });

        $('#cancelSave').click(() => {
            $('#saveTemplateModal').addClass('hidden');
            clearModalInputs();
        });

        $('#confirmSave').click(saveTemplate);
    }

    function loadTemplates() {
        $.get('/api/templates', (templates) => {
            renderTemplates('preset', templates.filter(t => t.category === 'preset'));
            renderTemplates('user', templates.filter(t => t.category === 'user'));
        });
    }

    function renderTemplates(category, templates) {
        const container = category === 'preset' ? '#presetTemplates' : '#userTemplates';
        $(container).empty();

        templates.forEach(template => {
            const templateHtml = createTemplateHtml(template);
            $(container).append(templateHtml);
            renderPreview(template.pattern, $(`[data-template-id="${template.id}"] .template-preview`));
        });
    }

    function createTemplateHtml(template) {
        return `
            <div class="template-card border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-move"
                 data-template-id="${template.id}"
                 draggable="true">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-lg">${template.name}</h3>
                        <p class="text-gray-600 text-sm mt-1">${template.description || ''}</p>
                    </div>
                    ${template.category === 'user' ? `
                        <button class="delete-template text-red-500 hover:text-red-700"
                                data-template-id="${template.id}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="template-preview mt-2 bg-gray-100 rounded aspect-square"></div>
            </div>
        `;
    }

    function renderPreview(pattern, element) {
        if (!element || !element.length) return;

        try {
            const grid = typeof pattern === 'string' ? JSON.parse(pattern) : pattern;
            if (!Array.isArray(grid) || !grid.length) throw new Error('Invalid pattern');

            const containerSize = element.width() || 100;
            const rows = grid.length;
            const cols = grid[0].length;
            const cellSize = Math.floor((containerSize - 2) / Math.max(rows, cols));

            const templateCard = element.closest('.template-card');
            if (templateCard.length) {
                templateCard.data('pattern', JSON.stringify(grid));
            }

            const gridContainer = $('<div>')
                .addClass('grid w-full h-full bg-white rounded-lg p-1')
                .css({
                    'display': 'grid',
                    'grid-template-columns': `repeat(${cols}, 1fr)`,
                    'gap': '1px'
                });

            grid.flat().forEach((cell, idx) => {
            const cellElement = $('<div>')
                    .addClass('relative')
                    .css({
                        'background-color': cell ? '#000' : '#fff',
                        'aspect-ratio': '1',
                        'transition': 'all 0.15s ease-in-out',
                        'transform-origin': 'center',
                        'border': '1px solid #eee'
                    })
                    .hover(
                        function() { $(this).css('transform', 'scale(1.1)'); },
                        function() { $(this).css('transform', 'scale(1)'); }
                    );

                gridContainer.append(cellElement);
            });

            element.empty().append(gridContainer);

            if (templateCard.length) {
                templateCard
                    .attr('draggable', true)
                    .on('dragstart', function(e) {
                        const dragData = {
                            templateId: templateCard.data('template-id'),
                            pattern: templateCard.data('pattern')
                        };
                        e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                        $(this).addClass('opacity-50 scale-95');

                        const preview = gridContainer.clone()
                            .addClass('fixed pointer-events-none z-50')
                            .css({
                                width: '200px',
                                background: '#fff',
                                border: '2px solid #000',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                transform: 'scale(0.8)',
                                opacity: 0.9
                            });

                        $('body').append(preview);

                        const updatePreview = (e) => {
                            preview.css({
                                left: e.clientX + 10,
                                top: e.clientY + 10
                            });
                        };

                        $(document).on('dragover.preview', updatePreview);

                        $(document).one('dragend.preview', () => {
                            preview.remove();
                            $(document).off('dragover.preview', updatePreview);
                            $(this).removeClass('opacity-50 scale-95');
                        });
                    });
            }

        } catch (error) {
            console.error('Preview error:', error);
            element.html(`
                <div class="flex items-center justify-center h-full bg-red-50">
                    <span class="text-red-500 text-sm">Error loading preview</span>
                </div>
            `);
        }
    }

    function initializeDragAndDrop() {
        const gameGrid = $('#gameGrid');

        gameGrid
            .on('dragenter', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).addClass('ring-4 ring-blue-500 ring-opacity-50 scale-105');
            })
            .on('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.originalEvent.dataTransfer.dropEffect = 'copy';
            })
            .on('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('ring-4 ring-blue-500 ring-opacity-50 scale-105');
            })
            .on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('ring-4 ring-blue-500 ring-opacity-50 scale-105');

                try {
                    const data = JSON.parse(e.originalEvent.dataTransfer.getData('text/plain'));
                    if (data.templateId && data.pattern) {
                        const rect = this.getBoundingClientRect();
                        const x = e.originalEvent.clientX - rect.left;
                        const y = e.originalEvent.clientY - rect.top;

                        const dropEffect = $('<div>')
                            .addClass('absolute transform scale-110')
                            .css({
                                left: x - 50,
                                top: y - 50,
                                width: '100px',
                                height: '100px',
                                background: 'rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                                transition: 'all 0.3s ease'
                            })
                            .appendTo(this);

                        setTimeout(() => {
                            dropEffect.css({
                                transform: 'scale(1)',
                                opacity: 0
                            });
                            setTimeout(() => dropEffect.remove(), 300);
                        }, 50);

                        $(document).trigger('templateDrop', [data, x, y]);
                    }
                } catch (error) {
                    console.error('Drop error:', error);
                }
            });

        $(document).on('dragstart', '.template-card', function(e) {
            const templateId = $(this).data('template-id');
            const pattern = $(this).data('pattern');

            if (!pattern) return;

            e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                templateId: templateId,
                pattern: pattern
            }));

            $(this).addClass('opacity-50 scale-95');
        });

        $(document).on('dragend', '.template-card', function() {
            $(this).removeClass('opacity-50 scale-95');
        });
    }

    function selectTemplate(templateId) {
        $('.template-card').removeClass('selected ring-2 ring-blue-500');
        $(`.template-card[data-template-id="${templateId}"]`).addClass('selected ring-2 ring-blue-500');
        loadTemplatePreview(templateId);
        $('#applyTemplate').prop('disabled', false);
    }

    function loadTemplatePreview(templateId) {
        $.ajax({
            url: '/api/templates/load',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ template_id: templateId }),
            success: (response) => {
                if (response.success) {
                    renderPreview(response.pattern, $('#templatePreview'));
                }
            }
        });
    }

    function deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) return;

        $.ajax({
            url: '/api/templates/delete',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ template_id: templateId }),
            success: (response) => {
                if (response.success) {
                    $(`.template-card[data-template-id="${templateId}"]`).fadeOut(300, function() {
                        $(this).remove();
                    });
                } else {
                    alert(response.message || 'Failed to delete template');
                }
            }
        });
    }

    function applyTemplate(templateId) {
        $.ajax({
            url: '/api/templates/load',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ template_id: templateId }),
            success: (response) => {
                if (response.success) {
                    $(document).trigger('applyTemplate', [response.pattern]);
                }
            }
        });
    }

    function saveTemplate() {
        const name = $('#templateName').val().trim();
        const description = $('#templateDescription').val().trim();

        if (!name) {
            alert('Please enter a template name');
            return;
        }

        const gridSize = Math.sqrt($('.grid-cell').length);
        const pattern = [];

        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                const cell = $(`.grid-cell[data-index="${i * gridSize + j}"]`);
                row.push(cell.css('background-color') === 'rgb(0, 0, 0)');
            }
            pattern.push(row);
        }

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
                    clearModalInputs();
                    loadTemplates();
                    alert('Template saved successfully!');
                } else {
                    alert(response.error || 'Failed to save template');
                }
            },
            error: (xhr) => {
                const response = xhr.responseJSON || {};
                alert(response.error || 'Failed to save template');
            }
        });
    }

    function clearModalInputs() {
        $('#templateName').val('');
        $('#templateDescription').val('');
    }
});
