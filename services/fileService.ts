import api from '../config/api';

export interface FileUploadResponse {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

export interface Document {
  id: string;
  documentName: string;
  documentUrl: string[];
  type: string;
  size: string;
  docType?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Upload file to Cloudinary (for general use)
 */
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('files', file);

  const response = await api.postFormData('/file-uploads', formData);
  return response.data || response;
};

/**
 * Upload multiple files
 */
export const uploadFiles = async (files: File[]): Promise<FileUploadResponse[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.postFormData('/file-uploads', formData);
  return Array.isArray(response.data) ? response.data : [response.data];
};

/**
 * Map admin category to backend DocumentType
 */
const mapCategoryToDocType = (category: string): string => {
  // All admin library documents use 'OTHER' type
  // Category information is preserved in document name
  return 'OTHER';
};

/**
 * Upload document to document library (admin endpoint)
 */
export const uploadDocument = async (
  file: File,
  documentName: string,
  category?: string,
  systemId?: string,
  isPublished?: boolean
): Promise<Document> => {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('documentName', documentName);
  // Always use 'OTHER' for admin library documents
  // Category is preserved in document name (e.g., [FAQ] Document Name)
  formData.append('docType', mapCategoryToDocType(category || 'Template'));
  
  if (systemId) {
    formData.append('systemId', systemId);
  }
  
  if (isPublished !== undefined) {
    formData.append('isPublished', String(isPublished));
  }

  // Use admin endpoint instead of landlord endpoint
  const response = await api.postFormData('/admin/documents', formData);
  return response.data || response.results?.[0];
};

/**
 * Upload multiple documents
 */
export const uploadDocuments = async (
  files: File[],
  documentNames: string[],
  docTypes?: string[]
): Promise<Document[]> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  documentNames.forEach((name) => {
    formData.append('documentName', name);
  });
  
  if (docTypes) {
    docTypes.forEach((type) => {
      formData.append('docType', type);
    });
  }

  const response = await api.postFormData('/landlord/documents', formData);
  return response.results || response.data || [];
};

/**
 * Get all documents
 */
export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get('/landlord/documents/docs');
  return response.data || response.documents || [];
};

/**
 * Upload property document
 */
export const uploadPropertyDocument = async (
  propertyId: string,
  file: File,
  documentName?: string
): Promise<any> => {
  const formData = new FormData();
  formData.append('files', file);
  if (documentName) {
    formData.append('documentName', documentName);
  }
  formData.append('propertyId', propertyId);

  const response = await api.postFormData('/property-docs/uploads', formData);
  return response.data || response;
};

