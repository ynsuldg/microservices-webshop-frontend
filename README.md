# Microservices Webshop Frontend

## Ansvar

Frontend låter användare logga in, söka och filtrera produkter, hantera kundvagnen och starta Stripe Checkout.
Administratörer kan även skapa produkter. Alla backendanrop går via gatewayn.

Betalningssidan visar backendens orderstatus och låter kunden uppdatera eller avbryta ett betalningsförsök.
Att lämna Stripe eller ändra kundvagnen avbryter inte en tidigare betalningssession.
Kundvagnen behålls vid avbrott och töms efter PAID endast om den motsvarar den betalade ordern.
Pending-länken sparas per webbläsarflik och följer inte med till en annan dator.
En saknad order kan rensas ur lokala referenser utan att kundvagnen tas bort.

## Tekniker

Node.js 24, React 19, React Router 8 i framework mode med SSR, TypeScript, Vite, Tailwind CSS,
Vitest, React Testing Library och MSW.

## Databas och session

Frontend har ingen egen databas. JWT lagras i en signerad HttpOnly-cookie (`__session`), inte i localStorage.
Kundvagn och betalningsreferens lagras i `sessionStorage`. Kortuppgifter anges på Stripes sida.

## Miljövariabler

| Variabel | Lokalt | Render |
| --- | --- | --- |
| `VITE_GATEWAY_URL` | `http://localhost:9003/gateway` | `https://microservices-webshop-gateway-service.onrender.com/gateway` |
| `SESSION_SECRET` | Egen lång slumpmässig sessionshemlighet. | Hemlighet i tjänstens Environment. |
| `NODE_ENV` | `development` | `production`, redan satt i Docker-imagen. |

Lokala värden kan läggas i `.env.local`, som inte ska committas.
Frontend behöver inga Stripe-nycklar, databaslösenord eller interna tjänstetokens.

## Starta applikationen lokalt

Kräver Node.js 24 och att gatewayn samt berörda backendtjänster är igång.

```shell
npm install
npm run dev
```

Öppna `http://localhost:5173`. Typkontroll körs med `npm run typecheck` och tester med `npm run test -- --run`.

## Render

| Tjänst | Render-adress |
| --- | --- |
| Frontend – öppna webshoppen | [microservices-webshop-frontend.onrender.com](https://microservices-webshop-frontend.onrender.com) |
| Auth Service | [microservices-webshop-auth-service.onrender.com](https://microservices-webshop-auth-service.onrender.com) |
| Product Service | [microservices-webshop-product-service.onrender.com](https://microservices-webshop-product-service.onrender.com) |
| Order Service | [microservices-webshop-order-service.onrender.com](https://microservices-webshop-order-service.onrender.com) |
| Email Service | [microservices-webshop-email-service.onrender.com](https://microservices-webshop-email-service.onrender.com) |
| Gateway Service | [microservices-webshop-gateway-service.onrender.com](https://microservices-webshop-gateway-service.onrender.com) |
| Payment Service | [microservices-webshop-payment-service.onrender.com](https://microservices-webshop-payment-service.onrender.com) |
- Docker-image: `ynsuldg/microservices-webshop-frontend:1.0.0`.

Använd **Web Service → Existing Image**, sätt miljövariablerna i Render och behåll Docker-imagens startkommando.
Efter en ny image från senaste `main` väljs **Manual Deploy → Deploy latest reference**.
En äldre Actions-omkörning kan skriva över samma tagg med äldre kod.

Render Free kan ge väntetid när tjänsterna väcks. Se [Render-dokumentationen](https://render.com/docs/deploying-an-image).

### Gatewayadress vid bygge

`VITE_GATEWAY_URL` byggs in av Vite. Enbart en ändring i Renders Environment uppdaterar inte en färdig image.
Sätt GitHub Actions **repository variable** `VITE_GATEWAY_URL` till gatewayadressen ovan och bygg imagen från senaste `main`.
`SESSION_SECRET` sätts däremot vid körning i Render. Containern lyssnar på port 3000.

`allowedActionOrigins` i `react-router.config.ts` tillåter frontendens exakta Render-värd för formulär
bakom HTTPS-proxyn. Vid byte av frontenddomän behöver även den inställningen och backendens
`ALLOWED_ORIGINS` samt payment-tjänstens `PAYMENT_RETURN_URL` uppdateras.

## Relaterade repositories

- [Auth Service](https://github.com/ynsuldg/microservices-webshop-auth-service)
- [Product Service](https://github.com/ynsuldg/microservices-webshop-product-service)
- [Order Service](https://github.com/ynsuldg/microservices-webshop-order-service)
- [Email Service](https://github.com/ynsuldg/microservices-webshop-email-service)
- [Gateway Service](https://github.com/ynsuldg/microservices-webshop-gateway-service)
- [Payment Service](https://github.com/ynsuldg/microservices-webshop-payment-service)
