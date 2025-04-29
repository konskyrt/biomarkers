import { IfcImporter } from "@thatopen/fragments";

const serializer = new IfcImporter();
serializer.wasm = { absolute: true, path: "https://unpkg.com/web-ifc@0.0.68/" };

export {
    serializer
}