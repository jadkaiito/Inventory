<!-- HTML: Camera Permission Modal -->
<div id="cameraPermissionModal" class="permission-modal">
  <div class="modal-content">
    <h3>Camera Access Required</h3>
    <p>This website requires access to your camera to scan barcodes. Please grant permission for the camera to function.</p>
    <button id="allowCamera">Allow Camera</button>
    <button id="denyCamera">Deny</button>
  </div>
</div>

<!-- Add your camera display element here -->
<video id="video" width="640" height="480" autoplay></video>

<script>
// camera.js

// Patch to ensure all canvas contexts use willReadFrequently
(function patchCanvasContext() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, options) {
    if (type === "2d") {
      options = options || {};
      options.willReadFrequently = true;
    }
    return originalGetContext.call(this, type, options);
  };
  console.log("Canvas context patched to include willReadFrequently.");
})();

const CameraScanner = (() => {
  let scannerActive = false;
  let stream = null; // Keep track of the camera stream
  const modal = document.getElementById("cameraModal");
  const permissionModal = document.getElementById("cameraPermissionModal");
  const videoElement = document.getElementById("video");
  const closeModalButton = document.getElementById("closeModal");
  const scanSound = new Audio("scan_sound.mp3"); // Replace with your sound file path

  /**
   * Stop the camera stream and close all cameras.
   */
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      console.log("Camera stream stopped");
    }
  };

  /**
   * Show the camera permission modal to the user.
   */
  const showPermissionModal = () => {
    permissionModal.classList.add("active");
  };

  /**
   * Hide the camera permission modal.
   */
  const hidePermissionModal = () => {
    permissionModal.classList.remove("active");
  };

  /**
   * Show the camera modal and request camera access.
   */
  const showModal = () => {
    hidePermissionModal(); // Close the permission modal once the user accepts
    modal.classList.add("active");

    // Check for available devices and request camera access
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput");

        if (videoDevices.length === 0) {
          throw new Error("No video devices found.");
        }

        console.log("Available video devices: ", videoDevices);

        // Select the first available video device (front or back)
        const selectedCamera = videoDevices[0];
        console.log("Selected camera: ", selectedCamera);

        // Request the selected camera (front or back)
        return navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedCamera.deviceId, // Use the first available camera
          },
        });
      })
      .then((cameraStream) => {
        stream = cameraStream;
        videoElement.srcObject = stream;
        videoElement.play();
        initScanner();
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        alert("Camera access error: " + err.message);
        modal.classList.remove("active");
      });
  };

  /**
   * Hide the camera modal and stop the scanner.
   */
  const hideModal = () => {
    modal.classList.remove("active");
    stopStream();
    stopScanner();
  };

  /**
   * Initialize QuaggaJS for barcode scanning.
   */
  const initScanner = () => {
    if (scannerActive) return;

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoElement,
          constraints: {
            width: 1920, // Increased resolution for better accuracy
            height: 1080,
            facingMode: "environment", // Ensures back camera is used if available
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "upc_reader",
          ],
          multiple: false, // Only focus on a single barcode
        },
        locator: {
          halfSample: false,
          patchSize: "large", // Larger patches for higher accuracy
          debug: { showCanvas: false },
        },
        locate: true,
        debug: false, // Disable debug mode to reduce overhead
      },
      (err) => {
        if (err) {
          console.error("Error initializing Quagga:", err);
          return;
        }
        console.log("Scanner initialized successfully");
        Quagga.start();
        scannerActive = true;
      }
    );

    Quagga.onDetected((result) => {
      const barcode = result.codeResult.code;
      if (barcode) {
        scanSound.play();
        document.getElementById("barcode").value = barcode;
        alert(`Barcode Scanned: ${barcode}`);
        hideModal(); // Automatically close after scan
      }
    });
  };

  /**
   * Stop the Quagga scanner.
   */
  const stopScanner = () => {
    if (scannerActive) {
      Quagga.stop();
      scannerActive = false;
      console.log("Scanner stopped");
    }
  };

  return {
    init: () => {
      document.getElementById("startScanner").addEventListener("click", showPermissionModal);
      closeModalButton.addEventListener("click", hideModal);
      document.getElementById("allowCamera").addEventListener("click", showModal);
      document.getElementById("denyCamera").addEventListener("click", () => {
        alert("Camera access denied.");
        hidePermissionModal();
      });
    },
  };
})();

// Initialize the camera scanner on page load
document.addEventListener("DOMContentLoaded", () => {
  CameraScanner.init();
});
</script>

<style>
/* Styling the Permission Modal */
.permission-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: none;
  justify-content: center;
  align-items: center;
}

.permission-modal.active {
  display: flex;
}

.permission-modal .modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
}

.permission-modal button {
  margin: 10px;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

.permission-modal button#denyCamera {
  background-color: #f44336;
}
</style>
