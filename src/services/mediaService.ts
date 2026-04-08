const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max width 1024px
        const MAX_WIDTH = 1024;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Check size (approximate base64 size to bytes)
        const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
        if (sizeInBytes > 500 * 1024) {
          // If still too large, try more compression
          const smallerDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          resolve(smallerDataUrl);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const mediaService = {
  selectImageFromAlbum(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          try {
            const file = target.files[0];
            const compressed = await compressImage(file);
            resolve(compressed);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error('No file selected'));
        }
      };
      input.click();
    });
  },

  takePhoto(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Hint for mobile devices to use camera
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          try {
            const file = target.files[0];
            const compressed = await compressImage(file);
            resolve(compressed);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error('No photo taken'));
        }
      };
      input.click();
    });
  }
};
