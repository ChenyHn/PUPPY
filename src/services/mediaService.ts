export const mediaService = {
  selectImageFromAlbum(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
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
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        } else {
          reject(new Error('No photo taken'));
        }
      };
      input.click();
    });
  }
};
