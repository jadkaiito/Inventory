<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inventory System</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #1e1e1e;
      color: #fff;
    }
    h1 {
      text-align: center;
      font-size: 2.5em;
      margin-bottom: 20px;
    }
    #addItemForm {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-bottom: 20px;
    }
    #addItemForm input, #addItemForm button {
      padding: 10px;
      font-size: 16px;
      color: #333;
    }
    #addItemForm button {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    #addItemForm button:hover {
      background-color: #0056b3;
    }
    #inventoryTable {
      width: 100%;
      margin-top: 20px;
      border-collapse: collapse;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    #inventoryTable th, #inventoryTable td {
      padding: 12px;
      text-align: center;
      border: 1px solid #ddd;
      background-color: #333;
      color: #fff;
    }
    #inventoryTable th {
      background-color: #007bff;
    }
    #cameraModal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: black;
      justify-content: center;
      align-items: center;
    }
    #cameraModal.active {
      display: flex;
    }
    #cameraContent {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      text-align: center;
    }
    #video {
      width: 320px;
      height: 240px;
      border: 5px solid #007bff;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    #scannerTitle {
      font-size: 1.5em;
      margin-bottom: 10px;
      color: #fff;
    }
    #closeModal {
      background-color: #dc3545;
      color: white;
      border: none;
      margin-top: 15px;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    #closeModal:hover {
      background-color: #c82333;
    }
    #exportImportButtons {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 20px;
    }
    #exportBtn, #importBtn {
      background-color: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    #exportBtn:hover, #importBtn:hover {
      background-color: #218838;
    }
  </style>
</head>
<body>
  <h1>Inventory System</h1>
  
  <!-- Form to Add Items -->
  <form id="addItemForm">
    <input type="text" id="barcode" placeholder="Codebar" required readonly>
    <input type="text" id="name" placeholder="Item Name" required>
    <input type="number" id="quantity" placeholder="Quantity" required>
    <input type="number" step="0.01" id="price" placeholder="Price" required>
    <button type="button" id="startScanner">Scan Codebar</button>
    <button type="submit">Add Item</button>
  </form>

  <!-- Inventory Display -->
  <h2>Inventory</h2>
  <table id="inventoryTable" border="1">
    <thead>
      <tr>
        <th>Reference</th>
        <th>Codebar</th>
        <th>Name</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <!-- Export/Import Buttons -->
  <div id="exportImportButtons">
    <button id="exportBtn">Export Inventory</button>
    <input type="file" id="importBtn" accept=".json" style="display: none;" />
    <button onclick="document.getElementById('importBtn').click()">Import Inventory</button>
  </div>

  <!-- Camera Modal for Barcode Scanning -->
  <div id="cameraModal">
    <div id="cameraContent">
      <div id="scannerTitle">Barcode Scanner</div>
      <video id="video" autoplay></video>
      <button id="closeModal">Close Scanner</button>
    </div>
  </div>

  <!-- Quagga JS and Barcode Sound -->
  <script src="js/quagga.js"></script>
  <script src="js/camera.js"></script>

  <script>
    let inventory = JSON.parse(localStorage.getItem("local/inventory")) || [];

    // Function to render inventory table
    function renderInventory() {
      const tableBody = document.querySelector('#inventoryTable tbody');
      tableBody.innerHTML = '';
      inventory.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${item.barcode}</td>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.price}</td>
          <td><button onclick="removeItem(${index})">Remove</button> <button onclick="editItem(${index})">Edit</button></td>
        `;
        tableBody.appendChild(row);
      });
    }

    // Function to remove item from inventory
    function removeItem(index) {
      inventory.splice(index, 1);
      localStorage.setItem("local/inventory", JSON.stringify(inventory));
      renderInventory();
    }

    // Function to edit item
    function editItem(index) {
      const item = inventory[index];
      document.querySelector("#barcode").value = item.barcode;
      document.querySelector("#name").value = item.name;
      document.querySelector("#quantity").value = item.quantity;
      document.querySelector("#price").value = item.price;
      removeItem(index);
    }

    // Add item to inventory
    document.querySelector('#addItemForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const barcode = document.querySelector('#barcode').value;
      const name = document.querySelector('#name').value;
      const quantity = document.querySelector('#quantity').value;
      const price = document.querySelector('#price').value;
      inventory.push({ barcode, name, quantity, price });
      localStorage.setItem("local/inventory", JSON.stringify(inventory));
      renderInventory();
      document.querySelector('#addItemForm').reset();
    });

    // Export inventory to JSON file
    document.querySelector('#exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(inventory)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'inventory.json';
      link.click();
    });

    // Import inventory from JSON file
    document.querySelector('#importBtn').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const data = JSON.parse(event.target.result);
          inventory = data;
          localStorage.setItem("local/inventory", JSON.stringify(inventory));
          renderInventory();
        };
        reader.readAsText(file);
      }
    });

    // Initialize the inventory view on page load
    renderInventory();
  </script>
</body>
</html>
