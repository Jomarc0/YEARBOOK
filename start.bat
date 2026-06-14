@echo off

:: Laravel Backend
start cmd /k "cd /d %~dp0 && php artisan serve --host=0.0.0.0 --port=8000"

:: Laravel Reverb
start cmd /k "cd /d %~dp0 && php artisan reverb:start --port=6001"

:: Queue Worker
start cmd /k "cd /d %~dp0 && php artisan queue:work"

:: Ngrok Tunnel
start cmd /k "cd /d %~dp0 && ngrok http 8000"

:: React Web Client
start cmd /k "cd /d %~dp0sinag-bughaw-web && npm run dev"

:: React Admin Panel
start cmd /k "cd /d %~dp0sinag-bughaw-admin && npm run dev"

:: React Native Expo Mobile App
start cmd /k "cd /d %~dp0bughawII-master && npx expo start -c"