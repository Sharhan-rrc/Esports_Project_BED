/**
 * Firestore repository - Abstracts database operations
 * Path: src/api/v1/repositories/firestoreRepository.ts
 */

import { db } from "../../../config/firebaseConfig";

/**
 * Create a new document in collection
 * @param collectionName - Name of Firestore collection
 * @param data - Document data
 * @param id - Optional specific document ID
 * @returns Document ID
 */
export const createDocument = async <T>(
  collectionName: string,
  data: Partial<T>,
  id?: string
): Promise<string> => {
  try {
    let docRef: FirebaseFirestore.DocumentReference;
    if (id) {
      docRef = db.collection(collectionName).doc(id);
      await docRef.set(data);
    } else {
      docRef = await db.collection(collectionName).add(data);
    }
    return docRef.id;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to create document in ${collectionName}: ${errorMessage}`
    );
  }
};

/**
 * Get all documents from collection
 * @param collectionName - Name of Firestore collection
 * @returns Query snapshot
 */
export const getDocuments = async (
  collectionName: string
): Promise<FirebaseFirestore.QuerySnapshot> => {
  try {
    return await db.collection(collectionName).get();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to fetch documents from ${collectionName}: ${errorMessage}`
    );
  }
};

/**
 * Get document by ID
 * @param collectionName - Name of Firestore collection
 * @param id - Document ID
 * @returns Document snapshot or null
 */
export const getDocumentById = async (
  collectionName: string,
  id: string
): Promise<FirebaseFirestore.DocumentSnapshot | null> => {
  try {
    const doc: FirebaseFirestore.DocumentSnapshot = await db
      .collection(collectionName)
      .doc(id)
      .get();
    return doc?.exists ? doc : null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to fetch document ${id} from ${collectionName}: ${errorMessage}`
    );
  }
};

/**
 * Query documents by field
 * @param collectionName - Collection name
 * @param fieldName - Field to query
 * @param operator - Comparison operator
 * @param value - Value to compare
 * @returns Query snapshot
 */
export const queryDocuments = async (
  collectionName: string,
  fieldName: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any
): Promise<FirebaseFirestore.QuerySnapshot> => {
  try {
    return await db
      .collection(collectionName)
      .where(fieldName, operator, value)
      .get();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to query documents from ${collectionName}: ${errorMessage}`
    );
  }
};

/**
 * Update document
 * @param collectionName - Collection name
 * @param id - Document ID
 * @param data - Fields to update
 */
export const updateDocument = async <T>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> => {
  try {
    await db.collection(collectionName).doc(id).update(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to update document ${id} in ${collectionName}: ${errorMessage}`
    );
  }
};

/**
 * Delete document
 * @param collectionName - Collection name
 * @param id - Document ID
 * @param transaction - Optional transaction
 */
export const deleteDocument = async (
  collectionName: string,
  id: string,
  transaction?: FirebaseFirestore.Transaction
): Promise<void> => {
  try {
    const docRef: FirebaseFirestore.DocumentReference = db
      .collection(collectionName)
      .doc(id);
    if (transaction) {
      transaction.delete(docRef);
    } else {
      await docRef.delete();
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to delete document ${id} from ${collectionName}: ${errorMessage}`
    );
  }
};

/**
 * Run transaction
 * @param operations - Transaction operations callback
 * @returns Transaction result
 */
export const runTransaction = async <T>(
  operations: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> => {
  try {
    return await db.runTransaction(operations);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Transaction failed: ${errorMessage}`);
  }
};

/**
 * Batch write operations
 * @param operations - Function that accepts batch and performs operations
 */
export const batchWrite = async (
  operations: (batch: FirebaseFirestore.WriteBatch) => Promise<void>
): Promise<void> => {
  try {
    const batch = db.batch();
    await operations(batch);
    await batch.commit();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Batch write failed: ${errorMessage}`);
  }
};