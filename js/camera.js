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

  /**
   * Stop the camera stream.
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
    modal.classList.add("active");

    // Check for available devices and request camera access
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput");

        if (videoDevices.length === 0) {
          throw new Error("No video devices found.");
        }

        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: videoDevices.length > 1 ? "environment" : "user", // Fallback to "user" for single camera devices
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
            facingMode: "environment",
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
      document.getElementById("startScanner").addEventListener("click", showModal);
      closeModalButton.addEventListener("click", hideModal);
    },
  };
})();

// Initialize the camera scanner on page load
document.addEventListener("DOMContentLoaded", () => {
  CameraScanner.init();
});
