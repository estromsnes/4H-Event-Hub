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
     * Capture a photo from the video stream
     * @returns {Blob} - The captured image as a Blob
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
