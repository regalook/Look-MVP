const S3_PRESIGNED_PROVIDER = 's3-presigned';
const CHECKOUT_MOCKUP_SESSION_KEY = 'CheckoutPageMockupImages';

const getRequiredEnv = (name, value) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const resolvePublicURL = ({ fileUrl, fileKey }) => {
  if (fileUrl) {
    return fileUrl;
  }

  const publicBaseURL = process.env.REACT_APP_MOCKUP_S3_PUBLIC_BASE_URL;
  if (publicBaseURL && fileKey) {
    const base = publicBaseURL.endsWith('/') ? publicBaseURL.slice(0, -1) : publicBaseURL;
    return `${base}/${fileKey}`;
  }

  return null;
};

const appendUploadedMockupToSessionCache = ({ uploadedImageId, uploadedImageUrl, fileName }) => {
  if (typeof window === 'undefined' || !window.sessionStorage || !uploadedImageUrl) {
    return;
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_MOCKUP_SESSION_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const currentArray = Array.isArray(current) ? current : [];
    const dedupeKey = uploadedImageId || uploadedImageUrl;
    const exists = currentArray.some(item => (item?.id || item?.url) === dedupeKey);
    const next = exists
      ? currentArray
      : [
          ...currentArray,
          {
            id: uploadedImageId || null,
            url: uploadedImageUrl,
            name: fileName || null,
          },
        ];
    window.sessionStorage.setItem(CHECKOUT_MOCKUP_SESSION_KEY, JSON.stringify(next));
  } catch (e) {
    // Ignore storage failures in restricted browser modes.
  }
};

/**
 * Upload buyer mockup image to S3 via presigned URL.
 *
 * Required env vars:
 * - REACT_APP_MOCKUP_UPLOAD_PROVIDER=s3-presigned
 * - REACT_APP_MOCKUP_UPLOAD_SIGNER_URL=<api endpoint that returns presigned upload data>
 *
 * Optional env vars:
 * - REACT_APP_MOCKUP_S3_PUBLIC_BASE_URL=<https://bucket.s3.region.amazonaws.com>
 *
 * Signer response must include:
 * - uploadUrl: string (presigned PUT URL)
 * - fileKey: string (S3 object key)
 *
 * Optional response fields:
 * - fileUrl: string (public/served URL)
 * - headers: object (extra headers required by signer policy)
 */
export const uploadMockupImage = async file => {
  const provider = process.env.REACT_APP_MOCKUP_UPLOAD_PROVIDER;
  if (provider !== S3_PRESIGNED_PROVIDER) {
    throw new Error(
      `Unsupported mockup upload provider. Set REACT_APP_MOCKUP_UPLOAD_PROVIDER=${S3_PRESIGNED_PROVIDER}`
    );
  }

  const signerURL = getRequiredEnv(
    'REACT_APP_MOCKUP_UPLOAD_SIGNER_URL',
    process.env.REACT_APP_MOCKUP_UPLOAD_SIGNER_URL
  );

  const signRes = await fetch(signerURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }),
  });

  if (!signRes.ok) {
    throw new Error(`Mockup upload signer failed with status ${signRes.status}`);
  }

  const signData = await signRes.json();
  const uploadUrl = signData?.uploadUrl;
  const fileKey = signData?.fileKey;
  const fileUrl = signData?.fileUrl;
  const extraHeaders = signData?.headers || {};

  if (!uploadUrl || !fileKey) {
    throw new Error('Invalid signer response. Expected uploadUrl and fileKey.');
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...extraHeaders,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed with status ${uploadRes.status}`);
  }

  const uploadedImageUrl = resolvePublicURL({ fileUrl, fileKey });
  if (!uploadedImageUrl) {
    throw new Error(
      'Missing uploaded image URL. Return fileUrl from signer or set REACT_APP_MOCKUP_S3_PUBLIC_BASE_URL.'
    );
  }

  appendUploadedMockupToSessionCache({
    uploadedImageId: fileKey,
    uploadedImageUrl,
    fileName: file?.name,
  });

  return {
    uploadedImageId: fileKey,
    uploadedImageUrl,
  };
};
