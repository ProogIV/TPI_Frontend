// Frontend mínimo (enfoque de la Clase 13): JavaScript sin frameworks que consume las APIs.
// Siempre se usa textContent (nunca innerHTML) para mostrar datos de la API: defensa contra XSS.

let accessToken = sessionStorage.getItem("access");
const productosPorId = {};

const $ = (id) => document.getElementById(id);
const pesos = (n) => Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

function fila(celdas, claseUltima) {
  const tr = document.createElement("tr");
  celdas.forEach((texto, i) => {
    const td = document.createElement("td");
    td.textContent = texto;
    if (claseUltima && i === celdas.length - 1) td.className = claseUltima;
    tr.appendChild(td);
  });
  return tr;
}

async function leerError(respuesta) {
  // Los tres servicios responden los errores con el mismo formato: {"error": true, "mensaje": ...}
  try {
    const datos = await respuesta.json();
    return datos.mensaje || `Error ${respuesta.status}`;
  } catch {
    return `Error ${respuesta.status}`;
  }
}

// --- Catálogo (público: no necesita token) ---

async function cargarCatalogo() {
  try {
    const respuesta = await fetch(`${CONFIG.INVENTARIO_API}/productos?limit=50`);
    if (!respuesta.ok) throw new Error(await leerError(respuesta));
    const datos = await respuesta.json();

    const tabla = $("catalogo");
    const select = $("producto");
    const seleccionado = select.value; // para no perder el producto elegido al refrescar
    tabla.innerHTML = "";
    select.innerHTML = "";

    datos.resultados.forEach((p) => {
      productosPorId[p._id] = p;
      tabla.appendChild(fila([p.codigoSKU, p.nombre, pesos(p.precio), p.stock]));
      const opcion = document.createElement("option");
      opcion.value = p._id;
      opcion.textContent = `${p.nombre} — ${pesos(p.precio)}`;
      select.appendChild(opcion);
    });
    if (productosPorId[seleccionado]) select.value = seleccionado;
    $("catalogo-error").textContent = "";
  } catch (error) {
    $("catalogo-error").textContent = `No se pudo cargar el catálogo: ${error.message}`;
  }
}

// --- Login con JWT (lo emite Pedidos) ---

async function login() {
  const respuesta = await fetch(`${CONFIG.PEDIDOS_API}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: $("username").value, password: $("password").value }),
  });

  if (!respuesta.ok) {
    $("login-error").textContent = respuesta.status === 429
      ? "Demasiados intentos. Esperá un minuto."
      : "Usuario o contraseña incorrectos.";
    return;
  }

  accessToken = (await respuesta.json()).access;
  sessionStorage.setItem("access", accessToken);
  mostrarApp();
}

function salir() {
  desconectarWebSocket();
  accessToken = null;
  sessionStorage.removeItem("access");
  $("app-box").classList.add("oculto");
  $("login-box").classList.remove("oculto");
}

function mostrarApp() {
  // El payload del JWT es Base64 (no está cifrado): se puede leer el usuario y el rol
  const payload = JSON.parse(atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  $("usuario-actual").textContent = `(${payload.username} · ${payload.rol})`;
  $("login-error").textContent = "";
  $("login-box").classList.add("oculto");
  $("app-box").classList.remove("oculto");
  cargarPedidos();
  conectarWebSocket();
}

// --- Pedidos (requieren token) ---

async function cargarPedidos() {
  const respuesta = await fetch(`${CONFIG.PEDIDOS_API}/orders/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (respuesta.status === 401) return salir(); // token vencido
  const datos = await respuesta.json();

  const tabla = $("pedidos");
  tabla.innerHTML = "";
  datos.results.forEach((p) => {
    const nombre = productosPorId[p.producto_id]?.nombre || p.producto_id;
    tabla.appendChild(fila([p.id, nombre, p.cantidad, pesos(p.monto_total), p.estado], `estado-${p.estado}`));
  });
}

async function comprar() {
  const resultado = $("compra-resultado");
  resultado.className = "";
  resultado.textContent = "Procesando...";

  const respuesta = await fetch(`${CONFIG.PEDIDOS_API}/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ producto_id: $("producto").value, cantidad: Number($("cantidad").value) }),
  });

  if (!respuesta.ok) {
    resultado.className = "error";
    resultado.textContent = await leerError(respuesta);
  } else {
    const pedido = await respuesta.json();
    resultado.className = pedido.estado === "PAGADO" ? "ok" : "error";
    resultado.textContent = pedido.estado === "PAGADO"
      ? `Pedido #${pedido.id} PAGADO (${pesos(pedido.monto_total)}). Comprobante: ${pedido.transaccion_id}`
      : `Pedido #${pedido.id} FALLIDO: el pago fue rechazado y el stock se repuso.`;
  }

  cargarCatalogo();
  cargarPedidos();
}

// --- Notificaciones en tiempo real por WebSocket (TP 3, Clases 9 y 10) ---
// El navegador no deja mandar el header Authorization en un WebSocket: el token va en la URL.

let ws = null;
let cerradoAProposito = false;
let espera = 1000; // reintento: 1 s, 2 s, 4 s... hasta 30 s (Clase 10)

function conectarWebSocket() {
  cerradoAProposito = false;
  ws = new WebSocket(`${CONFIG.PEDIDOS_WS}?token=${encodeURIComponent(accessToken)}`);

  ws.onopen = () => {
    espera = 1000;
    $("ws-estado").textContent = "● Tiempo real conectado";
    $("ws-estado").className = "ok";
    cargarPedidos(); // al (re)conectar se piden los datos frescos por REST (Clase 10)
  };

  ws.onmessage = (evento) => {
    const datos = JSON.parse(evento.data);
    if (datos.tipo !== "pedido_actualizado") return;
    const p = datos.pedido;
    const nombre = productosPorId[p.producto_id]?.nombre || p.producto_id;
    mostrarNotificacion(`🔔 Pedido #${p.id} (${nombre}): ${p.estado} — ${pesos(p.monto_total)}`, p.estado);
    cargarPedidos();
    cargarCatalogo(); // el stock cambió
  };

  ws.onclose = () => {
    $("ws-estado").textContent = "● Tiempo real desconectado";
    $("ws-estado").className = "error";
    if (cerradoAProposito || !accessToken) return;
    setTimeout(conectarWebSocket, espera);
    espera = Math.min(espera * 2, 30000);
  };
}

function desconectarWebSocket() {
  cerradoAProposito = true;
  if (ws) ws.close();
  ws = null;
}

function mostrarNotificacion(texto, estado) {
  const aviso = document.createElement("div");
  aviso.className = `aviso estado-${estado}`;
  aviso.textContent = texto; // textContent: el dato viene del servidor (defensa contra XSS)
  $("notificaciones").prepend(aviso);
  setTimeout(() => aviso.remove(), 8000);
}

$("btn-login").addEventListener("click", login);
$("btn-comprar").addEventListener("click", comprar);
$("btn-salir").addEventListener("click", salir);

cargarCatalogo().then(() => { if (accessToken) mostrarApp(); });
