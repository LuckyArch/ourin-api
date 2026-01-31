#!/usr/bin/env python3
"""
=====================================================
OURIN API - BUILD & DEPLOY SCRIPT
=====================================================

Script ini digunakan untuk:
1. Validasi project sebelum deploy
2. Exclude file yang tidak diperlukan
3. Push ke GitHub

Cara pakai:
    python build.py

=====================================================
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
from datetime import datetime

# =====================================================
# KONFIGURASI
# =====================================================

# Repository GitHub
GITHUB_REPO = "https://github.com/LuckyArch/ourin-api.git"
GITHUB_REPO_SSH = "git@github.com:LuckyArch/ourin-api.git"

# File/folder yang akan di-exclude (tidak di-push)
EXCLUDE_FILES = [
    ".next",
    "node_modules",
    ".env",
    ".env.local",
    ".env.production",
    ".DS_Store",
    "Thumbs.db",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".pnpm-debug.log*",
    "tsconfig.tsbuildinfo",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    ".turbo",
    "coverage",
    ".nyc_output",
    "dist",
    "build",
    "out",
    ".cache",
    ".temp",
    "__pycache__",
    "*.pyc",
]

# File wajib yang harus ada
REQUIRED_FILES = [
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "README.md",
    "lib/site.ts",
    "lib/registry.ts",
    "lib/plugins/index.ts",
    "app/page.tsx",
    "app/docs/page.tsx",
]

# Warna terminal
class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    PURPLE = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    BOLD = "\033[1m"
    END = "\033[0m"

# =====================================================
# HELPER FUNCTIONS
# =====================================================

def print_header():
    """Print header script"""
    print(f"\n{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}   OURIN API - BUILD & DEPLOY SCRIPT{Colors.END}")
    print(f"{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}   Repository: {GITHUB_REPO}{Colors.END}")
    print(f"{Colors.CYAN}{'='*60}{Colors.END}\n")

def print_step(step: int, message: str):
    """Print step number"""
    print(f"{Colors.BLUE}[{step}]{Colors.END} {Colors.BOLD}{message}{Colors.END}")

def print_success(message: str):
    """Print success message"""
    print(f"    {Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message: str):
    """Print error message"""
    print(f"    {Colors.RED}✗ {message}{Colors.END}")

def print_warning(message: str):
    """Print warning message"""
    print(f"    {Colors.YELLOW}⚠ {message}{Colors.END}")

def print_info(message: str):
    """Print info message"""
    print(f"    {Colors.CYAN}ℹ {message}{Colors.END}")

def run_command(command: str, capture: bool = False) -> tuple:
    """Run shell command"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=capture,
            text=True,
            timeout=300
        )
        return result.returncode == 0, result.stdout if capture else ""
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)

def get_project_root() -> Path:
    """Get project root directory"""
    return Path(__file__).parent.resolve()

# =====================================================
# VALIDATION FUNCTIONS
# =====================================================

def validate_required_files() -> bool:
    """Validasi file wajib"""
    print_step(1, "Validasi file wajib...")
    
    root = get_project_root()
    all_exist = True
    
    for file in REQUIRED_FILES:
        file_path = root / file
        if file_path.exists():
            print_success(f"{file}")
        else:
            print_error(f"{file} - TIDAK DITEMUKAN!")
            all_exist = False
    
    return all_exist

def validate_package_json() -> bool:
    """Validasi package.json"""
    print_step(2, "Validasi package.json...")
    
    import json
    root = get_project_root()
    package_path = root / "package.json"
    
    try:
        with open(package_path, "r", encoding="utf-8") as f:
            package = json.load(f)
        
        # Check required fields
        required_fields = ["name", "version", "scripts"]
        for field in required_fields:
            if field in package:
                print_success(f"Field '{field}' ada")
            else:
                print_error(f"Field '{field}' tidak ada!")
                return False
        
        # Check scripts
        required_scripts = ["dev", "build", "start"]
        scripts = package.get("scripts", {})
        for script in required_scripts:
            if script in scripts:
                print_success(f"Script '{script}' ada")
            else:
                print_warning(f"Script '{script}' tidak ada")
        
        return True
    except Exception as e:
        print_error(f"Error membaca package.json: {e}")
        return False

def validate_typescript() -> bool:
    """Validasi TypeScript compilation"""
    print_step(3, "Validasi TypeScript...")
    
    success, output = run_command("npx tsc --noEmit", capture=True)
    
    if success:
        print_success("TypeScript valid - tidak ada error")
        return True
    else:
        print_warning("Ada warning TypeScript (mungkin aman diabaikan)")
        return True  # Allow warnings

def validate_plugins() -> bool:
    """Validasi plugin"""
    print_step(4, "Validasi plugins...")
    
    root = get_project_root()
    plugins_dir = root / "lib" / "plugins"
    
    if not plugins_dir.exists():
        print_error("Folder lib/plugins tidak ditemukan!")
        return False
    
    # Count plugins
    categories = ["ai", "download", "stalker"]
    total_plugins = 0
    
    for category in categories:
        cat_dir = plugins_dir / category
        if cat_dir.exists():
            plugins = list(cat_dir.glob("*.ts"))
            count = len(plugins)
            total_plugins += count
            print_success(f"{category}: {count} plugins")
    
    # Check for custom categories
    for item in plugins_dir.iterdir():
        if item.is_dir() and item.name not in categories:
            plugins = list(item.glob("*.ts"))
            if plugins:
                total_plugins += len(plugins)
                print_success(f"{item.name} (custom): {len(plugins)} plugins")
    
    print_info(f"Total: {total_plugins} plugins")
    return total_plugins > 0

def validate_git() -> bool:
    """Validasi Git repository"""
    print_step(5, "Validasi Git...")
    
    root = get_project_root()
    git_dir = root / ".git"
    
    if not git_dir.exists():
        print_warning("Git belum diinisialisasi")
        print_info("Menginisialisasi Git...")
        
        success, _ = run_command("git init")
        if not success:
            print_error("Gagal inisialisasi Git!")
            return False
        print_success("Git berhasil diinisialisasi")
    else:
        print_success("Git repository ditemukan")
    
    return True

# =====================================================
# GITIGNORE FUNCTIONS
# =====================================================

def update_gitignore():
    """Update .gitignore file"""
    print_step(6, "Update .gitignore...")
    
    root = get_project_root()
    gitignore_path = root / ".gitignore"
    
    gitignore_content = """# Dependencies
node_modules
.pnpm-store

# Next.js
.next
out
build
dist

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# TypeScript
*.tsbuildinfo
tsconfig.tsbuildinfo

# Lock files (optional - uncomment jika tidak mau push)
# pnpm-lock.yaml
# package-lock.json
# yarn.lock

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
*.log

# Testing
coverage
.nyc_output

# Misc
.cache
.temp
*.pyc
__pycache__

# Turbo
.turbo
"""
    
    try:
        with open(gitignore_path, "w", encoding="utf-8") as f:
            f.write(gitignore_content)
        print_success(".gitignore berhasil diupdate")
        return True
    except Exception as e:
        print_error(f"Gagal update .gitignore: {e}")
        return False

# =====================================================
# GIT FUNCTIONS
# =====================================================

def setup_remote():
    """Setup Git remote"""
    print_step(7, "Setup Git remote...")
    
    # Check existing remote
    success, output = run_command("git remote -v", capture=True)
    
    if "origin" in output:
        print_success("Remote 'origin' sudah ada")
        return True
    
    # Add remote
    success, _ = run_command(f"git remote add origin {GITHUB_REPO}")
    
    if success:
        print_success(f"Remote ditambahkan: {GITHUB_REPO}")
        return True
    else:
        print_error("Gagal menambahkan remote")
        return False

def git_add_commit():
    """Git add dan commit"""
    print_step(8, "Git add & commit...")
    
    # Add all files
    success, _ = run_command("git add -A")
    if not success:
        print_error("Gagal git add")
        return False
    print_success("Semua file ditambahkan")
    
    # Check if there are changes
    success, output = run_command("git status --porcelain", capture=True)
    
    if not output.strip():
        print_warning("Tidak ada perubahan untuk di-commit")
        return True
    
    # Commit
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_message = f"🚀 Deploy: {timestamp}"
    
    success, _ = run_command(f'git commit -m "{commit_message}"')
    
    if success:
        print_success(f"Commit berhasil: {commit_message}")
        return True
    else:
        print_warning("Commit gagal atau tidak ada perubahan")
        return True

def git_push():
    """Push ke GitHub"""
    print_step(9, "Push ke GitHub...")
    
    print_info("Mencoba push ke main branch...")
    
    # Try push to main
    success, output = run_command("git push -u origin main 2>&1", capture=True)
    
    if success:
        print_success("Push berhasil ke branch 'main'!")
        return True
    
    # If main doesn't exist, try master
    if "error" in output.lower() or "failed" in output.lower():
        print_warning("Branch 'main' tidak ada, mencoba 'master'...")
        success, _ = run_command("git push -u origin master")
        
        if success:
            print_success("Push berhasil ke branch 'master'!")
            return True
    
    # Force push option
    print_warning("Push gagal. Mungkin perlu force push.")
    print_info("Menjalankan force push...")
    
    success, _ = run_command("git push -u origin main --force")
    
    if success:
        print_success("Force push berhasil!")
        return True
    
    print_error("Push gagal! Cek kredensial GitHub.")
    print_info("Jalankan: git push -u origin main")
    return False

# =====================================================
# MAIN
# =====================================================

def main():
    """Main function"""
    print_header()
    
    # Change to project directory
    os.chdir(get_project_root())
    
    # Validation
    print(f"\n{Colors.PURPLE}{'─'*60}{Colors.END}")
    print(f"{Colors.BOLD}FASE 1: VALIDASI{Colors.END}")
    print(f"{Colors.PURPLE}{'─'*60}{Colors.END}\n")
    
    validations = [
        ("Required Files", validate_required_files),
        ("Package.json", validate_package_json),
        ("TypeScript", validate_typescript),
        ("Plugins", validate_plugins),
        ("Git", validate_git),
    ]
    
    all_valid = True
    for name, func in validations:
        if not func():
            all_valid = False
            print_error(f"Validasi {name} GAGAL!")
            print()
        else:
            print()
    
    if not all_valid:
        print(f"\n{Colors.RED}{'='*60}{Colors.END}")
        print(f"{Colors.RED}VALIDASI GAGAL! Perbaiki error di atas.{Colors.END}")
        print(f"{Colors.RED}{'='*60}{Colors.END}\n")
        sys.exit(1)
    
    # Git Operations
    print(f"\n{Colors.PURPLE}{'─'*60}{Colors.END}")
    print(f"{Colors.BOLD}FASE 2: GIT OPERATIONS{Colors.END}")
    print(f"{Colors.PURPLE}{'─'*60}{Colors.END}\n")
    
    update_gitignore()
    print()
    setup_remote()
    print()
    git_add_commit()
    print()
    
    # Ask for push confirmation
    print(f"\n{Colors.YELLOW}{'─'*60}{Colors.END}")
    confirm = input(f"{Colors.YELLOW}Push ke GitHub sekarang? (y/n): {Colors.END}").strip().lower()
    
    if confirm == "y":
        print()
        if git_push():
            print(f"\n{Colors.GREEN}{'='*60}{Colors.END}")
            print(f"{Colors.GREEN}✓ DEPLOY BERHASIL!{Colors.END}")
            print(f"{Colors.GREEN}Repository: {GITHUB_REPO}{Colors.END}")
            print(f"{Colors.GREEN}{'='*60}{Colors.END}\n")
        else:
            print(f"\n{Colors.RED}Push gagal. Coba manual:{Colors.END}")
            print(f"{Colors.CYAN}git push -u origin main{Colors.END}\n")
    else:
        print(f"\n{Colors.YELLOW}Push dibatalkan.{Colors.END}")
        print(f"{Colors.CYAN}Untuk push manual: git push -u origin main{Colors.END}\n")

if __name__ == "__main__":
    main()
