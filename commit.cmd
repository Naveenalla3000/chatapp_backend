@echo off

set /p msg="Enter the commit message: "
if "%msg%"=="" (
    echo No commit message entered. Terminating.
    exit /b 1
)

timeout /t 3 >nul

echo Git branches:
git branch
timeout /t 3 >nul

set /p branch="Enter the branch: "
timeout /t 3 >nul

git show-ref --verify --quiet "refs/heads/%branch%" >nul 2>&1
if %errorlevel% equ 0 (
    git checkout "%branch%"
) else (
    git checkout -b "%branch%"
)

timeout /t 3 >nul
git add .
timeout /t 3 >nul
git config core.autocrlf false
git config core.eol lf 
git commit -m "%msg%"
timeout /t 3 >nul
git push origin "%branch%" 
timeout /t 3 >nul

cls
echo Commit done Successfully! 🚀
