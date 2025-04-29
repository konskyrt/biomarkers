const fs = require('fs');
const path = require('path');

console.log('Setting up IFC WASM files...');

// Create wasm directory if it doesn't exist
const wasmDir = path.join(__dirname, 'public', 'wasm');
if (!fs.existsSync(wasmDir)) {
  console.log('Creating wasm directory...');
  fs.mkdirSync(wasmDir, { recursive: true });
}

// Copy wasm files from web-ifc
try {
  const webIfcWasmDir = path.join(__dirname, 'node_modules', 'web-ifc', 'dist');
  
  // Check if directory exists
  if (!fs.existsSync(webIfcWasmDir)) {
    console.error(`Error: Directory not found: ${webIfcWasmDir}`);
    console.error('Make sure web-ifc is installed by running npm install');
    process.exit(1);
  }

  // Get all wasm files
  const wasmFiles = fs.readdirSync(webIfcWasmDir).filter(file => file.endsWith('.wasm'));
  
  if (wasmFiles.length === 0) {
    console.error('No .wasm files found in web-ifc/dist directory');
    process.exit(1);
  }
  
  // Copy each file
  wasmFiles.forEach(file => {
    const sourcePath = path.join(webIfcWasmDir, file);
    const destPath = path.join(wasmDir, file);
    
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to public/wasm/`);
  });
  
  // Create web.config file for IIS servers (Windows)
  const webConfigPath = path.join(wasmDir, 'web.config');
  const webConfigContent = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <remove fileExtension=".wasm" />
      <mimeMap fileExtension=".wasm" mimeType="application/wasm" />
    </staticContent>
  </system.webServer>
</configuration>`;

  fs.writeFileSync(webConfigPath, webConfigContent);
  console.log('Created web.config file for proper MIME type configuration');
  
  // Create .htaccess file for Apache servers
  const htaccessPath = path.join(wasmDir, '.htaccess');
  const htaccessContent = `AddType application/wasm .wasm`;
  
  fs.writeFileSync(htaccessPath, htaccessContent);
  console.log('Created .htaccess file for Apache servers');
  
  console.log('WASM files setup complete!');
} catch (error) {
  console.error('Error setting up WASM files:', error);
  process.exit(1);
} 