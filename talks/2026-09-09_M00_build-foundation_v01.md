# NightWise Module 0 build foundation

9 September 2026 IST  |  M00 revision 1  |  Prepared by Codex for the project owner

The build foundation has passed its first Android compilation. The project is stored in the requested D drive folder, dependencies are locked and the portable Android toolchain works. The first build produced a 5,716,080 byte debug APK and completed 245 tasks in 29 minutes 12 seconds. This establishes that the Android project compiles; it does not establish physical phone behavior or live map correctness.

## Work completed

- Set up React and TypeScript, Vite 8.2.2 and Capacitor 8.5.1, with environment examples, build scripts, a dependency lock, initial route contracts and the Android project. The application identifier is in.nightwise.demo.

- Downloaded Microsoft JDK 21 and Android command-line tools from official sources, verified archive SHA256 checksums and kept the tools and caches under .tools on D drive. Installed Android platform 36 and build tools 35 and 36. Android Gradle Plugin selected build tools 35 for the first compilation.

- Created repeatable SDK setup and Android build scripts. Source control exclusions cover tools, caches, build output and secrets. Environment examples contain placeholders only.

- Recorded the user's ongoing instructions in AGENTS.md and established talks as the Word handoff folder, with Markdown companions and source records for context recovery.

## Approach and reasons

I used a shared web interface with a Capacitor Android container so the same UI can support an optional iOS build later. I attempted Android compilation early to expose packaging problems before live integration. D drive holds the larger tool downloads and caches because C drive had limited free space.

After the first full build, the build command was narrowed to :app:assembleDebug with at most two workers. Kotlin compilation is configured in process. Windows reported only about 315 MiB of free physical memory during the first build, so subsequent builds should avoid unnecessary concurrent tooling. That observation does not prove a single cause for every setup delay.

## First compile evidence

The first build finished successfully and generated android/app/build/outputs/apk/debug/app-debug.apk. Its SHA256 was 091a905774346193515a60eed8ded618d628218112480d97bd85ee7b07db559f. This is the first compile checkpoint, before the final Module 1 Android branding update. Use the Module 1 record and current output APK for the later package.

## Errors encountered and fixes

The original npm 10.9.3 dependency install failed inside its peer resolver with Cannot read properties of null reading edgesOut. The precise root cause was not established. Pinning a compatible Vite React plugin and Vitest release and using locally cached npm 11.6.2 completed installation.

The first Java source, Adoptium, returned HTTP 403. I switched to Microsoft's official JDK 21 archive and verified its published checksum. The access-control reason for the original response remains unknown.

The Android SDK vendor batch script failed in its Java version check when JAVA_HOME contained the parentheses in the user's project path. The replacement setup helper calls the Java SDK manager entry point directly with separate arguments, preserving the requested folder name.

PowerShell 5 treated a native SDK deprecation warning written to stderr as a terminating error. The Python wrapper now captures stdout and stderr in a log and checks the actual process exit code. The SDK tools installed successfully. The SDK manager's deprecation notice and an SDK XML version warning were nonfatal in the successful build.

The first report export stalled in Word automation. The read-only automation instance was stopped. A Windows Installer administrative-image attempt also stalled and was stopped; a direct read-only extraction of the verified LibreOffice MSI supplies the project-private report renderer. The bundled document rendering helper remains the page-rendering workflow, using bundled Python and Poppler.

## Files and next steps

All paths below are relative to D:/Aevy TV ( Achina Mayya )/Nightwise. No Google API keys, account credentials or private signing material are included in this report.

- package.json, package-lock.json, tsconfig.json, vite.config.ts, capacitor.config.ts and .env.example define the development foundation. android contains the native project.

- scripts/setup-toolchain.py, scripts/install-android-sdk.py and scripts/build-android.ps1 provide local tooling. .tools/logs contains SDK and diagnostic logs; .tools/gradle-cache contains the isolated Gradle cache.

- scripts/write-module-report.py and scripts/render-module-report.ps1 support future Word handoffs. Their input records and matching Markdown files live in talks.

Continue with the Module 1 handoff for the implemented app shell and browser evidence. API credentials are not needed for the foundation. Live integration, phone testing, release signing and optional iOS work remain later responsibilities in the module plan.
