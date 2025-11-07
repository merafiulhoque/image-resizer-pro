document.addEventListener("DOMContentLoaded", () => {
  // === DOM ELEMENTS ===
  const imageInput = document.getElementById('imageInput');
  const browseBtn = document.getElementById('browseBtn');
  const uploadArea = document.getElementById('uploadArea');
  const resizeWidth = document.getElementById('resizeWidth');
  const resizeHeight = document.getElementById('resizeHeight');
  const resizePercentage = document.getElementById('resizePercentage');
  const formatSelect = document.getElementById('format');
  const resizeButton = document.getElementById('resizeButton');
  const autoPredictBtn = document.getElementById('autoPredictBtn');
  const targetSizeInput = document.getElementById('targetSize');
  const originalPreview = document.getElementById('originalPreview');
  const resizedPreview = document.getElementById('resizedPreview');
  const originalInfo = document.getElementById('originalInfo');
  const resizedInfo = document.getElementById('resizedInfo');
  const downloadBtn = document.getElementById('downloadBtn');
  const modal = document.getElementById('editorModal');
  const closeModal = document.getElementById('closeModal');

  // === STATE ===
  let originalImage = null;
  let originalFile = null;
  let resizedImageDataUrl = null;

  // === EVENT LISTENERS ===
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    imageInput.click();
  });

  uploadArea.addEventListener('click', (e) => {
    if (e.target === uploadArea) imageInput.click();
  });

  imageInput.addEventListener('change', handleImageUpload);

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('active');
  });

  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('active'));

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('active');
    if (e.dataTransfer.files.length) {
      imageInput.files = e.dataTransfer.files;
      handleImageUpload();
    }
  });

  resizeButton.addEventListener('click', resizeAndCompress);
  autoPredictBtn.addEventListener('click', autoPredictBestSettings);

  // === FUNCTIONS ===

  function handleImageUpload() {
    if (!imageInput.files || !imageInput.files[0]) return;
    const file = imageInput.files[0];
    originalFile = file;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        originalImage = img;

        // Show modal with fade-in
        openModal();

        // Populate previews
        originalPreview.src = e.target.result;
        originalPreview.style.display = 'block';
        originalInfo.textContent = `Dimensions: ${img.width} × ${img.height} | Size: ${formatFileSize(file.size)}`;

        resizeWidth.value = img.width;
        resizeHeight.value = img.height;
        resizedPreview.style.display = 'none';
        resizedInfo.textContent = '';
        downloadBtn.style.display = 'none';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resizeAndCompress(customQuality = null, customScale = null) {
    if (!originalImage) {
      alert('Please upload an image first.');
      return;
    }

    let targetWidth = parseInt(resizeWidth.value);
    let targetHeight = parseInt(resizeHeight.value);
    let scale = parseInt(resizePercentage.value) / 100;
    if (customScale) scale = customScale;

    if (!targetWidth && !targetHeight) {
      targetWidth = Math.round(originalImage.width * scale);
      targetHeight = Math.round(originalImage.height * scale);
    } else if (!targetWidth && targetHeight) {
      targetWidth = Math.round(originalImage.width * (targetHeight / originalImage.height));
    } else if (targetWidth && !targetHeight) {
      targetHeight = Math.round(originalImage.height * (targetWidth / originalImage.width));
    }

    const format = formatSelect.value.toLowerCase();
    let mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    const quality = customQuality ? customQuality : 0.8;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);

    resizedImageDataUrl = canvas.toDataURL(mimeType, quality);
    const outputBytes = atob(resizedImageDataUrl.split(',')[1]).length;

    resizedPreview.src = resizedImageDataUrl;
    resizedPreview.style.display = 'block';
    resizedInfo.innerHTML = `
      Dimensions: ${targetWidth} × ${targetHeight} |
      Size: ${formatFileSize(outputBytes)} |
      Quality: ${(quality * 100).toFixed(0)}%
    `;

    const extension = format === 'jpeg' ? 'jpg' : format;
    downloadBtn.href = resizedImageDataUrl;
    downloadBtn.download = `optimized-image.${extension}`;
    downloadBtn.style.display = 'inline-block';

    return { outputBytes, quality, scale };
  }

  function autoPredictBestSettings() {
    if (!originalFile || !originalImage) {
      alert('Please upload an image first.');
      return;
    }

    const targetKB = parseFloat(targetSizeInput.value);
    if (!targetKB || targetKB < 10) {
      alert('Please enter a valid target size (at least 10 KB).');
      return;
    }

    const targetBytes = targetKB * 1024;
    let bestQuality = 0.9;
    let bestScale = 1.0;
    let bestMatch = null;

    for (let scale = 1.0; scale >= 0.4; scale -= 0.1) {
      for (let q = 0.9; q >= 0.4; q -= 0.1) {
        const { outputBytes } = resizeAndCompress(q, scale);
        if (outputBytes <= targetBytes) {
          bestQuality = q;
          bestScale = scale;
          bestMatch = outputBytes;
          break;
        }
      }
      if (bestMatch) break;
    }

    resizedInfo.innerHTML += `<br>🎯 Auto-Predicted: ${(bestMatch / 1024).toFixed(2)} KB | Quality: ${(bestQuality * 100).toFixed(0)}% | Scale: ${(bestScale * 100).toFixed(0)}%`;
  }

  // === Modal Control ===
  function openModal() {
    modal.style.display = 'flex';
    modal.classList.remove('closing');
    document.body.style.overflow = 'hidden';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
      modal.style.transition = 'all 0.3s ease';
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    }, 10);
  }

  closeModal.addEventListener('click', closeModalWindow);

  function closeModalWindow() {
    modal.style.transition = 'all 0.3s ease';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 200);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalWindow();
  });

  // === Helper ===
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
});
