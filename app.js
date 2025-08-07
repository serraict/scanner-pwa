class QRScanner {
    constructor() {
        this.codeReader = new ZXing.BrowserMultiFormatReader();
        this.video = document.getElementById('video');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.status = document.getElementById('status');
        this.result = document.getElementById('result');
        this.resultText = document.getElementById('resultText');
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
            this.hideResult();
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
        this.hideResult();
    }

    showResult(text) {
        this.resultText.textContent = text;
        this.result.style.display = 'block';
        
        // Auto-copy to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(err => {
                console.log('Could not copy to clipboard:', err);
            });
        }
    }

    hideResult() {
        this.result.style.display = 'none';
    }

    showError(message) {
        this.error.textContent = message;
        this.error.style.display = 'block';
    }

    hideError() {
        this.error.style.display = 'none';
    }

    updateStatus(message) {
        this.status.textContent = message;
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