// Camera Module
// Handles webcam access and photo capture

class Camera {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.stream = null;
        this.capturedBlob = null;
    }

    /**
     * Start the camera and show video stream
     */
    async start() {
        try {
            // Request camera access
            // Prefer front camera for selfies
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user', // Front camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // Attach stream to video element
            this.video.srcObject = this.stream;
            this.video.play();

            console.log('Camera started');
            return true;
        } catch (err) {
            console.error('Error accessing camera:', err);
            throw new Error('Kunne ikke få tilgang til kameraet. Sjekk tillatelser.');
        }
    }

    /**
     * Stop the camera and release resources
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
            console.log('Camera stopped');
        }
    }

    /**
     * Capture a photo with countdown
     * @param {HTMLElement} overlayElement - Element to show countdown
     * @returns {Promise<Canvas>} - The captured image canvas
     */
    async captureWithCountdown(overlayElement) {
        if (!this.stream) {
            throw new Error('Camera not started');
        }

        // Create countdown overlay
        overlayElement.style.display = 'flex';
        overlayElement.style.position = 'absolute';
        overlayElement.style.top = '0';
        overlayElement.style.left = '0';
        overlayElement.style.width = '100%';
        overlayElement.style.height = '100%';
        overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlayElement.style.color = 'white';
        overlayElement.style.fontSize = '120px';
        overlayElement.style.fontWeight = 'bold';
        overlayElement.style.justifyContent = 'center';
        overlayElement.style.alignItems = 'center';
        overlayElement.style.zIndex = '1000';

        // Countdown from 3 to 1
        for (let i = 3; i > 0; i--) {
            overlayElement.textContent = i;
            overlayElement.style.transform = 'scale(1.2)';

            // Play beep sound
            this.playBeep(i === 1 ? 1200 : 800, 200);

            await this.sleep(1000);

            overlayElement.style.transform = 'scale(1)';
        }

        // Flash effect
        overlayElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        overlayElement.textContent = '📸';

        // Play shutter sound
        this.playShutterSound();

        await this.sleep(100);

        // Capture the photo
        const canvas = this.capture();

        // Hide overlay
        await this.sleep(200);
        overlayElement.style.display = 'none';
        overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        return canvas;
    }

    /**
     * Capture a photo from the video stream (without countdown)
     * @returns {Canvas} - The captured image canvas
     */
    capture() {
        if (!this.stream) {
            throw new Error('Camera not started');
        }

        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Draw current video frame to canvas
        const context = this.canvas.getContext('2d');
        context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        console.log('Photo captured');
        return this.canvas;
    }

    /**
     * Play a beep sound
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in ms
     */
    playBeep(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (err) {
            // Silently fail if audio not supported
            console.log('Audio not supported');
        }
    }

    /**
     * Play camera shutter sound
     */
    playShutterSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a short "click" sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (err) {
            console.log('Audio not supported');
        }
    }

    /**
     * Sleep helper function
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Convert captured photo to Blob for uploading
     * @returns {Promise<Blob>}
     */
    async getBlob() {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                (blob) => {
                    if (blob) {
                        this.capturedBlob = blob;
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                'image/jpeg',
                0.9
            );
        });
    }

    /**
     * Upload captured photo to server
     * @param {string} participantCode - The participant code
     * @returns {Promise<object>} - Server response
     */
    async uploadPhoto(participantCode) {
        if (!this.capturedBlob) {
            throw new Error('No photo captured');
        }

        try {
            // Create form data
            const formData = new FormData();
            formData.append('photo', this.capturedBlob, 'selfie.jpg');

            // Upload to server
            const response = await fetch(`/api/participants/${participantCode}/photo`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload photo');
            }

            const result = await response.json();
            console.log('Photo uploaded successfully:', result);
            return result;
        } catch (err) {
            console.error('Error uploading photo:', err);
            throw err;
        }
    }

    /**
     * Check if browser supports camera access
     * @returns {boolean}
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
}

// Export for use in other modules
window.Camera = Camera;
