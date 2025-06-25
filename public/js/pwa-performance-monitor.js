/**
 * PWA Performance Monitor - Release 6B: PWA Avançado e Performance
 * Dashboard em tempo real para monitoramento de performance PWA
 */

class PWAPerformanceMonitor {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
        this.charts = {};
        this.realTimeData = {
            responseTime: [],
            cacheHitRate: [],
            memoryUsage: [],
            networkLatency: []
        };
        
        this.init();
    }

    init() {
        console.log('📊 PWA Performance Monitor initializing...');
        this.createMonitorUI();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
    }

    createMonitorUI() {
        // Create floating performance monitor
        const monitor = document.createElement('div');
        monitor.id = 'pwa-performance-monitor';
        monitor.className = 'pwa-monitor hidden';
        monitor.innerHTML = `
            <div class="monitor-header">
                <h3>🚀 PWA Performance Monitor</h3>
                <div class="monitor-controls">
                    <button class="monitor-btn" onclick="pwaMonitor.toggleFullscreen()">⛶</button>
                    <button class="monitor-btn" onclick="pwaMonitor.exportReport()">📊</button>
                    <button class="monitor-btn" onclick="pwaMonitor.hide()">✕</button>
                </div>
            </div>
            
            <div class="monitor-content">
                <!-- Real-time metrics -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-title">Cache Hit Rate</div>
                        <div class="metric-value" id="cache-hit-rate">--</div>
                        <div class="metric-trend" id="cache-trend">--</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Avg Response Time</div>
                        <div class="metric-value" id="response-time">--</div>
                        <div class="metric-trend" id="response-trend">--</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Memory Usage</div>
                        <div class="metric-value" id="memory-usage">--</div>
                        <div class="metric-trend" id="memory-trend">--</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Network Quality</div>
                        <div class="metric-value" id="network-quality">--</div>
                        <div class="metric-trend" id="network-trend">--</div>
                    </div>
                </div>
                
                <!-- Performance charts -->
                <div class="charts-container">
                    <div class="chart-section">
                        <h4>Response Time History</h4>
                        <canvas id="response-time-chart" width="300" height="150"></canvas>
                    </div>
                    
                    <div class="chart-section">
                        <h4>Cache Performance</h4>
                        <canvas id="cache-chart" width="300" height="150"></canvas>
                    </div>
                </div>
                
                <!-- Service Worker Status -->
                <div class="sw-status-section">
                    <h4>Service Worker Status</h4>
                    <div class="sw-info">
                        <div class="sw-item">
                            <span>State:</span>
                            <span id="sw-state" class="sw-value">--</span>
                        </div>
                        <div class="sw-item">
                            <span>Version:</span>
                            <span id="sw-version" class="sw-value">--</span>
                        </div>
                        <div class="sw-item">
                            <span>Last Update:</span>
                            <span id="sw-last-update" class="sw-value">--</span>
                        </div>
                        <div class="sw-item">
                            <span>Cache Size:</span>
                            <span id="sw-cache-size" class="sw-value">--</span>
                        </div>
                    </div>
                </div>
                
                <!-- Background Tasks -->
                <div class="tasks-section">
                    <h4>Background Tasks</h4>
                    <div id="background-tasks-list" class="tasks-list">
                        <!-- Tasks will be populated here -->
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="actions-section">
                    <h4>Quick Actions</h4>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="pwaMonitor.clearCaches()">
                            🗑️ Clear Caches
                        </button>
                        <button class="action-btn" onclick="pwaMonitor.forceSync()">
                            🔄 Force Sync
                        </button>
                        <button class="action-btn" onclick="pwaMonitor.updateServiceWorker()">
                            ⬆️ Update SW
                        </button>
                        <button class="action-btn" onclick="pwaMonitor.runDiagnostics()">
                            🔍 Diagnostics
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(monitor);
        this.addMonitorStyles();
    }

    addMonitorStyles() {
        const styles = `
            .pwa-monitor {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: rgba(26, 54, 93, 0.95);
                color: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                z-index: 10000;
                font-family: 'Segoe UI', system-ui, sans-serif;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .pwa-monitor.hidden {
                transform: translateX(420px);
                opacity: 0;
            }
            
            .pwa-monitor.fullscreen {
                top: 10px;
                left: 10px;
                right: 10px;
                bottom: 10px;
                width: auto;
                max-height: none;
            }
            
            .monitor-header {
                background: rgba(0, 0, 0, 0.2);
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
            }
            
            .monitor-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .monitor-controls {
                display: flex;
                gap: 8px;
            }
            
            .monitor-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }
            
            .monitor-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .monitor-content {
                padding: 16px;
                max-height: calc(80vh - 60px);
                overflow-y: auto;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .metric-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 12px;
                border-radius: 8px;
                text-align: center;
            }
            
            .metric-title {
                font-size: 11px;
                opacity: 0.8;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .metric-value {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            
            .metric-trend {
                font-size: 10px;
                opacity: 0.7;
            }
            
            .trend-up { color: #4ade80; }
            .trend-down { color: #f87171; }
            .trend-stable { color: #fbbf24; }
            
            .charts-container {
                margin-bottom: 20px;
            }
            
            .chart-section {
                margin-bottom: 16px;
            }
            
            .chart-section h4 {
                margin: 0 0 8px 0;
                font-size: 12px;
                text-transform: uppercase;
                opacity: 0.8;
            }
            
            .chart-section canvas {
                width: 100%;
                height: 100px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
            }
            
            .sw-status-section,
            .tasks-section,
            .actions-section {
                margin-bottom: 20px;
            }
            
            .sw-status-section h4,
            .tasks-section h4,
            .actions-section h4 {
                margin: 0 0 12px 0;
                font-size: 12px;
                text-transform: uppercase;
                opacity: 0.8;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 4px;
            }
            
            .sw-info {
                background: rgba(255, 255, 255, 0.05);
                padding: 12px;
                border-radius: 6px;
            }
            
            .sw-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 12px;
            }
            
            .sw-item:last-child {
                margin-bottom: 0;
            }
            
            .sw-value {
                font-weight: 600;
                color: #60a5fa;
            }
            
            .tasks-list {
                max-height: 120px;
                overflow-y: auto;
            }
            
            .task-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 8px 12px;
                margin-bottom: 6px;
                border-radius: 6px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
            }
            
            .task-status {
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 9px;
                font-weight: 600;
            }
            
            .task-running {
                background: #fbbf24;
                color: #000;
            }
            
            .task-completed {
                background: #4ade80;
                color: #000;
            }
            
            .task-pending {
                background: #6b7280;
                color: #fff;
            }
            
            .action-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            .action-btn {
                background: rgba(192, 0, 42, 0.8);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 500;
                transition: background 0.2s ease;
            }
            
            .action-btn:hover {
                background: rgba(192, 0, 42, 1);
            }
            
            /* Scrollbar styles */
            .monitor-content::-webkit-scrollbar,
            .tasks-list::-webkit-scrollbar {
                width: 6px;
            }
            
            .monitor-content::-webkit-scrollbar-track,
            .tasks-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }
            
            .monitor-content::-webkit-scrollbar-thumb,
            .tasks-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
            }
            
            .monitor-content::-webkit-scrollbar-thumb:hover,
            .tasks-list::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupEventListeners() {
        // Make monitor draggable
        this.makeDraggable();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+P to toggle monitor
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    makeDraggable() {
        const monitor = document.getElementById('pwa-performance-monitor');
        const header = monitor.querySelector('.monitor-header');
        
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = monitor.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = Math.max(0, Math.min(window.innerWidth - 400, startLeft + deltaX));
            const newTop = Math.max(0, Math.min(window.innerHeight - 200, startTop + deltaY));
            
            monitor.style.left = newLeft + 'px';
            monitor.style.top = newTop + 'px';
            monitor.style.right = 'auto';
        }
        
        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    setupRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            if (this.isVisible) {
                this.updateMetrics();
                this.updateCharts();
                this.updateServiceWorkerStatus();
                this.updateBackgroundTasks();
            }
        }, 2000); // Update every 2 seconds
    }

    updateMetrics() {
        if (!window.advancedPWAController) return;
        
        const metrics = window.advancedPWAController.getPerformanceMetrics();
        
        // Update cache hit rate
        const cacheHitRate = Math.round(metrics.cacheHitRate * 100);
        document.getElementById('cache-hit-rate').textContent = `${cacheHitRate}%`;
        this.updateTrend('cache-trend', cacheHitRate, 80);
        
        // Update response time
        const responseTime = Math.round(metrics.avgResponseTime);
        document.getElementById('response-time').textContent = `${responseTime}ms`;
        this.updateTrend('response-trend', responseTime, 1000, true);
        
        // Update memory usage
        if ('memory' in performance) {
            const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            document.getElementById('memory-usage').textContent = `${memoryUsage}MB`;
            this.updateTrend('memory-trend', memoryUsage, 100);
        }
        
        // Update network quality
        if ('connection' in navigator) {
            const quality = this.getNetworkQualityScore(navigator.connection);
            document.getElementById('network-quality').textContent = quality.label;
            this.updateTrend('network-trend', quality.score, 80);
        }
        
        // Store data for charts
        this.storeRealTimeData(metrics);
    }

    updateTrend(elementId, value, threshold, inverse = false) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let trend = 'stable';
        if (inverse) {
            trend = value > threshold ? 'down' : value < threshold * 0.5 ? 'up' : 'stable';
        } else {
            trend = value > threshold ? 'up' : value < threshold * 0.8 ? 'down' : 'stable';
        }
        
        const icons = { up: '↗️', down: '↘️', stable: '➡️' };
        element.textContent = icons[trend];
        element.className = `metric-trend trend-${trend}`;
    }

    getNetworkQualityScore(connection) {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        const rtt = connection.rtt;
        
        let score = 0;
        let label = 'Unknown';
        
        if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
            score = 95;
            label = 'Excellent';
        } else if (effectiveType === '4g') {
            score = 80;
            label = 'Good';
        } else if (effectiveType === '3g') {
            score = 60;
            label = 'Fair';
        } else {
            score = 30;
            label = 'Poor';
        }
        
        return { score, label };
    }

    storeRealTimeData(metrics) {
        const maxDataPoints = 30;
        
        // Store response time
        this.realTimeData.responseTime.push({
            timestamp: Date.now(),
            value: metrics.avgResponseTime
        });
        if (this.realTimeData.responseTime.length > maxDataPoints) {
            this.realTimeData.responseTime.shift();
        }
        
        // Store cache hit rate
        this.realTimeData.cacheHitRate.push({
            timestamp: Date.now(),
            value: metrics.cacheHitRate * 100
        });
        if (this.realTimeData.cacheHitRate.length > maxDataPoints) {
            this.realTimeData.cacheHitRate.shift();
        }
    }

    updateCharts() {
        this.updateResponseTimeChart();
        this.updateCacheChart();
    }

    updateResponseTimeChart() {
        const canvas = document.getElementById('response-time-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.realTimeData.responseTime;
        
        if (data.length < 2) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw chart
        this.drawLineChart(ctx, data, canvas.width, canvas.height, '#60a5fa');
    }

    updateCacheChart() {
        const canvas = document.getElementById('cache-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.realTimeData.cacheHitRate;
        
        if (data.length < 2) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw chart
        this.drawLineChart(ctx, data, canvas.width, canvas.height, '#4ade80');
    }

    drawLineChart(ctx, data, width, height, color) {
        if (data.length < 2) return;
        
        const padding = 10;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Find min/max values
        const values = data.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const valueRange = maxValue - minValue || 1;
        
        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw dots
        ctx.fillStyle = color;
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + (1 - (point.value - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    updateServiceWorkerStatus() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    document.getElementById('sw-state').textContent = 
                        registration.active ? 'Active' : 'Installing';
                    
                    if (window.advancedPWAController) {
                        document.getElementById('sw-version').textContent = 
                            window.advancedPWAController.version;
                    }
                    
                    document.getElementById('sw-last-update').textContent = 
                        new Date().toLocaleTimeString();
                } else {
                    document.getElementById('sw-state').textContent = 'Not Registered';
                }
            });
        }
        
        // Update cache size
        this.getCacheSize().then(size => {
            document.getElementById('sw-cache-size').textContent = 
                `${(size / 1024 / 1024).toFixed(1)}MB`;
        });
    }

    async getCacheSize() {
        try {
            const cacheNames = await caches.keys();
            let totalSize = 0;
            
            for (const name of cacheNames) {
                const cache = await caches.open(name);
                const requests = await cache.keys();
                
                for (const request of requests) {
                    const response = await cache.match(request);
                    if (response) {
                        const clone = response.clone();
                        const arrayBuffer = await clone.arrayBuffer();
                        totalSize += arrayBuffer.byteLength;
                    }
                }
            }
            
            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    updateBackgroundTasks() {
        if (!window.advancedPWAController) return;
        
        const tasksList = document.getElementById('background-tasks-list');
        const tasks = window.advancedPWAController.backgroundTasks;
        
        tasksList.innerHTML = '';
        
        for (const [name, task] of tasks) {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            
            const status = task.running ? 'running' : 'completed';
            const lastRun = task.lastRun ? 
                new Date(task.lastRun).toLocaleTimeString() : 'Never';
            
            taskElement.innerHTML = `
                <div>
                    <div>${name}</div>
                    <div style="font-size: 9px; opacity: 0.7;">Last: ${lastRun}</div>
                </div>
                <div class="task-status task-${status}">${status}</div>
            `;
            
            tasksList.appendChild(taskElement);
        }
    }

    // Public methods
    show() {
        const monitor = document.getElementById('pwa-performance-monitor');
        monitor.classList.remove('hidden');
        this.isVisible = true;
    }

    hide() {
        const monitor = document.getElementById('pwa-performance-monitor');
        monitor.classList.add('hidden');
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    toggleFullscreen() {
        const monitor = document.getElementById('pwa-performance-monitor');
        monitor.classList.toggle('fullscreen');
    }

    async clearCaches() {
        if (window.advancedPWAController) {
            await window.advancedPWAController.clearAllCaches();
            this.showNotification('Caches cleared successfully', 'success');
        }
    }

    async forceSync() {
        if (window.advancedPWAController) {
            await window.advancedPWAController.forceSync();
            this.showNotification('Sync completed', 'success');
        }
    }

    async updateServiceWorker() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
                this.showNotification('Service Worker updated', 'success');
            }
        }
    }

    runDiagnostics() {
        const diagnostics = this.generateDiagnostics();
        this.showDiagnosticsModal(diagnostics);
    }

    generateDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            connection: 'connection' in navigator ? {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            memory: 'memory' in performance ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null,
            serviceWorker: 'serviceWorker' in navigator,
            pwa: window.matchMedia('(display-mode: standalone)').matches,
            notifications: 'Notification' in window ? Notification.permission : 'not-supported',
            storage: 'storage' in navigator && 'estimate' in navigator.storage
        };
        
        return diagnostics;
    }

    showDiagnosticsModal(diagnostics) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 24px;
                border-radius: 12px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                font-family: monospace;
                font-size: 12px;
            ">
                <h3 style="margin-top: 0;">PWA Diagnostics Report</h3>
                <pre>${JSON.stringify(diagnostics, null, 2)}</pre>
                <button onclick="this.closest('div').parentElement.remove()" 
                        style="
                            background: #1a365d;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            margin-top: 16px;
                        ">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    exportReport() {
        const report = {
            timestamp: new Date().toISOString(),
            performance: window.advancedPWAController ? 
                window.advancedPWAController.getPerformanceMetrics() : {},
            realTimeData: this.realTimeData,
            diagnostics: this.generateDiagnostics()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], 
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pwa-performance-report-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Report exported', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4ade80' : '#60a5fa'};
            color: black;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 10002;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        const monitor = document.getElementById('pwa-performance-monitor');
        if (monitor) {
            monitor.remove();
        }
    }
}

// Initialize Performance Monitor
const pwaMonitor = new PWAPerformanceMonitor();

// Expose globally
window.pwaMonitor = pwaMonitor;

// Export for module use
export default PWAPerformanceMonitor;
