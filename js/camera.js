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
    console.log("Opening camera modal");
    modal.classList.add("active");

    // Check for available devices and request camera access
    // Stop any existing camera stream
    stopStream();
    // Request back camera access
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        if (!videoDevices.length) {
          throw new Error("No video devices found.");
        }

        const facingMode = videoDevices.length > 1 ? "environment" : "user";
        return navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        // Always prioritize the back camera
        const constraints = {
          video: {
            facingMode: { exact: "environment" }, // Use back camera if available
          },
        };
        return navigator.mediaDevices.getUserMedia(constraints).catch(() => {
          // Fallback to any available camera if back camera is not accessible
          console.warn("Back camera not accessible, switching to default camera.");
          return navigator.mediaDevices.getUserMedia({ video: true });
        });
      })
      .then((cameraStream) => {
        console.log("Camera stream obtained");
        stream = cameraStream;
        videoElement.srcObject = stream;

        return videoElement.play();
      })
      .then(() => {
        console.log("Video playback started");
        initScanner();
      })
      .catch((err) => {
        console.error("Error in showModal:", err);
        alert("Camera error: " + err.message);
        hideModal();
      });
  };

  /**
   * Hide the camera modal and stop the scanner.
   */
  const hideModal = () => {
    console.log("Closing camera modal");
    modal.classList.remove("active");
    stopStream();
    stopScanner();
  };

  /**
   * Initialize QuaggaJS for barcode scanning.
   */
  const initScanner = () => {
    if (scannerActive) return;
    if (scannerActive) {
      console.warn("Scanner is already active.");
      return;
    }

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
