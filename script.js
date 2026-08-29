const form = document.getElementById("formFicha");
const mensaje = document.getElementById("mensaje");
const dialogo = document.getElementById("dialogoSobrescribir");

const CAMPOS = [
  "rut", "nombres", "apellidos", "direccion", "ciudad",
  "telefono", "email", "fechaNacimiento", "estadoCivil", "comentarios"
];

function obtenerRegistros() {
  return JSON.parse(localStorage.getItem("fichasMedicas") || "[]");
}

function guardarRegistros(registros) {
  localStorage.setItem("fichasMedicas", JSON.stringify(registros));
}

function normalizarRUT(rut) {
  return rut.trim().toUpperCase().replace(/\s/g, "");
}

function validarRUT(rut) {
  rut = normalizarRUT(rut).replace(/\./g, "");
  if (!/^\d{7,8}-[0-9K]$/.test(rut)) return false;

  const [numero, dv] = rut.split("-");
  let suma = 0, multiplicador = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += Number(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  const dvCalculado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvCalculado;
}

function mostrarError(campo, texto) {
  const input = document.getElementById(campo);
  const error = document.getElementById(`error-${campo}`);
  input.classList.add("invalido");
  error.textContent = texto;
}

function limpiarError(campo) {
  const input = document.getElementById(campo);
  const error = document.getElementById(`error-${campo}`);
  input.classList.remove("invalido");
  error.textContent = "";
}

function validarFormulario() {
  let valido = true;

  CAMPOS.forEach(limpiarError);

  const datos = Object.fromEntries(new FormData(form).entries());

  if (!validarRUT(datos.rut)) {
    mostrarError("rut", "Ingrese un RUT válido.");
    valido = false;
  }

  ["nombres", "apellidos", "direccion", "ciudad"].forEach(campo => {
    if (!datos[campo].trim()) {
      mostrarError(campo, "Este campo es obligatorio.");
      valido = false;
    }
  });

  if (!/^(?:\+?56\s?)?9\s?\d{4}\s?\d{4}$/.test(datos.telefono.trim())
      && !/^\d{8,9}$/.test(datos.telefono.trim())) {
    mostrarError("telefono", "Ingrese un teléfono válido.");
    valido = false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
    mostrarError("email", "Ingrese un correo electrónico válido.");
    valido = false;
  }

  if (!datos.fechaNacimiento) {
    mostrarError("fechaNacimiento", "Seleccione una fecha.");
    valido = false;
  } else {
    const fecha = new Date(datos.fechaNacimiento + "T00:00:00");
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    if (fecha > hoy) {
      mostrarError("fechaNacimiento", "La fecha no puede ser futura.");
      valido = false;
    }
  }

  if (!datos.estadoCivil) {
    mostrarError("estadoCivil", "Seleccione el estado civil.");
    valido = false;
  }

  return { valido, datos };
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  window.scrollTo({top: 0, behavior: "smooth"});
}

function limpiarFormulario() {
  form.reset();
  CAMPOS.forEach(limpiarError);
  mensaje.className = "mensaje oculto";
}

function prepararDatos(datos) {
  return {
    rut: normalizarRUT(datos.rut),
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    direccion: datos.direccion.trim(),
    ciudad: datos.ciudad.trim(),
    telefono: datos.telefono.trim(),
    email: datos.email.trim(),
    fechaNacimiento: datos.fechaNacimiento,
    estadoCivil: datos.estadoCivil,
    comentarios: datos.comentarios.trim()
  };
}

let registroPendiente = null;

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const { valido, datos } = validarFormulario();
  if (!valido) {
    mostrarMensaje("Revise los campos marcados antes de guardar.", "error");
    return;
  }

  registroPendiente = prepararDatos(datos);
  const registros = obtenerRegistros();
  const indice = registros.findIndex(r => r.rut === registroPendiente.rut);

  if (indice >= 0) {
    dialogo.showModal();
  } else {
    registros.push(registroPendiente);
    guardarRegistros(registros);
    mostrarMensaje("Registro guardado correctamente.", "exito");
    limpiarFormulario();
  }
});

document.getElementById("btnConfirmar").addEventListener("click", () => {
  if (!registroPendiente) return;

  const registros = obtenerRegistros();
  const indice = registros.findIndex(r => r.rut === registroPendiente.rut);

  if (indice >= 0) {
    registros[indice] = registroPendiente;
    guardarRegistros(registros);
    mostrarMensaje("Registro sobrescrito correctamente.", "exito");
    limpiarFormulario();
  }

  registroPendiente = null;
  dialogo.close();
});

document.getElementById("btnCancelar").addEventListener("click", () => {
  registroPendiente = null;
  dialogo.close();
});

document.getElementById("btnLimpiar").addEventListener("click", () => {
  limpiarFormulario();
  mostrarMensaje("Formulario limpiado correctamente.", "exito");
});

document.getElementById("btnCerrar").addEventListener("click", () => {
  const confirmar = confirm("¿Desea cerrar la aplicación?");
  if (confirmar) {
    window.close();
    mostrarMensaje("La acción de cierre fue ejecutada. Si el navegador no permite cerrar la pestaña, puede hacerlo manualmente.", "exito");
  }
});

function buscar() {
  const apellido = document.getElementById("buscarApellido").value.trim().toLowerCase();
  const contenedor = document.getElementById("resultados");

  if (!apellido) {
    contenedor.innerHTML = '<p class="vacio">Ingrese un apellido para realizar una búsqueda.</p>';
    return;
  }

  const registros = obtenerRegistros().filter(r =>
    r.apellidos.toLowerCase().includes(apellido)
  );

  if (registros.length === 0) {
    contenedor.innerHTML = '<p class="vacio">No se encontraron registros.</p>';
    return;
  }

  contenedor.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>RUT</th>
          <th>Nombres</th>
          <th>Apellidos</th>
          <th>Ciudad</th>
          <th>Teléfono</th>
        </tr>
      </thead>
      <tbody>
        ${registros.map(r => `
          <tr>
            <td>${escapeHTML(r.rut)}</td>
            <td>${escapeHTML(r.nombres)}</td>
            <td>${escapeHTML(r.apellidos)}</td>
            <td>${escapeHTML(r.ciudad)}</td>
            <td>${escapeHTML(r.telefono)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

document.getElementById("btnBuscar").addEventListener("click", buscar);

document.getElementById("buscarApellido").addEventListener("keydown", e => {
  if (e.key === "Enter") buscar();
});
