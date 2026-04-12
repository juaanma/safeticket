document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('create-event-form');
  const errorMsg = document.getElementById('create-error-msg');
  const btnSubmit = document.getElementById('btn-submit-create');

  // Seleccion local de archivo e imagen previa
  const uploadBox = document.getElementById('file-upload-box');
  const fileInput = document.getElementById('event-image-file');
  const previewContainer = document.getElementById('file-preview-container');
  const previewImg = document.getElementById('file-preview-img');
  const previewName = document.getElementById('file-preview-name');
  let selectedFileBase64 = null;

  if (uploadBox && fileInput) {
    uploadBox.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        // Comprimir imagen usando Canvas para evitar limites de payload HTTP y Base de Datos
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Generar JPEG comprimido (0.7 calidad)
          selectedFileBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          previewImg.src = selectedFileBase64;
          previewName.textContent = file.name;
          
          // Hide icons, show preview
          const icon = uploadBox.querySelector('.ph-upload-simple');
          const h4 = uploadBox.querySelector('h4');
          const p = uploadBox.querySelector('p');
          
          if (icon) icon.style.display = 'none';
          if (h4) h4.style.display = 'none';
          if (p) p.style.display = 'none';
          
          previewContainer.style.display = 'block';
          uploadBox.style.borderColor = 'var(--primary)';
          uploadBox.style.background = 'rgba(79, 70, 229, 0.05)';
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset UI
    errorMsg.style.display = 'none';
    btnSubmit.disabled = true;
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Creando...';

    try {
      // Validar sesion usando metodo nativo de supabase auth
      const { data: userData } = await window.MiSupabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error('Debes iniciar sesión para crear un evento.');
      }

      const title = document.getElementById('event-title').value.trim();
      const location = document.getElementById('event-venue').value.trim();
      const category = document.getElementById('event-category') ? document.getElementById('event-category').value : 'Concierto';
      const date = document.getElementById('event-date').value;
      const imageUrl = selectedFileBase64;

      if (!title || !location || !date || !imageUrl || !category) {
        throw new Error('Todos los campos son obligatorios. Asegúrate de adjuntar una imagen y elegir la categoría.');
      }

      // Insert en supabase
      const { data, error } = await window.MiSupabase
        .from('events')
        .insert([
          {
            title: title,
            location: location,
            date: new Date(date).toISOString(),
            image_url: imageUrl,
            category: category
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Error al guardar en DB: ' + error.message);
      }

      // Todo ok, redirigir
      window.location.href = 'sell.html';

    } catch (err) {
      console.error('Error al crear el evento:', err);
      errorMsg.textContent = err.message || 'Ocurrió un error al intentar crear el evento. Intenta nuevamente.';
      errorMsg.style.display = 'block';
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  });

});
