// Reemplazo de alert()/confirm() nativos con UI propia.
// DialogHost (montado en Layout) registra el emisor; estas funciones
// se pueden llamar desde cualquier módulo.

let emitir = null;
let siguienteId = 1;

export function _registrarEmisor(fn) {
  emitir = fn;
  return () => { if (emitir === fn) emitir = null; };
}

/** Aviso flotante no bloqueante. tipo: 'success' | 'error' */
export function toast(mensaje, tipo = 'success') {
  if (!emitir) return;
  emitir({ kind: 'toast', id: siguienteId++, mensaje, tipo });
}

/**
 * Diálogo de confirmación. Devuelve Promise<boolean>.
 * confirmar({ titulo, mensaje, textoConfirmar, peligro })
 */
export function confirmar({ titulo, mensaje, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', peligro = false }) {
  if (!emitir) {
    return Promise.resolve(window.confirm([titulo, mensaje].filter(Boolean).join('\n')));
  }
  return new Promise((resolve) => {
    emitir({ kind: 'confirm', titulo, mensaje, textoConfirmar, textoCancelar, peligro, resolve });
  });
}
