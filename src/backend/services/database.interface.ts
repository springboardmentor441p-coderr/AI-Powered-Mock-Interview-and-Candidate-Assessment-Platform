/**
 * Database Interface Placeholder for MongoDB
 * To be implemented with Mongoose or Native MongoDB Driver in subsequent phase.
 */

export interface IDatabaseService {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getStatus(): { isConnected: boolean; dbName?: string };
}

export class MongoDatabasePlaceholder implements IDatabaseService {
  private isConnected = false;

  async connect(): Promise<boolean> {
    console.log('[Database Service] MongoDB connection requested. Currently operating in service-interface placeholder mode.');
    return false;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      dbName: 'smarthire_ai_db (pending connection)',
    };
  }
}

export const databaseService = new MongoDatabasePlaceholder();
