import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const AvatarSelector = ({ isOpen, onClose, onSelectAvatar }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPositionX(50);
      setPositionY(50);
      setErrorMessage('');
    }
  };

  const createCroppedBlob = async () => {
    if (!selectedFile) return null;

    const imageBitmap = await createImageBitmap(selectedFile);
    const size = Math.min(imageBitmap.width, imageBitmap.height);
    const centerX = imageBitmap.width * (positionX / 100);
    const centerY = imageBitmap.height * (positionY / 100);
    const cropX = clamp(centerX - size / 2, 0, imageBitmap.width - size);
    const cropY = clamp(centerY - size / 2, 0, imageBitmap.height - size);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, cropX, cropY, size, size, 0, 0, 512, 512);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob.'));
      }, 'image/jpeg', 0.9);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMessage('');

    try {
      const croppedBlob = await createCroppedBlob();
      if (!croppedBlob) throw new Error('Could not prepare image for upload.');

      const fileName = `${Date.now()}.jpg`;
      const uploadFile = new File([croppedBlob], fileName, { type: 'image/jpeg' });
      const filePath = `avatars/${fileName}`;
      const bucketName = 'profile-photos';

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, uploadFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        const message = uploadError.message || JSON.stringify(uploadError);
        if (message.toLowerCase().includes('bucket')) {
          setErrorMessage('Storage bucket not found. Please create a "profile-photos" bucket in your Supabase Storage dashboard first.');
        } else {
          setErrorMessage(`Upload failed: ${message}`);
        }
        return;
      }

      const { data: urlData, error: urlError } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('Public URL error details:', urlError);
        setErrorMessage(`Upload succeeded but failed to generate public URL: ${urlError.message}`);
        return;
      }

      onSelectAvatar(urlData.publicUrl);
      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage(`Failed to upload image: ${error.message || error}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="avatar-modal-overlay" onClick={onClose}>
      <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-modal-header">
          <h3>Upload Profile Photo</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="avatar-modal-content">
          <div className="upload-section">
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Select an image and adjust the crop area so your head is centered.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload" className="upload-btn">
              {selectedFile ? selectedFile.name : 'Choose Image'}
            </label>

            {previewUrl && (
              <>
                <div className="image-preview-box">
                  <img
                    src={previewUrl}
                    alt="Crop preview"
                    className="image-preview"
                    style={{ objectPosition: `${positionX}% ${positionY}%` }}
                  />
                </div>
                <div className="crop-controls">
                  <label>
                    Horizontal
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={positionX}
                      onChange={(e) => setPositionX(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Vertical
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={positionY}
                      onChange={(e) => setPositionY(Number(e.target.value))}
                    />
                  </label>
                </div>
              </>
            )}

            {errorMessage && (
              <p style={{ color: '#ef4444', marginTop: '12px' }}>{errorMessage}</p>
            )}

            {selectedFile && (
              <div style={{ marginTop: '16px' }}>
                <button
                  className="upload-confirm-btn"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload & Set as Profile Photo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;