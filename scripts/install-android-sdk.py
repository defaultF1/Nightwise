from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
sdk = root / '.tools/android-sdk'
logs = root / '.tools/logs'
logs.mkdir(parents=True, exist_ok=True)
base = [str(root / '.tools/jdk21/bin/java.exe'), '-classpath', str(sdk / 'cmdline-tools/latest/lib/sdkmanager-classpath.jar'), 'com.android.sdklib.tool.sdkmanager.SdkManagerCli', '--sdk_root=' + str(sdk)]
for name, args, answers in [
    ('sdk-licenses', ['--licenses'], 'y\n' * 100),
    ('sdk-install', ['platform-tools', 'platforms;android-36', 'build-tools;35.0.0', 'build-tools;36.0.0'], None),
]:
    print('Starting ' + name, flush=True)
    with (logs / (name + '.log')).open('w', encoding='utf-8') as output:
        process = subprocess.run(base + args, input=answers, text=True, stdout=output, stderr=subprocess.STDOUT)
    if process.returncode:
        print((logs / (name + '.log')).read_text(encoding='utf-8')[-3000:], flush=True)
        raise SystemExit(process.returncode)
    print(name + ' completed', flush=True)
