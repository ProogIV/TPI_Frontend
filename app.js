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

$("btn-login").addEventListener("click", login);
$("btn-comprar").addEventListener("click", comprar);
$("btn-salir").addEventListener("click", salir);

cargarCatalogo().then(() => { if (accessToken) mostrarApp(); });
