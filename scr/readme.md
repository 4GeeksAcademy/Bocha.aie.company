//////////////////////////////////////////////
// Para ejecutar el demo.ts pasos posibles. //
//////////////////////////////////////////////
1-cd /workspaces/Bocha.aie.company
2-npm init -y
3-npm install --save-dev typescript tsx
4-npx tsx scr/demo.ts

** DEspues de ejecutados una vez los 3 primeros pasos solo basta con hacer el 4to.

///////////Comandos del Proyecto ///////////////////
typecheck: tsc --noEmit demo.ts
dev:demo: tsx demo.ts
verify: npm run typecheck && npm run dev:demo


///////////Para ver el HTML para pruebas ///////////
Desde la raíz del repo:
npx http-server -p 3000 -a 0.0.0.0
Luego abre:
manual-tests.html