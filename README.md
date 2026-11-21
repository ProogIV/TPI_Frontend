# TPI Programación IV — Plataforma de E-commerce con Microservicios

**Equipo 12** · UTN FRRe · Tecnicatura Universitaria en Programación · 2026

Repositorio **orquestador** del Trabajo Práctico Integrador. Reúne los microservicios del sistema
(cada uno en su propio repositorio) y define cómo se comunican y cómo se levantan juntos.

## Integrantes

| Integrante | GitHub |
|---|---|
| Quijano, Joaquín Gabriel | [@Joabriel](https://github.com/Joabriel) |
| Alarcón, Gustavo | [@Gustavoctes](https://github.com/Gustavoctes) |
| Micheloud, Joaquín | [@Joaquin-Micheloud](https://github.com/Joaquin-Micheloud) |

## Alcance

Plataforma backend de comercio electrónico dividida en tres programas independientes (microservicios)
conectados por HTTP. Permite administrar un catálogo de productos vinculados a sus proveedores,
registrar órdenes de compra verificando el stock real y simular el cobro de cada operación mediante
una pasarela de pagos propia. Un frontend mínimo permite demostrar el circuito completo.

Fuera de alcance: cobros con tarjetas reales.

## Componentes

| Carpeta | Repositorio | Tecnología | Base de datos | Puerto | Rol |
|---|---|---|---|---|---|
| `inventario/` | [TPI_BackendA_Inventario](https://github.com/ProogIV/TPI_BackendA_Inventario) | Node.js + Express | MongoDB (Mongoose) | 3000 | Catálogo de productos, proveedores y stock |
| `pedidos/` | [TPI_BackendB_Pedidos](https://github.com/ProogIV/TPI_BackendB_Pedidos) | Python + Django REST Framework | PostgreSQL | 8000 | Órdenes de compra; coordina Inventario y Pagos |
| `pagos/` | [TPI_BackendC_Pagos](https://github.com/ProogIV/TPI_BackendC_Pagos) | Python + FastAPI | — | 8001 | Simula la pasarela bancaria |
| `frontend/` | [TPI_Frontend](https://github.com/ProogIV/TPI_Frontend) | HTML + CSS + JavaScript | — | a definir | Interfaz mínima de demostración |

## Documentación del proyecto

- `spec.md` — contratos entre servicios: modelos de datos, endpoints y reglas de negocio (*en preparación*).
- `agent.md` — reglas técnicas y de estilo de cada microservicio (*en preparación*).

## Cómo clonar el proyecto

Este repositorio usa **submódulos de Git**, así que hay que clonarlo con la opción
`--recurse-submodules` para que se descarguen también los microservicios:

```bash
git clone --recurse-submodules https://github.com/ProogIV/TPI_Ecommerce.git
cd TPI_Ecommerce
```

Si ya se clonó sin esa opción, las carpetas de los servicios quedan vacías. Se completan con:

```bash
git submodule update --init --recursive
```

La puesta en marcha con Docker Compose (`docker compose up --build`) se documentará en esta sección
cuando esté lista.

## Cómo trabajar con los submódulos

Cada carpeta (`inventario/`, `pedidos/`, `pagos/`, `frontend/`) es un repositorio Git completo e
independiente. El repositorio orquestador **no guarda el código de los servicios**: guarda una
referencia a un commit puntual de cada uno.

**Para programar en un servicio**, se trabaja dentro de su carpeta (o en su propio clon) con el flujo
de siempre: rama, commit, push y Pull Request en el repositorio del servicio.

**Para actualizar el orquestador** a la última versión de los servicios:

```bash
git submodule update --remote          # trae lo último de la rama principal de cada servicio
git add inventario pedidos pagos frontend
git commit -m "Actualiza submódulos a la última versión de cada servicio"
git push
```

> Si no se hace este paso, el orquestador sigue apuntando a la versión vieja de los servicios
> aunque ya se hayan mergeado cambios en ellos.

## Decisiones técnicas fuera del contenido de la cátedra

| Decisión | Motivo |
|---|---|
| Un repositorio por microservicio, más este orquestador con **submódulos de Git** (la planificación propone un monorepo; los submódulos no se vieron en la guía de Git de la cátedra) | Cada microservicio es independiente y tiene su propio ciclo de versiones, como en una arquitectura de microservicios real: un equipo puede trabajar y versionar su servicio sin afectar a los demás. El orquestador fija qué versión de cada servicio compone el sistema y permite levantar todo con un único comando, que es el objetivo del monorepo propuesto. |

## Hoja de ruta

| Entrega | Contenido | Estado |
|---|---|---|
| TP 0 | Repositorios, entornos, `spec.md` y `agent.md` | En curso |
| TP 1 | CRUD de proveedores y productos; órdenes; integración de stock | En curso |
| TP 2 | JWT, roles (Administrador / Cliente), validación y rate limiting | Pendiente |
| TP 3 | Microservicio de Pagos y notificaciones en tiempo real (WebSockets) | Pendiente |
| TP 4 y 5 | Docker Compose, CI con GitHub Actions, OpenAPI, GraphQL y defensa | Pendiente |
