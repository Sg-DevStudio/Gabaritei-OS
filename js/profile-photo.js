/* Foto privada no mesmo estado sincronizado da conta; sem serviço externo de imagens. */
(function () {
  'use strict';
  function safe(value) { return typeof value === 'string' && value.length <= 50000 && /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value); }
  function value(config) { const image = config && config.fotoPerfil && config.fotoPerfil.imagem; return safe(image) ? image : ''; }
  function change(config, image) {
    if (image !== '' && !safe(image)) throw new Error('Foto inválida.');
    const old = config.fotoPerfil || {};
    config.fotoPerfil = { imagem: image, rev: (Number(old.rev) || 0) + 1, em: new Date().toISOString() };
  }
  async function fromFile(file) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Escolha uma foto de até 10 MB.');
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 100000000) throw new Error('Escolha uma imagem menor.');
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
      const side = Math.min(bitmap.width, bitmap.height);
      ctx.drawImage(bitmap, (bitmap.width-side)/2, (bitmap.height-side)/2, side, side, 0, 0, 256, 256);
      for (const quality of [0.85, 0.65, 0.45]) { const result = canvas.toDataURL('image/jpeg', quality); if (safe(result)) return result; }
      throw new Error('Não foi possível reduzir essa foto. Escolha outra imagem.');
    } finally { bitmap.close(); }
  }
  window.ProfilePhoto = { safe, value, change, fromFile };
}());
