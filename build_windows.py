"""Build a Windows x64 portable ZIP; requires only Python 3 stdlib."""
from pathlib import Path
import hashlib, shutil, sys, tempfile, urllib.request, zipfile
VERSION = '44.7.0'
EXPECTED = 'eee30dc8fa1f5ea95490e59f44e46ea68dd24c6e93d22facf70fe5c2d4c2665c'
BASE = Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as temp:
    temp = Path(temp)
    if len(sys.argv) > 1:
        archive = Path(sys.argv[1]).resolve()
    else:
        archive = temp / 'electron.zip'
        url = f'https://github.com/electron/electron/releases/download/v{VERSION}/electron-v{VERSION}-win32-x64.zip'
        print('Downloading official Electron Windows runtime …')
        urllib.request.urlretrieve(url, archive)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    if digest != EXPECTED:
        raise SystemExit('Runtime SHA-256 mismatch; build cancelled.')
    dest = temp / 'LIFE LINE WaveDeck'
    with zipfile.ZipFile(archive) as z:
        z.extractall(dest)
    (dest / 'electron.exe').rename(dest / 'LIFE LINE WaveDeck.exe')
    app = dest / 'resources' / 'app'
    app.mkdir(parents=True)
    for name in ['package.json', 'main.cjs']:
        shutil.copy2(BASE / name, app / name)
    shutil.copytree(BASE / 'src', app / 'src')
    shutil.copy2(BASE / '使用说明.md', dest / '使用说明.md')
    output = BASE.parent / 'LIFE LINE WaveDeck-1.0.9-Windows-x64.zip'
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for file in dest.rglob('*'):
            if file.is_file():
                z.write(file, file.relative_to(temp))
    print('Built:', output)
