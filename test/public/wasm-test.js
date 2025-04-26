// Test script to check if WebAssembly files can be loaded correctly
(async function() {
  const wasmTestElement = document.getElementById('wasm-test-result');
  
  try {
    // Try to fetch the WASM file
    const response = await fetch('./wasm/web-ifc.wasm');
    
    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get content type
    const contentType = response.headers.get('Content-Type');
    
    // Check content type
    if (contentType && contentType.includes('application/wasm')) {
      wasmTestElement.innerHTML = `
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p class="font-bold">Success!</p>
          <p>WASM file loaded correctly with proper MIME type: ${contentType}</p>
        </div>
      `;
    } else {
      wasmTestElement.innerHTML = `
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p class="font-bold">Warning!</p>
          <p>WASM file loaded but with incorrect MIME type: ${contentType}</p>
          <p>Expected: application/wasm</p>
          <p>This may cause WebAssembly loading issues.</p>
        </div>
      `;
    }
    
    // Try to compile the WebAssembly module
    const arrayBuffer = await response.arrayBuffer();
    const result = await WebAssembly.compile(arrayBuffer);
    
    if (result) {
      wasmTestElement.innerHTML += `
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
          <p class="font-bold">WebAssembly Compilation Successful!</p>
          <p>The WASM file was successfully compiled by the browser.</p>
        </div>
      `;
    }
  } catch (error) {
    wasmTestElement.innerHTML = `
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <p class="font-bold">Error!</p>
        <p>Failed to load or compile WASM file: ${error.message}</p>
        <p>Check browser console for more details.</p>
      </div>
    `;
    console.error('WASM Test Error:', error);
  }
})(); 