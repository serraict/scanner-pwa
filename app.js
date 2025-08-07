class QRScanner {
    constructor() {
        this.codeReader = new ZXing.BrowserMultiFormatReader();
        this.video = document.getElementById('video');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.results = document.getElementById('results');
        this.resultsList = document.getElementById('resultsList');
        this.error = document.getElementById('error');
        
        this.isScanning = false;
        this.stream = null;
        
        this.init();
    }

    init() {
        this.toggleBtn.addEventListener('click', () => this.toggleScanning());
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    async startScanning() {
        try {
            this.hideError();
            this.updateStatus('Requesting camera access...');
            
            // Get camera constraints - prefer back camera on mobile
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.addEventListener('loadedmetadata', resolve, { once: true });
            });

            this.updateStatus('Camera ready. Scanning for codes...');
            this.toggleBtn.textContent = 'Stop Camera';
            this.toggleBtn.className = 'btn-secondary';
            this.isScanning = true;

            // Start continuous scanning
            this.scanContinuously();

        } catch (err) {
            console.error('Error starting camera:', err);
            this.showError(`Camera error: ${err.message}`);
            this.updateStatus('Failed to start camera');
        }
    }

    async scanContinuously() {
        if (!this.isScanning) return;

        try {
            const result = await this.codeReader.decodeOnceFromVideoDevice(undefined, 'video');
            
            if (result) {
                this.showResult(result.text);
                this.updateStatus(`Code detected! Type: ${result.format}`);
                
                // Vibrate if available
                if (navigator.vibrate) {
                    navigator.vibrate(200);
                }
                
                // Brief pause before continuing
                setTimeout(() => {
                    if (this.isScanning) {
                        this.scanContinuously();
                    }
                }, 2000);
            }
        } catch (err) {
            // Continue scanning even if no code is found
            if (this.isScanning) {
                requestAnimationFrame(() => this.scanContinuously());
            }
        }
    }

    stopScanning() {
        this.isScanning = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.codeReader.reset();
        
        this.toggleBtn.textContent = 'Start Camera';
        this.toggleBtn.className = 'btn-primary';
        this.updateStatus('Camera stopped');
    }

    showResult(text) {
        // Create timestamp
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        
        // Create new result item
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <div class="result-timestamp">${timestamp}</div>
            <div>${text}</div>
        `;
        
        // Add to top of results list
        this.resultsList.insertBefore(resultItem, this.resultsList.firstChild);
        
        // Show results container
        this.results.classList.add('has-results');
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (resultItem.parentNode) {
                resultItem.remove();
                // Hide results container if no more results
                if (this.resultsList.children.length === 0) {
                    this.results.classList.remove('has-results');
                }
            }
        }, 30000);
        
        // Auto-copy to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(err => {
                console.log('Could not copy to clipboard:', err);
            });
        }
    }

    showError(message) {
        if (this.error) {
            this.error.textContent = message;
            this.error.style.display = 'block';
        } else {
            console.error('Error element not found:', message);
        }
    }

    hideError() {
        if (this.error) {
            this.error.style.display = 'none';
        }
    }

    updateStatus(message) {
        console.log(`QR Scanner: ${message}`);
    }

    toggleScanning() {
        if (this.isScanning) {
            this.stopScanning();
        } else {
            this.startScanning();
        }
    }
}

// Initialize the scanner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QRScanner();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.scanner && window.scanner.isScanning) {
        // Pause scanning when page is hidden to save battery
        window.scanner.stopScanning();
    }
});