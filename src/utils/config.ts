import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Get XDG config home directory
 * Defaults to ~/.config if XDG_CONFIG_HOME is not set
 */
function getXDGConfigHome(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  return xdgConfigHome || path.join(os.homedir(), '.config');
}

/**
 * Get path to Vicify configuration file
 * File location: ~/.config/vicinae/extensions/vicify/Vicify.json
 */
function getVicifyConfigPath(): string {
  const configHome = getXDGConfigHome();
  return path.join(configHome, 'vicinae', 'extensions', 'vicify', 'Vicify.json');
}

/**
 * Vicify configuration interface
 */
interface VicifyConfig {
  lastDeviceName?: string;
}

/**
 * Ensure config directory exists
 * @throws Error if directory creation fails
 */
function ensureConfigDirectory(): void {
  try {
    const configPath = getVicifyConfigPath();
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }
  } catch (error) {
    console.error('[Vicify] Failed to create config directory:', error);
    throw new Error('Failed to initialize configuration directory');
  }
}

/**
 * Read Vicify configuration file
 * Returns empty config if file doesn't exist or is corrupted
 */
function readConfig(): VicifyConfig {
  const configPath = getVicifyConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('[Vicify] Failed to read config file:', error);
    return {};
  }
}

/**
 * Write Vicify configuration file
 * @throws Error if write operation fails
 */
function writeConfig(config: VicifyConfig): void {
  ensureConfigDirectory();
  const configPath = getVicifyConfigPath();

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { 
      encoding: 'utf-8', 
      mode: 0o600 
    });
    console.log('[Vicify] Config saved to:', configPath);
  } catch (error) {
    console.error('[Vicify] Failed to write config file:', error);
    throw new Error('Failed to save configuration');
  }
}

/**
 * Save last used device name
 */
export function saveLastDeviceName(deviceName: string): boolean {
  try {
    const config = readConfig();
    config.lastDeviceName = deviceName;
    writeConfig(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get last used device name
 */
export function getLastDeviceName(): string | null {
  const config = readConfig();
  return config.lastDeviceName || null;
}

/**
 * Clear last used device name
 */
export function clearLastDeviceName(): boolean {
  try {
    const config = readConfig();
    delete config.lastDeviceName;
    writeConfig(config);
    return true;
  } catch {
    return false;
  }
}
