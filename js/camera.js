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
  const videoElement = document.getElementById("video");
  const closeModalButton = document.getElementById("closeModal");
  const scanSound = new Audio("scan_sound.mp3"); // Replace with your sound file path
  let availableCameras = [];
  const cameraSelect = document.createElement("select");
  cameraSelect.id = "cameraSelect";

  /**
   * Stop the camera stream if active.
   */
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      console.log("Camera stream stopped");
    }
  };

  /**
   * Show the camera modal and request camera access.
   */
  const showModal = () => {
    console.log("Opening camera modal");
    modal.classList.add("active");

    // If there's already a stream, do not request again
    if (stream) {
      videoElement.srcObject = stream;
      return;
    }

    // Populate camera dropdown
    listCameras().then(() => {
      modal.insertBefore(cameraSelect, videoElement);
      startCamera(availableCameras[0].deviceId); // Start with the first camera
    });
  };

  /**
   * Populate the camera dropdown with available video devices.
   */
  const listCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras = devices.filter((device) => device.kind === "videoinput");

    cameraSelect.innerHTML = ""; // Clear existing options
    availableCameras.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    // Handle camera selection change
    cameraSelect.addEventListener("change", (e) => {
      const selectedDeviceId = e.target.value;
      startCamera(selectedDeviceId);
    });
  };

  /**
   * Start the selected camera.
   */
  const startCamera = async (deviceId) => {
    stopStream(); // Stop any existing stream

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      console.log("Camera stream obtained");
      stream = cameraStream;
      videoElement.srcObject = stream;
      await videoElement.play();
      console.log("Video playback started");
      initScanner();
    } catch (err) {
      console.error("Error starting camera:", err);
      alert("Camera error: " + err.message);
      hideModal();
    }
  };

  /**
   * Hide the camera modal and stop the scanner.
   */
  const hideModal = () => {
    console.log("Closing camera modal");
    modal.classList.remove("active");
    stopStream(); // Ensure the stream is stopped here
    stopScanner();
  };

  /**
   * Initialize QuaggaJS for barcode scanning.
   */
  const initScanner = () => {
    if (scannerActive) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoElement,
          constraints: {
            width: isMobile ? 1280 : 1920,
            height: isMobile ? 720 : 1080,
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["code_128_reader", "ean_reader"], // Fewer readers for performance
          multiple: false,
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error("Error initializing Quagga:", err);
          hideModal();
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
        console.log(`Barcode detected: ${barcode}`);
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
      document.getElementById("startScanner").addEventListener("click", showModal);
      closeModalButton.addEventListener("click", hideModal);
    },
  };
})();

// Initialize the camera scanner on page load
document.addEventListener("DOMContentLoaded", () => {
  CameraScanner.init();
});
