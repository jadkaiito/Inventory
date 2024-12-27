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
  const inventory = JSON.parse(localStorage.getItem("local/inventory")) || []; // Load inventory

  /**
   * Stop the camera stream safely
   */
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // Stop all tracks
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

        // Try to find the back camera based on deviceId and facingMode
        let backCamera = videoDevices.find(device => device.facing === "environment");

        // If the back camera is not found, fallback to the first available video input
        if (!backCamera) {
          console.warn("Back camera not found. Using the first available camera.");
          backCamera = videoDevices[0]; // Default to the first camera (could be front or back)
        }

        // Stop any existing streams
        stopStream();

        // Start the selected camera using the deviceId
        return navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: backCamera.deviceId }
          }
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
        alert("Error: " + err.message);
      });
  };

  /**
   * Hide the camera modal and stop the scanner.
   */
  const hideModal = () => {
    modal.classList.remove("active");
    stopScanner();
    stopStream();
  };

  /**
   * Initialize QuaggaJS for barcode scanning.
   */
  const initScanner = () => {
    if (scannerActive) return;

    if (!stream) {
      console.error("No camera stream available. Cannot initialize scanner.");
      return;
    }

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoElement,
          constraints: {
            width: 1920, // Increased resolution for better accuracy
            height: 1080,
            facingMode: "environment", // Ensure using the back camera
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
        console.log(`Barcode Scanned: ${barcode}`);
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

  /**
   * Add an item to the inventory.
   */
  const addItemToInventory = (barcode, name, quantity, price) => {
    if (!barcode || !name || isNaN(quantity) || isNaN(price)) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const existingItem = inventory.find((item) => item.barcode === barcode);
    if (existingItem) {
      alert("Item with this barcode already exists!");
      return;
    }

    const reference = `${Date.now()}-${barcode}`; // Simplified reference generation
    const newItem = { reference, barcode, name, quantity, price };
    inventory.push(newItem);

    // Save updated inventory to localStorage
    localStorage.setItem("local/inventory", JSON.stringify(inventory));
    displayInventory(); // Refresh the inventory table
    alert("Item added successfully!");
  };

  /**
   * Display the inventory in the table.
   */
  const displayInventory = () => {
    const tableBody = document.querySelector("#inventoryTable tbody");
    tableBody.innerHTML = "";
    inventory.forEach((item, index) => {
      const row = `<tr>
        <td>${item.reference}</td>
        <td>${item.barcode}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)}</td>
        <td>
          <button onclick="editItem(${index})">Edit</button>
          <button onclick="deleteItem(${index})">Delete</button>
        </td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  };

  /**
   * Bind form submission for adding items.
   */
  const bindFormSubmission = () => {
    document.getElementById("addItemForm").addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent form refresh
      const barcode = document.getElementById("barcode").value;
      const name = document.getElementById("name").value;
      const quantity = parseInt(document.getElementById("quantity").value, 10);
      const price = parseFloat(document.getElementById("price").value);
      addItemToInventory(barcode, name, quantity, price);
      e.target.reset(); // Clear the form
    });
  };

  /**
   * Bind event listeners for the scanner modal.
   */
  const bindModalControls = () => {
    document.getElementById("startScanner").addEventListener("click", showModal);
    closeModalButton.addEventListener("click", hideModal);
  };

  return {
    init: () => {
      bindModalControls();
      bindFormSubmission();
      displayInventory(); // Initial display
    },
  };
})();

// Initialize the camera scanner on page load
document.addEventListener("DOMContentLoaded", () => {
  CameraScanner.init();
});
