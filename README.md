# TPI Frontend — Interfaz mínima de demostración

Parte del TPI de Programación IV (Equipo 12). Repositorio orquestador:
[TPI_Ecommerce](https://github.com/ProogIV/TPI_Ecommerce).

Página web en HTML, CSS y JavaScript sin frameworks (enfoque de la Clase 13) que consume las APIs
para demostrar el circuito completo: catálogo, login con JWT, compra y estado de los pedidos.

## Uso

- **Con Docker** (desde el orquestador): `docker compose up --build` → http://localhost:8080
- **Sin Docker**: `python -m http.server 5500` en esta carpeta → http://localhost:5500

Las URLs de las APIs están en `config.js`. El origen del frontend tiene que figurar en
`CORS_ALLOWED_ORIGINS` de Inventario y de Pedidos.

## Servicios que consume

| Servicio | URL local |
|---|---|
| Inventario (Express) | http://localhost:3000/api |
| Pedidos (Django) | http://localhost:8000/api |
