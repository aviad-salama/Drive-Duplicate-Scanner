import type { CloudFile } from '../providers/types.js';

const DANGEROUS_EXTENSIONS = new Set([
  // Windows & OS System Files
  '.exe', '.dll', '.sys', '.ini', '.dat', '.config', '.com', '.drv', '.ocx', '.cpl', '.scr',
  // Scripts and Executables
  '.bat', '.sh', '.cmd', '.ps1', '.vbs', '.wsf', '.reg', '.pol', '.msi', '.app', '.dmg',
  // Build, Compile and Dev environments
  '.lock', '.pdb', '.classpath', '.project', '.env', '.local', '.class', '.o', '.obj', '.bin',
  '.cs', '.cpp', '.h', '.hpp', '.java', '.ts', '.pyc', '.pyo',
  // Keys, Certificates and Security
  '.pem', '.key', '.cer', '.crt', '.pfx', '.der', '.p12',
  // Databases and Logs
  '.db', '.sqlite', '.sqlite3', '.db-journal', '.msb', '.sdb', '.log', '.bak',
  // Caches, Temp and Virtual Machines
  '.tmp', '.temp', '.cache', '.swp', '.asar', '.pak', '.so', '.dylib', '.ko',
  '.vmx', '.vmdk', '.ova', '.ovf', '.qcow2', '.vhd', '.vhdx', '.wim', '.esd', '.cab',
]);

const DANGEROUS_EXACT_NAMES = new Set([
  // Hidden OS Files
  '.ds_store', 'thumbs.db', 'desktop.ini', 'ntuser.dat', 'bootmgr',
  'pagefile.sys', 'swapfile.sys', 'hiberfil.sys',
  // Config and Package Managers
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'composer.json', 'composer.lock', 'dockerfile', 'makefile', 'cmakelists.txt',
  'web.config', 'app.config', '.htaccess',
]);

const DANGEROUS_PATH_SEGMENTS = new Set([
  // Node & Web Dev
  'node_modules', '.next', '.nuxt', 'coverage', 'vendor',
  // Version Control & IDEs
  '.git', '.svn', '.hg', '.idea', '.vscode', '__pycache__', 'venv', 'env', '.env',
  // Build and Output dirs
  'bin', 'obj', 'build', 'dist', 'out', 'target',
  // Windows System Dirs
  'appdata', 'program files', 'program files (x86)', 'windows', 'system32',
  'syswow64', 'users', 'programdata', 'perflogs', 'boot', 'recovery',
  // Unix/Mac System Dirs
  'library', 'system', 'usr', 'var', 'etc', 'sbin', 'opt', 'dev', 'proc', 'sys', 'run', 'tmp',
]);

export function isSafeFile(file: CloudFile): boolean {
  if (file.size === '0') {
    return false;
  }

  const fileNameLower = file.name.toLowerCase();

  if (DANGEROUS_EXACT_NAMES.has(fileNameLower)) {
    return false;
  }

  const lastDotIndex = fileNameLower.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    const extension = fileNameLower.substring(lastDotIndex);
    if (DANGEROUS_EXTENSIONS.has(extension)) {
      return false;
    }
  }

  if (file.path) {
    const pathSegments = file.path.toLowerCase().split(/[/\\]/);
    for (const segment of pathSegments) {
      if (DANGEROUS_PATH_SEGMENTS.has(segment)) {
        return false;
      }
    }
  }

  return true;
}
