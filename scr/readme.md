//////////////////////////////////////////////
// Ejecución del demo de TypeScript (Hito 2)//
//////////////////////////////////////////////

Ir a la raíz del proyecto:
cd Bocha.aie.company

Instalar dependencias (solo la primera vez o cuando cambie package.json):
npm install

Ejecutar validación de TypeScript:
npm run typecheck

Ejecutar el demo:
npm run dev:demo

Ejecutar validación + demo en un solo paso:
npm run verify

//////////////////////////////////////////////
//         Scripts del proyecto             //
//////////////////////////////////////////////

typecheck: tsc --noEmit demo.ts
dev:demo: tsx demo.ts
verify: npm run typecheck && npm run dev:demo


//////////////////////////////////////////////
//      Página HTML de pruebas manuales     //
//////////////////////////////////////////////

Desde la raíz del repo:
npx http-server -p 3000 -a 0.0.0.0

Luego abre:
manual-tests.html