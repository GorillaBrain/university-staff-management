"""Run a project-local Semgrep installation, including Windows .pth bootstrap files."""
import os
import site
import sys
from pathlib import Path

target = Path(__file__).resolve().parents[1] / '.local' / 'python-tools'
site.addsitedir(str(target))
os.environ['PATH'] = str(target / 'bin') + os.pathsep + os.environ.get('PATH', '')
from semgrep.console_scripts.pysemgrep import main
main()
