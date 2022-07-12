const { Db } = require('mongodb');

const { logger } = require('../../pkg/logger/logger');

/** DB implements Standard Methods for interacting with MongoDB */
class DB {
  /**
   * @param {Db} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * @param {string} collectionName - Name of the collection - Ex: "offenses"
   * @param {object} filter - .find(filter) - Ex: { field: value }
   * @param {object} sort - .sort(sort) - Ex: { field: 1 } for ascending order or { field: -1 } for descending order
   * @param {number} limit - .limit(limit) - Ex: 25
   */
  async listDocuments(collectionName, filter, sort, limit) {
    try {
      const docs = await this.db.collection(collectionName).find(filter).sort(sort).limit(limit).toArray();
      return Promise.resolve(docs);
    } catch (e) {
      logger.error(e);
      return Promise.reject(new Error('DB_ERROR'));
    }
  };

  /**
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the document
   */
  async getDocument(collectionName, id) {
    try {
      const doc = await this.db.collection(collectionName).findOne({ _id: id });
      if (!doc) return Promise.reject(new Error(`ID ${id} not found`));

      return Promise.resolve(doc);
    } catch (e) {
      logger.error(e);
      return Promise.reject(new Error('DB_ERROR'));
    }
  };

  /**
   * @param {string} collectionName - Name of the collection
   * @param {object} data - Data to write to DB
   */
  async createDocument(collectionName, data) {
    try {
      const result = await this.db.collection(collectionName).insertOne(data);
      const doc = await this.db.collection(collectionName).findOne({ _id: result.insertedId });
      if (!doc) return Promise.reject(new Error('DB_ERROR'));

      return Promise.resolve(doc);
    } catch (e) {
      logger.error(e);
      return Promise.reject(new Error('DB_ERROR'));
    }
  };

  /**
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the document
   * @param {object} data - Data to update in DB
   */
  async updateDocument(collectionName, id, data) {
    try {
      const result = await this.db.collection(collectionName).updateOne({ _id: id }, { $set: data });
      if (result.matchedCount != 1) {
        return Promise.reject(new Error(`ID ${id} not found`));
      }

      const doc = await this.db.collection(collectionName).findOne({ _id: id });
      if (!doc) return Promise.reject(new Error(`ID ${id} not found`));

      return Promise.resolve(doc);
    } catch (e) {
      logger.error(e);
      return Promise.reject(new Error('DB_ERROR'));
    }
  };

  /**
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the document
   */
  async deleteDocument(collectionName, id) {
    try {
      const result = await this.db.collection(collectionName).deleteOne({ _id: id });
      if (result.deletedCount != 1) {
        return Promise.reject(new Error(`ID ${id} not found`));
      }

      return Promise.resolve();
    } catch (e) {
      logger.error(e);
      return Promise.reject(new Error('DB_ERROR'));
    }
  };

  /**
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the document
   * @param {object} data - Data to update in DB
   */
  async upsertDocument(collectionName, id, data) {
    try {
      const result = await this.db.collection(collectionName).updateOne({ _id: id }, { $set: data }, { upsert: true });
      if (!(result.matchedCount == 1 || result.upsertedCount == 1)) {
        return Promise.reject(new Error(`ID ${id} not found`));
      }

      const doc = await this.db.collection(collectionName).findOne({ _id: id });
      if (!doc) return Promise.reject(new Error(`ID ${id} not found`));

      return Promise.resolve(doc);
    } catch (e) {
      logger.error(e);
      return Promise.reject(new Error('DB_ERROR'));
    }
  };

  /**
   * @param {string} collectionName
   * @param {string} key
   */
  async distinct(collectionName, key) {
    try {
      const result = await this.db.collection(collectionName).distinct(key);
      return result;
    } catch (e) {
      logger.error(e);
      return Promise.reject(new Error('DB_ERROR'));
    }
  }
}

module.exports = { DB };
