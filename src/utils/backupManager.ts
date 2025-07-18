// Backup Manager for automatic backups and smart recovery
import { PriceItem } from '../types';

export interface BackupFile {
  filename: string;
  date: Date;
  itemCount: number;
  isValid: boolean;
}

class BackupManager {
  private static readonly BACKUP_PREFIX = 'golden-price-list-backup-';
  private static readonly BACKUP_EXTENSION = '.json';
  
  // Auto-backup after every change
  async createAutoBackup(items: PriceItem[]): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${BackupManager.BACKUP_PREFIX}${timestamp}${BackupManager.BACKUP_EXTENSION}`;
      
      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        itemCount: items.length,
        autoBackup: true,
        items: items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          lastEditedAt: item.lastEditedAt?.toISOString()
        }))
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`Auto-backup created: ${filename}`);
    } catch (error) {
      console.error('Failed to create auto-backup:', error);
    }
  }

  // Check if database is empty and recovery is needed
  shouldShowRecovery(items: PriceItem[]): boolean {
    return items.length === 0;
  }

  // Parse backup files from file input
  async parseBackupFile(file: File): Promise<{ items: PriceItem[]; metadata: any } | null> {
    try {
      const content = await this.readFileAsText(file);
      const data = JSON.parse(content);
      
      // Validate backup file structure
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid backup file format');
      }

      // Convert date strings back to Date objects
      const items = data.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        lastEditedAt: item.lastEditedAt ? new Date(item.lastEditedAt) : undefined
      }));

      return {
        items,
        metadata: {
          version: data.version,
          exportDate: data.exportDate,
          itemCount: data.itemCount,
          autoBackup: data.autoBackup || false
        }
      };
    } catch (error) {
      console.error('Failed to parse backup file:', error);
      return null;
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // Generate recovery instructions
  getRecoveryInstructions(): string {
    return `Your price list is empty. This might be because:
    
• Browser cache was cleared
• App data was reset
• First time using the app

If you have a backup file, you can restore your data by importing it.`;
  }

  // Check if filename looks like our backup
  isBackupFile(filename: string): boolean {
    return filename.startsWith(BackupManager.BACKUP_PREFIX) && 
           filename.endsWith(BackupManager.BACKUP_EXTENSION);
  }

  // Extract date from backup filename
  extractDateFromFilename(filename: string): Date | null {
    try {
      const match = filename.match(/golden-price-list-backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
      if (match) {
        const dateStr = match[1].replace(/-/g, ':').replace('T', 'T').slice(0, 19);
        return new Date(dateStr + 'Z');
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const backupManager = new BackupManager();