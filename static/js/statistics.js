/* global Chart */
$(document).ready(() => {
    // Initialize charts
    let evolutionChart = null;
    let populationChart = null;

    // Initialize data
    initializeCharts();
    startRealTimeUpdates();

    function initializeCharts() {
        // Evolution History Chart
        const evolutionCanvas = document.getElementById('evolutionChart');
        if (!evolutionCanvas) {
            console.error('Evolution chart canvas not found');
            return;
        }
        const evolutionCtx = evolutionCanvas.getContext('2d');
        evolutionChart = new Chart(evolutionCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Generation Count',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Population Trends Chart
        const populationCanvas = document.getElementById('populationChart');
        if (!populationCanvas) {
            console.error('Population chart canvas not found');
            return;
        }
        const populationCtx = populationCanvas.getContext('2d');
        populationChart = new Chart(populationCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Alive Cells',
                    data: [],
                    borderColor: 'rgb(139, 92, 246)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Load initial historical data
        loadHistoricalData();
    }

    function loadHistoricalData() {
        $.ajax({
            url: '/api/statistics/history',
            method: 'GET',
            success: (data) => {
                // Process data for charts
                const labels = data.map(d => {
                    const date = new Date(d.timestamp);
                    return date.toLocaleTimeString();
                });
                const generations = data.map(d => d.generation);
                const populations = data.map(d => d.alive_cells);

                // Update Evolution Chart
                evolutionChart.data.labels = labels;
                evolutionChart.data.datasets[0].data = generations;
                evolutionChart.update();

                // Update Population Chart
                populationChart.data.labels = labels;
                populationChart.data.datasets[0].data = populations;
                populationChart.update();
            }
        });
    }

    function startRealTimeUpdates() {
        // Update real-time statistics every second
        setInterval(updateRealTimeStats, 1000);

        // Update historical data every minute
        setInterval(loadHistoricalData, 60000);
    }

    function updateRealTimeStats() {
        $.ajax({
            url: '/api/statistics/overview',
            method: 'GET',
            success: (data) => {
                $('#currentGeneration').text(data.current_generation);
                $('#aliveCells').text(data.alive_cells);
                $('#totalTime').text(formatTime(data.total_time));
            }
        });
    }

    function formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
});
