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
  systemId?: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Upload file to Cloudinary (for general use)
 * Backend endpoint: POST /api/file-uploads
 */
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('files', file);

  const response = await api.postFormData('/file-uploads', formData);
  return response.data || response;
};

/**
 * Upload multiple files
 * Backend endpoint: POST /api/file-uploads
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
 * Backend endpoint: POST /api/admin/documents (requires ADMIN role)
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

  // Use admin endpoint (requires ADMIN role)
  const response = await api.postFormData('/admin/documents', formData);
  return response.data || response.results?.[0];
};

/**
 * Upload multiple documents
 * Backend endpoint: POST /api/admin/documents (requires ADMIN role)
 * Previously used /landlord/documents which requires LANDLORD role
 */
export const uploadDocuments = async (
  files: File[],
  documentNames: string[],
  docTypes?: string[]
): Promise<Document[]> => {
  // Upload documents one at a time using admin endpoint
  const results: Document[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append('files', files[i]);
    formData.append('documentName', documentNames[i] || files[i].name);
    
    if (docTypes && docTypes[i]) {
      formData.append('docType', docTypes[i]);
    }

    const response = await api.postFormData('/admin/documents', formData);
    const doc = response.data || response.results?.[0];
    if (doc) results.push(doc);
  }
  
  return results;
};

/**
 * Get all documents
 * Backend endpoint: GET /api/admin/documents (requires ADMIN role)
 * Previously used /landlord/documents/docs which requires LANDLORD role
 */
export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get('/admin/documents');
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

export const updateDocumentStatus = async (documentId: string, isPublished: boolean): Promise<Document> => {
  const response = await api.patch(`/admin/documents/${documentId}/status`, { isPublished });
  return response.data || response;
};

/**
 * Upload property document
 * Backend endpoint: POST /api/file-uploads (general upload)
 * Note: /property-docs route is not mounted in the main index.
 * Using the general file-uploads endpoint instead.
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

  // Use general file upload since /property-docs is not mounted
  const response = await api.postFormData('/file-uploads', formData);
  return response.data || response;
};
