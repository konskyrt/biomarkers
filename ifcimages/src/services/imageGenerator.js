const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// HTML template for the viewer
const viewerTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>IFC Viewer</title>
    <style>
        body { margin: 0; }
        canvas { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <script src="https://unpkg.com/three@0.149.0/build/three.min.js"></script>
    <script src="https://unpkg.com/web-ifc@0.0.46/web-ifc-api.js"></script>
    <script src="https://unpkg.com/web-ifc-three@0.0.125/IFCLoader.js"></script>
    <script>
        async function init() {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(800, 600);
            document.body.appendChild(renderer.domElement);

            // Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(1, 1, 1);
            scene.add(directionalLight);

            // Load IFC file
            const ifcLoader = new IFCLoader();
            const model = await ifcLoader.load('{{ifcPath}}');
            scene.add(model);

            {{elementFocus}}

            // Render
            renderer.render(scene, camera);
            
            // Return the image data
            return renderer.domElement.toDataURL('image/png');
        }
    </script>
</body>
</html>
`;

async function generateElementImage(ifcPath, elementId) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Create temporary HTML file
    const htmlPath = path.join(__dirname, '../temp/viewer.html');
    const outputPath = path.join(__dirname, `../output/element_${elementId}.png`);
    
    // Prepare the HTML with the specific element focus
    const elementFocus = elementId ? `
        const element = model.getObjectByProperty('expressID', '${elementId}');
        if (element) {
            const box = new THREE.Box3().setFromObject(element);
            const center = box.getCenter(new THREE.Vector3());
            camera.position.set(center.x + 5, center.y + 5, center.z + 5);
            camera.lookAt(center);
        }
    ` : '';

    const html = viewerTemplate
        .replace('{{ifcPath}}', ifcPath)
        .replace('{{elementFocus}}', elementFocus);

    await writeFileAsync(htmlPath, html);
    
    // Load the page and generate image
    await page.goto(`file://${htmlPath}`);
    const imageData = await page.evaluate(() => init());
    
    // Save the image
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    await writeFileAsync(outputPath, base64Data, 'base64');
    
    await browser.close();
    return outputPath;
}

async function generateAllElementImages(ifcPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Create temporary HTML file
    const htmlPath = path.join(__dirname, '../temp/viewer.html');
    
    // Prepare the HTML to get all elements
    const html = viewerTemplate
        .replace('{{ifcPath}}', ifcPath)
        .replace('{{elementFocus}}', `
            const elements = model.children.filter(child => child.userData.expressID);
            const images = [];
            for (const element of elements) {
                const box = new THREE.Box3().setFromObject(element);
                const center = box.getCenter(new THREE.Vector3());
                camera.position.set(center.x + 5, center.y + 5, center.z + 5);
                camera.lookAt(center);
                renderer.render(scene, camera);
                images.push({
                    elementId: element.userData.expressID,
                    imageData: renderer.domElement.toDataURL('image/png')
                });
            }
            return images;
        `);

    await writeFileAsync(htmlPath, html);
    
    // Load the page and generate images
    await page.goto(`file://${htmlPath}`);
    const images = await page.evaluate(() => init());
    
    // Save all images
    const savedImages = [];
    for (const image of images) {
        const outputPath = path.join(__dirname, `../output/element_${image.elementId}.png`);
        const base64Data = image.imageData.replace(/^data:image\/png;base64,/, '');
        await writeFileAsync(outputPath, base64Data, 'base64');
        savedImages.push({
            elementId: image.elementId,
            path: outputPath
        });
    }
    
    await browser.close();
    return savedImages;
}

module.exports = {
    generateElementImage,
    generateAllElementImages
}; 